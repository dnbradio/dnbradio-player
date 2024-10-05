<template>
<div>
  <div class="upnext" v-if="isJukebox==true && nowplaying">
    <div class="heading">PLAYLIST ROTATION</div>
    <span v-if="data">
      <div>
        <span class="artist" style="text-transform: uppercase;" v-html="nowplaying.artist"></span>
        <br /><span  class="title" v-html="nowplaying.title"></span>
      </div>
    </span>
  </div>
  <div class="upnext" v-else-if="nowplaying.song_type=='L'">
    <div class="heading">LIVE NOW</div>
    <span v-if="data">
      <div>
        <span class="artist" style="text-transform: uppercase;" v-html="nowplaying.artist"></span>
        <br /><span  class="title" v-html="nowplaying.title"></span>
      </div>
    </span>
  </div>
</div>
</template>

<script>
import moment from 'moment-timezone'
import Vue from 'vue'
Vue.filter('timeTil', function(value) {
  if (value) {
    return moment(value).fromNow();
  }
});


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
      data: null,
      nowplaying: {
        artist: null,
        title: null,
        listeners: null,
        albumyear: null,
        album: null,
        song_type: '',
        label: null,
        streamer: null
      },
    }
  },
  methods: {
    fetchData() {
      this.$axios.get(this.station.schedule.url, {progress: false}).then((res) => {
        this.data = res.data;
      })
    },
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
              song_type: res.data.now_playing.streamer_name ? 'L' : 'S',
              label: null
            };
          break;
          case 'sam':
            this.nowplaying = res.data
            this.nowplaying.title = this.nowplaying.title.replace('(Original Title)', '')
          break;
          case 'icecast':
            let titleParts = res.data.icestats.source.title.split(' - ')
            this.nowplaying.artist = titleParts[0]
            this.nowplaying.title = titleParts[1]
            this.nowplaying.listeners = res.data.icestats.source.listeners
            this.nowplaying.albumyear = null
            this.nowplaying.album = null
            this.nowplaying.song_type = 'S'
            this.nowplaying.label = null
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
            this.nowplaying.title = data.title.replace('(Original Title)', '')
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
    isJukebox() {
      if (this.nowplaying.streamer) {
        return false
      }
      return true
    },
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
    filteredData() {
      if (!this.data || !this.data.filter) {
        return;
      }
      return this.data
      .filter((item) => {
        var end = moment.utc({ hour:23, minute:59, second:59 }).add(1, 'days');
        var start = moment.utc();
        let ostart = moment.utc(item.start)
        return ostart > start
      })
      .slice(0,1)[0];
    }
  },
  async mounted() {
    const stationsInitData = await stations()
    Station.create({ data: stationsInitData })

    this.fetchData()
    setInterval(() => {
      this.fetchData();
    }, 60000);

    this.fetchNowplaying()
    setInterval(() => {
      this.fetchNowplaying()
    },10000)
  }
}
</script>
<style scoped>
  .upnext {  font-size:12px; font-family: 'Roboto', sans-serif; text-align:center; font-weight: 600;  width: 100%; }
  .heading { font-size: 1.4em;}
  .artist { font-weight: 600; font-size: 2.4em; margin-top: 15px;}
  .title { font-size: 1.8em; font-weight: 100; }
  .upcoming { font-size: 1.6em; }
</style>