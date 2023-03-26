<template>
<div class="donators">
  <small style="color: yellow;">TOP DONATIONS</small>
  <v-divider />
  <div v-for="item in filteredData" :key="item.id" style="text-align:center;">
    {{ item.nickname }} ${{ item.gross }}
  </div>
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
      data: []
    }
  },
  methods: {
    fetchData() {
      this.$axios.get('https://dnbradio.com/swcontrib/SWDnbRadio/assets/inc/paypal-json.php', {progress: false}).then((res) => {
        console.log(res)
        this.data = res.data;
      })
    },
  },
  computed: {
    filteredData() {
      return this.data.slice(0, 10)
    }
  },
  async mounted() {
    this.fetchData()
    setInterval(() => {
      this.fetchData();
    }, 60000);
  }
}
</script>
<style scoped>
  .donators {  font-family: 'Roboto', sans-serif; text-align:center; font-weight: 600; font-size: 1.9em; }
</style>