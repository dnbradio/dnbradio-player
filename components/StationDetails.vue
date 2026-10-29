<template>
  <div class="overlap-screen">
    <Visualizations :mode="visualization" />
    <div
      class="player"
      :class="{
        'player--framed': framed,
        'player--desktop': $device.isDesktop,
        'player--minimized': minimized,
      }"
      @dblclick="expandFromBar"
    >
      <div class="player__bar">
        <button
          type="button"
          class="player__icon player__size"
          :aria-label="minimized ? 'Expand player' : 'Minimize player'"
          :title="minimized ? 'Expand player' : 'Minimize player'"
          :aria-expanded="!minimized"
          @click="toggleMinimized"
        >
          <UiIcon :size="iconSize">{{
            minimized ? "mdi-chevron-down" : "mdi-window-minimize"
          }}</UiIcon>
        </button>
        <div
          v-if="minimized"
          class="player__marquee"
          role="status"
          :aria-label="miniReadout"
          :title="miniReadout"
        >
          <div class="player__marquee-track" aria-hidden="true">
            <span>{{ miniReadout }}</span
            ><span>{{ miniReadout }}</span>
          </div>
        </div>
        <button
          type="button"
          class="player__icon"
          :class="{ 'player__icon--on': visualsEnabled }"
          :aria-pressed="visualsEnabled ? 'true' : 'false'"
          :aria-label="visualizationLabel"
          :title="visualizationLabel"
          @click="toggleVisuals"
        >
          <UiIcon :size="iconSize">mdi-waveform</UiIcon>
        </button>
        <button
          v-if="minimized"
          type="button"
          class="player__icon player__mini-play"
          :aria-label="stationActive ? 'Pause' : 'Play'"
          @click="toggle"
        >
          <UiIcon :size="24">{{
            stationActive ? "pause" : "play_arrow"
          }}</UiIcon>
        </button>
        <span class="player__bar-gap" />
        <button
          type="button"
          class="player__icon"
          aria-label="Stations and station info"
          title="Stations"
          @click="stationsOpen = true"
        >
          <UiIcon :size="iconSize">mdi-home</UiIcon>
        </button>
        <button
          v-if="$device.isDesktop"
          type="button"
          class="player__icon"
          aria-label="Open in a popup window"
          title="Popup player"
          @click="launchPopup"
        >
          <UiIcon :size="iconSize">mdi-open-in-new</UiIcon>
        </button>
      </div>

      <header v-if="station" class="player__station">
        <p class="player__overline">Station</p>
        <h1 class="player__title">
          <button
            type="button"
            class="player__title-button"
            @click="stationsOpen = true"
          >
            {{ station.title }}
          </button>
        </h1>
        <p class="player__subtitle">{{ station.subtitle }}</p>
        <p class="player__description">{{ station.description }}</p>
        <p
          class="player__listeners"
          :class="{ 'player__listeners--empty': listeners === null }"
        >
          <span class="player__listeners-dot" aria-hidden="true" />{{
            listenersText
          }}
        </p>
      </header>

      <div
        class="player__art"
        @touchstart.passive="touchStart"
        @touchend.passive="touchEnd"
      >
        <transition :name="slide" mode="out-in">
          <div
            v-if="station"
            :key="station.id"
            :style="{ backgroundImage: `url(${cover})` }"
            class="player__logo"
            :class="{
              'player__logo--on': stationActive,
              'player__logo--off': !stationActive,
            }"
            aria-hidden="true"
            @click="playIfStopped"
          />
        </transition>
        <DjHead v-if="djVisible && !minimized" :dj="$dj.current" />
        <div class="player__dots" role="group" aria-label="Choose station">
          <button
            v-for="item in stations"
            :key="item.id"
            type="button"
            class="player__dot"
            :class="{ 'player__dot--on': station && item.id === station.id }"
            :aria-label="item.title"
            :aria-current="station && item.id === station.id ? 'true' : null"
            @click="goToStation(item)"
          />
        </div>
      </div>

      <section class="player__now" aria-live="polite">
        <p class="player__status">
          <span
            v-if="statusLabel"
            :class="['player__state', 'player__state--' + statusTone]"
          >
            <span
              v-if="statusTone === 'live'"
              class="player__state-dot"
              aria-hidden="true"
            />{{ statusLabel }}
          </span>
          <span
            v-if="liveBadge"
            class="player__state player__state--live player__state--small"
          >
            <span class="player__state-dot" aria-hidden="true" />Live now
          </span>
        </p>
        <button
          type="button"
          class="player__track"
          :aria-label="trackLabel"
          @click="nowOpen = true"
        >
          <template v-if="artist || title">
            <span class="player__artist">{{ artist }}</span>
            <span class="player__song">{{ title }}</span>
          </template>
          <span v-else class="player__hint"
            >Click play to<br />start your stream</span
          >
        </button>
        <button type="button" class="player__meta" @click="nowOpen = true">
          <UiIcon size="16" aria-hidden="true">{{ metaIcon }}</UiIcon>
          <span>{{ metaText }}</span>
          <UiIcon size="16" class="player__meta-chevron" aria-hidden="true"
            >expand_less</UiIcon
          >
        </button>
      </section>

      <div class="player__controls">
        <button
          type="button"
          class="player__control"
          aria-label="Previous station"
          @click="step(-1)"
        >
          <UiIcon :size="controlSize">skip_previous</UiIcon>
        </button>
        <button
          v-if="volumeSupported"
          type="button"
          class="player__control"
          aria-label="Volume down"
          @click="nudgeVolume(-0.1)"
        >
          <UiIcon :size="controlSize">mdi-volume-minus</UiIcon>
        </button>
        <span v-else aria-hidden="true" />
        <PlayButton
          :size="68"
          :active="stationActive"
          :busy="stationBusy"
          :pause-label="episodePlaying ? 'Pause' : 'Stop'"
          @click="toggle"
        />
        <button
          v-if="volumeSupported"
          type="button"
          class="player__control"
          aria-label="Volume up"
          @click="nudgeVolume(0.1)"
        >
          <UiIcon :size="controlSize">mdi-volume-plus</UiIcon>
        </button>
        <span v-else aria-hidden="true" />
        <button
          type="button"
          class="player__control"
          aria-label="Next station"
          @click="step(1)"
        >
          <UiIcon :size="controlSize">skip_next</UiIcon>
        </button>
      </div>

      <StationNav :station="station" class="player__nav" />

      <footer class="player__footer">
        <router-link
          v-if="station"
          :to="'/stations/' + station.id + '/donate'"
          class="player__tagline"
        >
          <UiIcon size="13" aria-hidden="true">favorite</UiIcon>Keepin' the
          beats rollin' on dnbradio!
        </router-link>
        <a
          href="https://github.com/dnbradio/dnbradio-player"
          title="Contribute to dnbradio-player on GitHub"
          target="_blank"
          rel="noopener"
          class="player__version"
          >dnbradio-player/{{ APP_BRANCH }}:v{{ APP_VERSION }}
          <img
            :src="`${APP_BASE_URL}github-mark-white.svg`"
            height="12"
            width="12"
            alt="GitHub"
          />
        </a>
      </footer>
    </div>

    <transition name="whats-new">
      <aside v-if="whatsNew" class="whats-new" role="status">
        <p>
          <strong>The player got a tune-up.</strong> Everything is where you
          left it. New: tap the track for recently played, up next, and a sleep
          timer. Playback keeps going while you browse.
        </p>
        <button type="button" class="whats-new__ok" @click="dismissWhatsNew">
          Got it
        </button>
      </aside>
    </transition>

    <StationsSheet v-model="stationsOpen" :station="station" />
    <NowPlayingSheet v-model="nowOpen" :station="station" />
  </div>
