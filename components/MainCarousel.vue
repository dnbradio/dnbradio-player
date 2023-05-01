<template>
<div v-if="station">
  <v-carousel v-model="cIndex" height="459px" width="800px" class="playerCar"
  :show-arrows="false" :hide-delimiters="true">
    <v-carousel-item v-for="(station) in stations" :key="station.id">
      <client-only>
        <video-panel v-if="station.defaultPlayer=='custom'" :station="station" :hook="cIndex" :key="`cupanel${station.id}`" ref="activePanel" />
        <twitch-panel v-if="station.defaultPlayer=='twitch'" :station="station" :hook="cIndex" :key="`twpanel${station.id}`" ref="activePanel" />
        <youtube-panel v-if="station.defaultPlayer=='youtube'" :station="station" :hook="cIndex" :key="`ytpanel${station.id}`" ref="activePanel" />
        <station-details v-if="station.defaultPlayer=='webaudio'" :station="station" :hook="cIndex" :hideExtras="true" slayout="wide" :key="`scpanel${station.id}`" ref="activePanel" />
      </client-only>
    </v-carousel-item>
  </v-carousel>
  </div>
</template>
<script>

// init data
import stations from '@/data/stations'

// models
import Station from '@/models/Station'

import VideoPanel from './VideoPanel.vue';
import TwitchPanel from './TwitchPanel.vue';
import YoutubePanel from './YoutubePanel.vue';
import StationDetails from './StationDetails.vue';

export default {
  async fetch () {
    const stationsInitData = await stations()
    Station.create({ data: stationsInitData })
  },
  computed: {
    stations() {

      let stations = Station.query().get()
      console.log('sations', stations);
      stations.sort((a,b)=>a.order-b.order)
      return stations;
    },
    station() {
      let index = this.$route.params?.stationId || 1
      return this.stations.map(item=>item).filter((item) => item.id == index)[0];
    },
  },
  components: { VideoPanel, TwitchPanel, YoutubePanel, StationDetails },
  data: () => ({
    cIndex: 0,
    ready: false
  }),
}
</script>

<style>
  .playerCar .v-carousel__controls { background: transparent; box-shadow: none;}


</style>