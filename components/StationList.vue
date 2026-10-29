<template>
  <StationDetails :station="station" />
</template>

<script>
import StationDetails from "@/components/StationDetails";
import stationMixin from "~/mixins/station";

export default {
  components: { StationDetails },
  mixins: [stationMixin],
};
</script>