</template>

<script>
import DjHead from "./player/DjHead.vue";
import { mapGetters, mapState } from "vuex";
import { stationList } from "@/data/stations";
import { EventBus } from "@/components/eventbus.js";
import PlayButton from "~/components/player/PlayButton.vue";
import Visualizations from "~/components/player/Visualizations.vue";
import StationNav from "~/components/player/StationNav.vue";
import StationsSheet from "~/components/player/StationsSheet.vue";
import NowPlayingSheet from "~/components/player/NowPlayingSheet.vue";
import { adjacentStation, stationPath } from "~/lib/stations.js";
import {
  fetchSchedule,
  formatTime,
  liveShow,
  upcomingShows,
} from "~/lib/schedule.js";

const WHATS_NEW_KEY = "dnbradio-player-whats-new-2026-11";
const DEFAULT_TITLE =
  "dnbradio.com : All flavors of dnb from dj's across the globe! [dnbradio.com [all flavors]] - dnbradio.com";

export default {
  components: {
    DjHead,
    PlayButton,
    Visualizations,
    StationNav,
    StationsSheet,
    NowPlayingSheet,
  },
  props: ["station"],
  data() {
    return {
      online: navigator.onLine,
      stationsOpen: false,
      nowOpen: false,
      minimized: false,
      slide: "logo-fade",
      touch: null,
      shows: [],
      now: Date.now(),
      clock: null,
      portrait: true,
      whatsNew: false,
      whatsNewTimer: null,
    };
  },
  computed: {
    ...mapState("player", [
      "status",
      "source",
      "message",
      "nowplaying",
      "volume",
      "volumeSupported",
      "visualsEnabled",
      "visualization",
      "sleepAt",
    ]),
    ...mapGetters("player", [
      "isActive",
      "isBusy",
      "playingStationId",
      "episode",
    ]),
    djVisible() {
      return (
        this.$dj.current?.profile &&
        this.station?.id === 1 &&
        (!this.source || this.playingStationId === 1)
      );
    },
    stations() {
      return stationList;
    },
    miniReadout() {
      const track = [this.artist, this.title].filter(Boolean).join(" — ");
      const station = this.station ? this.station.title : "DNBRadio";
      return track
        ? `${track} · ${station}`
        : `${station} · ${this.statusLabel || "Ready to play"}`;
    },
    visualizationLabel() {
      const names = {
        off: "Off",
        stars: "Stars",
        milkdrop: "MilkDrop",
        rain: "Rain",
      };
      const modes = Object.keys(names);
      const next =
        modes[(modes.indexOf(this.visualization) + 1) % modes.length];
      return `Visualizations: ${names[this.visualization]}. Next: ${names[next]}`;
    },
    framed() {
      return !this.portrait;
    },
    iconSize() {
      return this.portrait ? 28 : 24;
    },
    controlSize() {
      return this.portrait ? 32 : 28;
    },
    episodePlaying() {
      return Boolean(this.episode);
    },
    // Playback belongs to this screen's station (or a podcast started here).
    ownsPlayback() {
      return (
        this.episodePlaying ||
        (this.station && this.playingStationId === this.station.id)
      );
    },
    stationActive() {
      return Boolean(this.ownsPlayback && this.isActive);
    },
    stationBusy() {
      return Boolean(this.ownsPlayback && this.isBusy);
    },
    np() {
      return this.station ? this.nowplaying[this.station.id] || null : null;
    },
    artist() {
      return this.episodePlaying
        ? this.episode.artist
        : this.np
          ? this.np.artist
          : "";
    },
    title() {
      return this.episodePlaying
        ? this.episode.title
        : this.np
          ? this.np.title
          : "";
    },
    listeners() {
      return this.np && this.np.listeners !== null ? this.np.listeners : null;
    },
    listenersText() {
      if (this.listeners === null) {
        return " ";
      }
      return (
        this.listeners.toLocaleString() +
        (this.listeners === 1 ? " listener" : " listeners")
      );
    },
    offline() {
      return !this.online;
    },
    statusTone() {
      if (this.ownsPlayback) {
        if (this.status === "loading" || this.status === "reconnecting")
          return "wait";
        if (this.status === "error") return "error";
        if (this.status === "playing") {
          if (this.episodePlaying) return "plain";
          return this.np && this.np.live ? "live" : "plain";
        }
      }
      if (this.offline) return "error";
      return "muted";
    },
    statusLabel() {
      if (this.ownsPlayback) {
        if (this.status === "loading") return this.message || "Connecting…";
        if (this.status === "reconnecting")
          return this.message || "Reconnecting…";
        if (this.status === "error") return this.message || "Connection error";
        if (this.status === "playing") {
          if (this.episodePlaying) return "Podcast";
          return this.np && this.np.live
            ? "Live broadcast"
            : "Playlist rotation";
        }
      }
      if (this.offline) return "Device offline!";
      return "Stopped";
    },
    liveBadge() {
      return Boolean(
        this.np &&
        this.np.live &&
        this.statusTone !== "live" &&
        !this.episodePlaying,
      );
    },
    trackLabel() {
      const what = [this.artist, this.title].filter(Boolean).join(", ");
      return (what ? what + ". " : "") + "Show recently played and up next";
    },
    isMainStation() {
      return this.station && this.station.id === 1;
    },
    currentShow() {
      return this.isMainStation
        ? liveShow(this.shows, new Date(this.now))
        : null;
    },
    nextShow() {
      return this.isMainStation
        ? upcomingShows(this.shows, new Date(this.now), 1)[0] || null
        : null;
    },
    metaIcon() {
      if (this.metaText.startsWith("Sleep")) return "mdi-power-sleep";
      if (this.episodePlaying) return "mdi-radio";
      return this.metaText.startsWith("Next live") ||
        this.metaText.startsWith("Live since")
        ? "mdi-calendar-clock"
        : "mdi-history";
    },
    metaText() {
      if (this.sleepAt && this.sleepAt > this.now) {
        return (
          "Sleep timer · " +
          Math.max(1, Math.round((this.sleepAt - this.now) / 60000)) +
          " min left"
        );
      }
      if (this.episodePlaying) {
        return "Back to live radio";
      }
      if (this.np && this.np.live && this.np.liveSince) {
        return "Live since " + formatTime(new Date(this.np.liveSince));
      }
      if (
        this.nextShow &&
        this.nextShow.startAt - this.now < 24 * 3600 * 1000
      ) {
        const day =
          new Date(this.now).getDate() === this.nextShow.startAt.getDate()
            ? ""
            : this.nextShow.startAt.toLocaleDateString(undefined, {
                weekday: "short",
              }) + " ";
        return (
          "Next live: " +
          this.nextShow.host +
          " · " +
          day +
          formatTime(this.nextShow.startAt)
        );
      }
      return "Recently played";
    },
    cover() {
      return this.station.cover || "https://dnbradio.com/images/logotags.png";
    },
    pageTitle() {
      if (this.station && this.np && this.np.artist) {
        const tuned =
          this.listeners !== null ? " [" + this.listeners + " tuned]" : "";
        return (
          this.np.artist +
          " - " +
          this.np.title +
          tuned +
          " - " +
          this.station.name
        );
      }
      return DEFAULT_TITLE;
    },
    pageDescription() {
      return this.station
        ? this.station.subtitle
        : "All flavors of dnb from dj's across the globe!";
    },
    pageKeywords() {
      return this.station
        ? this.station.description + " " + this.station.subtitle
        : "dnbradio.com all flavors";
    },
    pageImage() {
      return this.station
        ? this.station.cover
        : "https://dnbradio.com/img/logotags.png";
    },
    APP_BASE_URL() {
      return this.$config.APP_BASE_URL;
    },
    APP_BRANCH() {
      return this.$config.APP_BRANCH || "main";
    },
    APP_VERSION() {
      return this.$config.APP_VERSION;
    },
  },
  watch: {
    pageTitle: {
      immediate: true,
      handler(title) {
        document.title = title;
      },
    },
    station: {
      immediate: true,
      handler(station, previous) {
        if (!station) {
          return;
        }
        this.$player.focusStation(station);
        if (
          previous &&
          this.playingStationId &&
          this.playingStationId !== station.id &&
          this.isActive
        ) {
          // The listener moved to another station while one was playing.
          this.$player.playStation(station);
        }
        if (station.schedule && station.id === 1) {
          fetchSchedule(station.schedule.url).then(
            (shows) => (this.shows = shows),
          );
        }
      },
    },
  },
  mounted() {
    window.addEventListener("online", this.updateOnline);
    window.addEventListener("offline", this.updateOnline);
    this.measure();
    window.addEventListener("resize", this.measure);
    window.addEventListener("keydown", this.onKey);
    this.clock = setInterval(() => (this.now = Date.now()), 30000);
    try {
      this.whatsNew = !localStorage.getItem(WHATS_NEW_KEY);
    } catch (error) {
      this.whatsNew = false;
    }
    if (this.whatsNew) {
      this.whatsNewTimer = setTimeout(this.dismissWhatsNew, 15000);
    }
    if (this.$store.state.player.initialLoad) {
      this.$store.dispatch("player/SET_INITIAL_LOAD", false);
      // Browsers that allow autoplay (frequent desktop listeners) start
      // straight away, as the player always has; others wait for a tap.
      this.$player.ready.then(() => {
        if (this.station && !this.$store.state.player.source) {
          this.$player.playStation(this.station, { quiet: true });
        }
      });
    }
  },
  beforeUnmount() {
    window.removeEventListener("online", this.updateOnline);
    window.removeEventListener("offline", this.updateOnline);
    window.removeEventListener("resize", this.measure);
    window.removeEventListener("keydown", this.onKey);
    clearInterval(this.clock);
    clearTimeout(this.whatsNewTimer);
  },
  methods: {
    toggleMinimized() {
      this.minimized = !this.minimized;
      if (this.minimized) {
        this.dismissWhatsNew();
        this.stationsOpen = this.nowOpen = false;
      }
    },
    expandFromBar(event) {
      if (this.minimized && !event.target.closest("button, a, input"))
        this.minimized = false;
    },
    updateOnline() {
      this.online = navigator.onLine;
    },
    dismissWhatsNew() {
      this.whatsNew = false;
      try {
        localStorage.setItem(WHATS_NEW_KEY, "1");
      } catch (error) {
        // Storage unavailable: the note shows again next visit.
      }
    },
    measure() {
      this.portrait = window.innerHeight > window.innerWidth;
    },
    toggleVisuals() {
      this.$store.commit("player/TOGGLE_VISUALS");
      if (this.visualization === "milkdrop")
        this.$player.enableVisualizationAudio();
      else this.$player.disableVisualizationAudio();
    },
    toggle() {
      if (this.stationActive) {
        this.$player.pause();
      } else if (
        this.episodePlaying &&
        this.$store.state.player.status === "paused"
      ) {
        this.$player.play();
      } else {
        this.$player.playStation(this.station);
      }
    },
    playIfStopped() {
      if (!this.stationActive) {
        this.$player.playStation(this.station);
      }
    },
    step(direction) {
      this.slide = direction > 0 ? "logo-next" : "logo-prev";
      const next = adjacentStation(this.stations, this.station, direction);
      this.$player.playStation(next);
      this.$router.push(stationPath(next));
    },
    goToStation(item) {
      if (item.id === this.station.id) {
        return;
      }
      const from = this.stations.findIndex((s) => s.id === this.station.id);
      const to = this.stations.findIndex((s) => s.id === item.id);
      this.slide = to > from ? "logo-next" : "logo-prev";
      this.$router.push(stationPath(item));
    },
    touchStart(event) {
      const point = event.changedTouches[0];
      this.touch = { x: point.clientX, y: point.clientY };
    },
    touchEnd(event) {
      if (!this.touch) {
        return;
      }
      const point = event.changedTouches[0];
      const dx = point.clientX - this.touch.x;
      const dy = point.clientY - this.touch.y;
      this.touch = null;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.5) {
        return;
      }
      // Swipe left for the next station, right for the previous one. A
      // playing station keeps playing; a stopped one stays stopped.
      const direction = dx < 0 ? 1 : -1;
      const next = adjacentStation(this.stations, this.station, direction);
      this.slide = direction > 0 ? "logo-next" : "logo-prev";
      this.$router.push(stationPath(next));
    },
    nudgeVolume(delta) {
      this.$player.setVolume(this.volume + delta);
      EventBus.$emit(
        "toast",
        "Volume " + Math.round(this.$player.audio.volume * 100) + "%",
      );
    },
    onKey(event) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const target = event.target;
      if (
        target &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))
      ) {
        return;
      }
      if (this.stationsOpen || this.nowOpen) {
        return;
      }
      const actions = {
        " ": () => this.toggle(),
        k: () => this.toggle(),
        ArrowLeft: () => this.step(-1),
        ArrowRight: () => this.step(1),
        ArrowUp: () => this.volumeSupported && this.nudgeVolume(0.1),
        ArrowDown: () => this.volumeSupported && this.nudgeVolume(-0.1),
      };
      if (actions[event.key]) {
        event.preventDefault();
        actions[event.key]();
      }
    },
    launchPopup() {
      const width = 422;
      const height = 600;
      if (
        (window.innerHeight == height || window.outerHeight == height) &&
        (window.innerWidth == width || window.outerWidth == width)
      ) {
        return;
      }
      this.$player.pause();
      window.open(
        window.location.href,
        "formPopup",
        "width=" +
          width +
          ",height=" +
          height +
          ",left=25,top=25,screenX=100,screenY=100,resizable=0,scrollbars=0,toolbar=no,location=no,status=no,menubar=no",
      );
    },
  },
};
</script>

