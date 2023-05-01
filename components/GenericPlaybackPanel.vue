<template>
<div>
  <div style="background-image: url(https://dnbradio.com/assets/swframework/kool_k_show_2__37.jpg); background-size: cover; background-position: 50% 50%; height: 100%; width: 100%; overflow: hidden;">
    <video class="vjs-tech" id="video_html5_api" style="background-image: url('/assets/swframework/kool_k_show_2__37.jpg'); height: 100%; min-height:301px; background-size: cover; background-position: 50% 50%;" poster="https://dnbradio.com/img/blank.gif" preload="none">
		<source src="https://dnbradio.com/podcast/dl/livesets/Kool_K._LIVE_on_DNBRADIO.COM_20220329_2056_-_The_Kool_K_show_45.mp3" type="audio/mpeg">	</video>
  </div>
</div>
</template>

<script>
import Vue from 'vue'

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import Donations from '~/components/Donations.vue';
import FlyingEmoji from '~/components/FlyingEmoji.vue';
// import GenericPlaybackPlayer from '~/components/GenericPlaybackPlayer.vue';
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
      
    })
  }
}
</script>

<style>
 
  .youtube-panel iframe { box-shadow: none; border:0px; border-radius: 10px; }
  .youtube-panel { box-shadow: none !important; border:0px; }

</style>