<template>
  <BottomSheet
    :value="value"
    :eyebrow="station ? station.title : ''"
    title="Now playing"
    @input="$emit('input', $event)"
  >
    <template v-if="episode">
      <div class="np-card">
        <img :src="episode.image" alt="" class="np-card__art" />
        <div class="np-card__text">
          <span class="np-tag">Podcast</span>
          <strong>{{ episode.artist }}</strong>
          <span>{{ episode.title }}</span>
        </div>
      </div>
      <div class="np-actions">
        <nuxt-link
          :to="'/stations/1/podcast/' + episode.id"
          class="chip"
          @click.native="$emit('input', false)"
        >
          <v-icon size="18">voicemail</v-icon>Open episode
        </nuxt-link>
        <button type="button" class="chip" @click="backToRadio">
          <v-icon size="18">mdi-radio</v-icon>Back to live radio
        </button>
      </div>
    </template>

    <template v-else-if="np">
      <div class="np-card">
        <img v-if="np.art" :src="np.art" alt="" class="np-card__art" />
        <div class="np-card__text">
          <span v-if="np.live" class="np-tag np-tag--live">Live broadcast</span>
          <span v-else class="np-tag">Playlist rotation</span>
          <strong>{{ np.artist }}</strong>
          <span>{{ np.title }}</span>
          <span v-if="np.album && !np.live" class="np-card__album">{{
            np.album
          }}</span>
        </div>
        <button
          type="button"
          class="np-copy"
          aria-label="Copy artist and title"
          @click="copy(np)"
        >
          <v-icon size="20">mdi-content-copy</v-icon>
        </button>
      </div>

      <template v-if="np.next">
        <p class="dnb-section-label">Up next</p>
        <div class="np-row">
          <img
            v-if="np.next.art"
            :src="np.next.art"
            alt=""
            class="np-row__art"
            loading="lazy"
          />
          <span class="np-row__text">
            <strong>{{ np.next.artist || "Unknown artist" }}</strong>
            <span>{{ np.next.title }}</span>
          </span>
        </div>
      </template>
    </template>

    <template v-if="station && station.id === 1 && upcoming.length">
      <p class="dnb-section-label">Next live shows</p>
      <nuxt-link
        v-for="show in upcoming"
        :key="show.id + show.start"
        :to="'/stations/' + station.id + '/schedule'"
        class="np-row np-row--link"
        @click.native="$emit('input', false)"
      >
        <img
          v-if="show.image"
          :src="show.image"
          alt=""
          class="np-row__art np-row__art--round"
          loading="lazy"
        />
        <span class="np-row__text">
          <strong>{{ show.host }}</strong>
          <span>{{ show.title }}</span>
        </span>
        <span class="np-row__time">
          {{ day(show.startAt) }}<br />{{ time(show.startAt) }}
        </span>
      </nuxt-link>
    </template>

    <template v-if="np && np.history.length && !episode">
      <p class="dnb-section-label">Recently played</p>
      <ul class="np-history">
        <li v-for="(item, index) in np.history" :key="index">
          <button
            type="button"
            class="np-row np-row--button"
            :aria-label="'Copy ' + item.artist + ' – ' + item.title"
            @click="copy(item)"
          >
            <img
              v-if="item.art"
              :src="item.art"
              alt=""
              class="np-row__art"
              loading="lazy"
            />
            <span class="np-row__text">
              <strong>{{ item.artist || "Unknown artist" }}</strong>
              <span>{{ item.title }}</span>
            </span>
            <span class="np-row__time">{{ ago(item.playedAt) }}</span>
          </button>
        </li>
      </ul>
      <p class="np-note">Tap a track to copy it.</p>
    </template>

    <p class="dnb-section-label">Sleep timer</p>
    <div class="np-sleep" role="group" aria-label="Sleep timer">
      <button
        v-for="option in sleepOptions"
        :key="option"
        type="button"
        class="np-sleep__option"
        :class="{ 'np-sleep__option--on': sleepChoice === option }"
        :aria-pressed="sleepChoice === option ? 'true' : 'false'"
        @click="setSleep(option)"
      >
        {{ option ? option + " min" : "Off" }}
      </button>
    </div>
    <p v-if="sleepAt" class="np-note">
      Fades out and stops in {{ sleepLeft }}.
    </p>
  </BottomSheet>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import { EventBus } from "@/components/eventbus";
import BottomSheet from "~/components/ui/BottomSheet";
import {
  fetchSchedule,
  formatTime,
  relativeTime,
  sameLocalDay,
  upcomingShows,
} from "~/lib/schedule";

