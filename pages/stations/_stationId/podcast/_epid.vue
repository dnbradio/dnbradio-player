<template>
  <PageShell
    title="Live Recordings"
    eyebrow="Episode"
    :station="station"
    active="podcast"
    :back="station ? '/stations/' + station.id + '/podcast' : ''"
  >
    <div v-if="item" class="ep">
      <img
        :src="item.image"
        alt=""
        class="ep__art"
        :class="{ 'ep__art--on': playing }"
        @click="playIfStopped"
      />
      <p class="ep__overline">Recorded live on dnbradio.com</p>
      <h2 class="ep__artist">{{ artist }}</h2>
      <p class="ep__title">{{ title }}</p>
      <p class="ep__meta">
        {{ recorded
        }}<template v-if="item.plays">
          · {{ Number(item.plays).toLocaleString() }} plays</template
        >
      </p>

      <div class="ep__seek">
        <input
          type="range"
          min="0"
          :max="duration || 0"
          step="1"
          :value="position"
          :disabled="!current || !duration"
          :style="{
            '--fill': duration ? (position / duration) * 100 + '%' : '0%',
          }"
          aria-label="Seek"
          :aria-valuetext="clock(position) + ' of ' + clock(duration)"
          @input="scrubbing = Number($event.target.value)"
          @change="seekTo($event.target.value)"
        />
        <div class="ep__times">
          <span>{{ clock(position) }}</span>
          <span>{{
            duration ? "-" + clock(duration - position) : "--:--"
          }}</span>
        </div>
      </div>

      <div class="ep__controls">
        <button
          type="button"
          class="ep__control"
          :disabled="!prev"
          aria-label="Newer episode"
          @click="go(prev)"
        >
          <UiIcon size="30">skip_previous</UiIcon>
        </button>
        <button
          type="button"
          class="ep__control"
          :disabled="!current"
          aria-label="Back 30 seconds"
          @click="$player.seek(-30)"
        >
          <UiIcon size="30">mdi-rewind-30</UiIcon>
        </button>
        <PlayButton :size="68" :active="playing" :busy="busy" @click="toggle" />
        <button
          type="button"
          class="ep__control"
          :disabled="!current"
          aria-label="Forward 30 seconds"
          @click="$player.seek(30)"
        >
          <UiIcon size="30">mdi-fast-forward-30</UiIcon>
        </button>
        <button
          type="button"
          class="ep__control"
          :disabled="!next"
          aria-label="Older episode"
          @click="go(next)"
        >
          <UiIcon size="30">skip_next</UiIcon>
        </button>
      </div>

      <div class="ep__actions">
        <router-link :to="'/stations/' + station.id" class="chip">
          <UiIcon size="18">mdi-radio</UiIcon>Live radio
        </router-link>
        <button type="button" class="chip" @click="share">
          <UiIcon size="18">mdi-share-variant</UiIcon>Share
        </button>
        <a
          v-if="item.download_url"
          :href="item.download_url"
          class="chip"
          download
        >
          <UiIcon size="18">mdi-download</UiIcon>Download
        </a>
        <a
          v-if="item.profile && item.profile.url"
          :href="item.profile.url"
          target="_blank"
          rel="noopener"
          class="chip"
        >
          <UiIcon size="18">mdi-account-music</UiIcon>DJ profile
        </a>
      </div>

      <section v-if="tracks.length" class="ep__section">
        <h3 class="ep__section-title">Tracklist</h3>
        <ol class="ep__tracks">
          <li v-for="(track, index) in tracks" :key="index">{{ track }}</li>
        </ol>
      </section>
      <section v-if="description" class="ep__section">
        <h3 class="ep__section-title">About this show</h3>
        <p class="ep__description">{{ description }}</p>
      </section>
    </div>

    <div v-else-if="failed" class="ep-state">
      This recording couldn't be found.
      <router-link :to="'/stations/' + (station ? station.id : 1) + '/podcast'"
        >Browse all recordings</router-link
      >
    </div>
    <div v-else class="ep-state">
      <Spinner indeterminate size="28" width="2" color="#e7ff2c" />
    </div>
  </PageShell>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import { EventBus } from "@/components/eventbus.js";
import PageShell from "~/components/ui/PageShell.vue";
import PlayButton from "~/components/player/PlayButton.vue";
import stationMixin from "~/mixins/station.js";
import { cleanMeta, stripTags } from "~/lib/text.js";

