import Station from "@/models/Station";

// The station a route belongs to: /darkstep by pathname, /stations/:id by id,
// and everything else (/) is station 1.
export default {
  computed: {
    stations() {
      return Station.query().get();
    },
    stationId() {
      const byPath = this.stations.find(
        (item) => item.pathname && item.pathname === this.$route.name
      );
      if (byPath) {
        return byPath.id;
      }
      return Number(this.$route.params.stationId) || 1;
    },
    station() {
      return this.stations.find((item) => item.id == this.stationId) || null;
    },
  },
};
