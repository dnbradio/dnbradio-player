<template>
  <div :class="themeClass">
    <v-toolbar
      color="transparent"
      dark
      flat
      :max-width="560"
      style="margin:auto;"
      v-if="hideNav==false"
    >
      <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
      <v-btn icon class="ml-2" @click="$router.go(-1)">
        <v-icon medium transparent>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="view = 'calendar'" v-if="view == 'schedule'">
        <v-icon>mdi-calendar-month</v-icon>
      </v-btn>
      <v-btn icon @click="view = 'schedule'" v-if="view == 'calendar'">
        <v-icon>mdi-calendar-week</v-icon>
      </v-btn>
    </v-toolbar>
    <div class="text-center" v-if="station && view && !hideTitle">
      <small>UPCOMING SCHEDULE</small>
      <h2 class="categoryTitle">{{ station.title }}</h2>
      <h4 class="categorySubtitle" style="text-transform: uppercase;">
        <small>{{ station.subtitle }}</small>
      </h4>
      <div>
        {{ tz }}
        {{ dst }}
      </div>
    </div>
    <div v-if="station && view == 'schedule'">
      <StationSchedule :station="station" />
    </div>
    <div v-if="station && view == 'calendar'">
      <StationCalendar :station="station" />
    </div>
  </div>
</template>

<script>
// init data
import stations from "@/data/stations";

// models
import Station from "@/models/Station";

// comp
import StationSchedule from "~/components/StationSchedule";
import StationCalendar from "~/components/StationCalendar";
import Logo from "~/components/Logo.vue";
import moment from "moment-timezone";
import Vue from "vue";

Vue.filter("localTZ", function(value) {
  if (value) {
    return moment(value).format("ZZ");
  }
});
var abbrs = {
  EST: "Eastern Standard Time",
  EDT: "Eastern Daylight Time",
  CST: "Central Standard Time",
  CDT: "Central Daylight Time",
  MST: "Mountain Standard Time",
  MDT: "Mountain Daylight Time",
  PST: "Pacific Standard Time",
  PDT: "Pacific Daylight Time"
};

moment.fn.zoneName = function() {
  var abbr = this.zoneAbbr();
  return abbrs[abbr] || abbr;
};

export default {
  components: {
    Logo,
    StationSchedule,
    StationCalendar
  },
  async fetch() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
  },
  data() {
    return {
      view: "",
      hideNav: false,
      hideTitle: false,
      themeClass: "",
    };
  },
  async mounted() {
    if (this.$route.query.calendar) {
      this.view = "calendar";
    } else {
      this.view = "schedule";
    }
    this.hideNav = this.$route.query?.hideNav || false;
    this.hideTitle = this.$route.query?.hideTitle || false;
    this.themeClass = 'invertTrue' || "";
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
  },
  computed: {
    dst() {
      return moment().isDST() ? "DST" : "";
    },
    tz() {
      return moment.tz.guess();
    },
    currenStationIndex() {
      return this.$route.params && this.$route.params.stationId
        ? this.$route.params.stationId
        : 0;
    },
    stations() {
      return Station.query().get();
    },
    station() {
      let index = this.currenStationIndex || 0;
      return this.stations.filter(
        item => item.id == this.currenStationIndex
      )[0];
    }
  }
};
</script>
<style>

.invertTrue img {
  filter: invert(1);
}
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
