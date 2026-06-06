import { VitePWA } from "vite-plugin-pwa";

export default VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
  manifest: {
    name: "Sổ Thu Chi",
    short_name: "Sổ Thu Chi",
    description: "Ứng dụng quản lý thu chi cá nhân",
    theme_color: "#ebe0ce",
    background_color: "#ebe0ce",
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
});
