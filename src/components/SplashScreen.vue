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
    radial-gradient(
      circle at center,
      color-mix(in srgb, var(--coffee-surface) 56%, transparent) 0%,
      transparent 34%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--coffee-surface) 68%, transparent) 0%,
      transparent 320px
    ),
    var(--coffee-neutral);
  z-index: 9999;
}

.logo {
  border-radius: 20%;
  box-shadow: 0 18px 40px rgba(43, 24, 16, 0.16);
}

:global(html[data-theme="dark"]) .splash-screen {
  background:
    radial-gradient(
      circle at center,
      rgba(240, 138, 75, 0.1) 0%,
      rgba(240, 138, 75, 0.04) 18%,
      transparent 38%
    ),
    linear-gradient(180deg, rgba(35, 25, 18, 0.42) 0%, transparent 260px),
    var(--coffee-neutral);
}

:global(html[data-theme="dark"]) .logo {
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.36),
    0 0 32px rgba(240, 138, 75, 0.1);
}
</style>
