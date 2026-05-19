import { ref } from "vue";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

export const isInitialized = ref(false);
export const isAuthenticated = ref(false);
export const isSyncing = ref(false);
const storedSyncTime = localStorage.getItem("last_sync_time");
export const lastSyncTime = ref(
  storedSyncTime ? new Date(storedSyncTime) : null,
);
export const initError = ref(null);

let tokenClient;
let gapiInited = false;
let gisInited = false;
let authResolver = null;

const CONFIG_FILE_NAME = "sothuchi_data.json";

export async function initGoogleServices() {
  if (!CLIENT_ID || !API_KEY) {
    console.warn("Google Client ID or API Key missing in .env");
    initError.value = "Missing credentials in .env";
    return;
  }

  await new Promise((resolve) => {
    const checkLibs = setInterval(() => {
      if (typeof gapi !== "undefined" && typeof google !== "undefined") {
        clearInterval(checkLibs);
        resolve();
      }
    }, 100);
  });

  initializeGisClient();
  await initializeGapiClient();
}

async function initializeGapiClient() {
  await new Promise((resolve, reject) => {
    gapi.load("client", { callback: resolve, onerror: reject });
  });

  try {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    await checkAuth();
  } catch (err) {
    console.error("Error initializing GAPI client", err);
    initError.value =
      "Failed to initialize GAPI: " +
      (err.error?.message || JSON.stringify(err));
  }
}

function initializeGisClient() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error !== undefined) {
        console.warn("G Drive Auth callback error:", resp.error);
        isAuthenticated.value = false;
        localStorage.removeItem("google_access_token");
        localStorage.removeItem("google_token_expiry");
        localStorage.setItem("google_logged_in", "false");
        if (authResolver) {
          authResolver(false);
          authResolver = null;
        }
        return;
      }
      isAuthenticated.value = true;
      localStorage.setItem("google_access_token", resp.access_token);
      localStorage.setItem(
        "google_token_expiry",
        Date.now() + resp.expires_in * 1000,
      );
      localStorage.setItem("google_logged_in", "true");

      try {
        gapi.client.setToken({ access_token: resp.access_token });
      } catch (e) {
        console.warn("Failed to set GAPI token in callback", e);
      }

      if (authResolver) {
        authResolver(true);
        authResolver = null;
      }
    },
  });
  gisInited = true;
}

function checkAuth() {
  return new Promise((resolve) => {
    const token = localStorage.getItem("google_access_token");
    const expiry = localStorage.getItem("google_token_expiry");

    // Check if we have a token and if it's still valid
    const now = Date.now();
    const expiryTime = parseInt(expiry) || 0;

    if (token && expiryTime > now) {
      try {
        gapi.client.setToken({ access_token: token });
        isAuthenticated.value = true;
        console.log("G Drive: Session restored successfully");
        isInitialized.value = true;
        resolve(true);
      } catch (e) {
        console.warn("G Drive: Failed to set token", e);
        isAuthenticated.value = false;
        isInitialized.value = true;
        resolve(false);
      }
    } else {
      const loggedIn = localStorage.getItem("google_logged_in");
      if (loggedIn === "true" && tokenClient) {
        console.log("G Drive: Token expired. Attempting silent refresh...");

        const timeout = setTimeout(() => {
          if (authResolver) {
            console.warn("G Drive: Silent refresh timed out");
            isAuthenticated.value = false;
            authResolver(false);
            authResolver = null;
            isInitialized.value = true;
          }
        }, 5000);

        authResolver = (result) => {
          clearTimeout(timeout);
          isInitialized.value = true;
          resolve(result);
        };

        try {
          tokenClient.requestAccessToken({ prompt: "none" });
        } catch (e) {
          clearTimeout(timeout);
          console.warn("G Drive: Silent refresh failed", e);
          isAuthenticated.value = false;
          authResolver = null;
          isInitialized.value = true;
          resolve(false);
        }
      } else {
        isAuthenticated.value = false;
        isInitialized.value = true;
        resolve(false);
      }
    }
  });
}

export function login() {
  if (!gisInited) {
    alert("Google Services not fully initialized.");
    return;
  }
  tokenClient.requestAccessToken({ prompt: "select_account" });
}

