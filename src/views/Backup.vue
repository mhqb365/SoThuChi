<template>
  <div class="container-lg py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Sao Lưu & Khôi Phục</h4>
    </div>

    <!-- Google Drive Backup -->
    <CCard class="my-3">
      <CCardBody>
        <h5 class="mb-3 d-flex align-items-center">
          <svg
            class="me-2 text-primary"
            style="width: 24px; height: 24px"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14C0,17.31 2.69,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.03Z"
            />
          </svg>
          Google Drive
        </h5>

        <div v-if="initError" class="alert alert-danger">
          {{ initError }}
        </div>

        <div v-else-if="!isAuthenticated">
          <p class="text-medium-emphasis">
            Đăng nhập để đồng bộ dữ liệu an toàn trên đám mây.
          </p>
          <CButton
            color="primary"
            @click="handleLogin"
            :disabled="!isInitialized"
          >
            Đăng nhập bằng Google
          </CButton>
        </div>

        <div v-else>
          <p class="text-medium-emphasis mb-2">
            <strong>Đã kết nối Google Drive</strong>.
            <a href="#" class="text-danger ms-2" @click.prevent="handleLogout">
              Đăng xuất
            </a>
          </p>
          <p v-if="lastSyncTime" class="small text-muted mb-3">
            Đồng bộ lần cuối:
            {{ new Date(lastSyncTime).toLocaleString("vi-VN") }}
          </p>
          <p v-else class="small text-muted mb-3">Chưa từng đồng bộ</p>

          <div class="d-flex gap-2">
            <CButton
              color="success"
              class="text-white"
              @click="handleSaveToDrive"
              :disabled="isSyncing"
            >
              {{ isSyncing ? "Đang xử lý..." : "Sao lưu lên Drive" }}
            </CButton>
            <CButton
              color="info"
              class="text-white"
              @click="handleLoadFromDrive"
              :disabled="isSyncing"
            >
              {{ isSyncing ? "Đang xử lý..." : "Khôi phục từ Drive" }}
            </CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup>
import { useStore } from "@/stores";
import { storageService } from "@/services/storage.service";
import {
  isAuthenticated,
  isInitialized,
  isSyncing,
  lastSyncTime,
  initError,
  login,
  logout,
  saveToDrive,
  loadFromDrive,
} from "@/services/googleDrive";

const store = useStore();

// Google Drive Sync methods
const handleLogin = () => {
  login();
};

const handleLogout = () => {
  logout();
};

const handleSaveToDrive = async () => {
  try {
    const data = {
      accounts: store.accounts,
      categories: store.categories,
      transactions: store.transactions,
      exportDate: new Date().toISOString(),
    };
    await saveToDrive(data);
    alert("Đã lưu dữ liệu lên Google Drive thành công!");
  } catch (error) {
    alert("Có lỗi khi lưu lên Drive: " + error.message);
  }
};

const handleLoadFromDrive = async () => {
  if (!confirm("Dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn?")) {
    return;
  }

  try {
    const data = await loadFromDrive();
    if (!data || !data.accounts || !data.categories || !data.transactions) {
      throw new Error("Dữ liệu từ Drive không hợp lệ hoặc trống");
    }

    // Import data
    storageService.setItem("accounts", data.accounts);
    storageService.setItem("categories", data.categories);
    storageService.setItem("transactions", data.transactions);

    // Reload data in store
    await store.initialize();

    alert("Đã khôi phục dữ liệu từ Google Drive thành công!");
  } catch (error) {
    alert("Có lỗi khi tải từ Drive: " + error.message);
  }
};
</script>
