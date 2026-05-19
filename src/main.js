import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";

import CoreUIComponents from "@/plugins/coreui-components";
import CoreUIIcons from "@/plugins/coreui-icons";
import { registerSW } from "virtual:pwa-register";

import PullToRefresh from "pulltorefreshjs";

import "@coreui/coreui/dist/css/coreui.min.css";
import "@/assets/css/custom.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);

PullToRefresh.init({
  mainElement: "body",
  instructionsPullToRefresh: "Kéo xuống để làm mới",
  instructionsReleaseToRefresh: "Thả ra để làm mới",
  instructionsRefreshing: "Đang làm mới",
  distThreshold: 60,
  distMax: 80,
  distReload: 50,
  onRefresh() {
    return new Promise(async (resolve) => {
      try {
        const { autoSync } = await import("@/services/googleDrive");
        const { useStore } = await import("@/stores");
        const { useToastStore } = await import("@/stores/toast.store");
        const { storageService } = await import("@/services/storage.service");

        const store = useStore();
        const toastStore = useToastStore();

        const synced = await autoSync(async (data) => {
          if (data && data.accounts && data.categories && data.transactions) {
            storageService.setItem("accounts", data.accounts);
            storageService.setItem("categories", data.categories);
            storageService.setItem("transactions", data.transactions);
            await store.initialize();
            toastStore.show("Đã làm mới dữ liệu thành công!", "success");
          }
        });

        if (!synced) {
          toastStore.show("Dữ liệu đã ở trạng thái mới nhất", "info");
        }
      } catch (error) {
        console.error("Lỗi khi pull to refresh:", error);
      } finally {
        resolve();
      }
    });
  },
});

app.use(CoreUIComponents);
app.use(CoreUIIcons);

app.mount("#app");

registerSW();
