<template>
  <div class="winamp-embed">
    <div
      ref="stage"
      class="winamp-stage"
      :style="{ width: `${LAYOUT_WIDTH}px`, height: `${LAYOUT_HEIGHT}px` }"
    />
    <div
      ref="windows"
      class="dnb-layer"
      :class="{ 'dnb-layer--behind': webampOnTop }"
    >
      <ExtraWindows
        v-if="ready && station"
        :windows="extraWindows"
        :focused="focusedWindow"
        :bounds="{ width: LAYOUT_WIDTH, height: LAYOUT_HEIGHT }"
        :palette="palette"
        :station="station"
        :nowplaying="nowplaying[station.id]"
        :player-url="playerUrl"
        :podcasts="podcasts"
        :suggestions="suggestions"
        :active-list="activeList"
        :load-message="loadMessage"
        @focus="focusWindow"
        @move="moveWindow"
        @close="closeWindow"
        @play-podcast="playPodcast"
        @add-url="addUrl"
        @add-station="addStation"
        @load-default="loadDefaultPlaylist"
        @load-file="loadPlaylistFile"
        @save="savePlaylistFile"
      />
    </div>
    <p v-if="unsupported" class="winamp-unsupported">
      This browser can't run the player.
      <a :href="playerUrl" target="_blank" rel="noopener">Open dnbradio</a>
    </p>
  </div>
</template>

<script>
import webampScriptUrl from "!!file-loader?name=[name].[contenthash:7].js!webamp/built/webamp.butterchurn-bundle.min.mjs";
import stations from "@/data/stations";
import Station from "@/models/Station";
import ExtraWindows from "~/components/embed/ExtraWindows.vue";
import { readAudioInfo } from "~/components/embed/audioInfo";
import { parsePlaylist, toM3u, toPls } from "~/components/embed/playlistFiles";
import { loadSettings, saveSettings } from "~/components/embed/settings";

const LAYOUT_WIDTH = 275;
const MAIN_HEIGHT = 116;
const PLAYLIST_HEIGHT = 116;
const SHADE_HEIGHT = 14;
const MILKDROP_WIDTH = 400;
const MILKDROP_HEIGHT = 203;
const MILKDROP_MAX_WIDTH = 730;
const STANDALONE_MAX_WIDTH = 500;
const DEFAULT_PODCASTS = 20;
// Passed as a track duration so Webamp neither probes the URL for its length
// (which would open every stream on load) nor shows 0:00; rewritten to null.
const UNKNOWN_DURATION = -1;
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
const EXTRA_WINDOWS = {
  schedule: { x: 0, y: MAIN_HEIGHT },
  podcasts: { x: 0, y: MAIN_HEIGHT },
  info: { x: 0, y: MAIN_HEIGHT },
  addUrl: { x: 0, y: MAIN_HEIGHT },
  loadList: { x: 0, y: MAIN_HEIGHT },
  saveList: { x: 0, y: MAIN_HEIGHT },
};
const MENU_ITEMS = [
  ["schedule", "DNBRADIO Schedule"],
  ["podcasts", "DNBRADIO Podcasts"],
  ["info", "Station Info"],
];

