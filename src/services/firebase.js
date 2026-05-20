import { ref } from "vue";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isInitialized = ref(false);
export const isAuthenticated = ref(false);
export const isSyncing = ref(false);
const storedSyncTime = localStorage.getItem("last_sync_time");
export const lastSyncTime = ref(
  storedSyncTime ? new Date(storedSyncTime) : null,
);
export const initError = ref(null);
export const currentUser = ref(null);

let app;
let auth;
let db;

export function initFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    initError.value = "Missing Firebase credentials in .env";
    console.warn(initError.value);
    return;
  }

  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isInitialized.value = true;

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser.value = user;
        isAuthenticated.value = true;
      } else {
        currentUser.value = null;
        isAuthenticated.value = false;
        localStorage.removeItem("last_sync_time");
        lastSyncTime.value = null;
      }
    });
  } catch (error) {
    initError.value = "Firebase initialization failed: " + error.message;
    console.error(initError.value, error);
  }
}

export async function login() {
  if (!isInitialized.value) {
    alert("Firebase has not been initialized. Check your credentials in .env.");
    return;
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    alert("Đăng nhập thất bại: " + error.message);
    throw error;
  }
}

export async function logout() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

export async function saveToFirestore(data) {
  if (!isAuthenticated.value || !currentUser.value) {
    throw new Error("User not authenticated");
  }
  isSyncing.value = true;
  try {
    const userDocRef = doc(db, "users_data", currentUser.value.uid);
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, payload);
    updateLastSyncTime();
  } catch (error) {
    console.error("Save to Firestore failed:", error);
    throw error;
  } finally {
    isSyncing.value = false;
  }
}

export async function loadFromFirestore() {
  if (!isAuthenticated.value || !currentUser.value) {
    throw new Error("User not authenticated");
  }
  isSyncing.value = true;
  try {
    const userDocRef = doc(db, "users_data", currentUser.value.uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      updateLastSyncTime();
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Load from Firestore failed:", error);
    throw error;
  } finally {
    isSyncing.value = false;
  }
}

export async function autoSync(onRestore) {
  if (!isAuthenticated.value || !currentUser.value || !db) return false;

  try {
    isSyncing.value = true;
    const userDocRef = doc(db, "users_data", currentUser.value.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) return false;

    const cloudData = docSnap.data();
    const cloudTime = cloudData.updatedAt
      ? new Date(cloudData.updatedAt).getTime()
      : 0;
    const localTime = lastSyncTime.value
      ? new Date(lastSyncTime.value).getTime()
      : 0;

    console.log(
      "AutoSync Check - Firebase:",
      new Date(cloudTime),
      "Local:",
      new Date(localTime),
    );

    // If cloud is newer (10s buffer), or if we don't have local sync record
    if (cloudTime > localTime + 10000 || !lastSyncTime.value) {
      console.log("Firebase content is newer. Downloading...");
      if (cloudData.accounts && cloudData.categories && cloudData.transactions) {
        onRestore(cloudData);
        updateLastSyncTime();
        return true;
      }
    }
  } catch (error) {
    console.error("Auto sync failed:", error);
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
