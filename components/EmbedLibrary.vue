<template>
  <div class="library" :style="paletteStyle">
    <section v-if="tab !== 'stations'" class="library-panel">
      <header class="library-title">DNBRADIO {{ tab.toUpperCase() }}</header>
      <div class="library-body">
        <template v-if="tab === 'schedule'">
          <p v-if="!schedule" class="library-row">Loading...</p>
          <p v-else-if="!schedule.length" class="library-row">
            No upcoming shows
          </p>
          <a
            v-for="show in schedule"
            :key="show.id"
            class="library-row"
            :class="{ 'library-row--current': show.live }"
            :href="show.profile && show.profile.url"
            target="_blank"
            rel="noopener"
          >
            <span class="library-when">{{
              show.live ? "LIVE" : show.when
            }}</span>
            {{ show.host }} - {{ show.title }}
          </a>
        </template>

        <template v-if="tab === 'podcast'">
          <p v-if="!podcast" class="library-row">Loading...</p>
          <div v-for="episode in podcast" :key="episode.id" class="library-row">
            <button
              type="button"
              class="library-link"
              :title="`Play ${episode.artist} - ${episode.title}`"
              @click="$emit('play-podcast', episode)"
            >
              {{ episode.artist }} - {{ episode.title }}
            </button>
            <a
              class="library-open"
              :href="episode.permalink"
              target="_blank"
              rel="noopener"
              :aria-label="`Open ${episode.title} on dnbradio.com`"
              >&#8599;</a
            >
          </div>
        </template>

        <template v-if="tab === 'info'">
          <p class="library-row library-row--current">
            {{ station.title }} - {{ station.subtitle }}
          </p>
          <p class="library-row library-wrap">{{ station.description }}</p>
          <p v-if="nowplaying.artist" class="library-row library-wrap">
            Now: {{ nowplaying.artist }} - {{ nowplaying.title }}
          </p>
          <p v-if="nowplaying.listeners" class="library-row">
            {{ nowplaying.listeners }} listening
          </p>
          <p class="library-links">
            <a
              v-for="link in links"
              :key="link.label"
              :href="link.url"
              target="_blank"
              rel="noopener"
              >{{ link.label }}</a
            >
          </p>
        </template>
      </div>
    </section>
    <nav class="library-tabs">
      <button
        v-for="name in tabs"
        :key="name"
        type="button"
        class="library-tab"
        :class="{ 'library-tab--active': tab === name }"
        :aria-pressed="tab === name ? 'true' : 'false'"
        @click="$emit('tab', name)"
      >
        {{ name.toUpperCase() }}
      </button>
    </nav>
  </div>
</template>

<script>
import moment from "moment-timezone";

export default {
  props: ["station", "nowplaying", "palette", "tab", "playerUrl"],
  data() {
    return {
      tabs: ["stations", "schedule", "podcast", "info"],
      schedule: null,
      podcast: null,
    };
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
    links() {
      const station = this.station;
      return [
        { label: "Full player", url: this.playerUrl },
        { label: "Website", url: station.website },
        { label: "X", url: station.twitter },
        { label: "Facebook", url: station.facebook },
        { label: "Instagram", url: station.instagram },
        { label: "SoundCloud", url: station.soundcloud },
        { label: "Chat", url: "https://discord.gg/DYb3fay" },
        { label: "Donate", url: "https://dnbradio.com/donate" },
        { label: "Patreon", url: "https://patreon.com/dnbradio" },
        { label: "Shop", url: "https://shop.dnbradio.com" },
      ].filter((link) => link.url);
    },
  },
  watch: {
    tab: {
      immediate: true,
      handler(tab) {
        if (tab === "schedule" && !this.schedule) {
          this.fetchSchedule();
        }
        if (tab === "podcast" && !this.podcast) {
          this.fetchPodcast();
        }
      },
    },
  },
  methods: {
    fetchSchedule() {
      const now = moment();
      return this.$axios
        .get(this.station.schedule.url, { progress: false })
        .then((res) => {
          this.schedule = res.data
            .filter((show) => moment(show.end).isAfter(now))
            .sort((a, b) => moment(a.start).diff(moment(b.start)))
            .slice(0, 30)
            .map((show) => ({
              ...show,
              live: moment(show.start).isSameOrBefore(now),
              when: moment(show.start).format("ddd HH:mm"),
            }));
        })
        .catch((err) => {
          console.log("cannot fetch schedule", err.message);
          this.schedule = [];
        });
    },
    fetchPodcast() {
      return this.$axios
        .get(this.station.podcast.url + "?page=1", { progress: false })
        .then((res) => {
          this.podcast = res.data.data;
        })
        .catch((err) => {
          console.log("cannot fetch podcast", err.message);
          this.podcast = [];
        });
    },
  },
};
</script>

<style scoped>
.library {
  position: absolute;
  inset: 0;
  font-family: var(--font);
  font-size: 9px;
  line-height: 13px;
  color: var(--normal);
}
.library-panel,
.library-tabs {
  position: absolute;
  left: 0;
  width: 275px;
  pointer-events: auto;
  box-sizing: border-box;
  background: var(--normalbg);
}
.library-panel {
  top: 116px;
  height: 145px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--selectedbg);
}
.library-title {
  flex-shrink: 0;
  height: 13px;
  padding: 0 4px;
  background: var(--selectedbg);
  color: var(--current);
  font-weight: bold;
  letter-spacing: 0.08em;
}
.library-body {
  flex: 1;
  overflow-y: auto;
  padding: 2px 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--normal) var(--normalbg);
}
.library-row {
  display: flex;
  gap: 4px;
  margin: 0;
  color: var(--normal);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.library-row--current {
  color: var(--current);
}
.library-wrap {
  white-space: normal;
}
.library-when {
  flex-shrink: 0;
  width: 46px;
  color: var(--current);
}
.library-link {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
}
.library-open {
  flex-shrink: 0;
  color: var(--current);
  text-decoration: none;
}
.library-links {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  margin: 4px 0 0;
}
.library-links a {
  color: var(--current);
}
a.library-row:hover,
.library-link:hover,
.library-links a:hover {
  background: var(--selectedbg);
}
.library-tabs {
  top: 261px;
  height: 14px;
  display: flex;
}
.library-tab {
  flex: 1;
  padding: 0;
  border: 0;
  border-top: 1px solid var(--selectedbg);
  background: var(--normalbg);
  color: var(--normal);
  font: inherit;
  font-weight: bold;
  letter-spacing: 0.06em;
  cursor: pointer;
}
.library-tab--active {
  background: var(--selectedbg);
  color: var(--current);
}
.library-tab:focus-visible,
.library-link:focus-visible,
.library a:focus-visible {
  outline: 1px solid var(--current);
  outline-offset: -1px;
}
</style>