function initialLayout(query) {
  const milkdrop = query.milkdrop === "1";
  const minPlayer = query["min-player"] === "1";
  const minEq = query["min-eq"] === "1";
  const minPlaylist = query["min-playlist"] === "1";
  const mainHeight = minPlayer ? SHADE_HEIGHT : MAIN_HEIGHT;
  const playlistTop = mainHeight + (minEq ? SHADE_HEIGHT : 0);
  const milkdropTop = playlistTop + (minPlaylist ? SHADE_HEIGHT : 0);
  return {
    width: milkdrop ? MILKDROP_WIDTH : LAYOUT_WIDTH,
    height: milkdrop
      ? milkdropTop + MILKDROP_HEIGHT
      : playlistTop + (minPlaylist ? SHADE_HEIGHT : PLAYLIST_HEIGHT),
    maxWidth: milkdrop ? MILKDROP_MAX_WIDTH : STANDALONE_MAX_WIDTH,
    windows: {
      main: { position: { top: 0, left: 0 }, shadeMode: minPlayer },
      equalizer: {
        position: { top: mainHeight, left: 0 },
        shadeMode: minEq,
        closed: !minEq,
      },
      playlist: {
        position: { top: playlistTop, left: 0 },
        shadeMode: minPlaylist,
        closed: milkdrop && !minPlaylist,
      },
      milkdrop: {
        position: { top: milkdropTop, left: 0 },
        // Webamp's resize increments are 25px wide and 29px high.
        size: milkdrop ? { extraWidth: 5, extraHeight: 3 } : undefined,
        closed: !milkdrop,
      },
    },
  };
}

function decodeEntities(text) {
  const element = document.createElement("textarea");
  element.innerHTML = text || "";
  return element.value;
}

async function loadWebamp() {
  // Keep the prebuilt module outside Nuxt's older webpack parser. Its default
  // export includes Milkdrop; window.Webamp still points to the base class.
  const { default: Webamp } = await import(
    /* webpackIgnore: true */ webampScriptUrl
  );
  return Webamp;
}

