<template>
  <div class="winamp-embed">
    <div ref="stage" class="winamp-stage" />
    <div class="winamp-overlay" :style="overlayStyle">
      <EmbedLibrary
        v-if="ready && station"
        :station="station"
        :nowplaying="nowplaying[station.id] || {}"
        :palette="palette"
        :tab="tab"
        :player-url="playerUrl"
        @tab="selectTab"
        @play-podcast="playPodcast"
      />
    </div>
    <p v-if="unsupported" class="winamp-unsupported">
      This browser can't run the player.
      <a :href="playerUrl" target="_blank" rel="noopener">Open dnbradio</a>
    </p>
  </div>
</template>

<script>
import webampScriptUrl from "!!file-loader?name=[name].[contenthash:7].[ext]!webamp/built/webamp.bundle.min.js";
import stations from "@/data/stations";
import Station from "@/models/Station";
import EmbedLibrary from "~/components/EmbedLibrary.vue";

const LAYOUT_WIDTH = 275;
const MAIN_HEIGHT = 116;
const PLAYLIST_HEIGHT = 145;
const TABS_HEIGHT = 14;
const LAYOUT_HEIGHT = MAIN_HEIGHT + PLAYLIST_HEIGHT + TABS_HEIGHT;
const CLASSIC_SKINS = [
  ["Green-Dimension-V2", "Green Dimension V2"],
  ["Internet-Archive", "Internet Archive"],
  ["MacOSXAqua1-5", "Mac OSX v1.5 (Aqua)"],
  ["TopazAmp1-2", "TopazAmp"],
  ["Vizor1-01", "Vizor"],
  ["XMMS-Turquoise", "XMMS Turquoise"],
  ["ZaxonRemake1-0", "Zaxon Remake"],
];
const CLASSIC_PLAYLIST_STYLE = {
  normal: "#00FF00",
  current: "#FFFFFF",
  normalbg: "#000000",
  selectedbg: "#0000C6",
  font: "Arial",
};

