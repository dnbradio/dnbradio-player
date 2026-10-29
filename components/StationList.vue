<template>
  <StationDetails :station="station" />
</template>

<script>
import StationDetails from "@/components/StationDetails.vue";
import stationMixin from "~/mixins/station.js";

export default {
  components: { StationDetails },
  mixins: [stationMixin],
};
</script>
