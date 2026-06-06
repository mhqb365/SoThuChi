<template>
  <div class="splash-screen">
    <div class="loader">
      <img :src="splash" alt="splash" width="100px" class="logo" />
    </div>
  </div>
</template>

<script setup>
import splash from "@/assets/logo.png";
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(
      180deg,
      rgba(247, 238, 220, 0.78) 0%,
      rgba(235, 224, 206, 0) 280px
    ),
    var(--coffee-neutral);
  z-index: 9999;
}

.logo {
  border-radius: 20%;
}
</style>
