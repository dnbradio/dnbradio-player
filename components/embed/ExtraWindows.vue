<template>
  <div class="dnb-windows">
    <GenWindow
      v-for="win in openWindows"
      :key="win.id"
      :title="win.title"
      :x="windows[win.id].x"
      :y="windows[win.id].y"
      :z="windows[win.id].z"
      :width="WIDTH"
      :height="win.height"
      :bounds="bounds"
      :selected="focused === win.id"
      @focus="$emit('focus', win.id)"
      @move="$emit('move', win.id, $event)"
      @close="$emit('close', win.id)"
    >
      <ListRows
        v-if="win.id === 'schedule'"
        :rows="scheduleRows"
        :palette="palette"
      />

      <ListRows
        v-else-if="win.id === 'podcasts'"
        :rows="podcastRows"
        :palette="palette"
        @select="onPodcastRow"
      />

      <ListRows
        v-else-if="win.id === 'info'"
        :rows="infoRows"
        :palette="palette"
        :numbered="false"
      />

      <ListRows
        v-else-if="win.id === 'addUrl'"
        :rows="suggestionRows"
        :palette="palette"
        @select="$emit('add-station', $event.station)"
      >
        <template #before>
          <form class="dnb-form" @submit.prevent="submitUrl">
            <input
              ref="urlInput"
              v-model.trim="url"
              class="dnb-input"
              type="url"
              placeholder="http://"
              aria-label="Stream or file URL"
            />
            <button type="submit" class="dnb-button">ADD</button>
          </form>
          <p v-if="urlError" class="dnb-note">{{ urlError }}</p>
          <p class="dnb-note">
            {{
              suggestionRows.length
                ? "Suggested radios:"
                : "Every dnbradio station is on this playlist."
            }}
          </p>
        </template>
      </ListRows>

      <ListRows
        v-else-if="win.id === 'loadList'"
        :rows="loadRows"
        :palette="palette"
        @select="onLoadRow"
      >
        <input
          ref="fileInput"
          class="dnb-file"
          type="file"
          accept=".m3u,.m3u8,.pls,audio/x-mpegurl,audio/x-scpls"
          @change="onPlaylistFile"
        />
        <p v-if="loadMessage" class="dnb-note">{{ loadMessage }}</p>
      </ListRows>

      <ListRows
        v-else-if="win.id === 'saveList'"
        :rows="saveRows"
        :palette="palette"
        @select="$emit('save', $event.key)"
      />
    </GenWindow>
  </div>
</template>

<script>
import GenWindow from "./GenWindow.vue";
import ListRows from "./ListRows.vue";

const WIDTH = 275;
const WINDOWS = [
  { id: "schedule", title: "DNBRADIO SCHEDULE", height: 116 },
  { id: "podcasts", title: "DNBRADIO PODCASTS", height: 116 },
  { id: "info", title: "STATION INFO", height: 116 },
  { id: "addUrl", title: "ADD URL", height: 116 },
  { id: "loadList", title: "LOAD LIST", height: 116 },
  { id: "saveList", title: "SAVE LIST", height: 116 },
];

