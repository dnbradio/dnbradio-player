<template>
<div class="socials">
  <span class="group pa-2" v-if="data">
  <v-icon dark>mdi-facebook</v-icon>
  {{ data.facebook.followers }}
  <v-icon dark style="margin-left:10px;">mdi-instagram</v-icon>
  {{ data.instagram.followers }}
  <v-icon dark style="margin-left:10px;">mdi-twitter</v-icon>
  {{ data.twitter.followers }}
  </span>
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
      data: {
        facebook: {
          followers: 95770
        },
        instagram: {
          followers: 6789
        },
        twitter: {
          followers: 3320
        }
      }
    }
  },
  methods: {
    fetchData() {
      this.$axios.get('https://dnbradio.com/swcontrib/SWDnbRadio/assets/inc/socials-json.php', {progress: false}).then((res) => {
        this.data = res.data;
      })
    },
  },
  computed: {
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
  .socials {  font-size:12px; font-family: 'Roboto', sans-serif; text-align:center; font-weight: 600;   }
</style>