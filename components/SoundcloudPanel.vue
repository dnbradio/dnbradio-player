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
  <div class="soundcloud-slide" v-if="ready">
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
            <iframe width="100%" height="200" v-if="recording && recording.soundcloud_id" scrolling="no" frameborder="no" allow="autoplay" :src="`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${recording.soundcloud_id}&color=%23000000&show_playcount=true&auto_play=false&hide_related=truee&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`"></iframe>
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
  props: [ 'hook', 'recording' ],
  data() {
    return {
      widget: null,
      snackbar: false,
      snackMessage: null,
      snackShare: false,
      player: null,
      ready: true,
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
    tracklist() {
      return this.recording.tracklist.split('\n');
    }
  },
  watch: {
    hook() {
      this.stop()
    }
  },
  mounted() {
    this.$nextTick(()=> {
      // this.ready = true;
      // setTimeout(() => {
      //   var widgetIframe = document.getElementById('sc-widget');
      //   console.log(widgetIframe);
      //   this.widget = SC.Widget(widgetIframe);
      //   this.widget.bind(SC.Widget.Events.READY, function() {
      //     this.widget.bind(SC.Widget.Events.FINISH, function() {
      //       //
      //     });
      //   });
      //   if (!this?.recording?.soundcloud_id) { return; }
      //   this.widget.load(`https://api.soundcloud.com/tracks/${this?.recording?.soundcloud_id}`, {
      //     show_artwork: true
      //   });
      // }, 1800);
    })
  }
}
</script>

<style>
 
  .youtube-panel iframe { box-shadow: none; border:0px; border-radius: 10px; }
  .youtube-panel { box-shadow: none !important; border:0px; }

</style>