import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.js";
import store from "../store/index.js";
import playerPlugin from "../plugins/player.js";
import djPlugin from "../plugins/dj.js";
import sourcePlugin from "../plugins/source-attribution.js";
import UiIcon from "../components/ui/Icon.vue";
import Spinner from "../components/ui/Spinner.vue";
import { trackHistory } from "../lib/history.js";
import { http } from "../lib/http.js";
import "@mdi/font/css/materialdesignicons.css";
import "./style.css";

const app = createApp(App);
app.use(store);
app.use(router);
app.component("UiIcon", UiIcon);
app.component("Spinner", Spinner);
const globals = app.config.globalProperties;
globals.$config = __APP_CONFIG__;
globals.$device = {
  isDesktop:
    !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    !(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
};
// Webamp's auxiliary feed readers use this small fetch-backed GET adapter.
globals.$http = http;
const pluginApp = { router, $stationStreamUrl: null };
const inject = (name, value) => {
  globals["$" + name] = value;
  pluginApp["$" + name] = value;
};
await router.isReady();
djPlugin({ route: router.currentRoute.value, app: pluginApp }, inject);
sourcePlugin({ route: router.currentRoute.value, app: pluginApp }, inject);
playerPlugin(
  {
    app: {
      ...pluginApp,
      router: {
        ...router,
        get currentRoute() {
          return router.currentRoute.value;
        },
      },
    },
    store,
  },
  inject,
);
trackHistory();
app.mount("#app");
