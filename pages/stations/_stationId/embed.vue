<template>
  <div class="embed" v-if="station">
    <div class="embed-main">
      <div
        class="embed-cover"
        :class="{ 'embed-cover--playing': isPlaying }"
        :style="`background-image: url(${station.cover})`"
        role="img"
        :aria-label="`${station.title} logo`"
      />
      <div class="embed-info">
        <p class="embed-station">
          {{ station.title }} <span>{{ station.subtitle }}</span>
        </p>
        <p
          class="embed-status"
          :class="{ 'embed-status--error': errorMessage }"
          role="status"
        >
          {{ statusText }}
        </p>
        <p class="embed-artist" v-if="nowplaying.artist">
          {{ nowplaying.artist }}
        </p>
        <p class="embed-title" v-if="nowplaying.title">
          {{ nowplaying.title }}
        </p>
      </div>
    </div>
    <div class="embed-controls">
      <button
        type="button"
        class="embed-button embed-button--play"
        :aria-label="isPlaying ? 'Pause' : `Play ${station.title} live`"
        @click="togglePlay"
      >
        <v-icon dark size="48">{{
          isPlaying ? "pause_circle_filled" : "play_circle_filled"
        }}</v-icon>
      </button>
      <button
        type="button"
        class="embed-button"
        aria-label="Stop"
        :disabled="!streamLoaded"
        @click="stop"
      >
        <v-icon dark>stop</v-icon>
      </button>
      <button
        type="button"
        class="embed-button"
        :aria-label="muted ? 'Unmute' : 'Mute'"
        :aria-pressed="muted ? 'true' : 'false'"
        @click="muted = !muted"
      >
        <v-icon dark>{{
          muted || volume == 0 ? "volume_off" : "volume_up"
        }}</v-icon>
      </button>
      <input
        class="embed-volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        aria-label="Volume"
        v-model.number="volume"
      />
      <span class="embed-listeners" v-if="nowplaying.listeners">
        {{ nowplaying.listeners }} listening
      </span>
      <a
        class="embed-button embed-open"
        :href="playerUrl"
        target="_blank"
        rel="noopener"
        aria-label="Open the full dnbradio player in a new tab"
      >
        <v-icon dark>mdi-open-in-new</v-icon>
      </a>
    </div>
  </div>
</template>

<script>
// init data
import stations from "@/data/stations";

// models
import Station from "@/models/Station";

