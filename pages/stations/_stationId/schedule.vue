<template>
  <PageShell
    title="dnbradio.com"
    eyebrow="Live schedule"
    :station="station"
    active="schedule"
    :hide-nav="hideNav"
  >
    <template #actions>
      <button
        type="button"
        class="icon-button"
        :aria-label="view === 'day' ? 'Show the whole week' : 'Show one day'"
        :title="view === 'day' ? 'Week' : 'Day'"
        @click="setView(view === 'day' ? 'week' : 'day')"
      >
        <v-icon>{{
          view === "day" ? "mdi-calendar-week" : "mdi-calendar-today"
        }}</v-icon>
      </button>
    </template>

    <div v-if="!hideTitle" class="schedule-intro">
      <p class="schedule-intro__zone">
        <v-icon size="16" aria-hidden="true">mdi-earth</v-icon>
        Times in your time zone: {{ zone }}
      </p>
      <button
        v-if="liveNow"
        type="button"
        class="live-banner"
        @click="open(liveNow)"
      >
        <span class="live-banner__pill"
          ><span class="live-banner__dot" />Live now</span
        >
        <span class="live-banner__text">
          <strong>{{ liveNow.host }}</strong> · {{ liveNow.title }}
        </span>
        <span class="live-banner__until">until {{ time(liveNow.endAt) }}</span>
      </button>
    </div>

    <div v-if="view === 'day'" class="day-tabs" role="tablist" aria-label="Day">
      <button
        v-for="(day, index) in days"
        :key="day.getTime()"
        type="button"
        role="tab"
        class="day-tab"
        :class="{ 'day-tab--on': index === selected }"
        :aria-selected="index === selected ? 'true' : 'false'"
        @click="selected = index"
      >
        <span class="day-tab__name">{{ dayName(day, index) }}</span>
        <span class="day-tab__date">{{ day.getDate() }}</span>
        <span
          class="day-tab__count"
          :class="{ 'day-tab__count--none': !countFor(day) }"
          >{{ countFor(day) || "–" }}</span
        >
      </button>
    </div>

    <div v-if="loading" class="schedule-state">
      <v-progress-circular indeterminate size="28" width="2" color="#e7ff2c" />
    </div>
    <p v-else-if="failed" class="schedule-state">
      The schedule didn't load.
      <button type="button" class="text-button" @click="load">Try again</button>
    </p>

    <template v-else-if="view === 'day'">
      <ol v-if="dayShows.length" class="show-list">
        <li
          v-for="show in dayShows"
          :key="show.id + show.start"
          :ref="isLive(show) ? 'live' : null"
        >
          <ShowRow :show="show" :state="stateOf(show)" @open="open(show)" />
        </li>
      </ol>
      <p v-else class="schedule-empty">
        No live shows scheduled{{
          selected === 0 ? " for the rest of today" : ""
        }}.<br />
        Playlist rotation plays all day.
      </p>
    </template>

    <template v-else>
      <section
        v-for="(day, index) in days"
        :key="day.getTime()"
        class="week-day"
      >
        <h2 class="week-day__title">
          {{ dayName(day, index) }}
          <span>{{
            day.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          }}</span>
        </h2>
        <ol v-if="showsFor(day).length" class="show-list">
          <li v-for="show in showsFor(day)" :key="show.id + show.start">
            <ShowRow
              :show="show"
              :state="stateOf(show)"
              compact
              @open="open(show)"
            />
          </li>
        </ol>
        <p v-else class="week-day__empty">Playlist rotation all day</p>
      </section>
    </template>

    <BottomSheet
      v-model="detailOpen"
      :eyebrow="detail ? recurrenceOf(detail) || 'Live show' : ''"
      :title="detail ? detail.host : ''"
    >
      <template v-if="detail">
        <img
          v-if="detail.image"
          :src="detail.image"
          alt=""
          class="detail__image"
        />
        <p class="detail__title">{{ detail.title }}</p>
        <p class="detail__when">
          <v-icon size="18" aria-hidden="true">mdi-clock-outline</v-icon>
          {{
            detail.startAt.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          }},
          {{ range(detail) }}
          <span v-if="isLive(detail)" class="detail__live">Live now</span>
          <span v-else class="detail__rel"
            >({{ relative(detail.startAt) }})</span
          >
        </p>
        <p v-if="detail.location" class="detail__when">
          <v-icon size="18" aria-hidden="true">mdi-map-marker-outline</v-icon
          >{{ detail.location }}
        </p>
        <p v-if="detail.description" class="detail__description">
          {{ detail.description }}
        </p>
        <div class="detail__actions">
          <button
            v-if="isLive(detail)"
            type="button"
            class="action action--primary"
            @click="listen"
          >
            <v-icon size="18">play_arrow</v-icon>Listen live
          </button>
          <a
            :href="googleUrl(detail)"
            target="_blank"
            rel="noopener"
            class="action"
          >
            <v-icon size="18">mdi-google</v-icon>Google Calendar
          </a>
          <button type="button" class="action" @click="downloadIcs(detail)">
            <v-icon size="18">mdi-calendar-plus</v-icon>Add to calendar (.ics)
          </button>
          <a
            v-if="detail.profile && detail.profile.url"
            :href="detail.profile.url"
            target="_blank"
            rel="noopener"
            class="action"
          >
            <v-icon size="18">mdi-account-music</v-icon>DJ profile
          </a>
        </div>
      </template>
    </BottomSheet>
  </PageShell>
