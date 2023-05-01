<template>
<div>
  <v-snackbar
    v-model="snackbar"
    :timeout="2000"
    centered
  >
    {{ snackMessage }}
  </v-snackbar>
  <v-snackbar v-model="snackShare" centered>
    https://dnbradio.com/ 

    <template v-slot:action="{ attrs }">
      <v-btn
        text
        v-bind="attrs"
        v-clipboard:success="showCopiedMessage" 
        v-clipboard:copy="'https://dnbradio.com/'"
      >
        Copy
      </v-btn>
      <v-btn
        text
        v-bind="attrs"
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
  <div class="twitch-slide" v-if="ready">
    <v-sheet
    :outlined="false"
      style="background-color: transparent !important; opacity: 1;"
      height="100%"
      width="100%"
      tile
    > 
      <v-row
        align="center"
        justify="center"
        no-gutters
      >
 
          <v-col cols="12">
            <v-card class="youtube-panel mt-0 text-center" color="transparent">
              <v-card-subtitle class="pb-0">
                <center color="white"><small>STATION</small></center>
                <h1 style="font-size:14px; color:white;">{{ station.title }}</h1>
                <h2 style="font-size:14px; color:white;">{{ station.subtitle }}</h2>
                <p style="font-size:12px; color:white;">{{ station.description }}</p>
              </v-card-subtitle>
              <div :id="`yt${this.station.id}`"></div>
            </v-card>
          </v-col>
 
          
      </v-row>
    </v-sheet>

  </div>
</div>
</template>

<script>
import Vue from 'vue'

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import Donations from '~/components/Donations.vue';
import FlyingEmoji from '~/components/FlyingEmoji.vue';

export default {

  components: { Donations, FlyingEmoji },
  props: [ 'station', 'hook' ],
  data() {
    return {
      snackbar: false,
      snackMessage: null,
      snackShare: false,
      player: null,
      ready: false,
      nowPlaying: null
    }
  },
  methods: {
    showCopiedMessage() {
      this.showSnack('Copied!');
    },
    showSnack(message) {
      this.snackShare = false
      this.snackMessage = message;
      this.snackbar = true;
    },
    play() {
      this.player?.playVideo()
    },
    stop() {
      this.player?.stopVideo()
    },
    unmute() {
      this.player.setMuted(false);
    },
    mute() {
      this.player.setMuted(true);
    },
    onPlayerReady() {

    },
    onPlayerStateChange() {

    }
  },
  computed: {
    videoId() {
      return this?.station?.streams?.find(item=>item.type=='youtube')?.id
    }
  },
  watch: {
    hook() {
      this.stop()
    }
  },
  mounted() {
    this.$nextTick(()=> {
      this.ready = true;
      setTimeout(() => {
        this.player = new YT.Player(`yt${this.station.id}`, {
            height: '400',
            width: '727',
            videoId: this.videoId,
            playerVars: {
              playsinline: 1,
              autoplay: 1,
              controls: 1,
              enablejsapi: 1,
              modestbranding: 1,
              rel: 0
            },
            events: {
              'onReady': this.onPlayerReady,
              'onStateChange': this.onPlayerStateChange
            }
          });
      }, 1400)
      
    })
  }
}
</script>

<style>
 
  .youtube-panel iframe { box-shadow: none; border:0px; border-radius: 10px; }
  .youtube-panel { box-shadow: none !important; border:0px; }

</style>