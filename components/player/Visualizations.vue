<template>
  <div ref="host" class="visualizations" aria-hidden="true" />
  <span class="visualizations__status" role="status">{{ message }}</span>
</template>
<script>
import { createBackgroundVisualizer } from "~/lib/background-visualizer.js";
export default {
  props: { mode: { type: String, default: "off" } },
  data: () => ({ message: "" }),
  watch: {
    mode(value) {
      this.layer?.setMode(value);
    },
    "$dj.current.state.available"() {
      this.layer?.update();
    },
    "$dj.current.state.contextState"() {
      this.layer?.update();
    },
    "$dj.current"() {
      this.layer?.update();
    },
    "$store.state.player.source"() {
      this.layer?.update();
    },
    "$store.state.player.status"() {
      this.layer?.update();
    },
  },
  mounted() {
    this.layer = createBackgroundVisualizer(this.$refs.host, {
      getAudio: () => {
        const graph = this.$player.getVisualizationAudio();
        const audio = this.$player.audio;
        return graph
          ? {
              ...graph,
              paused:
                audio.paused ||
                audio.ended ||
                audio.readyState < 3 ||
                ["loading", "reconnecting"].includes(
                  this.$store.state.player.status,
                ),
            }
          : null;
      },
      onStatus: (message) => {
        this.message =
          this.mode === "milkdrop" &&
          this.$dj.current?.state.available === false
            ? "MilkDrop unavailable. Stars and rain are still available."
            : message;
      },
    });
    this.layer.setMode(this.mode);
  },
  beforeUnmount() {
    this.layer.destroy();
  },
};
</script>
<style scoped>
.visualizations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.visualizations__status {
  position: fixed;
  bottom: max(12px, env(safe-area-inset-bottom));
  left: 12px;
  max-width: 290px;
  z-index: 2;
  font-size: 11px;
  text-align: center;
  color: var(--dnb-text-3);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid var(--dnb-line);
  border-radius: 6px;
  padding: 4px 8px;
}
.visualizations__status:empty {
  display: none;
}
</style>
