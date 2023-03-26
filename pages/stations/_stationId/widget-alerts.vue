<template>
<div class="alerts">
  <div></div>
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
  data() {
    return {
      data: []
    }
  },
  mounted() {
    this.$axios.get('https://dnbradio.com/swcontrib/SWDnbRadio/assets/pages/alerts.php').then((res) => {
      this.data = res.data
    })
  },
  computed: {
    filteredData() {
      return this.data.slice(this.data.length-22, this.data.length+22).map((item) => {
        return item
      })
    }
  }
}
</script>
<style>
</style>