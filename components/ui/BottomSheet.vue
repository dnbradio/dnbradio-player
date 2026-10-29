<template>
  <v-bottom-sheet
    :value="value"
    max-width="560"
    content-class="dnb-sheet-wrap"
    @input="$emit('input', $event)"
  >
    <div class="dnb-sheet" role="dialog" :aria-label="title">
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
          @click="$emit('input', false)"
        >
          <v-icon>mdi-close</v-icon>
        </button>
      </header>
      <div class="dnb-sheet__body">
        <slot />
      </div>
    </div>
  </v-bottom-sheet>
</template>

<script>
export default {
  props: {
    value: { type: Boolean, default: false },
    title: { type: String, default: "" },
    eyebrow: { type: String, default: "" },
  },
};
</script>

<style>
.dnb-sheet-wrap.v-bottom-sheet.v-dialog {
  max-height: 88svh;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.7);
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
