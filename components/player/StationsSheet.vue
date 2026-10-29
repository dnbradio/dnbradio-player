<template>
  <BottomSheet
    :modelValue="modelValue"
    eyebrow="dnbradio.com"
    title="Stations"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <ul class="stations">
      <li v-for="item in stations" :key="item.id">
        <button
          type="button"
          class="stations__row"
          :class="{
            'stations__row--current': station && item.id === station.id,
          }"
          :aria-current="station && item.id === station.id ? 'true' : null"
          @click="choose(item)"
        >
          <span
            class="stations__logo"
            :style="{ backgroundImage: `url(${item.cover})` }"
            aria-hidden="true"
          />
          <span class="stations__text">
            <span class="stations__name">
              {{ item.title }}
              <span v-if="np(item) && np(item).live" class="stations__live"
                >LIVE</span
              >
            </span>
            <span class="stations__sub">{{ item.subtitle }}</span>
            <span v-if="np(item)" class="stations__np">{{
              nowLine(item)
            }}</span>
          </span>
          <span class="stations__side">
            <UiIcon
              v-if="playingStationId === item.id && isActive"
              size="20"
              class="stations__eq"
              aria-label="Playing"
              >mdi-equalizer</UiIcon
            >
            <span
              v-if="np(item) && np(item).listeners !== null"
              class="stations__count"
            >
              {{ np(item).listeners
              }}<UiIcon size="14" aria-hidden="true">mdi-headphones</UiIcon>
            </span>
          </span>
        </button>
      </li>
    </ul>

    <template v-if="station">
      <p class="dnb-section-label">About {{ station.title }}</p>
      <p class="stations__about">{{ station.description }}</p>
      <div class="stations__links">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.href"
          target="_blank"
          rel="noopener"
          class="chip"
        >
          <UiIcon size="18" aria-hidden="true">{{ link.icon }}</UiIcon
          >{{ link.label }}
        </a>
        <button v-if="canShare" type="button" class="chip" @click="share">
          <UiIcon size="18" aria-hidden="true">mdi-share-variant</UiIcon>Share
        </button>
      </div>
      <p class="stations__listen">
        Listen elsewhere:
        <a :href="streamUrl" target="_blank" rel="noopener">direct stream</a>
      </p>
    </template>
  </BottomSheet>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import { stationList } from "@/data/stations";
import { EventBus } from "@/components/eventbus.js";
import BottomSheet from "~/components/ui/BottomSheet.vue";
import { stationPath } from "~/lib/stations.js";

export default {
  components: { BottomSheet },
  props: {
    modelValue: { type: Boolean, default: false },
    station: { type: Object, default: null },
  },
  computed: {
    ...mapState("player", ["nowplaying"]),
    ...mapGetters("player", ["playingStationId", "isActive"]),
    stations() {
      return stationList;
    },
    canShare() {
      return true;
    },
    streamUrl() {
      return this.$stationStreamUrl(this.station);
    },
    links() {
      const s = this.station;
      return [
        s.website && { label: "Website", icon: "mdi-web", href: s.website },
        s.podcast &&
          s.podcast.website && {
            label: "Podcast",
            icon: "voicemail",
            href: s.podcast.website,
          },
        s.facebook && {
          label: "Facebook",
          icon: "mdi-facebook",
          href: s.facebook,
        },
        s.twitter && {
          label: "X / Twitter",
          icon: "mdi-twitter",
          href: s.twitter,
        },
        s.instagram && {
          label: "Instagram",
          icon: "mdi-instagram",
          href: s.instagram,
        },
        s.soundcloud && {
          label: "SoundCloud",
          icon: "mdi-soundcloud",
          href: s.soundcloud,
        },
      ].filter(Boolean);
    },
  },
  watch: {
    modelValue(open) {
      this.$player.watchAllStations(open);
    },
  },
  methods: {
    np(item) {
      return this.nowplaying[item.id] || null;
    },
    nowLine(item) {
      const np = this.np(item);
      return [np.artist, np.title].filter(Boolean).join(" – ");
    },
    choose(item) {
      this.$player.playStation(item);
      if (!this.station || item.id !== this.station.id) {
        this.$router.push(stationPath(item));
      }
      this.$emit("update:modelValue", false);
    },
    async share() {
      const url =
        window.location.origin +
        this.$router.resolve(stationPath(this.station)).href;
      const data = {
        title: this.station.title + " – " + this.station.subtitle,
        url,
      };
      try {
        if (navigator.share) {
          await navigator.share(data);
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
.stations {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}
.stations__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px 10px 10px;
  border: 1px solid var(--dnb-line);
  border-radius: 14px;
  background: var(--dnb-surface);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}
.stations__row:hover {
  background: var(--dnb-surface-2);
}
.stations__row:focus-visible {
  outline: 2px solid var(--dnb-accent);
}
.stations__row--current {
  border-color: var(--dnb-accent);
}
.stations__logo {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #000 center / 80% no-repeat;
}
.stations__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.stations__name {
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}
.stations__live {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--dnb-live);
  font-size: 10px;
  letter-spacing: 0.08em;
}
.stations__sub {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dnb-text-3);
}
.stations__np {
  margin-top: 3px;
  font-size: 13px;
  color: var(--dnb-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stations__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.stations__eq {
  color: var(--dnb-accent) !important;
}
.stations__count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--dnb-text-3);
  font-variant-numeric: tabular-nums;
}
.stations__count .ui-icon {
  color: inherit !important;
}
.stations__about {
  margin: 0 0 12px !important;
  font-size: 14px;
  line-height: 21px;
  color: var(--dnb-text-2);
}
.stations__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
.stations__listen {
  margin: 16px 0 0 !important;
  font-size: 13px;
  color: var(--dnb-text-3);
}
.stations__listen a {
  color: var(--dnb-text-2) !important;
}
</style>
