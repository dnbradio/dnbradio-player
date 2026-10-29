<template>
  <div class="page" :class="{ 'page--bare': hideNav }">
    <header v-if="!hideNav" class="page__bar">
      <button
        type="button"
        class="page__icon"
        :aria-label="backLabel"
        @click="goBack"
      >
        <UiIcon>arrow_back</UiIcon>
      </button>
      <div class="page__heading">
        <span v-if="eyebrow" class="page__eyebrow">{{ eyebrow }}</span>
        <h1 class="page__title">{{ title }}</h1>
      </div>
      <div class="page__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="page__body">
      <slot />
    </div>
    <div v-if="!hideNav" class="page__nav">
      <StationNav :station="station" :active="active" variant="bar" />
    </div>
  </div>
</template>

<script>
import StationNav from "~/components/player/StationNav.vue";
import { canGoBack } from "~/lib/history.js";
import { stationPath } from "~/lib/stations.js";

export default {
  components: { StationNav },
  props: {
    title: { type: String, default: "" },
    eyebrow: { type: String, default: "" },
    station: { type: Object, default: null },
    active: { type: String, default: "" },
    back: { type: String, default: "" },
    backLabel: { type: String, default: "Back" },
    hideNav: { type: Boolean, default: false },
  },
  mounted() {
    document.documentElement.classList.toggle("has-page-nav", !this.hideNav);
  },
  beforeUnmount() {
    document.documentElement.classList.remove("has-page-nav");
  },
  methods: {
    goBack() {
      if (canGoBack()) {
        this.$router.back();
      } else {
        this.$router.push(
          this.back || (this.station ? stationPath(this.station) : "/"),
        );
      }
    },
  },
};
</script>

<style scoped>
.page {
  max-width: 560px;
  margin: 0 auto;
  min-height: 100svh;
  padding-bottom: calc(
    var(--dnb-chrome-bottom) + env(safe-area-inset-bottom) + 24px
  );
}
.page__bar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 4px;
  min-height: 60px;
  padding: calc(env(safe-area-inset-top) + 6px) 4px 6px;
  margin: 0 -2px;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--dnb-line);
}
.page__icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}
.page__icon .ui-icon {
  color: var(--dnb-text) !important;
}
.page__icon:hover {
  background: rgba(255, 255, 255, 0.08);
}
.page__icon:focus-visible {
  outline: 2px solid var(--dnb-accent);
}
.page__heading {
  min-width: 0;
  text-align: center;
  line-height: 1.2;
}
.page__eyebrow {
  display: block;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dnb-text-3);
}
.page__title {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.page__actions {
  display: flex;
  justify-content: flex-end;
}
.page__body {
  padding: 16px 14px 0;
}
.page__nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 150;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid var(--dnb-line);
}
.page__nav > * {
  max-width: 560px;
  margin: 0 auto;
}
</style>
