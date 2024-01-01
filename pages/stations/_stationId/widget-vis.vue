<template>
<div class="vis" @click="play">
  <v-row>
    <v-col cols="2">
      <v-img
        :src="cover"
        aspect-ratio="1"
        style="background-color: transparent;"
      ></v-img>
    </v-col>
    <v-col cols="10">
    <av-bars
      class="av-bars"
      caps-color="#efefef"
      :bar-color="['#fff', '#fff', '#fff']"
      canv-fill-color=""
      :caps-height="6"
      :bar-width="5"
      :canv-height="50"
      :corsAnonym="true"
      audio-src="https://source.dnbradio.com/stream.mp3"></av-bars>
      <div v-if="nowplaying.song_type=='L'">
        <div><small>LIVE DJ</small></div>
        <div class="artist" v-html="artist">
        </div>
        <div class="title" v-html="title">
        </div>
      </div>
      <div v-else>
        <div><small>PLAYLIST ROTATION</small></div>
        <div class="artist" v-html="artist">
        </div>
        <div class="title" v-html="title">
        </div>
      </div>
    </v-col>
  </v-row>
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
import Vue from 'vue'

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
      cover: 'https://dnbradio.com/img/logotags.png',
      data: [],
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
    play() {
      let audio = document.querySelector('.av-bars audio');
      audio.play();
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
              song_type: '',
              label: null
            };
          break;
          case 'sam':
            this.nowplaying = res.data
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
  async mounted() {
    const stationsInitData = await stations()
    Station.create({ data: stationsInitData })
    this.$nextTick(() => {
      this.play();
      this.fetchNowplaying()
      setInterval(() => {
        this.fetchNowplaying()
      },10000)
    })
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
  }
}
</script>
<style>
  .av-bars audio { position:fixed; left: -999999px; }
</style>
<style scoped>
  .vis {  font-family: 'Roboto', sans-serif;  }
  .artist { font-size:1.8em; text-transform: uppercase; font-weight: 600;}
  .title { font-size: 1.5em; font-weight: 100; }
  .av-bars { margin-top: 30px;}
</style>
