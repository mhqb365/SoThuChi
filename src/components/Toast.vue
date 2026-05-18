<template>
  <CToaster placement="top-end">
    <CToast
      :visible="toastStore.visible"
      :color="toastStore.color"
      @close="toastStore.hide"
    >
      <CToastHeader>
        <span class="me-auto fw-bold">Thông báo</span>
      </CToastHeader>
      <CToastBody>{{ toastStore.message }}</CToastBody>
    </CToast>
  </CToaster>
</template>

<script setup>
import { useToastStore } from "@/stores/toast.store";
const toastStore = useToastStore();
</script>
