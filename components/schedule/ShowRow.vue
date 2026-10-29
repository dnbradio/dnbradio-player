<template>
  <button
    type="button"
    class="show"
    :class="[
      state && 'show--' + state,
      { 'show--compact': compact, 'show--past': past },
    ]"
    @click="$emit('open')"
  >
    <span class="show__time">
      <strong>{{ start }}</strong>
      <span>{{ end }}</span>
    </span>
    <img
      v-if="show.image && !compact"
      :src="show.image"
      alt=""
      class="show__image"
      loading="lazy"
    />
    <span class="show__text">
      <span v-if="state === 'live'" class="show__badge show__badge--live"
        >Live now</span
      >
      <span v-else-if="state === 'next'" class="show__badge">Up next</span>
      <strong class="show__host">{{ show.host }}</strong>
      <span class="show__title">{{ show.title }}</span>
      <span v-if="!compact && (show.location || repeat)" class="show__extra">
        {{ [show.location, repeat].filter(Boolean).join(" · ") }}
      </span>
    </span>
    <v-icon size="20" class="show__chevron" aria-hidden="true"
      >chevron_right</v-icon
    >
  </button>
</template>

<script>
import { formatTime, recurrence } from "~/lib/schedule";

export default {
  props: {
    show: { type: Object, required: true },
    state: { type: String, default: "" },
    compact: { type: Boolean, default: false },
  },
  computed: {
    start() {
      return formatTime(this.show.startAt);
    },
    end() {
      return formatTime(this.show.endAt);
    },
    repeat() {
      return recurrence(this.show);
    },
    past() {
      return this.show.endAt < new Date();
    },
  },
};
</script>

<style scoped>
.show {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px 12px 12px;
  border: 1px solid var(--dnb-line);
  border-radius: 14px;
  background: var(--dnb-surface);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.show:hover {
  background: var(--dnb-surface-2);
}
.show:focus-visible {
  outline: 2px solid var(--dnb-accent);
}
.show--live {
  border-color: rgba(211, 47, 47, 0.7);
  background: rgba(211, 47, 47, 0.1);
}
.show--next {
  border-color: rgba(231, 255, 44, 0.45);
}
.show--past {
  opacity: 0.5;
}
.show__time {
  width: 68px;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
}
.show__time strong {
  font-size: 15px;
  color: var(--dnb-accent);
}
.show__time span {
  font-size: 13px;
  color: var(--dnb-text-3);
}
.show__image {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #111;
}
.show__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.show__badge {
  align-self: flex-start;
  margin-bottom: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(231, 255, 44, 0.16);
  color: var(--dnb-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.show__badge--live {
  background: var(--dnb-live);
  color: #fff;
}
.show__host {
  font-size: 16px;
  line-height: 21px;
}
.show__title {
  font-size: 14px;
  line-height: 19px;
  color: var(--dnb-text-2);
}
.show__extra {
  margin-top: 2px;
  font-size: 12px;
  color: var(--dnb-text-3);
}
.show__host,
.show__title,
.show__extra {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.show__chevron {
  color: var(--dnb-text-3) !important;
  flex-shrink: 0;
}
.show--compact {
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
