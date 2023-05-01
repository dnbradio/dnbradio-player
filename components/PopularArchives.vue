<template>
<div class="cont">
  <v-container fluid>
  <v-row v-if="popular.length" key="trending">
    <v-col cols="12">
      <h1 style="font-size:10px;">Now Playing <span v-if="nowPlaying && nowPlaying.songtype=='S'"> : playlist rotation</span></h1>
      <h1 v-if="nowPlaying" style="line-height: normal;">

        <span v-if="nowPlaying.songtype=='L'">LIVE:</span>
        {{ nowPlaying.artist }} - {{ nowPlaying.title }}
        <span v-if="isArchive(nowPlaying)">[ARCHIVE]</span>
        <span style="font-size:12px;">
          <span v-if="nowPlaying.album">on {{ nowPlaying.album }}</span>
          <span v-if="nowPlaying.albumyear"> ({{ nowPlaying.albumyear }})</span>
        </span>
      </h1>
    </v-col>
    <v-col cols="12">
      <h1>Trending Mixes <v-btn href="/sets?sortby=Trending" small text>view all</v-btn></h1>
    </v-col>
    <v-col cols="3" v-for="(item,index) in popular" :key="`t${index}`">
      <podcast-playable-banner :item="item" :index="index" />
    </v-col>
  </v-row>
  <v-row v-if="latest.length" class="pt-16" key="latest">
    <v-col cols="12">
      <h1>Latest Episodes :: <v-btn href="/sets?sortby=New" small text>view all</v-btn></h1>
    </v-col>
    <v-col cols="3" v-for="(item,index) in latest" :key="index">
      <podcast-playable-banner :item="item" :index="index" />
    </v-col>
  </v-row>
  <v-row v-if="this.items.length">
    <v-col class="text-center">
      <v-btn>Browse more</v-btn>
    </v-col>
  </v-row>
  </v-container>
</div>
</template>

<script>



// models
import Station from '@/models/Station'
import PodcastPlayableBanner from './PodcastPlayableBanner.vue'

// init data
import stations from '@/data/stations'

export default {
  components: { PodcastPlayableBanner },
  data() {
    return {
      nowPlaying: null,
      items: [],
      popular: [],
      latest: [],
    }
  },
  fetchOnServer: true,
  async fetch () {
    const stationsInitData = await stations()
    await Station.create({ data: stationsInitData })
    const stations1 = await Station.query().get()
    this.station = stations1[0]
    if (this.station && this.station.podcast) {
      this.items = await this.$axios.get(this.station.podcast.url).then((res) => res.data.items);
    }
  },
  mounted() {
    this.fetchNowplaying();
  },
  methods: {
    isArchive(nowPlaying) {
      if (nowPlaying.filename?.indexOf('_LIVE_on_') != -1) {
        return true
      }
      return false;
    },
    fetchNowplaying() {
      if (!this.station) {
        throw 'station not ready'
      }
       this.$axios.get(this.station.nowplaying_url.url, { progress: false }).then((res) => {
        this.nowPlaying = res.data
      }).catch(err=> {});
    },
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
    popular() {
      let items = [...this.items?.sort((itema,itemb)=>itemb.id-itema.id)?.slice(0,77)];
      return items;
    },
  }
}
</script>

<style>

</style>