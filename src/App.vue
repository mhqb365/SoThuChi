<template>
  <div>
    <transition name="fade">
      <SplashScreen v-if="loading" />
    </transition>
    <HeadMenu />
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
import SplashScreen from "@/components/SplashScreen.vue";
import HeadMenu from "@/components/Menus/Head.vue";
import BottomMenu from "@/components/Menus/Bottom.vue";
import Toast from "@/components/Toast.vue";
import CreateTransaction from "@/components/Transactions/Create.vue";
import { initGoogleServices } from "@/services/googleDrive";

const store = useStore();
const loading = ref(true);
const showTransactionModal = ref(false);

onMounted(async () => {
  await store.initialize();
  await initGoogleServices();
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
