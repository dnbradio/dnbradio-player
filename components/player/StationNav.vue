<template>
  <nav
    class="station-nav"
    :class="`station-nav--${variant}`"
    aria-label="Station"
  >
    <template v-for="item in items">
      <a
        v-if="item.href"
        :key="item.key"
        :href="item.href"
        target="_blank"
        rel="noopener"
        class="station-nav__item"
        :aria-label="item.label + ' (opens shop.dnbradio.com)'"
      >
        <v-icon size="24" aria-hidden="true">{{ item.icon }}</v-icon>
        <span
          >{{ item.label
          }}<v-icon size="11" class="station-nav__ext" aria-hidden="true"
            >mdi-arrow-top-right</v-icon
          ></span
        >
      </a>
      <nuxt-link
        v-else
        :key="item.key"
        :to="item.to"
        class="station-nav__item"
        :class="{
          'station-nav__item--active': active === item.key,
          'station-nav__item--disabled': item.disabled,
        }"
        :aria-current="active === item.key ? 'page' : undefined"
        :aria-disabled="item.disabled ? 'true' : undefined"
        :tabindex="item.disabled ? -1 : undefined"
      >
        <v-icon size="24" :class="item.iconClass" aria-hidden="true">{{
          item.icon
        }}</v-icon>
        <span>{{ item.label }}</span>
      </nuxt-link>
    </template>
  </nav>
</template>

<script>
// The five links under the player, in the order listeners know.
export default {
  props: {
    station: { type: Object, default: null },
    active: { type: String, default: "" },
    variant: { type: String, default: "inline" },
  },
  computed: {
    items() {
      const base = "/stations/" + (this.station ? this.station.id : 1);
      return [
        {
          key: "podcast",
          to: base + "/podcast",
          icon: "voicemail",
          label: "podcast",
          disabled: Boolean(this.station && !this.station.podcast),
        },
        {
          key: "schedule",
          to: base + "/schedule",
          icon: "mdi-calendar-month",
          label: "schedule",
        },
        {
          key: "donate",
          to: base + "/donate",
          icon: "favorite",
          label: "donate",
          iconClass: "station-nav__heart",
        },
        {
          key: "merch",
          href: "https://shop.dnbradio.com",
          icon: "mdi-tshirt-crew",
          label: "merch",
        },
        {
          key: "chat",
          to: base + "/chat",
          icon: "mdi-forum-outline",
          label: "chat",
        },
      ];
    },
  },
};
</script>

<style scoped>
.station-nav {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  width: 100%;
}
.station-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 56px;
  padding: 6px 2px;
  border-radius: 12px;
  color: var(--dnb-text-2) !important;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.station-nav__item .v-icon {
  color: inherit;
}
.station-nav__item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--dnb-text) !important;
}
.station-nav__item:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: -2px;
}
.station-nav__item--active {
  color: var(--dnb-accent) !important;
  font-weight: 700;
}
.station-nav__item--disabled {
  opacity: 0.35;
  pointer-events: none;
}
.station-nav .station-nav__heart {
  color: var(--dnb-red) !important;
}
.station-nav__ext {
  margin-left: 1px;
  vertical-align: 1px;
  color: inherit !important;
  opacity: 0.8;
}
.station-nav--bar {
  padding: 4px 6px;
}
.station-nav--bar .station-nav__item {
  min-height: 52px;
}
</style>
