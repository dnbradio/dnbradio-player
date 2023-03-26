<template>
  <div>
    <client-only>
      <StationList />
    </client-only>
  </div>
</template>

<script>
// init data
import stations from "@/data/stations";

// models
import Station from "@/models/Station";

// comp
import StationList from "~/components/StationList";
import Logo from "~/components/Logo.vue";

export default {
  head() {
    var station = {};
    if (this.station) {
      station = this.station;
    } else {
      station.title = "24/7 Drum and Bass Radio Station";
      station.description = "Daily live shows from around the world";
      station.name = "dnbradio";
      station.subtitle = "Tune in on any device";
      station.twitterId = "dnbradio";
      station.cover = "https://dnbradio.com/img/logotags.png";
    }
    return {
      title: `${station.title} : ${station.description} [${station.name}]`,
      meta: [
        {
          hid: "description",
          name: "description",
          content: `${station.description}`
        },
        {
          hid: `keywords`,
          name: "keywords",
          keywords: `${station.title} ${station.subtitle}`
        },
        {
          hid: `og:title`,
          property: "og:title",
          content: `${station.title} -  ${station.subtitle}`
        },
        {
          hid: `og:description`,
          property: "og:description",
          content: `${station.description}`
        },
        // { hid: `og:url`, property: 'og:url', content: product.name },
        { hid: `og:image`, property: "og:image", content: `${station.cover}` },
        {
          hid: `og:site_name`,
          property: "og:site_name",
          content: `${station.title}`
        },
        {
          hid: `twitter:card`,
          property: "twitter:card",
          content: `${station.title} ${station.subtitle}`
        },
        {
          hid: `twitter:site`,
          property: "twitter:site",
          content: `${station.twitterId || "dnbradio"}`
        },
        {
          hid: `twitter:creator`,
          property: "twitter:creator",
          content: `${station.twitterId || "dnbradio"}`
        },
        // { hid: `twitter:card`, property: 'twitter:card', content: 'player' },
        // { hid: `twitter:player:stream`, property: 'twitter:player:stream', content: 'https://dnbradio.com:10128/dnbradio_main.mp3' },
        // { hid: `twitter:stream:content_type`, property: 'twitter:stream:content_type', content: 'audio/mpeg' },
        // { hid: `twitter:player`, property: 'twitter:player', content: 'https://dnbradio.com/embed/live' },
        // { hid: `twitter:player:height`, property: 'twitter:player:height', content: '720' },
        // { hid: `twitter:player:width`, property: 'twitter:player:width', content: '1280' },
        {
          hid: `twitter:image`,
          property: "twitter:image",
          content: `${station.cover}`
        },
        {
          hid: `twitter:title`,
          property: "twitter:title",
          content: `${station.title} - ${station.subtitle}`
        },
        {
          hid: `twitter:description`,
          property: "twitter:description",
          content: `${station.description}`
        },
        {
          hid: `apple-mobile-web-app-capable`,
          rel: "apple-mobile-web-app-capable",
          content: "yes"
        }
      ],
      link: [
        { rel: "image_src", href: `${station.cover}` },
        { rel: "favicon", href: `${station.cover}` },
        { rel: "shortcut icon", href: `${station.cover}` },
        { rel: "icon", href: `${station.cover}` },
        { rel: "apple-touch-icon", href: `${station.cover}` }
        // { rel: 'canonical', href="//section8recs.com/r/fringe-recall-monatomic-gold-oblivion/9710" }
      ]
    };
  },
  components: {
    Logo,
    StationList
  },
  async fetch() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
  },
  data() {
    return {};
  },
  computed: {
    currenStationIndex() {
      if (this.stations) {
        let station = this.stations.find(
          item => item.pathname && item.pathname == this.$route.name
        );
        //console.log('station', station, this.stations, this.$route)
        if (station) {
          return station.id;
        }
      }
      return this.$route.params && this.$route.params.stationId
        ? this.$route.params.stationId
        : 1;
    },
    stations() {
      return Station.query().get();
    },
    station() {
      if (!this.stations) {
        return null;
      }
      let currenStationIndex = this.currenStationIndex
        ? this.currenStationIndex
        : 1;
      return this.stations.filter(item => item.id == currenStationIndex)[0];
    }
  },
  async mounted() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
  }
};
</script>
<style>
.v-autocomplete__content.v-menu__content .v-card {
  color: #fff;
}
.theme--dark.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: #fff !important;
}
.v-application .primary--text {
  color: #e7ff2c !important;
  caret-color: #e7ff2c !important;
}
.v-select__slot input {
  color: #fff !important;
}
body {
  background: #181818;
}
</style>
