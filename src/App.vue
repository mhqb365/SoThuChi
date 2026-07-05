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
    <CButton
      class="theme-toggle"
      color="light"
      :aria-label="
        theme === 'dark'
          ? 'Chuyển sang giao diện sáng'
          : 'Chuyển sang giao diện tối'
      "
      @click="toggleTheme"
    >
      <Sun v-if="theme === 'dark'" :size="18" aria-hidden="true" />
      <Moon v-else :size="18" aria-hidden="true" />
    </CButton>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { Moon, Sun } from "@lucide/vue";
import { useStore } from "@/stores";
import { useToastStore } from "@/stores/toast.store";
import { storageService } from "@/services/storage.service";
import SplashScreen from "@/components/SplashScreen.vue";
import HeadMenu from "@/components/Menus/Head.vue";
import BottomMenu from "@/components/Menus/Bottom.vue";
import Toast from "@/components/Toast.vue";
import CreateTransaction from "@/components/Transactions/Create.vue";
import { initFirebase, autoSync, isAuthenticated } from "@/services/firebase";

const store = useStore();
const toastStore = useToastStore();
const loading = ref(true);
const showTransactionModal = ref(false);
const theme = ref(localStorage.getItem("theme") || "light");

const applyTheme = (value) => {
  document.documentElement.dataset.theme = value;
  localStorage.setItem("theme", value);

  const themeColor = document.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute("content", value === "dark" ? "#17110d" : "#ebe0ce");
};

const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
};

onMounted(async () => {
  applyTheme(theme.value);
  await store.initialize();
  initFirebase();

  setTimeout(() => {
    loading.value = false;
  }, 1000);
});

watch(isAuthenticated, async (loggedIn) => {
  if (loggedIn) {
    await autoSync(async (data) => {
      if (data && data.accounts && data.categories && data.transactions) {
        storageService.setItem("accounts", data.accounts);
        storageService.setItem("categories", data.categories);
        storageService.setItem("transactions", data.transactions);
        await store.initialize();
        toastStore.show("Đã đồng bộ dữ liệu mới nhất từ Firebase!", "success");
      }
    });
  }
});
</script>

<style>
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
}

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
    padding-top: var(--safe-area-top);
  }

  .main-content {
    padding-bottom: 60px;
  }
}

.theme-toggle {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1040;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--coffee-border);
  border-radius: 999px;
  color: var(--coffee-primary);
  background-color: var(--coffee-surface);
  box-shadow: var(--coffee-shadow);
}

@media (max-width: 768px) {
  .theme-toggle {
    right: calc(18px + var(--safe-area-right));
    bottom: calc(96px + var(--safe-area-bottom));
  }
}
</style>
