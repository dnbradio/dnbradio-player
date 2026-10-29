<template>
  <section
    ref="container"
    class="broadcast-widget"
    :class="'broadcast-widget--' + kind"
  >
    <template v-if="kind === 'nowplaying'"
      ><p>{{ np.live ? "LIVE NOW" : "PLAYLIST ROTATION" }}</p>
      <strong>{{ np.artist }}</strong
      ><br /><span>{{ np.title }}</span></template
    >
    <template v-else-if="kind === 'listeners'"
      ><span v-if="np.listeners !== null"
        >{{ np.listeners }} LISTENERS</span
      ></template
    >
    <template v-else-if="kind === 'upnext' && next"
      ><p>NEXT LIVE SHOW</p>
      <strong>{{ next.host }}</strong>
      <span v-if="next.location">({{ next.location }})</span>
      <p>STARTS {{ relative(next.startAt) }}</p></template
    >
    <template v-else-if="kind === 'donators'"
      ><small style="color: yellow">TOP DONATIONS</small>
      <hr />
      <div v-for="(donor, index) in donors" :key="index">
        {{ donor.alias }} ${{ donor.gross }}
      </div></template
    >
    <template v-else-if="kind === 'socials'"
      ><span v-for="(count, key) in socials" :key="key" class="social"
        ><UiIcon>{{ "mdi-" + key }}</UiIcon
        >{{ count.followers }}</span
      ></template
    >
    <template v-else-if="kind === 'chat'"
      ><div v-for="(line, index) in chat" :key="index" class="chat-line">
        <strong>{{ line.nick || line.nickname || line.name }}</strong
        ><span>{{ plain(line.message) }}</span>
      </div></template
    >
    <template v-else-if="kind === 'marquee'"
      ><p>
        EST. 2003 - PAYPAL.ME/RADIODNB - PATREON.COM/DNBRADIO -
        DNBRADIO.COM/PLAYER - DNBRADIO.COM/SCHEDULE
      </p></template
    >
    <template v-else-if="kind === 'vis'"><StarField active /></template>
    <span v-if="failed" role="status">Feed temporarily unavailable</span>
  </section>
</template>
<script>
import stationMixin from "../mixins/station.js";
import StarField from "../components/player/StarField.vue";
import { normalizeNowPlaying } from "../lib/nowplaying.js";
import {
  normalizeShows,
  upcomingShows,
  relativeTime,
} from "../lib/schedule.js";
import { widgetTypes } from "../scripts/static-routes.mjs";
export default {
  components: { StarField },
  mixins: [stationMixin],
  data: () => ({
    data: null,
    shows: [],
    donors: [],
    socials: {},
    chat: [],
    timer: null,
    failed: false,
    request: null,
  }),
  computed: {
    kind() {
      return this.$route.params.widget;
    },
    np() {
      return normalizeNowPlaying(this.station || {}, this.data);
    },
    next() {
      return upcomingShows(this.shows, new Date(), 1)[0];
    },
  },
  watch: {
    "$route.fullPath"() {
      this.load();
    },
  },
  mounted() {
    this.load();
    this.timer = setInterval(this.load, this.kind === "chat" ? 5000 : 30000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
    this.request?.abort();
  },
  methods: {
    relative: relativeTime,
    plain: (value) =>
      String(value || "")
        .replace("ACTION ", "")
        .replace("\u0001", "")
        .trim(),
    async load() {
      this.request?.abort();
      const request = new AbortController();
      this.request = request;
      this.failed = false;
      if (!widgetTypes.includes(this.kind) || !this.station) {
        this.failed = true;
        return;
      }
      const kind = this.kind;
      const urls = {
        nowplaying: this.station.nowplaying_url.url,
        listeners: this.station.nowplaying_url.url,
        upnext: this.station.schedule.url,
        donators: "https://dnbradio.com/api/donations",
        socials:
          "https://dnbradio.com/swcontrib/SWDnbRadio/assets/inc/socials-json.php",
        chat: "https://dnbradio.hardcoding.nl/api/chat_log",
      };
      if (!urls[kind]) return;
      try {
        const response = await fetch(urls[kind], { signal: request.signal });
        if (!response.ok) throw new Error(response.status);
        const data = await response.json();
        if (request.signal.aborted) return;
        if (kind === "upnext") this.shows = normalizeShows(data);
        else if (kind === "donators")
          this.donors = data
            .filter(
              (item) =>
                new Date(item.date) > new Date(Date.now() - 90 * 86400000),
            )
            .filter(
              (item, index, all) =>
                index === all.findIndex((other) => other.alias === item.alias),
            )
            .map((item) => ({ ...item, gross: Math.round(item.gross) }))
            .sort((a, b) => b.gross - a.gross)
            .slice(0, 10);
        else if (kind === "socials") this.socials = data;
        else if (kind === "chat") {
          this.chat = data.slice(0, 30).reverse();
          await this.$nextTick();
          const container = this.$refs.container;
          if (container) container.scrollTop = container.scrollHeight;
        } else this.data = data;
      } catch (error) {
        if (error.name !== "AbortError") this.failed = true;
      }
    },
  },
};
</script>
<style scoped>
.broadcast-widget {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.broadcast-widget p {
  margin: 0;
}
.broadcast-widget--nowplaying strong {
  text-transform: uppercase;
  font-size: 28.8px;
}
.broadcast-widget--nowplaying span {
  font-size: 21.6px;
  font-weight: 100;
}
.broadcast-widget--nowplaying p {
  font-size: 16.8px;
}
.broadcast-widget--upnext {
  font-size: 19.2px;
}
.broadcast-widget--donators {
  font-size: 30.4px;
}
.broadcast-widget--socials {
  font-size: 12px;
}
.chat-line strong {
  color: #39ff14;
}
.broadcast-widget--chat {
  height: 100svh;
  overflow-y: auto;
  text-align: left;
}
.chat-line {
  display: flex;
  gap: 12px;
}
.chat-line strong {
  min-width: 80px;
  text-align: right;
}
.social {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0 5px;
}
.broadcast-widget--vis {
  position: fixed;
  inset: 0;
}
.broadcast-widget--vis :deep(canvas) {
  opacity: 1;
}
</style>
