<template>
  <v-app dark v-cloak>
    <client-only>
      <v-main class="module">
        <v-container class="module-inside">
          <nuxt />
        </v-container>
      </v-main>
      <MiniPlayer />
      <Toast />
    </client-only>
  </v-app>
</template>

<script>
import stations from "@/data/stations";
import Station from "@/models/Station";
import MiniPlayer from "~/components/player/MiniPlayer";
import Toast from "~/components/ui/Toast";
import { trackHistory } from "~/lib/history";

export default {
  components: { MiniPlayer, Toast },
  beforeCreate() {
    if (process.client) {
      let userAgent = navigator.userAgent;
      if (
        /iphone_os_4|iphone_os_5|iphone_os_6|iphone_os_7|iphone_os_8|iphone_os_9|safari\/525|safari\/533|safari\/534|safari\/601|safari\/600/i.test(
          userAgent
        )
      ) {
        window.location.href = "https://dnbradio.com/mobile";
        return;
      }
    }
  },
  async created() {
    trackHistory(this.$router);
    Station.create({ data: await stations() });
  },
};
</script>

<style>
:root {
  --dnb-bg: #000;
  --dnb-surface: #0d0d0d;
  --dnb-surface-2: #171717;
  --dnb-line: rgba(255, 255, 255, 0.1);
  --dnb-line-strong: rgba(255, 255, 255, 0.22);
  --dnb-text: #fff;
  /* 0.74 and 0.6 white on black: 10.6:1 and 7.4:1 */
  --dnb-text-2: rgba(255, 255, 255, 0.74);
  --dnb-text-3: rgba(255, 255, 255, 0.6);
  --dnb-control: #c4c4c4;
  --dnb-accent: #e7ff2c;
  --dnb-green: #5dcf6c;
  --dnb-red: #f44336;
  --dnb-live: #d32f2f;
  --dnb-warn: #ffe066;
  --dnb-nav-height: 0px;
  --dnb-mini-height: 0px;
  --dnb-chrome-bottom: calc(var(--dnb-nav-height) + var(--dnb-mini-height));
}
html.has-page-nav {
  --dnb-nav-height: 61px;
}
html.has-mini-player {
  --dnb-mini-height: 70px;
}
.theme--dark.v-application {
  background: black;
}
.v-application {
  font-family: Roboto, system-ui, -apple-system, "Segoe UI", sans-serif !important;
  -webkit-font-smoothing: antialiased;
}
.v-dialog--active .theme--dark.v-sheet {
  background: black;
}
[v-cloak] {
  display: none;
}
.vuedl-layout {
  background-color: darkslategrey;
}
.v-autocomplete__content .theme--dark.v-card {
  background: #191919;
}
.module {
  position: relative;
}
.module-inside {
  position: relative;
  padding: 2px;
}
.v-application a {
  color: inherit;
}
::selection {
  background: var(--dnb-accent);
  color: #000;
}
</style>
