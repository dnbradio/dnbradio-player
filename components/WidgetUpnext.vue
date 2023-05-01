<template>
<div>
  <div class="upnext" v-if="isJukebox==true && filteredData">
    <span v-if="data">
      <div class="upcoming" style="color: white;">
        <br /><small>NEXT UP</small><br />
        <span v-html="filteredData.host"></span>
        <span v-if="filteredData.location">({{ filteredData.location }})</span>
        <div style="text-transform:uppercase; font-size: 12px;"><small><v-icon style="font-size: 12px;">mdi-clock</v-icon> {{ filteredData.start | timeTil  }}</small></div>
      </div>
    </span>
  </div>
  <div class="upnext" v-else-if="nowplaying.songtype=='L'">
    <span v-if="data">
      <div class="upcoming" style="color: white;">
        <br /><small>NEXT UP</small><br />
        <span v-html="filteredData.host"></span>
        <span v-if="filteredData.location">({{ filteredData.location }})</span>
        <div style="text-transform:uppercase; font-size: 12px;"><small><v-icon style="font-size: 12px;">mdi-clock</v-icon> {{ filteredData.start | timeTil  }}</small></div>
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
    console.log(value);
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
      this.$axios.get('/api/events', {progress: false}).then((res) => {
        this.data = res.data;
      })
    },
    fetchNowplaying() {
      if (!this.station) {
        return null;
      }
      return this.$axios.get('/api/status', { progress: false }).then((res) => {

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
    getNearestDate(val, time, tz) {
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ];
      let ruleDay = days.findIndex(day=>day==val);
      const today = moment().isoWeekday();
      if (today <= ruleDay) {
        return moment().isoWeekday(ruleDay);
      } else {
        return moment().add(1, 'weeks').isoWeekday(ruleDay);
      }
    },
    getTimezoneOffset(timeZone, date = new Date()) {
      const tz = date.toLocaleString("en", {timeZone, timeStyle: "long"}).split(" ").slice(-1)[0];
      const dateString = date.toString();
      const offset = Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`);

      // return UTC offset in millis
      return offset / 1000 / 60 / 60;
    }
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
      let mappedData = this.data.map(item=>{
        let nearestTimeStartStr = this.getNearestDate(item.day).format('YYYY-MM-DD') + ' ' + item.startTime;
        let tzValue = this.getTimezoneOffset(item.tzRegion);
        let tzString = ((tzValue>=0) ? '+0' : '-0') + Math.abs(tzValue).toString() + '00';
        nearestTimeStartStr += tzString;
        let nearestTimeStart = moment.utc(nearestTimeStartStr);
        let nearestTimeEnd = moment(nearestTimeStart).add(item.lengthMinutes, 'minute').utcOffset(item.timezone)
        return { ...item, start: nearestTimeStart }
      });
      mappedData.sort((a,b)=>{
        return moment(a.start).diff(b.start);
      });
      let now = moment();
      let filteredData = mappedData.filter((item) => (item.start > now))
      return filteredData?.slice(0,1)?.[0];
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
  .upnext {  font-size: 10px; font-family: 'Roboto', sans-serif; text-align: right; font-weight: 300;  width: 100%; }
  .heading { font-size: 1em;}
  .artist { font-weight: 300; font-size: 1em; margin-top: 15px;}
  .title { font-size: 1em; font-weight: 100; }
  .upcoming { font-size: 16px; line-height: normal; font-weight: 500; opacity: 0.85; }
</style>