<style scoped>
.overlap-screen {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.player {
  --gap: clamp(6px, 1.6svh, 16px);
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  padding: calc(env(safe-area-inset-top) + 6px)
    max(12px, env(safe-area-inset-right))
    calc(env(safe-area-inset-bottom) + 10px)
    max(12px, env(safe-area-inset-left));
  overflow-y: auto;
  overflow-x: hidden;
  text-align: center;
  z-index: 1;
}
/* Landscape and desktop: the bordered 500px panel the player has always had. */
.player--framed {
  top: 10px;
  height: calc(100% - 20px);
  max-width: 500px;
  padding: 16px 20px 18px;
  border: 1px solid;
  border-image: linear-gradient(45deg, #090909, #302f2f, #000000) 1;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: linear-gradient(90deg, rgba(0, 10, 0, 0.3), transparent);
}

/* Top bar: visuals on the left, stations and popup on the right. */
.player__bar {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 4px);
  left: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  z-index: 2;
}
.player--framed .player__bar {
  top: 12px;
  left: 10px;
  right: 10px;
}
.player__bar-gap {
  flex: 1;
}
.player__icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.2s ease;
}
.player__icon .ui-icon {
  color: rgba(255, 255, 255, 0.62) !important;
  transition: color 0.2s ease;
}
.player__icon:hover {
  background: rgba(255, 255, 255, 0.08);
}
.player__icon:hover .ui-icon,
.player__icon--on .ui-icon {
  color: #fff !important;
}
.player__icon--on {
  background: rgba(255, 255, 255, 0.12);
}
.player__icon:focus-visible,
.player__control:focus-visible,
.player__dot:focus-visible,
.player__track:focus-visible,
.player__meta:focus-visible,
.player__title-button:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: 2px;
}

