<template>
  <transition name="mini">
    <section v-if="visible" class="mini" aria-label="Now playing">
      <div
        v-if="episode && duration"
        class="mini__progress"
        :style="{ transform: `scaleX(${currentTime / duration})` }"
        aria-hidden="true"
      />
      <button type="button" class="mini__body" @click="open">
        <img
          :src="art"
          alt=""
          class="mini__art"
          :class="{ 'mini__art--logo': !episode }"
        />
        <span class="mini__text">
          <span class="mini__line1">
            <span v-if="live" class="mini__live">LIVE</span>{{ line1 }}
          </span>
          <span class="mini__line2" :class="{ 'mini__line2--alert': alert }">{{
            line2
          }}</span>
        </span>
      </button>
      <PlayButton
        :size="44"
        :active="active"
        :busy="busy"
        :pause-label="episode ? 'Pause' : 'Stop'"
        @click="$player.toggle()"
      />
      <button
        type="button"
        class="mini__close"
        aria-label="Close player"
        @click="$player.stop()"
      >
        <v-icon size="20">mdi-close</v-icon>
      </button>
    </section>
  </transition>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import Station from "@/models/Station";
import PlayButton from "./PlayButton";
import { stationPath } from "~/lib/stations";

export default {
  components: { PlayButton },
  computed: {
    ...mapState("player", [
      "source",
      "status",
      "message",
      "nowplaying",
      "currentTime",
      "duration",
    ]),
    ...mapGetters("player", [
      "isActive",
      "isBusy",
      "episode",
      "playingStationId",
    ]),
    active() {
      return this.isActive;
    },
    busy() {
      return this.isBusy;
    },
    station() {
      return this.playingStationId ? Station.find(this.playingStationId) : null;
    },
    np() {
      return this.station ? this.nowplaying[this.station.id] : null;
    },
    onPlayerScreen() {
      const route = this.$route;
      if (this.$player.isPlayerRoute(route)) {
        return true;
      }
      return Boolean(
        this.episode &&
          route.name === "stations-stationId-podcast-epid" &&
          route.params.epid == this.episode.id
      );
    },
    visible() {
      return Boolean(
        this.source && (this.station || this.episode) && !this.onPlayerScreen
      );
    },
    live() {
      return Boolean(this.np && this.np.live);
    },
    art() {
      return this.episode ? this.episode.image : this.station.cover;
    },
    line1() {
      if (this.episode) {
        return this.episode.artist;
      }
      return (this.np && this.np.artist) || this.station.title;
    },
    alert() {
      return ["reconnecting", "error"].includes(this.status);
    },
    line2() {
      if (this.alert && this.message) {
        return this.message;
      }
      if (this.episode) {
        return this.episode.title;
      }
      return (this.np && this.np.title) || this.station.subtitle;
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(visible) {
        document.documentElement.classList.toggle("has-mini-player", visible);
      },
    },
  },
  methods: {
    open() {
      if (this.episode) {
        this.$router.push("/stations/1/podcast/" + this.episode.id);
      } else {
        this.$router.push(stationPath(this.station));
      }
    },
  },
};
</script>

<style scoped>
.mini {
  position: fixed;
  left: 50%;
  bottom: calc(var(--dnb-nav-height, 0px) + env(safe-area-inset-bottom) + 8px);
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 4px;
  width: calc(100% - 16px);
  max-width: 544px;
  padding: 8px 6px 8px 8px;
  border-radius: 16px;
  border: 1px solid var(--dnb-line);
  background: rgba(22, 22, 22, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.mini__progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: var(--dnb-accent);
  transform-origin: left center;
}
.mini__body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  background: none;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.mini__body:focus-visible {
  outline: 2px solid var(--dnb-accent);
  outline-offset: 2px;
  border-radius: 10px;
}
.mini__art {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  background: #000;
  flex-shrink: 0;
}
.mini__art--logo {
  object-fit: contain;
  padding: 3px;
}
.mini__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mini__line1,
.mini__line2 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mini__line1 {
  font-size: 14px;
  font-weight: 700;
  color: var(--dnb-text);
}
.mini__line2 {
  font-size: 13px;
  color: var(--dnb-text-2);
}
.mini__line2--alert {
  color: var(--dnb-warn);
}
.mini__live {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--dnb-live);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  vertical-align: 1px;
}
.mini__close {
  width: 40px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: none;
  border-radius: 10px;
  cursor: pointer;
}
.mini__close .v-icon {
  color: var(--dnb-text-3) !important;
}
.mini__close:hover .v-icon {
  color: var(--dnb-text) !important;
}
.mini-enter-active,
.mini-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}
.mini-enter,
.mini-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}
</style>
