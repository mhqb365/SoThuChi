<template>
  <CNavbar
    expand="lg"
    color-scheme="light"
    class="app-navbar d-none d-md-block"
  >
    <CContainer fluid>
      <router-link class="navbar-brand" to="/">Sổ Thu Chi</router-link>
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
  background-color: rgba(247, 238, 220, 0.92);
  box-shadow: 0 8px 24px rgba(43, 24, 16, 0.06);
  backdrop-filter: blur(12px);
}

.navbar-brand {
  letter-spacing: 0;
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
</style>