export default {
  components: { BottomSheet },
  props: {
    value: { type: Boolean, default: false },
    station: { type: Object, default: null },
  },
  data() {
    return {
      shows: [],
      sleepChoice: 0,
      sleepOptions: [0, 15, 30, 60, 90],
      now: Date.now(),
      clock: null,
    };
  },
  computed: {
    ...mapState("player", ["nowplaying", "sleepAt"]),
    ...mapGetters("player", ["episode"]),
    np() {
      return this.station ? this.nowplaying[this.station.id] || null : null;
    },
    upcoming() {
      return upcomingShows(this.shows, new Date(this.now), 3);
    },
    sleepLeft() {
      const seconds = Math.max(0, Math.round((this.sleepAt - this.now) / 1000));
      const minutes = Math.floor(seconds / 60);
      return minutes + ":" + String(seconds % 60).padStart(2, "0");
    },
  },
  watch: {
    value(open) {
      clearInterval(this.clock);
      if (!open) {
        return;
      }
      this.now = Date.now();
      this.clock = setInterval(() => (this.now = Date.now()), 1000);
      if (this.station && this.station.schedule) {
        fetchSchedule(this.station.schedule.url).then(
          (shows) => (this.shows = shows)
        );
      }
      if (this.station) {
        this.$player.focusStation(this.station);
      }
    },
    sleepAt(at) {
      if (!at) {
        this.sleepChoice = 0;
      }
    },
  },
  beforeDestroy() {
    clearInterval(this.clock);
  },
  methods: {
    time(date) {
      return formatTime(date);
    },
    day(date) {
      if (sameLocalDay(date, new Date())) {
        return "Today";
      }
      return date.toLocaleDateString(undefined, { weekday: "short" });
    },
    ago(at) {
      return at ? relativeTime(new Date(at), new Date(this.now)) : "";
    },
    async copy(item) {
      const text = [item.artist, item.title].filter(Boolean).join(" - ");
      try {
        await navigator.clipboard.writeText(text);
        EventBus.$emit("toast", "Copied: " + text);
      } catch (error) {
        EventBus.$emit("toast", text);
      }
    },
    setSleep(minutes) {
      this.sleepChoice = minutes;
      this.$player.setSleep(minutes);
      EventBus.$emit(
        "toast",
        minutes ? "Sleep timer: " + minutes + " min" : "Sleep timer off"
      );
    },
    backToRadio() {
      this.$player.playStation(this.station);
      this.$emit("input", false);
    },
  },
};
</script>

<style scoped>
.np-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 16px;
  background: var(--dnb-surface-2);
}
.np-card__art {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background: #000;
}
.np-card__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 15px;
  line-height: 20px;
}
.np-card__text strong {
  font-size: 17px;
}
.np-card__text span {
  color: var(--dnb-text-2);
}
.np-card__album {
  font-size: 13px;
  color: var(--dnb-text-3) !important;
}
.np-tag {
  align-self: flex-start;
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dnb-text-3) !important;
}
.np-tag--live {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--dnb-live);
  color: #fff !important;
}
.np-copy {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}
.np-copy .v-icon {
  color: var(--dnb-text-3) !important;
}
.np-copy:hover {
  background: rgba(255, 255, 255, 0.08);
}
.np-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.np-history {
  list-style: none;
  padding: 0;
  margin: 0;
}
.np-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 6px 4px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: inherit !important;
  text-align: left;
  text-decoration: none;
}
.np-row--button,
.np-row--link {
  cursor: pointer;
}
.np-row--button:hover,
.np-row--link:hover {
  background: rgba(255, 255, 255, 0.05);
}
.np-row:focus-visible {
  outline: 2px solid var(--dnb-accent);
}
.np-row__art {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: #000;
}
.np-row__art--round {
  border-radius: 50%;
}
.np-row__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  line-height: 19px;
}
.np-row__text strong,
.np-row__text span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.np-row__text span {
  color: var(--dnb-text-2);
}
.np-row__time {
  flex-shrink: 0;
  font-size: 12px;
  line-height: 16px;
  text-align: right;
  color: var(--dnb-text-3);
}
.np-note {
  margin: 6px 0 0 !important;
  font-size: 12px;
  color: var(--dnb-text-3);
}
.np-sleep {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.np-sleep__option {
  min-width: 64px;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 999px;
  background: none;
  color: var(--dnb-text);
  font-size: 14px;
  cursor: pointer;
}
.np-sleep__option--on {
  border-color: var(--dnb-accent);
  background: var(--dnb-accent);
  color: #000;
  font-weight: 700;
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
.chip .v-icon {
  color: inherit !important;
}
</style>
