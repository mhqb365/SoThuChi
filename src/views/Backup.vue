<template>
  <div class="container-lg py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0">Sao Lưu & Khôi Phục</h4>
    </div>

    <!-- Firebase Backup -->
    <CCard class="my-3">
      <CCardBody>
        <h5 class="mb-3 d-flex align-items-center">
          <Cloud class="me-2" :size="26" />
          Đồng bộ Firebase
        </h5>

        <div v-if="initError" class="alert alert-danger">
          {{ initError }}
        </div>

        <div v-else-if="!isAuthenticated">
          <p class="text-medium-emphasis">
            Đăng nhập để tự động sao lưu dữ liệu an toàn trên đám mây Firebase
          </p>
          <CButton
            color="warning"
            :disabled="!isInitialized"
            @click="handleLogin"
          >
            Đăng nhập Google Firebase
          </CButton>
        </div>

        <div v-else>
          <p class="text-medium-emphasis mb-2">
            <strong>Đã kết nối Google Firebase</strong> |
            <a href="#" class="text-danger" @click.prevent="handleLogout">
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
              :disabled="isSyncing"
              @click="handleSaveToDrive"
            >
              {{ isSyncing ? "Đang xử lý..." : "Sao lưu" }}
            </CButton>
            <CButton
              color="info"
              class="text-white"
              :disabled="isSyncing"
              @click="handleLoadFromDrive"
            >
              {{ isSyncing ? "Đang xử lý..." : "Khôi phục" }}
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
import { Cloud } from "@lucide/vue";
import {
  isAuthenticated,
  isInitialized,
  isSyncing,
  lastSyncTime,
  initError,
  login,
  logout,
  saveToFirestore,
  loadFromFirestore,
} from "@/services/firebase";

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
    await saveToFirestore(data);
    alert("Đã lưu dữ liệu lên Firebase thành công!");
  } catch (error) {
    alert("Có lỗi khi lưu lên Firebase: " + error.message);
  }
};

const handleLoadFromDrive = async () => {
  if (!confirm("Dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn?")) {
    return;
  }

  try {
    const data = await loadFromFirestore();
    if (!data || !data.accounts || !data.categories || !data.transactions) {
      throw new Error("Dữ liệu từ Firebase không hợp lệ hoặc trống");
    }

    // Import data
    storageService.setItem("accounts", data.accounts);
    storageService.setItem("categories", data.categories);
    storageService.setItem("transactions", data.transactions);

    // Reload data in store
    await store.initialize();

    alert("Đã khôi phục dữ liệu từ Firebase thành công!");
  } catch (error) {
    alert("Có lỗi khi tải từ Firebase: " + error.message);
  }
};
</script>