function downloadText(text, filename, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export default {
  layout: "ls-widget",
  components: { ExtraWindows },
  head() {
    return {
      title: this.station ? `${this.station.title} live player` : "live player",
      htmlAttrs: { class: "dnb-embed" },
    };
  },
  data() {
    const layout = initialLayout(this.$route.query);
    const extraWindows = {};
    Object.entries(EXTRA_WINDOWS).forEach(([id, position]) => {
      extraWindows[id] = {
        open: false,
        z: 1,
        ...position,
        y: layout.windows.playlist.position.top,
      };
    });
    return {
      LAYOUT_WIDTH: layout.width,
      LAYOUT_HEIGHT: layout.height,
      standaloneMaxWidth: layout.maxWidth,
      windowLayout: layout.windows,
      ready: false,
      unsupported: false,
      nowplaying: {},
      palette: CLASSIC_PLAYLIST_STYLE,
      podcasts: [],
      activeList: "default",
      playlistUrls: [],
      extraWindows,
      focusedWindow: null,
      webampOnTop: false,
      loadMessage: "",
      scale: 1,
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
    suggestions() {
      return this.stations.filter(
        (station) =>
          this.activeList !== "default" ||
          !this.playlistUrls.includes(station.streams[0].url)
      );
    },
  },
  methods: {
    stationEntry(station) {
      return {
        key: `station:${station.id}`,
        kind: "station",
        url: station.streams[0].url,
        artist: station.title,
        title: station.subtitle,
      };
    },
    podcastEntry(episode) {
      return {
        key: `podcast:${episode.id}`,
        kind: "podcast",
        url: episode.playback_url,
        infoUrl: /^https?:/.test(episode.download_url)
          ? episode.download_url
          : null,
        artist: episode.artist,
        title: `${episode.title} (${episode.plays} plays)`,
      };
    },
    urlEntry(url, title) {
      return { key: `url:${url}`, kind: "url", url, artist: "", title };
    },
    defaultBase() {
      return this.stations
        .map(this.stationEntry)
        .concat(
          this.podcasts.slice(0, DEFAULT_PODCASTS).map(this.podcastEntry)
        );
    },
    defaultEntries() {
      const removed = new Set(this.playlists.removedDefault);
      return this.defaultBase()
        .filter((entry) => !removed.has(entry.key))
        .concat(this.playlists.addedToDefault);
    },
    trackFor(entry) {
      return {
        url: entry.url,
        metaData: { artist: entry.artist, title: entry.title || entry.url },
        duration: UNKNOWN_DURATION,
      };
    },
    appendEntries(entries) {
      entries.forEach((entry) => this.entries.set(entry.url, entry));
      this.webamp.appendTracks(entries.map(this.trackFor));
    },
    showPlaylist(entries, list) {
      this.switchingList = true;
      this.activeList = list;
      this.webamp.store.dispatch({ type: "REMOVE_ALL_TRACKS", dnbKeep: true });
      this.appendEntries(entries);
      this.switchingList = false;
      this.rememberPlaylist();
    },
    keepDefaultPlaylist() {
      this.playlists.user = [];
      this.showPlaylist([], "user");
      this.showUserMessage("Default playlist kept - use Load list to return");
    },
    rememberPlaylist() {
      if (this.switchingList || !this.ready) {
        return;
      }
      const entries = this.webamp
        .getPlaylistTracks()
        .filter((track) => !track.url.startsWith("blob:"))
        .map(
          (track) =>
            this.entries.get(track.url) ||
            this.urlEntry(track.url, track.title || track.defaultName)
        );
      if (this.activeList === "default") {
        const keys = new Set(entries.map((entry) => entry.key));
        const base = this.defaultBase();
        const baseKeys = new Set(base.map((entry) => entry.key));
        this.playlists.removedDefault = base
          .filter((entry) => !keys.has(entry.key))
          .map((entry) => entry.key);
        this.playlists.addedToDefault = entries.filter(
          (entry) => !baseKeys.has(entry.key)
        );
      } else {
        this.playlists.user = entries;
      }
      this.scheduleSave();
    },
    stationTrackId() {
      const url = this.station.streams[0].url;
      const tracks = this.webamp.getPlaylistTracks();
      const track = tracks.find((item) => item.url === url) || tracks[0];
      return track ? track.id : null;
    },
    // Webamp has no API for these, so they go through its store's actions.
    webampMiddleware(store) {
      return (next) => (action) => {
        const { playlist } = store.getState();
        switch (action.type) {
          case "PLAY":
            if (playlist.currentTrack == null) {
              const id = this.stationTrackId();
              if (id != null) {
                store.dispatch({ type: "PLAY_TRACK", id });
                return;
              }
            }
            this.trackFirstPlay();
            break;
          case "PLAY_TRACK":
            this.trackFirstPlay();
            break;
          case "REMOVE_ALL_TRACKS":
            if (!action.dnbKeep && this.activeList === "default") {
              this.keepDefaultPlaylist();
              return;
            }
            break;
          case "REMOVE_TRACKS":
            if (
              this.activeList === "default" &&
              action.ids.length >= playlist.trackOrder.length
            ) {
              this.keepDefaultPlaylist();
              return;
            }
            break;
          case "ADD_TRACK_FROM_URL":
          case "SET_MEDIA_DURATION":
            if (action.duration === UNKNOWN_DURATION) {
              action = { ...action, duration: null };
            }
            break;
          case "SET_MEDIA":
            if (!Number.isFinite(action.length) || action.length === 0) {
              action = { ...action, length: null };
            }
            break;
          case "SET_SKIN_DATA":
            this.skinUrl = this.requestedSkinUrl || this.skinUrl;
            break;
          case "LOAD_DEFAULT_SKIN":
            this.skinUrl = null;
            break;
        }
        const result = next(action);
        if (action.type === "SET_MEDIA") {
          this.showRealAudioInfo(action.id);
        }
        // Windows hidden at startup share the playlist's compact slot.
        if (
          (action.type === "TOGGLE_WINDOW" ||
            action.type === "SET_WINDOW_VISIBILITY") &&
          store.getState().windows.genWindows[action.windowId]?.open
        ) {
          if (
            (action.windowId === "equalizer" ||
              action.windowId === "milkdrop") &&
            this.windowLayout[action.windowId].closed
          ) {
            store.dispatch({
              type: "UPDATE_WINDOW_POSITIONS",
              positions: {
                [action.windowId]:
                  store.getState().windows.genWindows.playlist.position,
              },
            });
          }
          store.dispatch({
            type: "SET_FOCUSED_WINDOW",
            window: action.windowId,
          });
        }
        if (action.type === "SET_FOCUSED_WINDOW" && action.window != null) {
          this.webampOnTop = true;
        }
        return result;
      };
    },
    // Webamp shows fixed 128 kbps / 44 kHz / stereo for anything it doesn't
    // tag-scan, so the readouts come from the stream's own frame headers.
    async showRealAudioInfo(id) {
      const track = this.webamp.store.getState().tracks[id];
      if (!track) {
        return;
      }
      const entry = this.entries.get(track.url);
      const url = (entry && entry.infoUrl) || track.url;
      if (!/^(https?|blob):/.test(url)) {
        return;
      }
      if (!this.audioInfo.has(url)) {
        this.audioInfo.set(url, readAudioInfo(url));
      }
      const info = await this.audioInfo.get(url);
      const current = this.webamp.store.getState().tracks[id];
      if (!info || !current) {
        return;
      }
      this.webamp.store.dispatch({
        type: "SET_MEDIA_TAGS",
        id,
        title: current.title,
        artist: current.artist,
        album: current.album,
        albumArtUrl: current.albumArtUrl,
        bitrate: info.kbps * 1000,
        sampleRate: info.sampleRate,
        numberOfChannels: info.channels,
      });
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
    // Webamp resumes its suspended AudioContext only from clicks that reach
    // <body>, and its playlist stops click propagation, so double-clicking a
    // track before pressing Play started it silently.
    resumeAudio() {
      const context = this.webamp && this.webamp.media._context;
      if (context && context.state === "suspended") {
        context.resume();
      }
    },
    // Webamp moves windows by raw mouse deltas, which the zoom would magnify.
    onDragStart(event) {
      const target = event.target;
      this.dragOrigin =
        target.closest &&
        target.closest("#webamp") &&
        (target.classList.contains("draggable") ||
          target.closest(".track-cell"))
          ? { x: event.clientX, y: event.clientY }
          : null;
    },
    onDragMove(event) {
      if (!this.dragOrigin || this.scaledEvents.has(event)) {
        return;
      }
      event.stopImmediatePropagation();
      const scaled = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX:
          this.dragOrigin.x + (event.clientX - this.dragOrigin.x) / this.scale,
        clientY:
          this.dragOrigin.y + (event.clientY - this.dragOrigin.y) / this.scale,
        buttons: event.buttons,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      });
      this.scaledEvents.add(scaled);
      event.target.dispatchEvent(scaled);
    },
    onDragEnd() {
      this.dragOrigin = null;
    },
    fitToFrame() {
      const framed = window.self !== window.top;
      const scale = Math.min(
        window.innerWidth / this.LAYOUT_WIDTH,
        window.innerHeight / this.LAYOUT_HEIGHT,
        framed ? Infinity : this.standaloneMaxWidth / this.LAYOUT_WIDTH
      );
      this.scale = scale;
      const root = document.getElementById("webamp");
      if (root) {
        Object.assign(root.style, {
          position: "absolute",
          zoom: scale,
          left: `${
            (window.innerWidth - this.LAYOUT_WIDTH * scale) / 2 / scale
          }px`,
          top: `${
            (window.innerHeight - this.LAYOUT_HEIGHT * scale) / 2 / scale
          }px`,
        });
      }
    },
    openWindow(id) {
      this.extraWindows[id].open = true;
      this.focusWindow(id);
    },
    closeWindow(id) {
      this.extraWindows[id].open = false;
      if (id === "loadList") {
        this.loadMessage = "";
      }
    },
    focusWindow(id) {
      const top = Math.max(...Object.values(this.extraWindows).map((w) => w.z));
      if (this.extraWindows[id].z !== top || top === 1) {
        this.extraWindows[id].z = top + 1;
      }
      this.focusedWindow = id;
      this.webampOnTop = false;
    },
    moveWindow(id, position) {
      Object.assign(this.extraWindows[id], position);
    },
    // Adds the DNBRADIO windows to Winamp's main menu (top-left icon or
    // right-click), which Webamp renders in a portal it appends on open.
    extendMainMenu() {
      const menu = document.querySelector("#webamp-context-menu ul");
      const skins = menu
        ? [...menu.children].find(
            (item) =>
              item.classList.contains("parent") &&
              item.lastChild.textContent === "Skins"
          )
        : null;
      if (!skins || menu.querySelector(".dnb-menu-item")) {
        return;
      }
      MENU_ITEMS.forEach(([id, label]) => {
        const item = document.createElement("li");
        item.className = "dnb-menu-item";
        item.textContent = label;
        item.addEventListener("click", () => this.openWindow(id));
        menu.insertBefore(item, skins);
      });
      const separator = document.createElement("li");
      separator.className = "hr dnb-menu-item";
      separator.appendChild(document.createElement("hr"));
      menu.insertBefore(separator, skins);
    },
    addUrl(url) {
      this.appendEntries([this.urlEntry(url, url)]);
      this.closeWindow("addUrl");
    },
    addStation(station) {
      this.appendEntries([this.stationEntry(station)]);
    },
    playPodcast(episode) {
      const entry = this.podcastEntry(episode);
      let track = this.webamp
        .getPlaylistTracks()
        .find((item) => item.url === entry.url);
      if (!track) {
        this.appendEntries([entry]);
        const tracks = this.webamp.getPlaylistTracks();
        track = tracks[tracks.length - 1];
      }
      this.webamp.store.dispatch({ type: "PLAY_TRACK", id: track.id });
    },
    loadDefaultPlaylist() {
      this.showPlaylist(this.defaultEntries(), "default");
      this.closeWindow("loadList");
    },
    async loadPlaylistFile(file) {
      const entries = parsePlaylist(await file.text()).map((item) =>
        this.urlEntry(item.url, item.title || item.url)
      );
      if (!entries.length) {
        this.loadMessage = `No http(s) URLs found in ${file.name}`;
        return;
      }
      this.showPlaylist(entries, "user");
      this.closeWindow("loadList");
    },
    savePlaylistFile(format) {
      const entries = this.webamp
        .getPlaylistTracks()
        .filter((track) => !track.url.startsWith("blob:"))
        .map((track) => ({
          url: track.url,
          artist: track.artist,
          title: track.title || track.defaultName,
          seconds: track.duration ? Math.round(track.duration) : -1,
        }));
      if (format === "pls") {
        downloadText(toPls(entries), "dnbradio.pls", "audio/x-scpls");
      } else {
        downloadText(toM3u(entries), "dnbradio.m3u", "audio/x-mpegurl");
      }
      this.closeWindow("saveList");
    },
    showUserMessage(message) {
      this.webamp.store.dispatch({ type: "SET_USER_MESSAGE", message });
      clearTimeout(this.userMessageTimeout);
      this.userMessageTimeout = setTimeout(() => {
        this.webamp.store.dispatch({ type: "UNSET_USER_MESSAGE" });
      }, 6000);
    },
    onMediaError(event) {
      const entry = this.entries.get(event.target.getAttribute("src") || "");
      this.showUserMessage(
        entry && entry.kind === "station"
          ? `${entry.artist} can't play here - open the full player from Station Info`
          : "This track can't play here - its server blocks web players"
      );
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
          nowplaying.artist = decodeEntities(nowplaying.artist);
          nowplaying.title = decodeEntities(nowplaying.title);
          this.$set(this.nowplaying, station.id, nowplaying);
          const track = this.webamp
            .getPlaylistTracks()
            .find((item) => item.url === station.streams[0].url);
          if (track && nowplaying.artist && nowplaying.title) {
            this.webamp.store.dispatch({
              type: "SET_MEDIA_TAGS",
              id: track.id,
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
    async fetchPodcasts() {
      const pages = Math.ceil(DEFAULT_PODCASTS / 10);
      const responses = await Promise.all(
        Array.from({ length: pages }, (_, i) =>
          this.$axios
            .get(`${this.station.podcast.url}?page=${i + 1}`, {
              progress: false,
            })
            .then((res) => res.data.data)
            .catch((err) => {
              console.log("cannot fetch podcasts", err.message);
              return [];
            })
        )
      );
      this.podcasts = responses.flat();
    },
    restoreSettings() {
      const { media, equalizer, visualizerStyle } = this.settings;
      const store = this.webamp.store;
      if (media) {
        store.dispatch({ type: "SET_VOLUME", volume: media.volume });
        store.dispatch({ type: "SET_BALANCE", balance: media.balance });
        const state = store.getState().media;
        if (state.shuffle !== media.shuffle) {
          store.dispatch({ type: "TOGGLE_SHUFFLE" });
        }
        if (state.repeat !== media.repeat) {
          store.dispatch({ type: "TOGGLE_REPEAT" });
        }
        if (state.timeMode !== media.timeMode) {
          store.dispatch({ type: "TOGGLE_TIME_MODE" });
        }
      }
      if (equalizer) {
        Object.entries(equalizer.sliders).forEach(([band, value]) => {
          store.dispatch({
            type: "SET_BAND_VALUE",
            band: band === "preamp" ? band : Number(band),
            value,
          });
        });
        store.dispatch({ type: equalizer.on ? "SET_EQ_ON" : "SET_EQ_OFF" });
        store.dispatch({ type: "SET_EQ_AUTO", value: equalizer.auto });
      }
      for (
        let i = 0;
        visualizerStyle != null &&
        i < 4 &&
        store.getState().display.visualizerStyle !== visualizerStyle;
        i++
      ) {
        store.dispatch({ type: "TOGGLE_VISUALIZER_STYLE" });
      }
    },
    scheduleSave() {
      if (!this.ready || this.saveTimeout) {
        return;
      }
      this.saveTimeout = setTimeout(() => {
        this.saveTimeout = null;
        const state = this.webamp.store.getState();
        saveSettings({
          skinUrl: this.skinUrl,
          media: {
            volume: state.media.volume,
            balance: state.media.balance,
            shuffle: state.media.shuffle,
            repeat: state.media.repeat,
            timeMode: state.media.timeMode,
          },
          equalizer: state.equalizer,
          visualizerStyle: state.display.visualizerStyle,
          playlists: { ...this.playlists, active: this.activeList },
        });
      }, 500);
    },
    onStateChange() {
      const state = this.webamp.store.getState();
      this.palette = state.display.skinPlaylistStyle || CLASSIC_PLAYLIST_STYLE;
      const urls = state.playlist.trackOrder.map((id) => state.tracks[id].url);
      if (urls.join("\n") !== this.playlistUrls.join("\n")) {
        this.playlistUrls = urls;
        this.rememberPlaylist();
      }
      const persisted = JSON.stringify([
        state.media.volume,
        state.media.balance,
        state.media.shuffle,
        state.media.repeat,
        state.media.timeMode,
        state.equalizer,
        state.display.visualizerStyle,
        this.skinUrl,
      ]);
      if (persisted !== this.lastPersisted) {
        this.lastPersisted = persisted;
        this.scheduleSave();
      }
    },
    // Webamp's skin menu fetches the .wsz itself and only dispatches the parsed
    // skin, so the chosen URL is noted here to restore it on the next visit.
    watchSkinRequests() {
      const nativeFetch = window.fetch;
      this.restoreFetch = () => {
        window.fetch = nativeFetch;
      };
      window.fetch = (input, init) => {
        const url = typeof input === "string" ? input : input.url;
        if (/\.wsz(\?|$)/i.test(url)) {
          this.requestedSkinUrl = url;
        }
        return nativeFetch(input, init);
      };
    },
    async startWebamp() {
      const [Webamp] = await Promise.all([loadWebamp(), this.fetchPodcasts()]);
      if (!Webamp.browserIsSupported()) {
        this.unsupported = true;
        return;
      }
      this.settings = loadSettings();
      this.playlists = {
        removedDefault: [],
        addedToDefault: [],
        user: [],
        ...this.settings.playlists,
      };
      this.skinUrl = this.settings.skinUrl || null;
      const skin = this.$route.query.skin;
      if (typeof skin === "string") {
        const selected = CLASSIC_SKINS.find(
          ([file]) => file.toLowerCase() === skin.toLowerCase()
        );
        if (skin.toLowerCase() === "default") {
          this.skinUrl = null;
        } else if (selected) {
          this.skinUrl = `${this.$config.APP_BASE_URL}skins/${selected[0]}.wsz`;
        }
      }
      this.watchSkinRequests();
      this.webamp = new Webamp({
        initialTracks: [],
        initialSkin: this.skinUrl ? { url: this.skinUrl } : undefined,
        availableSkins: CLASSIC_SKINS.map(([file, name]) => ({
          url: `${this.$config.APP_BASE_URL}skins/${file}.wsz`,
          name,
        })),
        windowLayout: this.windowLayout,
        enableHotkeys: true,
        enableMediaSession: true,
        handleAddUrlEvent: () => {
          this.openWindow("addUrl");
          return Promise.resolve(null);
        },
        handleLoadListEvent: () => {
          this.openWindow("loadList");
          return Promise.resolve(null);
        },
        handleSaveListEvent: () => {
          this.openWindow("saveList");
        },
        __customMiddlewares: [(store) => this.webampMiddleware(store)],
      });
      this.webamp.onWillClose((cancel) => cancel());
      await this.webamp.renderWhenReady(this.$refs.stage);
      document.getElementById("webamp").appendChild(this.$refs.windows);

      // Webamp buffers the first of its initialTracks on load, which would
      // open a live stream connection on every card view.
      this.activeList = this.playlists.active === "user" ? "user" : "default";
      this.appendEntries(
        this.activeList === "user" ? this.playlists.user : this.defaultEntries()
      );
      this.restoreSettings();
      this.webamp.media._source._audio.addEventListener(
        "error",
        this.onMediaError
      );
      this.webamp.__onStateChange(this.onStateChange);
      this.fitToFrame();
      this.ready = true;
      this.onStateChange();
    },
  },
  async mounted() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });

    this.entries = new Map();
    this.audioInfo = new Map();
    this.scaledEvents = new WeakSet();
    this.menuObserver = new MutationObserver(this.extendMainMenu);
    this.menuObserver.observe(document.body, { childList: true });
    window.addEventListener("pointerdown", this.resumeAudio, true);
    window.addEventListener("keydown", this.resumeAudio, true);
    window.addEventListener("mousedown", this.onDragStart, true);
    window.addEventListener("mousemove", this.onDragMove, true);
    window.addEventListener("mouseup", this.onDragEnd, true);
    window.addEventListener("resize", this.fitToFrame);
    await this.startWebamp();
    this.fetchAllNowplaying();
    this.npInterval = setInterval(this.fetchAllNowplaying, 30000);
  },
  beforeDestroy() {
    clearInterval(this.npInterval);
    clearTimeout(this.userMessageTimeout);
    clearTimeout(this.saveTimeout);
    if (this.menuObserver) {
      this.menuObserver.disconnect();
    }
    if (this.restoreFetch) {
      this.restoreFetch();
    }
    window.removeEventListener("pointerdown", this.resumeAudio, true);
    window.removeEventListener("keydown", this.resumeAudio, true);
    window.removeEventListener("mousedown", this.onDragStart, true);
    window.removeEventListener("mousemove", this.onDragMove, true);
    window.removeEventListener("mouseup", this.onDragEnd, true);
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
.dnb-layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
}
.dnb-layer--behind {
  z-index: -1;
}
.winamp-stage {
  position: absolute;
  top: 0;
  left: 0;
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
