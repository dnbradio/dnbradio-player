<template>
<div class="listeners">
  <div class="text-center" v-if="nowplaying.listeners">{{ nowplaying.listeners }} LISTENERS</div>
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
      nowplaying: {
        artist: null,
        title: null,
        listeners: null,
        albumyear: null,
        album: null,
        song_type: null,
        label: null
      },
    }
  },
  methods: {
    fetchNowplaying() {
      if (!this.station) {
        return null;
      }
      return this.$axios.get(this.station.nowplaying_url.url, { progress: false }).then((res) => {

        switch (this.station.nowplaying_url.type)
        {
          case 'azuracast':
            this.nowplaying = {
              artist: res.data.now_playing.streamer_name ?? res.data.now_playing.song.artist,
              title: res.data.now_playing.song.title,
              listeners: res.data.listeners.current,
              albumyear: null,
              album: res.data.now_playing.song.album,
              song_type: '',
              label: null
            };
          break;
          case 'sam':
            this.nowplaying = res.data
          break;
          case 'shoutcast':
            let d = res.data.replace(/(<([^>]+)>)/ig,"").split(',')
            let rejoin = null
            if (d[8]) {
              rejoin = d[6] + ', ' + d[7] + ', ' + d[8]
            } else if (d[7]) {
              rejoin = d[6] + ', ' + d[7]
            } else {
              rejoin = d[6]
            }
            let parts = rejoin.split(' - ')
            let artist = parts[0];
            let title = parts[1] || parts[1];
            let data = { listeners: d[0], status: d[1], peak: d[2], max: d[3], reported: d[4], bitrate: d[5], artist: artist, title: title }
            this.nowplaying.artist = data.artist
            this.nowplaying.title = data.title
            this.nowplaying.listeners = data.listeners
            this.nowplaying.albumyear = null
            this.nowplaying.album = null
            this.nowplaying.song_type = ''
            this.nowplaying.label = null
          break;
        }

      })
    },
  },
  computed: {
    currenStationIndex() {
      return (this.$route.params && this.$route.params.stationId) ? this.$route.params.stationId : 1
    },
    stations() {
      return Station.query().get()
    },
    station() {
      let index = this.currenStationIndex || 1
      return this.stations.filter((item) => item.id == index)[0]
    },
    artist() {
      return (this.nowplaying) ? this.nowplaying.artist : null
    },
    title() {
      return (this.nowplaying) ? this.nowplaying.title : null
    },
    albumyear() {
      return (this.nowplaying) ? this.nowplaying.album_year : null
    },
    song_type() {
      return (this.nowplaying) ? this.nowplaying.song_type : null
    },
    label() {
      return (this.nowplaying) ? this.nowplaying.label : null
    },
    listeners() {
      return (this.nowplaying) ? this.nowplaying.listeners : null
    },
  },
  async mounted() {
    const stationsInitData = await stations()
    //console.log('stationsInitData', stationsInitData)
    Station.create({ data: stationsInitData })
    this.fetchNowplaying()
    setInterval(() => {
      this.fetchNowplaying()
    },60000)
  }
}
</script>
<style scoped>
  .listeners {  font-family: 'Roboto', sans-serif; text-align:center; font-weight: 600; font-size: 1.9em; }
</style>