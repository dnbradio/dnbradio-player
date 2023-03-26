<template>
  <v-card
    flat
    :max-width="500"
    :width="windowWidth"
    min-width="300"
    :height="windowHeight"
    style="background: transparent; overflow: hidden; margin:auto;"
  >
    <StationDetails :station="station" />
  </v-card>
</template>

<script>
import Station from "@/models/Station";
import StationDetails from "@/components/StationDetails";
// models
export default {
  data() {
    return {
      loaded: false,
      selectedCategory: 1
    };
  },
  components: {
    StationDetails
  },
  methods: {},
  watch: {},
  computed: {
    windowHeight() {
      if (process.client) {
        return window.height;
      }
    },
    windowWidth() {
      if (process.client) {
        return window.width;
      }
    },
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
      let currenStationIndex = this.currenStationIndex
        ? this.currenStationIndex
        : 1;
      return this.stations.filter(item => item.id == currenStationIndex)[0];
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.loaded = true;
      }, 2000);
    });
  }
};
</script>

<style scoped>
h2.categoryTitle {
  font-size: 3.2em;
}
p.categoryDescription {
  color: #6b6666;
}
</style>