// Minimal, frameable player for the X (Twitter) player card. Playback only
// starts from the play button, never automatically.
export default {
  layout: "ls-widget",
  head() {
    return {
      title: this.station ? `${this.station.title} live player` : "live player",
      htmlAttrs: { class: "dnb-embed" },
    };
  },
  data() {
    return {
      nowplaying: {
        artist: null,
        title: null,
        listeners: null,
        streamer: null,
      },
      isPlaying: false,
      isLoading: false,
      streamLoaded: false,
      errorMessage: "",
      volume: 1,
      muted: false,
      npInterval: null,
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
    statusText() {
      if (this.errorMessage) {
        return this.errorMessage;
      }
      if (this.isLoading) {
        return "PLEASE WAIT...";
      }
      if (!this.isPlaying) {
        return this.streamLoaded ? "PAUSED" : "CLICK PLAY TO START YOUR STREAM";
      }
      return this.nowplaying.streamer ? "LIVE BROADCAST" : "PLAYLIST ROTATION";
    },
  },
  methods: {
    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },
    play() {
      const stream = this.station?.streams?.[0];
      if (!stream) {
        return;
      }
      this.errorMessage = "";
      this.isLoading = true;
      if (!this.streamLoaded) {
        const unixtime = new Date().getTime();
        this.$sound.src = stream.url + "?" + unixtime.toString();
        this.streamLoaded = true;
        if (window.plausible) {
          window.plausible("Embed Play", {
            props: { station: this.station.title },
          });
        }
      }
      const playing = this.$sound.play();
      if (playing && playing.catch) {
        playing.catch((err) => {
          console.log("embed play failed", err.message);
          this.isLoading = false;
          if (err.name !== "AbortError") {
            this.showStreamError();
          }
        });
      }
      this.fetchNowplaying();
    },
    pause() {
      this.$sound.pause();
    },
    stop() {
      this.$sound.pause();
      // Drop the connection so the next play starts from the live edge.
      this.$sound.removeAttribute("src");
      this.$sound.load();
      this.streamLoaded = false;
      this.isPlaying = false;
      this.isLoading = false;
    },
    showStreamError() {
      this.stop();
      this.errorMessage = "STREAM UNAVAILABLE. TRY AGAIN SHORTLY.";
    },
    onPlaying() {
      this.isPlaying = true;
      this.isLoading = false;
      this.errorMessage = "";
    },
    onWaiting() {
      this.isLoading = true;
    },
    onPause() {
      this.isPlaying = false;
      this.isLoading = false;
    },
    onError() {
      if (this.streamLoaded) {
        this.showStreamError();
      }
    },
    fetchNowplaying() {
      if (!this.station) {
        return;
      }
      return this.$axios
        .get(this.station.nowplaying_url.url, { progress: false })
        .then((res) => {
          switch (this.station.nowplaying_url.type) {
            case "azuracast": {
              const streamer = res.data.live?.is_live
                ? res.data.live.streamer_name
                : null;
              this.nowplaying = {
                artist: streamer || res.data.now_playing.song.artist,
                title: res.data.now_playing.song.title,
                listeners: res.data.listeners.current,
                streamer,
              };
              break;
            }
            case "jt":
              this.nowplaying = {
                artist: res.data.h1,
                title: res.data.h2,
                listeners: res.data.listening,
                streamer: null,
              };
              break;
            default:
              this.nowplaying = {
                artist: this.station.name,
                title: this.station.subtitle,
                listeners: null,
                streamer: null,
              };
          }
        })
        .catch((err) => {
          console.log("cannot fetch nowplaying", err.message);
        });
    },
  },
  watch: {
    volume(val) {
      this.$sound.volume = val;
    },
    muted(val) {
      this.$sound.muted = val;
    },
  },
  async mounted() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });

    this.$sound.autoplay = false;
    this.volume = this.$sound.volume;
    this.$sound.addEventListener("playing", this.onPlaying);
    this.$sound.addEventListener("waiting", this.onWaiting);
    this.$sound.addEventListener("pause", this.onPause);
    this.$sound.addEventListener("error", this.onError);

    this.fetchNowplaying();
    this.npInterval = setInterval(() => {
      this.fetchNowplaying();
    }, 15000);
  },
  beforeDestroy() {
    clearInterval(this.npInterval);
    this.$sound.removeEventListener("playing", this.onPlaying);
    this.$sound.removeEventListener("waiting", this.onWaiting);
    this.$sound.removeEventListener("pause", this.onPause);
    this.$sound.removeEventListener("error", this.onError);
  },
};
</script>

<style>
html.dnb-embed,
html.dnb-embed body {
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #181818;
}
</style>
<style scoped>
.embed {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 16px;
  color: #fff;
  background: #181818;
  font-family: "Roboto", sans-serif;
}
.embed p {
  margin: 0;
}
.embed-main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 0;
  flex: 1;
}
.embed-cover {
  flex-shrink: 0;
  width: clamp(72px, 45vh, 136px);
  height: clamp(72px, 45vh, 136px);
  border-radius: 6px;
  background-color: #000;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.6;
  transition: opacity 0.3s;
}
.embed-cover--playing {
  opacity: 1;
}
.embed-info {
  min-width: 0;
}
.embed-station {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.embed-station span {
  font-weight: 400;
  opacity: 0.6;
}
.embed-status {
  margin-top: 6px !important;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #e7ff2c;
}
.embed-status--error {
  color: #ff6e6e;
}
.embed-artist {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 8px !important;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}
.embed-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 300;
  opacity: 0.85;
}
.embed-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.embed-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: #fff;
  cursor: pointer;
  text-decoration: none;
}
.embed-button--play {
  min-width: 52px;
  height: 52px;
}
.embed-button:disabled {
  cursor: default;
  opacity: 0.35;
}
.embed-button:focus-visible,
.embed-volume:focus-visible {
  outline: 2px solid #e7ff2c;
  outline-offset: 2px;
}
.embed-volume {
  width: 100%;
  max-width: 120px;
  accent-color: #e7ff2c;
  cursor: pointer;
}
.embed-listeners {
  font-size: 12px;
  opacity: 0.6;
  white-space: nowrap;
}
.embed-open {
  margin-left: auto;
  opacity: 0.6;
}
@media (max-width: 360px) {
  .embed-cover,
  .embed-listeners {
    display: none;
  }
}
</style>
