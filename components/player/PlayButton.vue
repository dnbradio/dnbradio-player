<template>
  <button
    type="button"
    class="play-button"
    :class="[`play-button--${variant}`, { 'play-button--busy': busy }]"
    :style="{ '--size': size + 'px' }"
    :aria-label="active ? pauseLabel : 'Play'"
    @click="$emit('click', $event)"
  >
    <svg
      v-if="busy"
      class="play-button__ring"
      viewBox="0 0 50 50"
      aria-hidden="true"
    >
      <circle cx="25" cy="25" r="23" />
    </svg>
    <v-icon :size="Math.round(size * 0.56)" aria-hidden="true">
      {{ active ? "pause" : "play_arrow" }}
    </v-icon>
  </button>
</template>

<script>
export default {
  props: {
    active: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    size: { type: Number, default: 64 },
    variant: { type: String, default: "solid" },
    pauseLabel: { type: String, default: "Pause" },
  },
};
</script>

<style scoped>
.play-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.12s ease, background-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.play-button:active {
  transform: scale(0.94);
}
.play-button--solid {
  background: var(--dnb-control);
}
.play-button--solid .v-icon {
  color: #000 !important;
}
.play-button--solid:hover {
  background: #e2e2e2;
}
.play-button--ghost {
  background: transparent;
  border: 1px solid var(--dnb-line-strong);
}
.play-button--ghost .v-icon {
  color: var(--dnb-text) !important;
}
.play-button:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: 3px;
}
.play-button__ring {
  position: absolute;
  inset: -5px;
  width: calc(100% + 10px);
  height: calc(100% + 10px);
  animation: play-ring-spin 1.1s linear infinite;
}
.play-button__ring circle {
  fill: none;
  stroke: var(--dnb-text);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 40 120;
}
@keyframes play-ring-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .play-button__ring {
    animation-duration: 3s;
  }
}
</style>
