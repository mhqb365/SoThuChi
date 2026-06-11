<template>
  <div class="bottom-menu d-md-none">
    <router-link to="/" class="menu-item">
      <Home :size="20" />
      <span class="fw-bold">Tổng Quan</span>
    </router-link>
    <router-link to="/accounts" class="menu-item">
      <Wallet :size="20" />
      <span class="fw-bold">Tài Khoản</span>
    </router-link>
    <div class="menu-item add-btn" @click="$emit('show-create-transaction')">
      <Plus :size="24" />
    </div>
    <router-link to="/transactions" class="menu-item">
      <List :size="20" />
      <span class="fw-bold">Giao Dịch</span>
    </router-link>
    <router-link to="/categories" class="menu-item">
      <Tags :size="20" />
      <span class="fw-bold">Danh Mục</span>
    </router-link>
  </div>
</template>

<script setup>
import { Home, Wallet, Plus, List, Tags } from "@lucide/vue";

defineEmits(["show-create-transaction"]);
</script>

<style scoped>
.bottom-menu {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: color-mix(in srgb, var(--coffee-surface) 94%, transparent);
  min-height: 82px;
  padding: 0 8px;
  z-index: 1000;
  border-top: 1px solid var(--coffee-border);
  box-shadow: 0 -8px 24px rgba(43, 24, 16, 0.08);
  backdrop-filter: blur(12px);
}

.menu-item {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 8px 4px 10px;
  text-decoration: none;
  color: var(--coffee-secondary);
  font-size: 0.7rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.menu-item i,
.menu-item svg {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 4px;
}

.menu-item::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 28px;
  height: 4px;
  border-radius: 999px;
  background-color: var(--coffee-tertiary);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item.router-link-active::after {
  transform: translateX(-50%) scaleX(1);
}

.menu-item.router-link-active i,
.menu-item.router-link-active svg {
  transform: translateY(-2px);
  color: var(--coffee-tertiary);
}

.menu-item.router-link-active:not(.add-btn) {
  background-color: transparent;
}

.menu-item span {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item.router-link-active span {
  color: var(--coffee-tertiary);
  font-weight: 800;
  transform: translateY(-2px);
}

.add-btn {
  flex: 0 0 52px;
  align-self: center;
  color: white;
  background: var(--coffee-tertiary);
  width: 52px;
  height: 52px;
  min-height: 52px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -30px 4px 0;
  box-shadow: 0 8px 18px rgba(217, 119, 66, 0.28);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 22px rgba(217, 119, 66, 0.34);
}

.add-btn:active {
  transform: scale(0.95);
}

.menu-item:hover,
.menu-item.router-link-active {
  color: var(--coffee-tertiary);
}

.menu-item.router-link-active i {
  transform: scale(1.1);
}
</style>
