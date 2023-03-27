<template>
  <div>
    <v-toolbar
      color="transparent"
      dark
      flat
      style="margin:auto; opacity: 0.24;"
    >
      <v-btn class="ml-3" @click="$router.go(-1)">
        <v-icon medium transparent>arrow_back</v-icon> Back
      </v-btn>
      <v-divider />
      <v-btn class="ml-6" @click="$router.go(-1)">
        <v-icon medium transparent>mdi-radio</v-icon>
        <span class="pl-1">SWITCH TO RADIO</span>
      </v-btn>
    </v-toolbar>
    <v-card color="transparent" flat class="mx-auto">
      <v-list three-line color="transparent" flat>
        <div style="text-align:center;">
          <h1>Live Recordings</h1>
          <h2>Recorded during the live broadcast</h2>
        </div>
        <div style="text-align:center;" v-if="items && items.length">
          <v-btn @click="prevPage()" :disabled="page <= 1" fab
            ><v-icon medium transparent>arrow_back</v-icon></v-btn
          >
          <v-btn @click="nextPage()" :disabled="page >= numPages" fab
            ><v-icon medium transparent>arrow_forward</v-icon></v-btn
          >
          <br /><small>PAGE {{ page }} of {{ numPages }}</small>
          <v-divider style="margin-top: 20px;" />
        </div>

        <template v-for="(item, index) in items">
          <v-list-item
            :key="item.title"
            @click="$router.push('/stations/1/podcast/' + item.id)"
          >
            <v-list-item-avatar>
              <v-img :src="item.image"></v-img>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title v-html="item.artist"></v-list-item-title>
              <v-list-item-subtitle v-html="item.title"></v-list-item-subtitle>
              <v-list-item-subtitle class="text-right" style="margin-top:-60px;"
                ><small
                  >RECORDED:<br />{{ item.timestamp }}</small
                ></v-list-item-subtitle
              >
            </v-list-item-content>
          </v-list-item>
          <v-divider
            v-if="index != 9"
            v-bind:key="index"
            style="margin-bottom: 10px; margin-top: 10px;"
          />
        </template>
      </v-list>
      <div style="text-align:center;" v-if="items && items.length">
        <v-divider style="margin-bottom: 20px;" />

        <v-btn @click="prevPage()" :disabled="page <= 1" fab
          ><v-icon medium transparent>arrow_back</v-icon></v-btn
        >
        <v-btn @click="nextPage()" :disabled="page >= numPages" fab
          ><v-icon medium transparent>arrow_forward</v-icon></v-btn
        >
        <br /><small>PAGE {{ page }} of {{ numPages }}</small>
      </div>
    </v-card>
  </div>
</template>

<script>
// init data
import stations from "@/data/stations";

// models
import Station from "@/models/Station";

// comp
import StationSchedule from "~/components/StationSchedule";
import Logo from "~/components/Logo.vue";

export default {
  async fetch() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
  },
  components: {
    Logo,
    StationSchedule
  },
  data() {
    return {
      pagination: null,
      items: null
    };
  },
  async mounted() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
  },
  methods: {
    nextPage() {
      this.$router.push(
        "/stations/" + this.station.id + "/podcast?page=" + (this.page + 1)
      );
    },
    prevPage() {
      this.$router.push(
        "/stations/" + this.station.id + "/podcast?page=" + (this.page - 1)
      );
    },
    fetchData() {
      if (this.station && this.station.podcast) {
        this.$axios
          .get(this.station.podcast.url + "?page=" + this.page)
          .then(res => {
            this.pagination = res.data.pagination;
            this.items = res.data.data;
          });
      }
    }
  },
  computed: {
    numPages() {
      if (this.pagination) {
        return Number(this.pagination.total_pages).toLocaleString();
      }
    },
    page() {
      return this.$route.query.page ? this.$route.query.page : 1;
    },
    currenStationIndex() {
      return this.$route.params && this.$route.params.stationId
        ? this.$route.params.stationId
        : 1;
    },
    stations() {
      return Station.query().get();
    },
    station() {
      let index = this.currenStationIndex || 1;
      return this.stations.filter(
        item => item.id == this.$route.params.stationId
      )[0];
    }
  },
  watch: {
    page() {
      this.fetchData();
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.station && this.station.podcast) {
        this.$axios
          .get(this.station.podcast.url + "?page=" + this.page)
          .then(res => {
            this.pagination = res.data.pagination;
            this.items = res.data.data;
          });
      } else {
        console.log("no podcast");
      }
    });
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

/** LOCK ROTATION **/
@media screen and (min-width: 320px) and (max-width: 767px) and (orientation: landscape) {
  html {
    transform: rotate(-90deg);
    transform-origin: left top;
    width: 100vh;
    overflow-x: hidden;
    position: absolute;
    top: 100%;
    left: 0;
  }
}
</style>
