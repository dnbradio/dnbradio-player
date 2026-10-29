<template>
  <section class="action-card" :class="{ 'action-card--featured': featured }">
    <div class="action-card__head">
      <span
        class="action-card__icon"
        :style="{ color: iconColor }"
        aria-hidden="true"
      >
        <UiIcon size="24" :color="iconColor">{{ icon }}</UiIcon>
      </span>
      <div class="action-card__text">
        <h2 class="action-card__title">{{ title }}</h2>
        <p class="action-card__body">{{ text }}</p>
      </div>
    </div>
    <div v-if="$slots.default" class="action-card__actions">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  props: {
    icon: { type: String, required: true },
    iconColor: { type: String, default: "" },
    title: { type: String, required: true },
    text: { type: String, default: "" },
    featured: { type: Boolean, default: false },
  },
};
</script>

<style>
.action-card {
  padding: 16px;
  border: 1px solid var(--dnb-line);
  border-radius: 16px;
  background: var(--dnb-surface);
}
.action-card--featured {
  border-color: rgba(231, 255, 44, 0.4);
}
.action-card__head {
  display: flex;
  gap: 14px;
}
.action-card__icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--dnb-surface-2);
}
.action-card__icon .ui-icon:not([class*="--text"]) {
  color: var(--dnb-text);
}
.action-card__text {
  min-width: 0;
}
.action-card__title {
  margin: 0;
  font-size: 17px;
  line-height: 22px;
  font-weight: 700;
}
.action-card__body {
  margin: 4px 0 0 !important;
  font-size: 14px;
  line-height: 20px;
  color: var(--dnb-text-2);
}
.action-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-left: 58px;
}
.dnb-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 18px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 999px;
  background: none;
  color: var(--dnb-text) !important;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.dnb-button .ui-icon {
  color: inherit !important;
}
.dnb-button:hover {
  background: rgba(255, 255, 255, 0.08);
}
.dnb-button:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: 2px;
}
.dnb-button--primary {
  border-color: var(--dnb-accent);
  background: var(--dnb-accent);
  color: #000 !important;
}
.dnb-button--primary:hover {
  background: #f0ff7a;
}
.dnb-code {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 6px 6px 12px;
  border-radius: 12px;
  background: #000;
  border: 1px solid var(--dnb-line);
}
.dnb-code code {
  flex: 1;
  min-width: 0;
  background: none !important;
  color: var(--dnb-text) !important;
  font-size: 13px;
  padding: 0 !important;
  overflow-wrap: anywhere;
  box-shadow: none !important;
}
@media (max-width: 360px) {
  .action-card__actions {
    padding-left: 0;
  }
}
</style>