/* Station header */
/* "STATION" sits level with the corner icons; the title starts just below
   them, so it never runs into them at any width. */
.player__station {
  flex-shrink: 0;
  padding: 14px 8px 0;
}
.player--framed .player__station {
  padding-top: 12px;
}
.player__station p {
  margin: 0;
}
.player__overline {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dnb-text-2);
  line-height: 16px;
}
.player__title {
  margin: 12px 0 0;
  font-size: clamp(26px, 8.2vw, 36px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
}
.player__title-button {
  max-width: 100%;
  padding: 0 4px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 6px;
}
.player__subtitle {
  margin-top: 6px !important;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dnb-text);
}
.player__description {
  margin-top: 6px !important;
  font-size: 14px;
  line-height: 20px;
  color: var(--dnb-text-2);
}
.player__listeners {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px !important;
  font-size: 13px;
  line-height: 20px;
  color: var(--dnb-text-3);
  font-variant-numeric: tabular-nums;
}
.player__listeners-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dnb-green);
}
.player__listeners--empty .player__listeners-dot {
  visibility: hidden;
}

/* Station logo: tap to play, pulses while playing, faded when stopped. */
.player__art {
  position: relative;
  flex: 1 1 auto;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--gap) 0 0;
  touch-action: pan-y;
}
.player__logo {
  flex: 1 1 auto;
  width: min(75%, 300px);
  min-height: 96px;
  max-height: 300px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
  transition: opacity 0.4s ease;
}
.player__logo--off {
  opacity: 0.45;
}
.player__logo--on {
  animation: logo-pulse 2s 3;
}
@keyframes logo-pulse {
  0% {
    transform: scale(0.95);
  }
  70% {
    transform: scale(1);
  }
  100% {
    transform: scale(0.95);
  }
}
.player__dots {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}
.player__dot {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  position: relative;
}
.player__dot::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.32);
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}
.player__dot--on::after {
  background: #fff;
  transform: scale(1.25);
}

