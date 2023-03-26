<template>
<div>
  <div class="upnext" v-if="isJukebox==true && filteredData">
    <span v-if="data">
      <div class="upcoming">
        <br />NEXT LIVE SHOW<br />
        <span v-html="filteredData.host"></span>
        <span v-if="filteredData.location">({{ filteredData.location }})</span>
        <div style="text-transform:uppercase;">STARTS {{ filteredData.start | timeTil  }}</div>
      </div>
    </span>
  </div>
  <div class="upnext" v-else-if="nowplaying.song_type=='L'">
    <span v-if="data">
      <div class="upcoming">
        <br />UP NEXT<br />
        <span v-html="filteredData.host"></span>
        <span v-if="filteredData.location">({{ filteredData.location }})</span>
        <div style="text-transform:uppercase;">STARTS {{ filteredData.start | timeTil  }}</div>
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
        label: null
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
          case 'sam':
            this.nowplaying = res.data
            this.nowplaying.title = this.nowplaying.title.replace('(Original Title)', '')
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
      if (this.nowplaying.song_type != 'L') {
        return true
      }
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