<template>
  <dialog
    ref="dialog"
    class="dnb-sheet-wrap"
    :aria-label="title"
    @cancel.prevent="$emit('update:modelValue', false)"
    @click="dismissBackdrop"
  >
    <div class="dnb-sheet">
      <div class="dnb-sheet__grab" aria-hidden="true" />
      <header class="dnb-sheet__head">
        <div>
          <p v-if="eyebrow" class="dnb-sheet__eyebrow">{{ eyebrow }}</p>
          <h2 class="dnb-sheet__title">{{ title }}</h2>
        </div>
        <button
          type="button"
          class="dnb-sheet__close"
          aria-label="Close"
          @click="$emit('update:modelValue', false)"
        >
          <UiIcon>mdi-close</UiIcon>
        </button>
      </header>
      <div class="dnb-sheet__body">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<script>
export default {
  emits: ["update:modelValue"],
  mounted() {
    this.sync();
  },
  beforeUnmount() {
    this.$refs.dialog.close();
  },
  watch: {
    modelValue() {
      this.sync();
    },
  },
  methods: {
    sync() {
      const dialog = this.$refs.dialog;
      if (this.modelValue && !dialog.open) dialog.showModal();
      else if (!this.modelValue && dialog.open) dialog.close();
    },
    dismissBackdrop(event) {
      if (event.target === this.$refs.dialog)
        this.$emit("update:modelValue", false);
    },
  },
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: "" },
    eyebrow: { type: String, default: "" },
  },
};
</script>

<style>
.dnb-sheet-wrap {
  position: fixed;
  inset: auto 0 0;
  margin: 0 auto;
  padding: 0;
  border: 0;
  width: min(100%, 560px);
  max-width: 100%;
  background: transparent;
  color: white;
  max-height: 88svh;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.7);
}
.dnb-sheet-wrap::backdrop {
  background: rgba(0, 0, 0, 0.46);
}
.dnb-sheet {
  display: flex;
  flex-direction: column;
  max-height: 88svh;
  background: #101010;
  border: 1px solid var(--dnb-line);
  border-bottom: 0;
  border-radius: 20px 20px 0 0;
  color: var(--dnb-text);
}
.dnb-sheet__grab {
  width: 40px;
  height: 4px;
  margin: 10px auto 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.25);
}
.dnb-sheet__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px 8px 20px;
}
.dnb-sheet__eyebrow {
  margin: 6px 0 2px !important;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dnb-text-3);
}
.dnb-sheet__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
}
.dnb-sheet__close {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}
.dnb-sheet__close:focus-visible {
  outline: 2px solid var(--dnb-accent);
}
.dnb-sheet__body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 20px calc(24px + env(safe-area-inset-bottom));
}
.dnb-section-label {
  margin: 20px 0 8px !important;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dnb-text-3);
}
</style>