/* Now playing: fixed height so changing text never moves the controls. */
.player__now {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: var(--gap);
}
.player__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 24px;
  margin: 0 0 6px !important;
}
.player__state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 16px;
}
.player__state--muted {
  color: var(--dnb-text-3);
}
.player__state--plain {
  color: var(--dnb-text-2);
}
.player__state--wait {
  color: var(--dnb-warn);
}
.player__state--error {
  color: #ff6b5e;
}
.player__state--live {
  padding: 4px 10px 4px 8px;
  border-radius: 999px;
  background: var(--dnb-live);
  color: #fff;
}
.player__state--small {
  padding: 2px 8px 2px 6px;
  font-size: 10px;
}
.player__state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  animation: live-blink 1.6s ease-in-out infinite;
}
@keyframes live-blink {
  50% {
    opacity: 0.35;
  }
}
.player__track {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  min-height: 70px;
  padding: 2px 8px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: inherit;
  cursor: pointer;
}
.player__artist,
.player__song {
  max-width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.player__artist {
  font-size: 19px;
  font-weight: 700;
  line-height: 24px;
  -webkit-line-clamp: 1;
}
.player__song {
  font-size: 16px;
  line-height: 22px;
  color: var(--dnb-text-2);
  -webkit-line-clamp: 2;
}
.player__hint {
  font-size: 13px;
  line-height: 20px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dnb-text-2);
}
.player__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: 32px;
  margin-top: 2px;
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--dnb-text-2);
  font-size: 13px;
  line-height: 18px;
  cursor: pointer;
}
.player__meta span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player__meta .ui-icon {
  color: var(--dnb-text-3) !important;
}
.player__meta:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Transport: five fixed slots, so play and the station arrows never move. */
.player__controls {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  justify-items: center;
  max-width: 420px;
  width: 100%;
  margin: calc(var(--gap) + 4px) auto 0;
}
.player__control {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 0.2s ease,
    transform 0.12s ease;
}
.player__control .ui-icon {
  color: var(--dnb-control) !important;
}
.player__control:hover {
  background: rgba(255, 255, 255, 0.08);
}
.player__control:active {
  transform: scale(0.92);
}