function loadWebamp() {
  if (window.Webamp) {
    return Promise.resolve(window.Webamp);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = webampScriptUrl;
    script.onload = () => resolve(window.Webamp);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default {
  layout: "ls-widget",
  components: { EmbedLibrary },
  head() {
    return {
      title: this.station ? `${this.station.title} live player` : "live player",
      htmlAttrs: { class: "dnb-embed" },
    };
  },
  data() {
    return {
      ready: false,
      unsupported: false,
      tab: "stations",
      nowplaying: {},
      palette: CLASSIC_PLAYLIST_STYLE,
      stationTrackIds: {},
      scale: 1,
      offset: { left: 0, top: 0 },
      npInterval: null,
      userMessageTimeout: null,
      playTracked: false,
    };
  },
  computed: {
    currenStationIndex() {
      return this.$route.params && this.$route.params.stationId
        ? this.$route.params.stationId
        : 1;
    },
    stations() {
      return Station.query().get();
    },
    station() {
      return this.stations.find((item) => item.id == this.currenStationIndex);
    },
    playerUrl() {
      const base = this.$config.APP_BASE_URL;
      return this.currenStationIndex == 1
        ? base
        : `${base}stations/${this.currenStationIndex}`;
    },
    overlayStyle() {
      return {
        zoom: this.scale,
        left: `${this.offset.left / this.scale}px`,
        top: `${this.offset.top / this.scale}px`,
      };
    },
  },
  methods: {
    trackFor(station) {
      return {
        url: station.streams[0].url,
        metaData: { artist: station.title, title: station.subtitle },
        duration: 0,
      };
    },
    // Webamp has no API for these, so they go through its store and private
    // options: start the embed's station when Play is pressed with nothing
    // loaded, and show the library tab that matches a toggled window.
    webampMiddleware(store) {
      return (next) => (action) => {
        const { playlist } = store.getState();
        if (
          action.type === "PLAY" &&
          playlist.currentTrack == null &&
          this.stationTrackIds[this.station.id] != null
        ) {
          store.dispatch({
            type: "PLAY_TRACK",
            id: this.stationTrackIds[this.station.id],
          });
          return;
        }
        if (action.type === "PLAY_TRACK" || action.type === "PLAY") {
          this.trackFirstPlay();
        }
        if (
          (action.type === "TOGGLE_WINDOW" ||
            action.type === "SET_WINDOW_VISIBILITY") &&
          action.windowId !== "main"
        ) {
          this.tab = "stations";
        }
        return next(action);
      };
    },
    trackFirstPlay() {
      if (this.playTracked || !window.plausible) {
        return;
      }
      this.playTracked = true;
      window.plausible("Embed Play", {
        props: { station: this.station.title },
      });
    },
    lockWindowDragging(event) {
      if (event.target.classList?.contains("draggable")) {
        event.stopPropagation();
      }
    },
    fitToFrame() {
      const scale = Math.min(
        window.innerWidth / LAYOUT_WIDTH,
        window.innerHeight / LAYOUT_HEIGHT
      );
      this.scale = scale;
      this.offset = {
        left: (window.innerWidth - LAYOUT_WIDTH * scale) / 2,
        top: (window.innerHeight - LAYOUT_HEIGHT * scale) / 2,
      };
      const root = document.getElementById("webamp");
      if (root) {
        Object.assign(root.style, this.overlayStyle, { position: "absolute" });
      }
    },
    selectTab(tab) {
      this.tab = tab;
      if (tab === "stations") {
        this.webamp.store.dispatch({
          type: "SET_WINDOW_VISIBILITY",
          windowId: "playlist",
          hidden: false,
        });
      }
    },
    showUserMessage(message) {
      this.webamp.store.dispatch({ type: "SET_USER_MESSAGE", message });
      clearTimeout(this.userMessageTimeout);
      this.userMessageTimeout = setTimeout(() => {
        this.webamp.store.dispatch({ type: "UNSET_USER_MESSAGE" });
      }, 6000);
    },
    onMediaError(event) {
      const src = event.target.getAttribute("src") || "";
      const station = this.stations.find((item) =>
        src.startsWith(item.streams[0].url)
      );
      this.showUserMessage(
        station
          ? `${station.title} can't play here - open the full player from INFO`
          : "This episode can't play here - open it from PODCAST"
      );
    },
    playPodcast(episode) {
      this.webamp.appendTracks([
        {
          url: episode.playback_url,
          metaData: { artist: episode.artist, title: episode.title },
        },
      ]);
      const { trackOrder } = this.webamp.store.getState().playlist;
      this.webamp.store.dispatch({
        type: "PLAY_TRACK",
        id: trackOrder[trackOrder.length - 1],
      });
      this.selectTab("stations");
    },
    fetchNowplaying(station) {
      return this.$axios
        .get(station.nowplaying_url.url, { progress: false })
        .then((res) => {
          let nowplaying;
          switch (station.nowplaying_url.type) {
            case "azuracast": {
              const streamer = res.data.live?.is_live
                ? res.data.live.streamer_name
                : null;
              nowplaying = {
                artist: streamer || res.data.now_playing.song.artist,
                title: res.data.now_playing.song.title,
                listeners: res.data.listeners.current,
                streamer,
              };
              break;
            }
            case "jt":
              nowplaying = {
                artist: res.data.h1,
                title: res.data.h2,
                listeners: res.data.listening,
                streamer: null,
              };
              break;
            default:
              return;
          }
          this.$set(this.nowplaying, station.id, nowplaying);
          if (nowplaying.artist && nowplaying.title) {
            this.webamp.store.dispatch({
              type: "SET_MEDIA_TAGS",
              id: this.stationTrackIds[station.id],
              artist: station.title,
              title: `${nowplaying.artist} - ${nowplaying.title}`,
            });
          }
        })
        .catch((err) => {
          console.log("cannot fetch nowplaying", station.title, err.message);
        });
    },
    fetchAllNowplaying() {
      this.stations.forEach((station) => this.fetchNowplaying(station));
    },
    async startWebamp() {
      const Webamp = await loadWebamp();
      if (!Webamp.browserIsSupported()) {
        this.unsupported = true;
        return;
      }
      this.webamp = new Webamp({
        initialTracks: [],
        availableSkins: CLASSIC_SKINS.map(([file, name]) => ({
          url: `${this.$config.APP_BASE_URL}skins/${file}.wsz`,
          name,
        })),
        windowLayout: {
          main: { position: { top: 0, left: 0 } },
          equalizer: { position: { top: MAIN_HEIGHT, left: 0 }, closed: true },
          playlist: {
            position: { top: MAIN_HEIGHT, left: 0 },
            size: { extraHeight: 1, extraWidth: 0 },
          },
        },
        enableHotkeys: true,
        enableMediaSession: true,
        __customMiddlewares: [(store) => this.webampMiddleware(store)],
      });
      this.webamp.onWillClose((cancel) => cancel());
      this.webamp.__onStateChange(() => {
        this.palette =
          this.webamp.store.getState().display.skinPlaylistStyle ||
          CLASSIC_PLAYLIST_STYLE;
      });
      await this.webamp.renderWhenReady(this.$refs.stage);

      // Webamp buffers the first of its initialTracks on load, which would
      // open a live stream connection on every card view.
      this.webamp.appendTracks(this.stations.map(this.trackFor));
      const { trackOrder } = this.webamp.store.getState().playlist;
      this.stations.forEach((station, index) => {
        this.stationTrackIds[station.id] = trackOrder[index];
      });
      this.webamp.media._source._audio.addEventListener(
        "error",
        this.onMediaError
      );
      this.fitToFrame();
      this.ready = true;
    },
  },
  async mounted() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });

    window.addEventListener("mousedown", this.lockWindowDragging, true);
    window.addEventListener("touchstart", this.lockWindowDragging, true);
    window.addEventListener("resize", this.fitToFrame);
    await this.startWebamp();
    this.fetchAllNowplaying();
    this.npInterval = setInterval(this.fetchAllNowplaying, 30000);
  },
  beforeDestroy() {
    clearInterval(this.npInterval);
    clearTimeout(this.userMessageTimeout);
    window.removeEventListener("mousedown", this.lockWindowDragging, true);
    window.removeEventListener("touchstart", this.lockWindowDragging, true);
    window.removeEventListener("resize", this.fitToFrame);
    if (this.webamp) {
      this.webamp.dispose();
    }
  },
};
</script>

<style>
html.dnb-embed,
html.dnb-embed body {
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #000;
}
html.dnb-embed #webamp {
  image-rendering: pixelated;
}
/* Vuetify's global reset sets background-repeat: no-repeat on every element,
   which leaves Webamp's tiled skin sprites half drawn. */
#webamp * {
  background-repeat: repeat;
}
</style>
<style scoped>
.winamp-stage {
  position: absolute;
  top: 0;
  left: 0;
  width: 275px;
  height: 261px;
}
.winamp-overlay {
  position: absolute;
  width: 275px;
  height: 275px;
  pointer-events: none;
  z-index: 10;
  image-rendering: pixelated;
}
.winamp-unsupported {
  color: #0f0;
  font: 12px Arial, sans-serif;
  padding: 16px;
}
.winamp-unsupported a {
  color: #fff;
}
</style>