</template>

<script>
import PageShell from "~/components/ui/PageShell";
import BottomSheet from "~/components/ui/BottomSheet";
import ShowRow from "~/components/schedule/ShowRow";
import stationMixin from "~/mixins/station";
import { stationPath } from "~/lib/stations";
import {
  fetchSchedule,
  formatTime,
  googleCalendarUrl,
  liveShow,
  overlapsLocalDay,
  recurrence,
  relativeTime,
  sameLocalDay,
  showIcs,
  timeRange,
  timezoneLabel,
  weekDays,
} from "~/lib/schedule";

export default {
  components: { PageShell, BottomSheet, ShowRow },
  mixins: [stationMixin],
  data() {
    return {
      shows: [],
      loading: true,
      failed: false,
      view: this.$route.query.calendar ? "week" : "day",
      selected: 0,
      detail: null,
      detailOpen: false,
      now: new Date(),
      clock: null,
    };
  },
  computed: {
    // Kept for pages that frame the schedule (?hideNav=1&hideTitle=1).
    hideNav() {
      return Boolean(this.$route.query.hideNav);
    },
    hideTitle() {
      return Boolean(this.$route.query.hideTitle);
    },
    zone() {
      return timezoneLabel(this.now);
    },
    days() {
      return weekDays(this.now);
    },
    liveNow() {
      return liveShow(this.shows, this.now);
    },
    dayShows() {
      return this.showsFor(this.days[this.selected]);
    },
  },
  watch: {
    station: {
      immediate: true,
      handler(station) {
        if (station) {
          this.load();
        }
      },
    },
  },
  mounted() {
    this.clock = setInterval(() => (this.now = new Date()), 60000);
  },
  beforeDestroy() {
    clearInterval(this.clock);
  },
  methods: {
    load() {
      if (!this.station || !this.station.schedule) {
        return;
      }
      this.loading = true;
      this.failed = false;
      fetchSchedule(this.station.schedule.url).then((shows) => {
        this.shows = shows;
        this.loading = false;
        this.failed = !shows.length;
        this.$nextTick(this.scrollToLive);
      });
    },
    scrollToLive() {
      const live = this.$refs.live && this.$refs.live[0];
      if (live && this.view === "day" && this.selected === 0) {
        live.scrollIntoView({ block: "center" });
      }
    },
    setView(view) {
      this.view = view;
      const query = { ...this.$route.query };
      if (view === "week") {
        query.calendar = "1";
      } else {
        delete query.calendar;
      }
      this.$router.replace({ query }).catch(() => {});
    },
    showsFor(day) {
      return this.shows.filter(
        (show) =>
          overlapsLocalDay(show, day) &&
          (show.endAt > this.now || !sameLocalDay(day, this.now))
      );
    },
    countFor(day) {
      return this.showsFor(day).length;
    },
    dayName(day, index) {
      if (index === 0) return "Today";
      return day.toLocaleDateString(undefined, { weekday: "short" });
    },
    isLive(show) {
      return show.startAt <= this.now && show.endAt > this.now;
    },
    stateOf(show) {
      if (this.isLive(show)) return "live";
      const next = this.shows.find((item) => item.startAt > this.now);
      return next === show ? "next" : "";
    },
    open(show) {
      this.detail = show;
      this.detailOpen = true;
    },
    time(date) {
      return formatTime(date);
    },
    range(show) {
      return timeRange(show);
    },
    relative(date) {
      return relativeTime(date, this.now);
    },
    recurrenceOf(show) {
      return recurrence(show);
    },
    listenUrl() {
      return (
        window.location.origin +
        this.$router.resolve(stationPath(this.station)).href
      );
    },
    googleUrl(show) {
      return googleCalendarUrl(show, this.station.title, this.listenUrl());
    },
    downloadIcs(show) {
      const blob = new Blob(
        [showIcs(show, this.station.title, this.listenUrl())],
        { type: "text/calendar" }
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download =
        (show.host + "-" + show.title).replace(/[^\w-]+/g, "-").toLowerCase() +
        ".ics";
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },
    listen() {
      this.$player.playStation(this.station);
      this.detailOpen = false;
    },
  },
};
</script>

<style scoped>
.icon-button {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}
.icon-button .v-icon {
  color: var(--dnb-text) !important;
}
.icon-button:hover {
  background: rgba(255, 255, 255, 0.08);
}
.schedule-intro__zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 0 12px !important;
  font-size: 13px;
  color: var(--dnb-text-3);
}
.schedule-intro__zone .v-icon {
  color: inherit !important;
}
.live-banner {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(211, 47, 47, 0.6);
  border-radius: 14px;
  background: rgba(211, 47, 47, 0.12);
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.live-banner__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--dnb-live);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.live-banner__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}
.live-banner__text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
}
.live-banner__until {
  font-size: 12px;
  color: var(--dnb-text-2);
}
.day-tabs {
  position: sticky;
  top: calc(61px + env(safe-area-inset-top));
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin: 0 -14px 12px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-height: 60px;
  padding: 6px 0;
  border: 1px solid transparent;
  border-radius: 12px;
  background: var(--dnb-surface);
  color: var(--dnb-text-2);
  cursor: pointer;
}
.day-tab:focus-visible {
  outline: 2px solid var(--dnb-accent);
}
.day-tab__name {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.day-tab__date {
  font-size: 17px;
  font-weight: 700;
  color: var(--dnb-text);
}
.day-tab__count {
  font-size: 10px;
  color: var(--dnb-text-3);
}
.day-tab__count--none {
  opacity: 0.6;
}
.day-tab--on {
  background: var(--dnb-accent);
  color: #000;
}
.day-tab--on .day-tab__date,
.day-tab--on .day-tab__count {
  color: #000;
}
.show-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}
.schedule-state,
.schedule-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--dnb-text-2);
  font-size: 15px;
  line-height: 22px;
}
.text-button {
  margin-left: 6px;
  border: 0;
  background: none;
  color: var(--dnb-accent);
  font-weight: 700;
  cursor: pointer;
}
.week-day {
  margin-bottom: 20px;
}
.week-day__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.week-day__title span {
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--dnb-text-3);
}
.week-day__empty {
  margin: 0 !important;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px dashed var(--dnb-line);
  font-size: 13px;
  color: var(--dnb-text-3);
}
.detail__image {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 14px;
  margin-bottom: 14px;
}
.detail__title {
  margin: 0 0 10px !important;
  font-size: 17px;
  font-weight: 700;
}
.detail__when {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 6px !important;
  font-size: 14px;
  color: var(--dnb-text-2);
}
.detail__when .v-icon {
  color: var(--dnb-text-3) !important;
}
.detail__live {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--dnb-live);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.detail__rel {
  color: var(--dnb-text-3);
}
.detail__description {
  margin: 12px 0 0 !important;
  font-size: 14px;
  line-height: 21px;
  color: var(--dnb-text-2);
  white-space: pre-line;
}
.detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
.action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 999px;
  background: none;
  color: var(--dnb-text) !important;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}
.action .v-icon {
  color: inherit !important;
}
.action--primary {
  border-color: var(--dnb-accent);
  background: var(--dnb-accent);
  color: #000 !important;
  font-weight: 700;
}
</style>
