<template>
<span class="donators">
  <v-row style="line-height:normal;" no-gutters>
    <v-col   :cols="12">
      SUPPORTERS:<br /><br />
    </v-col>
    <v-col  :cols="12" v-for="(item,index) in filteredData" :key="index"
    :style="(index<=5) ? 'font-weight: 600; font-size:1em;' : ''">
      <span style="text-overflow: ellipsis; width: 60px; white-space: nowrap; overflow:hidden;">
        ${{ Number.parseInt(item.gross) }} {{ decodeURIComponent(item.name) }}
      </span>
    </v-col>
  </v-row>
</span>
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
      this.$axios.get('/api/donations', {progress: false}).then((res) => {
        this.data = this.data.map((item)=>{return {...item, gross: Number.parseInt(item.gross)}})
        this.data = res.data;
      })
    },
  },
  computed: {
    donatorsListText() {
      return this.filteredData.map(item=>`<strong>${item.name}</strong> $${item.gross}`).join(', ')
    },
    filteredData() {
      return this.data.slice(0, 100)
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
</style>