.player__nav {
  flex-shrink: 0;
  max-width: 440px;
  margin: var(--gap) auto 0;
}

.player__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: calc(var(--gap) - 2px);
}
.player__tagline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 12px;
  border-radius: 999px;
  color: var(--dnb-text-2) !important;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}
.player__tagline .ui-icon {
  color: var(--dnb-red) !important;
}
.player__tagline:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.06);
}
.player__version {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--dnb-text-3) !important;
  font-size: 11px;
  text-decoration: none;
  opacity: 0.8;
}
.player__version img {
  opacity: 0.8;
}

/* Over the station header, so the controls and nav stay usable. */
.whats-new {
  position: fixed;
  left: 50%;
  top: calc(env(safe-area-inset-top) + 8px);
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 24px);
  max-width: 476px;
  padding: 12px 12px 12px 16px;
  border: 1px solid var(--dnb-line-strong);
  border-radius: 16px;
  background: rgba(24, 24, 24, 0.96);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  text-align: left;
}
.whats-new p {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--dnb-text-2);
}
.whats-new strong {
  color: var(--dnb-text);
}
.whats-new__ok {
  flex-shrink: 0;
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: var(--dnb-accent);
  color: #000;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.whats-new-enter-active,
.whats-new-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.whats-new-enter,
.whats-new-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}