export function logout() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_token_expiry");
    localStorage.removeItem("google_logged_in");
    isAuthenticated.value = false;
  }
}

export async function syncData(localData) {
  if (!isAuthenticated.value) return;
  if (!gapiInited) {
    console.error("GAPI not initialized");
    return;
  }

  isSyncing.value = true;
  try {
    const fileId = await findConfigFile();

    if (fileId) {
      console.log("Config file found:", fileId);
    } else {
      console.log("Config file not found...");
    }
  } catch (error) {
    console.error("Sync error:", error);
  } finally {
    isSyncing.value = false;
    updateLastSyncTime();
  }
}

export async function loadFromDrive() {
  if (!isAuthenticated.value) throw new Error("Not authenticated");
  if (!gapiInited) throw new Error("Google Drive API not initialized");

  isSyncing.value = true;
  try {
    const fileId = await findConfigFile();
    if (!fileId) return null;

    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: "media",
    });

    updateLastSyncTime();
    return response.result;
  } catch (e) {
    console.error("Error loading from Drive:", e);
    throw e;
  } finally {
    isSyncing.value = false;
  }
}

export async function saveToDrive(data) {
  if (!isAuthenticated.value) throw new Error("Not authenticated");
  if (!gapiInited)
    throw new Error("Google Drive API not initialized (Check API Key)");

  isSyncing.value = true;
  try {
    const fileId = await findConfigFile();
    const content = JSON.stringify(data);

    const fileMetadata = {
      name: CONFIG_FILE_NAME,
      mimeType: "application/json",
    };

    // If saving to appDataFolder, parent should be 'appDataFolder'
    if (!fileId) {
      fileMetadata.parents = ["appDataFolder"];
    }

    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const contentType = "application/json";

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(fileMetadata) +
      delimiter +
      "Content-Type: " +
      contentType +
      "\r\n\r\n" +
      content +
      close_delim;

    const request = gapi.client.request({
      path: fileId
        ? `/upload/drive/v3/files/${fileId}`
        : "/upload/drive/v3/files",
      method: fileId ? "PATCH" : "POST",
      params: { uploadType: "multipart" },
      headers: {
        "Content-Type": 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    });

    await request;
    updateLastSyncTime();
  } catch (e) {
    console.error("Error saving to Drive:", e);
    throw e;
  } finally {
    isSyncing.value = false;
  }
}

async function findConfigFile() {
  const response = await gapi.client.drive.files.list({
    spaces: "appDataFolder",
    q: `name = '${CONFIG_FILE_NAME}' and trashed = false`,
    fields: "nextPageToken, files(id, name)",
    pageSize: 1,
  });
  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  }
  return null;
}

export async function autoSync(onRestore) {
  if (!isAuthenticated.value || !gapiInited) return false;

  try {
    isSyncing.value = true;

    // Find file and get modifiedTime
    const response = await gapi.client.drive.files.list({
      spaces: "appDataFolder",
      q: `name = '${CONFIG_FILE_NAME}' and trashed = false`,
      fields: "files(id, modifiedTime)",
      pageSize: 1,
    });

    const files = response.result.files;
    if (!files || files.length === 0) return false;

    const driveFile = files[0];
    const driveTime = new Date(driveFile.modifiedTime).getTime();

    // Local time (allow 10s buffer for clock skew/network delay)
    const localTime = lastSyncTime.value
      ? new Date(lastSyncTime.value).getTime()
      : 0;

    console.log(
      "AutoSync Check - Drive:",
      new Date(driveTime),
      "Local:",
      new Date(localTime),
    );

    if (driveTime > localTime + 10000) {
      console.log("Drive content is newer. Downloading...");

      const res = await gapi.client.drive.files.get({
        fileId: driveFile.id,
        alt: "media",
      });

      if (res.result) {
        onRestore(res.result);
        updateLastSyncTime(); // Update local time to now so we don't loop
        return true;
      }
    }
  } catch (e) {
    console.error("Auto sync failed:", e);
  } finally {
    isSyncing.value = false;
  }
  return false;
}

function updateLastSyncTime() {
  const now = new Date();
  lastSyncTime.value = now;
  localStorage.setItem("last_sync_time", now.toISOString());
}
