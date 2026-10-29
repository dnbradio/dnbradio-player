<template>
  <main class="app">
    <div class="module">
      <div class="module-inside"><slot /></div>
    </div>
    <MiniPlayer /><Toast />
  </main>
</template>
<script>
import MiniPlayer from "~/components/player/MiniPlayer.vue";
import Toast from "~/components/ui/Toast.vue";
export default { components: { MiniPlayer, Toast } };
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
.app {
  background: black;
}
.app {
  font-family:
    Roboto,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif !important;
  -webkit-font-smoothing: antialiased;
}
.module {
  position: relative;
}
.module-inside {
  position: relative;
  padding: 2px;
}
.app a {
  color: inherit;
}
::selection {
  background: var(--dnb-accent);
  color: #000;
}
</style>
