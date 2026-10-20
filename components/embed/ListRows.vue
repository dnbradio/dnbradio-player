<template>
  <div class="dnb-list" :style="paletteStyle">
    <slot name="before" />
    <component
      :is="row.href ? 'a' : row.action ? 'button' : 'div'"
      v-for="(row, i) in rows"
      :key="row.key"
      class="dnb-row"
      :class="{
        'dnb-row--current': row.current,
        'dnb-row--wrap': row.wrap,
        'dnb-row--action': row.href || row.action,
      }"
      :href="row.href"
      :target="row.href ? '_blank' : null"
      :rel="row.href ? 'noopener' : null"
      :type="row.action ? 'button' : null"
      :title="row.hint"
      @click="row.action && $emit('select', row)"
    >
      <span class="dnb-row-text"
        >{{ numbered ? `${i + 1}. ` : "" }}{{ row.text }}</span
      >
      <span v-if="row.detail" class="dnb-row-detail">{{ row.detail }}</span>
    </component>
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    rows: { type: Array, default: () => [] },
    palette: { type: Object, required: true },
    numbered: { type: Boolean, default: true },
  },
  computed: {
    paletteStyle() {
      return {
        "--normal": this.palette.normal,
        "--current": this.palette.current,
        "--normalbg": this.palette.normalbg,
        "--selectedbg": this.palette.selectedbg,
        "--font": `${this.palette.font}, Arial, sans-serif`,
      };
    },
  },
};
</script>

<style scoped>
.dnb-list {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 1px 2px;
  background: var(--normalbg);
  color: var(--normal);
  font-family: var(--font);
  font-size: 9px;
  line-height: 13px;
  scrollbar-width: thin;
  scrollbar-color: var(--normal) var(--normalbg);
}
.dnb-row {
  display: flex;
  gap: 4px;
  width: 100%;
  margin: 0;
  padding: 0 1px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  white-space: nowrap;
}
.dnb-row--action {
  cursor: pointer;
}
.dnb-row--action:hover,
.dnb-row--action:focus-visible {
  background: var(--selectedbg);
  outline: none;
}
.dnb-row--current {
  color: var(--current);
}
.dnb-row-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dnb-row--wrap .dnb-row-text {
  white-space: normal;
}
.dnb-row-detail {
  flex-shrink: 0;
}
</style>
