<template>
  <CNavbar
    expand="lg"
    color-scheme="light"
    class="app-navbar d-none d-md-block"
  >
    <CContainer fluid>
      <router-link class="navbar-brand" to="/" aria-label="Sổ Thu Chi">
        <img class="brand-logo" src="@/assets/logo.png" alt="" />
      </router-link>
      <CNavbarToggler @click="visible = !visible" />
      <CCollapse class="navbar-collapse" :visible="visible">
        <CNavbarNav class="me-auto">
          <CNavItem>
            <router-link
              class="nav-link"
              to="/"
              active-class="active"
              @click="visible = false"
            >
              Tổng Quan
            </router-link>
          </CNavItem>
          <CNavItem>
            <router-link
              class="nav-link"
              to="/accounts"
              active-class="active"
              @click="visible = false"
            >
              Tài Khoản
            </router-link>
          </CNavItem>
          <CNavItem>
            <router-link
              class="nav-link"
              to="/transactions"
              active-class="active"
              @click="visible = false"
            >
              Giao Dịch
            </router-link>
          </CNavItem>
          <CNavItem>
            <router-link
              class="nav-link"
              to="/categories"
              active-class="active"
              @click="visible = false"
            >
              Danh Mục
            </router-link>
          </CNavItem>
          <CNavItem>
            <router-link
              class="nav-link"
              to="/backup"
              active-class="active"
              @click="visible = false"
            >
              Sao lưu & Khôi phục
            </router-link>
          </CNavItem>
        </CNavbarNav>
        <div class="d-flex mt-2 mt-lg-0">
          <CButton color="primary" @click="$emit('show-create-transaction')">
            Thêm Giao Dịch
          </CButton>
        </div>
      </CCollapse>
    </CContainer>
  </CNavbar>
</template>

<script setup>
import { ref } from "vue";
const visible = ref(false);
defineEmits(["show-create-transaction"]);
</script>

<style scoped>
.app-navbar {
  border-bottom: 1px solid var(--coffee-border);
  background-color: color-mix(in srgb, var(--coffee-surface) 92%, transparent);
  box-shadow: 0 8px 24px rgba(43, 24, 16, 0.06);
  backdrop-filter: blur(12px);
}

@media (max-width: 768px) {
  .app-navbar {
    padding-top: env(safe-area-inset-top, 0px);
  }
}

.navbar-brand {
  display: inline-flex;
  align-items: center;
  padding: 0;
}

.brand-logo {
  display: block;
  width: 44px;
  height: 44px;
  border-radius: var(--coffee-radius-sm);
  object-fit: cover;
}

.nav-link {
  border-radius: var(--coffee-radius-md);
  color: var(--coffee-secondary);
  font-weight: 600;
}

.nav-link:hover {
  color: var(--coffee-tertiary);
}

.router-link-active {
  color: var(--cui-navbar-active-color);
  background-color: var(--cui-navbar-active-bg);
}

:global(html[data-theme="dark"]) .nav-link.active,
:global(html[data-theme="dark"]) .nav-link.router-link-active {
  color: #fff !important;
}
</style>