export default {
  components: { PageShell, PlayButton },
  mixins: [stationMixin],
  data() {
    return { item: null, failed: false, scrubbing: null };
  },
  computed: {
    ...mapState("player", ["episodes", "currentTime", "duration", "status"]),
    ...mapGetters("player", ["episode", "isActive", "isBusy"]),
    id() {
      return Number(this.$route.params.epid);
    },
    current() {
      return Boolean(this.episode && this.episode.id === this.id);
    },
    playing() {
      return this.current && this.isActive;
    },
    busy() {
      return this.current && this.isBusy;
    },
    position() {
      if (this.scrubbing !== null) {
        return this.scrubbing;
      }
      return this.current ? Math.floor(this.currentTime) : 0;
    },
    artist() {
      return cleanMeta(this.item.artist);
    },
    title() {
      return cleanMeta(this.item.title);
    },
    recorded() {
      const date = new Date(this.item.timestamp);
      return isNaN(date)
        ? ""
        : date.toLocaleString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
    },
    tracks() {
      return stripTags(this.item.tracklist)
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    },
    description() {
      const text = stripTags(this.item.description).trim();
      return text === "Recorded live on dnbradio.com" ? "" : text;
    },
    index() {
      return this.episodes.findIndex((item) => item.id === this.id);
    },
    prev() {
      return this.index > 0 ? this.episodes[this.index - 1] : null;
    },
    next() {
      return this.index >= 0 && this.index < this.episodes.length - 1
        ? this.episodes[this.index + 1]
        : null;
    },
  },
  watch: {
    id: {
      immediate: true,
      handler() {
        this.load();
      },
    },
    station() {
      this.load();
    },
  },
  methods: {
    async load() {
      if (!this.station || !this.station.podcast) {
        return;
      }
      const listed = this.episodes.find((item) => item.id === this.id);
      if (listed) {
        this.item = listed;
        return;
      }
      this.item = null;
      this.failed = false;
      try {
        const response = await fetch(this.station.podcast.url + "/" + this.id);
        if (!response.ok) {
          throw new Error(response.status);
        }
        this.item = (await response.json()).data;
      } catch (error) {
        this.failed = true;
      }
    },
    clock(seconds) {
      const s = Math.max(0, Math.floor(seconds || 0));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const rest = String(s % 60).padStart(2, "0");
      return h
        ? h + ":" + String(m).padStart(2, "0") + ":" + rest
        : m + ":" + rest;
    },
    seekTo(value) {
      this.$player.seekTo(Number(value));
      this.scrubbing = null;
    },
    toggle() {
      if (this.playing) {
        this.$player.pause();
      } else {
        this.$player.playEpisode(this.item);
      }
    },
    playIfStopped() {
      if (!this.playing) {
        this.$player.playEpisode(this.item);
      }
    },
    go(item) {
      if (item) {
        this.$router.replace(
          "/stations/" + this.station.id + "/podcast/" + item.id,
        );
      }
    },
    async share() {
      const url = this.item.permalink || window.location.href;
      try {
        if (navigator.share) {
          await navigator.share({
            title: this.artist + " – " + this.title,
            url,
          });
          return;
        }
        await navigator.clipboard.writeText(url);
        EventBus.$emit("toast", "Link copied");
      } catch (error) {
        // Share sheet dismissed.
      }
    },
  },
};
</script>

<style scoped>
.ep {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.ep__art {
  width: min(64vw, 260px);
  aspect-ratio: 1;
  border-radius: 16px;
  object-fit: cover;
  background: #111;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.7);
  cursor: pointer;
}
.ep__overline {
  margin: 18px 0 4px !important;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dnb-text-3);
}
.ep__artist {
  margin: 0;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
}
.ep__title {
  margin: 2px 0 0 !important;
  font-size: 16px;
  line-height: 22px;
  color: var(--dnb-text-2);
}
.ep__meta {
  margin: 6px 0 0 !important;
  font-size: 13px;
  color: var(--dnb-text-3);
}
.ep__seek {
  width: 100%;
  max-width: 420px;
  margin-top: 18px;
}
.ep__seek input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 28px;
  background: transparent;
  cursor: pointer;
}
.ep__seek input:disabled {
  cursor: default;
  opacity: 0.5;
}
.ep__seek input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--dnb-accent) var(--fill),
    rgba(255, 255, 255, 0.2) var(--fill)
  );
}
.ep__seek input::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--dnb-accent) var(--fill),
    rgba(255, 255, 255, 0.2) var(--fill)
  );
}
.ep__seek input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border-radius: 50%;
  background: #fff;
}
.ep__seek input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background: #fff;
}
.ep__seek input:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: 2px;
}
.ep__times {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--dnb-text-3);
  font-variant-numeric: tabular-nums;
}
.ep__controls {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  justify-items: center;
  width: 100%;
  max-width: 420px;
  margin-top: 8px;
}
.ep__control {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}
.ep__control .ui-icon {
  color: var(--dnb-control) !important;
}
.ep__control:disabled {
  opacity: 0.3;
  cursor: default;
}
.ep__control:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.08);
}
.ep__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 999px;
  background: none;
  color: var(--dnb-text) !important;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
}
.chip .ui-icon {
  color: inherit !important;
}
.chip:hover {
  background: rgba(255, 255, 255, 0.08);
}
.ep__section {
  width: 100%;
  margin-top: 24px;
  padding: 16px;
  border: 1px solid var(--dnb-line);
  border-radius: 14px;
  background: var(--dnb-surface);
  text-align: left;
}
.ep__section-title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dnb-text-3);
}
.ep__tracks {
  margin: 0;
  padding-left: 22px;
  font-size: 14px;
  line-height: 24px;
  color: var(--dnb-text-2);
}
.ep__description {
  margin: 0 !important;
  font-size: 14px;
  line-height: 21px;
  color: var(--dnb-text-2);
  white-space: pre-line;
}
.ep-state {
  padding: 48px 0;
  text-align: center;
  color: var(--dnb-text-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.ep-state a {
  color: var(--dnb-accent) !important;
}
</style>