export default {
  components: { GenWindow, ListRows },
  props: [
    "windows",
    "focused",
    "bounds",
    "palette",
    "station",
    "nowplaying",
    "playerUrl",
    "podcasts",
    "suggestions",
    "activeList",
    "loadMessage",
  ],
  data() {
    return { WIDTH, schedule: null, url: "", urlError: "" };
  },
  computed: {
    openWindows() {
      return WINDOWS.filter((win) => this.windows[win.id]?.open);
    },
    scheduleRows() {
      if (!this.schedule) {
        return [{ key: "loading", text: "Loading..." }];
      }
      if (!this.schedule.length) {
        return [{ key: "empty", text: "No upcoming shows" }];
      }
      return this.schedule.map((show) => ({
        key: show.id,
        text: `${show.host} - ${show.title}`,
        detail: show.live ? "LIVE" : show.when,
        current: show.live,
        href: show.profile && show.profile.url,
      }));
    },
    podcastRows() {
      const rows = this.podcasts.map((episode) => ({
        key: episode.id,
        text: `${episode.artist} - ${episode.title}`,
        detail: `${episode.plays} plays`,
        hint: "Play in the player",
        action: true,
        episode,
      }));
      rows.push({
        key: "more",
        text: "More on dnbradio.com",
        href: this.station.podcast && this.station.podcast.website,
      });
      return rows;
    },
    infoRows() {
      const station = this.station;
      const nowplaying = this.nowplaying || {};
      const rows = [
        {
          key: "name",
          text: `${station.title} - ${station.subtitle}`,
          current: true,
        },
        { key: "about", text: station.description, wrap: true },
      ];
      if (nowplaying.artist) {
        rows.push({
          key: "now",
          text: `Now: ${nowplaying.artist} - ${nowplaying.title}`,
          wrap: true,
        });
      }
      if (nowplaying.listeners) {
        rows.push({
          key: "listeners",
          text: `${nowplaying.listeners} listening`,
        });
      }
      return rows.concat(
        [
          ["Full player", this.playerUrl],
          ["Website", station.website],
          ["X", station.twitter],
          ["Facebook", station.facebook],
          ["Instagram", station.instagram],
          ["SoundCloud", station.soundcloud],
          ["Chat (Discord)", "https://discord.gg/DYb3fay"],
          ["Donate", "https://dnbradio.com/donate"],
          ["Patreon", "https://patreon.com/dnbradio"],
          ["Shop", "https://shop.dnbradio.com"],
        ]
          .filter(([, href]) => href)
          .map(([text, href]) => ({ key: text, text, href, detail: "open" })),
      );
    },
    suggestionRows() {
      return this.suggestions.map((station) => ({
        key: station.id,
        text: `${station.title} - ${station.subtitle}`,
        action: true,
        station,
      }));
    },
    loadRows() {
      return [
        {
          key: "default",
          text: "DNBRADIO default playlist",
          detail: this.activeList === "default" ? "loaded" : "",
          current: this.activeList === "default",
          action: true,
        },
        { key: "file", text: "Open .m3u or .pls file...", action: true },
      ];
    },
    saveRows() {
      return [
        { key: "m3u", text: "Save as M3U playlist (.m3u)", action: true },
        { key: "pls", text: "Save as PLS playlist (.pls)", action: true },
      ];
    },
  },
  watch: {
    "windows.schedule.open": {
      immediate: true,
      handler(open) {
        if (open && !this.schedule) {
          this.fetchSchedule();
        }
      },
    },
    "windows.addUrl.open"(open) {
      if (open) {
        this.url = "";
        this.urlError = "";
        this.$nextTick(() => this.$refs.urlInput?.[0]?.focus());
      }
    },
  },
  methods: {
    fetchSchedule() {
      const now = new Date();
      return this.$http
        .get(this.station.schedule.url, { progress: false })
        .then((res) => {
          this.schedule = res.data
            .filter((show) => new Date(show.end) > now)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 30)
            .map((show) => ({
              ...show,
              live: new Date(show.start) <= now,
              when: new Intl.DateTimeFormat(undefined, {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(show.start)),
            }));
        })
        .catch((err) => {
          console.log("cannot fetch schedule", err.message);
          this.schedule = [];
        });
    },
    onPodcastRow(row) {
      this.$emit("play-podcast", row.episode);
    },
    submitUrl() {
      if (!/^https?:\/\/\S+$/i.test(this.url)) {
        this.urlError = "Enter an http:// or https:// URL";
        return;
      }
      this.$emit("add-url", this.url);
    },
    onLoadRow(row) {
      if (row.key === "default") {
        this.$emit("load-default");
      } else {
        this.$refs.fileInput[0].click();
      }
    },
    onPlaylistFile(event) {
      const [file] = event.target.files;
      event.target.value = "";
      if (file) {
        this.$emit("load-file", file);
      }
    },
  },
};
</script>

<style scoped>
.dnb-windows {
  position: absolute;
  top: 0;
  left: 0;
}
.dnb-form {
  display: flex;
  gap: 3px;
  margin: 1px 0 3px;
}
.dnb-input,
.dnb-button {
  height: 13px;
  box-sizing: border-box;
  border: 1px solid var(--normal);
  background: var(--normalbg);
  color: var(--current);
  font: inherit;
}
.dnb-input {
  flex: 1;
  min-width: 0;
  padding: 0 2px;
}
.dnb-button {
  padding: 0 4px;
  cursor: pointer;
}
.dnb-button:hover,
.dnb-button:focus-visible,
.dnb-input:focus {
  background: var(--selectedbg);
  outline: none;
}
.dnb-note {
  margin: 0;
  padding: 0 1px;
  color: var(--current);
}
.dnb-file {
  display: none;
}
</style>