/* Logo transitions between stations */
.logo-fade-enter-active,
.logo-fade-leave-active,
.logo-next-enter-active,
.logo-next-leave-active,
.logo-prev-enter-active,
.logo-prev-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}
.logo-fade-enter,
.logo-fade-leave-to {
  opacity: 0;
}
.logo-next-enter,
.logo-prev-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
.logo-next-leave-to,
.logo-prev-enter {
  opacity: 0;
  transform: translateX(-24px);
}

/* Short screens: tighten, then drop the description and version line. */
@media (max-height: 700px) {
  .player__description {
    display: none;
  }
}
@media (max-height: 600px) {
  .player__version {
    display: none;
  }
  .player__track {
    min-height: 60px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .player__logo--on,
  .player__state-dot {
    animation: none;
  }
}
.player {
  transition: height 0.25s ease;
}
.player__marquee {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  color: var(--dnb-text);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 38px;
}
.player__marquee-track {
  display: flex;
  width: max-content;
  min-width: 100%;
  animation: player-marquee 22s linear infinite;
}
.player__marquee-track > span {
  flex-shrink: 0;
  white-space: nowrap;
  padding-right: 48px;
}
.player__marquee:hover .player__marquee-track,
.player__marquee:focus-within .player__marquee-track {
  animation-play-state: paused;
}
@keyframes player-marquee {
  to {
    transform: translateX(-50%);
  }
}
.player.player--minimized {
  height: 40px;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid #333;
  border-image: none;
  background: rgba(10, 10, 10, 0.94);
  box-shadow: 0 4px 20px #0005;
}
.player--minimized > :not(.player__bar) {
  display: none;
}
.player.player--minimized .player__bar {
  top: 0;
  left: 0;
  right: 0;
  height: 38px;
  gap: 2px;
}
.player--minimized .player__bar-gap,
.player--minimized
  .player__bar
  > button[aria-label="Stations and station info"],
.player--minimized .player__bar > button[aria-label="Open in a popup window"] {
  display: none;
}
.player--minimized .player__icon {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  border-radius: 4px;
}
.player--minimized .player__icon .ui-icon,
.player--minimized .player__icon .v-icon {
  font-size: 22px !important;
  width: 22px;
  height: 22px;
}
.player__size:focus-visible,
.player__mini-play:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: -3px;
}
@media (prefers-reduced-motion: reduce) {
  .player {
    transition: none;
  }
  .player__marquee-track {
    animation: none;
    display: block;
    width: 100%;
  }
  .player__marquee-track > span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0;
  }
  .player__marquee-track > span + span {
    display: none;
  }
}
</style>
