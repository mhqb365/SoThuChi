<template>
  <div>
    <transition name="fade">
      <SplashScreen v-if="loading" />
    </transition>
    <HeadMenu @show-create-transaction="showTransactionModal = true" />
    <div class="main-content">
      <router-view></router-view>
    </div>
    <BottomMenu @show-create-transaction="showTransactionModal = true" />
    <CreateTransaction v-model="showTransactionModal" />
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useStore } from "@/stores";
import { useToastStore } from "@/stores/toast.store";
import { storageService } from "@/services/storage.service";
import SplashScreen from "@/components/SplashScreen.vue";
import HeadMenu from "@/components/Menus/Head.vue";
import BottomMenu from "@/components/Menus/Bottom.vue";
import Toast from "@/components/Toast.vue";
import CreateTransaction from "@/components/Transactions/Create.vue";
import { initGoogleServices, autoSync } from "@/services/googleDrive";

const store = useStore();
const toastStore = useToastStore();
const loading = ref(true);
const showTransactionModal = ref(false);

onMounted(async () => {
  await store.initialize();
  await initGoogleServices();

  await autoSync(async (data) => {
    if (data && data.accounts && data.categories && data.transactions) {
      storageService.setItem("accounts", data.accounts);
      storageService.setItem("categories", data.categories);
      storageService.setItem("transactions", data.transactions);
      await store.initialize();
      toastStore.show(
        "Đã đồng bộ dữ liệu mới nhất từ Google Drive!",
        "success",
      );
    }
  });
  setTimeout(() => {
    loading.value = false;
  }, 1000);
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.router-link-active {
  color: var(--cui-navbar-active-color);
  background-color: var(--cui-navbar-active-bg);
}

@media (max-width: 768px) {
  .main-content {
    padding-bottom: 60px;
  }
}
</style>
