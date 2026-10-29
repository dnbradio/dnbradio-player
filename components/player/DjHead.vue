<template>
  <div class="dj-mode">
    <img
      ref="head"
      class="dj-mode__head"
      :src="image"
      :alt="dj.profile.alt"
      width="128"
      height="128"
      draggable="false"
    />
    <div class="dj-mode__controls">
      <span>{{ dj.profile.name }}</span>
      <button
        type="button"
        :aria-pressed="active"
        :disabled="dj.state.reduced || !dj.state.available"
        @click="dj.toggle()"
      >
        {{
          !dj.state.available
            ? "Motion unavailable"
            : dj.state.reduced
              ? "Reduced motion"
              : active
                ? "Motion on"
                : "Motion off"
        }}
      </button>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
const props = defineProps({ dj: { type: Object, required: true } });
const head = ref(null);
const image = import.meta.env.BASE_URL + "djs/" + props.dj.profile.image;
const active = computed(
  () =>
    props.dj.state.enabled &&
    props.dj.state.available &&
    !props.dj.state.reduced,
);
onMounted(() => props.dj.attach(head.value));
onBeforeUnmount(() => props.dj.detach());
</script>
<style scoped>
.dj-mode {
  position: absolute;
  right: 3%;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.dj-mode__head {
  width: clamp(80px, 25vw, 128px);
  height: auto;
  transform-origin: 50% 75%;
  filter: drop-shadow(0 6px 10px #000b);
  pointer-events: none;
}
.dj-mode__controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--dnb-text-3);
}
button {
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 20px;
  background: var(--dnb-surface-2);
  color: var(--dnb-accent);
  font: inherit;
  cursor: pointer;
}
button[aria-pressed="false"] {
  color: var(--dnb-text-2);
}
button:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: 3px;
}
button:disabled {
  cursor: default;
}
@media (max-height: 600px) {
  .dj-mode {
    bottom: 22px;
  }
  .dj-mode__head {
    width: 72px;
  }
}
</style>
