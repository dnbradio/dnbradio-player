<template>
  <div class="marquee" style="width: 100%; text-align:center; font-weight: 600; font-size:16px;">
      <p>{{ marquees[0].text }}</p>
  </div>
</template>

<script>

// init data
import stations from '@/data/stations'

// models
import Station from '@/models/Station'

// comp
import StationList from '~/components/StationList'
import Logo from '~/components/Logo.vue'

export default {
  layout: 'ls-widget',
  components: {
    Logo,
    StationList
  },
  async fetch () {
    const stationsInitData = await stations()
    Station.create({ data: stationsInitData })
  },
  data() {
    return {
      marquees: [
        {
          text: 'EST. 2003 - PAYPAL.ME/RADIODNB - PATREON.COM/DNBRADIO - DNBRADIO.COM/PLAYER - DNBRADIO.COM/SCHEDULE'
        }
      ]
    }
  },
  methods: {
  },
  computed: {
    currenStationIndex() {
      return (this.$route.params && this.$route.params.stationId) ? this.$route.params.stationId : 1
    },
    stations() {
      return Station.query().get()
    },
    station() {
      let index = (this.currenStationIndex) ? this.currenStationIndex : 1
      return this.stations.filter((item) => item.id == index)[0]
    },
  },
  async mounted() {
    const stationsInitData = await stations()
    Station.create({ data: stationsInitData })
  }
}
</script>
<style scoped>
  .marquee {  font-family: 'Roboto', sans-serif;  }
</style>
<style style="text/css">
</style>
