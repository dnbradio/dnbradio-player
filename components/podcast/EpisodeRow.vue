<template>
  <div class="episode" :class="{ 'episode--current': playing || busy }">
    <button type="button" class="episode__open" @click="$emit('open')">
      <img :src="episode.image" alt="" class="episode__art" loading="lazy" />
      <span class="episode__text">
        <strong class="episode__artist">{{ artist }}</strong>
        <span class="episode__title">{{ title }}</span>
        <span class="episode__meta">
          {{ when }}<template v-if="episode.plays"> · {{ plays }}</template>
        </span>
      </span>
    </button>
    <PlayButton
      :size="44"
      variant="ghost"
      :active="playing"
      :busy="busy"
      @click="$emit('toggle')"
    />
  </div>
</template>

<script>
import PlayButton from "~/components/player/PlayButton";
import { cleanMeta } from "~/lib/text";
import { relativeTime } from "~/lib/schedule";

export default {
  components: { PlayButton },
  props: {
    episode: { type: Object, required: true },
    playing: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
  },
  computed: {
    artist() {
      return cleanMeta(this.episode.artist);
    },
    title() {
      return cleanMeta(this.episode.title);
    },
    when() {
      const date = new Date(this.episode.timestamp);
      if (isNaN(date)) {
        return "";
      }
      if (Date.now() - date < 7 * 24 * 3600 * 1000) {
        return relativeTime(date);
      }
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    plays() {
      const n = Number(this.episode.plays);
      return (
        n.toLocaleString(undefined, {
          notation: n >= 10000 ? "compact" : "standard",
        }) + (n === 1 ? " play" : " plays")
      );
    },
  },
};
</script>

<style scoped>
.episode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 8px;
  border: 1px solid var(--dnb-line);
  border-radius: 14px;
  background: var(--dnb-surface);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.episode:hover {
  background: var(--dnb-surface-2);
}
.episode--current {
  border-color: var(--dnb-accent);
}
.episode__open {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 10px;
}
.episode__open:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: 2px;
}
.episode__art {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 10px;
  object-fit: cover;
  background: #111;
}
.episode__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.episode__artist,
.episode__title,
.episode__meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.episode__artist {
  font-size: 16px;
  line-height: 21px;
}
.episode__title {
  font-size: 14px;
  line-height: 19px;
  color: var(--dnb-text-2);
}
.episode__meta {
  font-size: 12px;
  line-height: 18px;
  color: var(--dnb-text-3);
}
</style>
