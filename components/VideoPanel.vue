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
  <div style="min-height:1000px;">
  <div class="video-slide">
    <v-sheet
      style="background-color: transparent !important; opacity: 1;"
      height="100%"
      width="100%"
      tile
    >

        <div>
            <div class="video-panel">

              <video
                v-if="selectedSrc"
                class="video-js"
                id="videojs-player"
                ref="videoPlayer"></video>

              <div class="flying-emoji-outer-placement">
                <flying-emoji ref="FlyingEmoji" />
              </div>
              <div style="position:absolute; top: 45%; left: 0%; width: 100%; z-index: 9999;" class="muteButtonOverlay" v-if="selectedChannel && selectedChannel.channelId == 'main' && selectedContext=='preview' && !initiatedFirstPlay">
                <div class="large-play-button"    style=" margin:auto; width: 200px;">
                  <v-btn dark color="black" @click="playPreviewAudio">
                    <v-icon>mdi-volume-off</v-icon>
                    Click to start audio
                  </v-btn>
                </div>
              </div>
              <div style="position:absolute; top: 45%; left: 0%; width: 100%; z-index: 9999;" class="muteButtonOverlay" v-else-if="muted">
                <div class="large-play-button" style="max-width: 220px; margin:auto;">
                  <v-btn dark color="black" @click="unmute">
                    <v-icon>mdi-volume-off</v-icon>
                    Click to un-mute
                  </v-btn>
                </div>
              </div>
              <div style="position:absolute; top: 39%;  width: 813px; margin: auto; z-index: 999; height: 95px;" v-if="paused">
                <div class="large-play-button" style="margin:auto;">
                  <v-btn text color="transparent" @click="play" style="width: 90px; height: 90px; box-shadow: none; background: transparent;"></v-btn>
                </div>
              </div>
              <div style="position:absolute; top: 39%;  width: 813px; margin: auto; z-index: 999; height: 95px;" v-if="playback=='Playing'">
                <div class="large-play-button" style="margin:auto;">
                  <v-btn text color="transparent" @click="stop" style="width: 90px; height: 90px; box-shadow: none; background: transparent;"></v-btn>
                </div>
              </div>

              <div class="video-bottom-bar" :class="(blackoutBottomBar) ? 'active' : ''">
                <v-toolbar dense flat style="background:transparent;" rounded dark>
                  <v-toolbar-items>
                    <!-- PLAY -->
                    <v-btn small text v-if="playback!='Playing'" key="mdi-play" @click="play"><v-icon>mdi-play</v-icon></v-btn>
                    <v-btn small text v-if="playback=='Playing'" key="mdi-stop" @click="stop"><v-icon>mdi-stop</v-icon></v-btn>

                    <!-- VOL -->
                    <v-btn small text v-if="muted" key="mdi-volume" @click="unmute"><v-icon>mdi-volume-off</v-icon></v-btn>
                    <v-btn small text v-if="!muted" key="mdi-volume-off" @click="mute"><v-icon>mdi-volume-high</v-icon></v-btn>

                    <!-- VIDEO -->
                    <!-- <v-btn v-if="selectedChannel && selectedChannel.channelId=='main' && selectedContext=='preview'" small text key="mdi-animation" @click="changeChannel('main', 'main')"><v-icon>mdi-video</v-icon></v-btn>
                    <v-btn v-else small text key="mdi-video-minus" @click="changeChannel('main', 'preview')"><v-icon>mdi-video-off</v-icon></v-btn> -->

                  </v-toolbar-items>
                  <v-toolbar-items>
                      <v-menu :close-on-content-click="false" offset-x x-small >
                      <template v-slot:activator="{ on }">
                        <v-btn
                          text
                          small
                          v-on="on"
                        >
                          <v-icon color="red">mdi-charity</v-icon>
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item><v-btn x-small text href="/donate"><v-icon  class="mr-2" color="red">mdi-charity</v-icon> Pledge</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text href="https://shop.dnbradio.com"><v-icon  class="mr-2" color="blue">mdi-tshirt-crew</v-icon> Shop</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text href="https://patreon.com/dnbradio" target="_blank"><v-icon  class="mr-2" color="green">mdi-patreon</v-icon> Patreon</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text @click="changeChannel('main', 'main')">switch to main</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text @click="changeChannel('twitch', 'main')">switch to plush</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text @click="changeChannel('section8recs', 'main')">switch to section8</v-btn></v-list-item>
                      </v-list>
                    </v-menu>
                  </v-toolbar-items>

                  <v-toolbar-items>
                      <v-menu :close-on-content-click="true" offset-x x-small dark>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          text
                          class="theme--dark"
                          v-on="on"
                        >
                          <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item v-if="$device.isDesktop"><v-btn x-small text title="Popout player" color="yellow" @click="launchPopupPlayer" ><v-icon class="mr-1">mdi-open-in-new</v-icon> Web player</v-btn></v-list-item>
                        <v-list-item>
                          <v-btn x-small text title="Share" color="grey" @click="snackShare=true"><v-icon class="mr-2">mdi-share</v-icon> Share</v-btn>
                        </v-list-item>
                        <v-divider />
                        <v-list-item><v-btn x-small text href="/sets" title="Browse" color="white"><v-icon class="mr-2">mdi-library</v-icon>  Browse..</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text href="/schedule" color="white"><v-icon class="mr-2">mdi-calendar</v-icon> Schedule</v-btn></v-list-item>
                        <!-- <v-list-item><v-btn x-small text href="/sets" color="white"><v-icon class="mr-2">mdi-music-box-multiple-outline</v-icon> Archive</v-btn></v-list-item> -->
                        <v-list-item><v-btn href="/chat" x-small text title="Discord"><v-icon class="mr-2" color="#5865F2">mdi-discord</v-icon> Discord / IRC</v-btn></v-list-item>
                        <!-- <v-divider />
                        <v-list-item><v-btn x-small text href="/about"><v-icon class="mr-2" color="red">mdi-charity</v-icon> About Us</v-btn></v-list-item> -->

                        <!-- <v-list-item><v-btn x-small text href="/channels" color="grey"><v-icon class="mr-2">mdi-broadcast</v-icon> Other channels</v-btn></v-list-item> -->
                      </v-list>
                    </v-menu>
                  </v-toolbar-items>

                  <v-spacer></v-spacer>
                  <v-btn fab rounded small text v-if="pictureInPictureEnabled" title="Picture in picture" @click="pip"><v-icon>mdi-picture-in-picture-bottom-right-outline</v-icon></v-btn>
                  <v-btn fab rounded small text v-if="fullscreenEnabled" title="Fullscreen" @click="fullscreen"><v-icon>mdi-fullscreen</v-icon></v-btn>
                  <v-btn fab rounded small text title="React" @click="pushEmoji('🔥')"><big style="font-size:1.5em;">🔥</big></v-btn>
                  <v-btn fab rounded small text title="React" @click="pushEmoji('💯 ')"><big style="font-size:1.5em;">💯 </big></v-btn>
                  <!-- <v-btn fab rounded small text title="React" @click="pushEmoji('🖤 ')"><big> 🖤 </big></v-btn>  -->


                </v-toolbar>
              </div>


              <div :class="overlayClassModifier" class="video-overlay" v-show="!hidePlayerOverlays">
                <v-row>
                  <v-col :cols="3">
                    <div>
                      <div style="text-align: right; position: relative; top: 10px; z-index: 9999">
                        <v-btn dark @click="toggleHideOverlay" v-if="!hideOverlay" x-small text key="up"><v-icon>mdi-chevron-up</v-icon></v-btn>
                        <v-btn dark @click="toggleHideOverlay" v-if="hideOverlay" x-small text key="down"><v-icon>mdi-chevron-down</v-icon></v-btn>
                      </div>
                      <div class="video-overlay-inner" v-if="showOverlay">
                        <div class="video-title" style="margin-top:0px;">
                          <v-row>
                            <v-col :cols="12" style="line-height: 22px;">
                              <div style="color: white; font-size: 1.5em;">
                                {{listenerCount}} TUNED IN
                              </div>
                            </v-col>
                          </v-row>
                        </div>
                        <div class="video-donations" style="margin-top:10px;">
                          <span style="font-size: 10px;">
                            <donations />
                          </span>
                        </div>
                      </div>
                    </div>
                  </v-col>
                  <v-col :cols="9">
                    <div style="text-align: right; margin-top:50px; line-height: normal; padding-right: 15px;"
                    v-if="nowPlaying && showTitleDetails">
                      <h1 style="font-size:14px; opacity: 0.95; color: #fff;">
                        <big v-if="nowPlaying.songtype=='L'"><small><v-icon class="blink_me" style="font-size: 12px;">mdi-circle</v-icon> LIVE NOW</small></big>
                        <span v-if="nowPlaying && nowPlaying.songtype=='S'"><small><v-icon class="blink_me" style="font-size: 12px;">mdi-circle</v-icon> NOW PLAYING</small></span>
                        <br />
                        <strong>
                          {{ nowPlaying.artist }} - {{ nowPlaying.title }}
                        </strong>
                        <span v-if="isArchive(nowPlaying)">[ARCHIVE]</span>
                        <span style="font-size:12px;" v-if="nowPlaying.album || nowPlaying.albumyear">
                          <br />
                          <span v-if="nowPlaying.album">on {{ nowPlaying.album }}</span>
                          <span v-if="nowPlaying.albumyear"> ({{ nowPlaying.albumyear }})</span>
                        </span>
                        <span style="font-size: 10px;">
                          <v-icon  style="font-size: 12px;">mdi-eye</v-icon> {{listenerCount}}
                        </span>
                      </h1>

                      <widget-upnext />
                    </div>
                  </v-col>
                </v-row>
              </div>

            </div>



        </div>


    </v-sheet>

  </div>
  </div>
</div>
</template>

<script>
import Vue from 'vue'

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import Donations from '~/components/Donations.vue';
import FlyingEmoji from '~/components/FlyingEmoji.vue';
import WidgetUpnext from '~/components/WidgetUpnext.vue';

import videojs from 'video.js';
import videojsYoutube from 'videojs-youtube';

export default {
  props: ['station', 'hook'],
  components: { Donations, FlyingEmoji, WidgetUpnext },
  data() {
    return {
      inFullscreenMode: false,
      inPipMode: false,
      nowPlaying: { songtype: 'L', artist: 'Triad & Synth Sense', title: 'Past Preent', albumyear: 2011, album: 'Dream Thief 2' },
      initiatedFirstPlay: false,
      hideOverlay: false,
      selectedChannel: null,
      selectedContext: null,
      channels: [
      {
        channelId: 'main',
        sources: [
          {
            context: 'preview-audio',
            type: 'audio/mp3',
            src: 'https://source.dnbradio.com/main.mp3',
            showOverlay: true,
            showTitleDetails: true,
          },
          {
            context: 'preview',
            type: 'video/mp4',
            src: '/bgs/dnbradio-tape-bg-grained.mp4',
            showOverlay: true,
            showTitleDetails: true,
          }, {
            context: 'main',
            type: "application/x-mpegURL",
            src: "https://customer-ucajlv5ibybbaj9c.cloudflarestream.com/a5bf326d4586dcbca6551edd70af84ca/manifest/video.m3u8",
            showOverlay: true,
            showTitleDetails: false,
          }
        ]
      }, {
        channelId: 'plush',
        sources: [
          {
            context: 'main',
            type: "video/youtube",
            src: "https://www.youtube.com/watch?v=8gAG4fpJHq8",
            showOverlay: false,
            showTitleDetails: false,
          }
        ]
      }, {
        channelId: 'twitch',
        sources: [
          {
            context: 'main',
            type: "application/x-mpegURL",
            src: "",
            showOverlay: false,
            showTitleDetails: false,
          }
        ]
      }, {
        channelId: 'section8recs',
        sources: [
          {
            context: 'main',
            type: 'video/youtube',
            src: 'https://www.youtube.com/watch?v=RbVocQpvpLg',
            showOverlay: false,
            showTitleDetails: false,
          }
        ]
      }],
      liveVideoPlaying: false,
      snackbar: false,
      snackMessage: null,
      snackShare: false,
      playback: 'Idle',
      player: null,
      ready: false,
      muted: true,
      paused: true,
      nowPlaying: null,
      videoOptions: {
        autoplay: true,
        loop: true,
        muted: true,
        preload: "auto",
        controls: false,
        techOrder: ["html5", "youtube"],
        poster: "/bgs/dnbradio-tape-bg-grained.gif",
        youtube: {
          playsinline: 1,
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          modestbranding: 1,
          rel: 0
        }
      }
    }
  },
  beforeDestroy() {
    if (this.player) {
      //this.player.dispose();
    }
  },
  methods: {
    async pip() {
      if (!this.player) {
        console.log('this.player not set');
        return;
      }
      if (this.player.isInPictureInPicture()) {
        this.player.exitPictureInPicture().then(()=> {
        }).catch(()=> {
          this.inPipMode = false;
        });
        return;
      }
      if (!this.player.requestPictureInPicture) {
        console.log('this.player does not support requestPictureInPicture');
        return;
      }
      this.pipAutoPlay();
      this.player.requestPictureInPicture().then(()=> {
      }).catch(()=> {
        this.inPipMode = false;
      });
    },
    pipAutoPlay() {
      if (this.selectedSrc.context == 'preview') {
        this.unmute();
        this.playPreviewAudio();
      } else if (this.selectedSrc.context == 'main') {
        this.unmute();
        this.playVideo();
      }
    },
    fsAutoPlay() {
      if (this.selectedSrc.context == 'preview') {
        this.unmute();
        this.playPreviewAudio();
      } else if (this.selectedSrc.context == 'main') {
        this.unmute();
        this.playVideo();
      }
    },
    async fullscreen() {

      if (!this.player) {
        console.log('this.player not set');
        return;
      }
      if (!this.player.requestFullscreen) {
        console.log('this.player does not support requestFullscreen');
        return;
      }
      this.fsAutoPlay();
      await this.player.requestFullscreen().then(()=> {
      }).catch(()=> {
        this.inFullscreenMode = false;
      });
    },
    isArchive() {
      return this.nowPlaying?.album == 'DNBRadio Podcast' ?? false;
    },
    playPreviewAudio() {
      this.initiatedFirstPlay = true
      this.unmute();
      let source = this.selectedChannel?.sources?.find((item)=>item.context=='preview-audio')
      if (!source) {
        console.error('playPreviewAudio source not found');
        return;
      }
      this.$sound = this.$media.audio({src: [source.src], type: source.type}, {
        loop: true,
        volume: 1,
        autoplay: true,
        poster: this.cover
      })
      //this.attachListeners();
    },
    toggleHideOverlay() {
      this.hideOverlay = !this.hideOverlay
    },
    changeChannel(channelId, context) {
      if (context=='main' && this.$sound) {
        this.$sound.pause();
      }
      if (context=='preview' && this.$sound) {
        this.$sound.load();
        //this.$sound.play();
      }
      let channel = this.channels.find(item=>item.channelId==channelId);
      if (!channel) {
        this.$dialog.message.error('Invalid channel');
        return;
      }
      this.selectedChannel = channel;
      this.selectedContext = channel.sources.find(item=>item.context==(context || 'preview')).context ?? 'main';
      this.playVideo(true);
    },
    playVideo(force) {
      try {
        if (!this.selectedSrc) {
          console.error('no selectedSrc!');
        }
        if (this.player && force) {
          this.player.src({ type: this.selectedSrc.type, src: this.selectedSrc.src });
          this.player.play();
          return;
        }

        this.videoOptions.sources = [{src: this.selectedSrc.src, type:  this.selectedSrc.type}];
        let that = this;
        this.player = videojs(this.$refs.videoPlayer, this.videoOptions, function onPlayerReady() {
          videojs.log('Your player is ready!');
          this.on('playing', function() {
            console.log('Playing');
            that.playback = 'Playing'
          });
          this.on('pause', function() {
            that.playback = 'Idle'
          });
          this.on('ended', function() {
            that.playback = 'Idle'
          });
          this.on('suspend', function() {
            that.playback = 'Idle'
          });
          this.on('stalled', function() {
            that.playback = 'Idle'
          });
          this.on('enterpictureinpicture', (val)=>{
            that.inPipMode = true;
            console.log('enterpictureinpicture');
          });
          this.on('leavepictureinpicture', (val)=>{
            that.inPipMode = false;
            console.log('leavepictureinpicture');
          });
          console.log(this.player);
          that.play();
        });
      } catch (e) {
        console.log('mounted() ERROR', e);
      }
      //this.player.setMute(false);

      this.isPlaying = true
      //this.$refs.FlyingEmoji.push('❤️');
    },
    showCopiedMessage() {
      this.showSnack('Copied!');
    },
    showSnack(message) {
      this.snackShare = false
      this.snackMessage = message;
      this.snackbar = true;
    },
    launchPopupPlayer() {
      this.stop();
      var windowopen;
      if (windowopen == true) {
        wind.focus();
        return true;
      } else {
        let width = 502;
        let height = 765;
        if ((window.innerHeight==height||window.outerHeight==height) && (window.innerWidth==width||window.outerWidth==width)) {
          return false;
        }
        var props = "width="+width+",height="+height+",left=25,top=25,screenX=100,screenY=100,resizable=0,scrollbars=0,toolbar=no,location=no,status=no,menubar=no,copyhistory=no,directories=no,statusbar=no";
        var wind = window.open('https://dnbradio.com/player', "formPopup", props);
        var windopen = true;
        return true;
      }
    },
    play() {
      if (this.playback=='Playing') {
        return;
      }
      this.player.play()
      if (this.initiatedFirstPlay && this.$sound && this.selectedContext == 'preview') {
        this.$sound.play()
      }
    },
    stop() {
      this.player.pause()
      if (this.initiatedFirstPlay && this.$sound && this.selectedContext == 'preview') {
        this.$sound.pause()
      }
    },
    unmute() {
      this.player.muted(false);
      this.muted = false;
      if (this.initiatedFirstPlay && this.$sound && this.selectedContext == 'preview') {
        this.$sound.volume = 1
      }
    },
    mute() {
      this.player.muted(true);
      this.muted = true;
      if (this.initiatedFirstPlay && this.$sound && this.selectedContext == 'preview') {
        this.$sound.volume = 0
      }
    },
    fetchNowplaying() {
      if (!this.station) {
        console.log('no station');
      }
      if (this.station) {
        this.$axios.get(this.station.nowplaying_url.url, { progress: false }).then((res) => {
          console.log('adfasdf', res.data);
          this.nowPlaying = res.data
        }).catch(err=> {});
      }
    },
    pushEmoji(emoji) {
      this.$refs.FlyingEmoji.push(emoji);
    }
  },
  computed: {
    hidePlayerOverlays() {
      if (this.inPipMode || this.inFullscreenMode) {
        return true;
      } else {
        return false
      }
    },
    pictureInPictureEnabled() {
      if (typeof document == undefined) { return false; }
      return document?.pictureInPictureEnabled
    },
    fullscreenEnabled() {
      if (typeof document == undefined) { return false; }
      return document?.fullscreenEnabled
    },
    showTitleDetails() {
      return this.selectedSrc?.showTitleDetails ?? false
    },
    overlayClassModifier() {
      if (this.selectedContext=='main') {
        return 'widenOverlay'
      }
    },
    selectedSrc() {
      if (!this.selectedChannel || !this.selectedContext) { return; }
      return this.selectedChannel?.sources?.find(item=>item.context==this.selectedContext)
    },
    showOverlay() {
      if (this.hideOverlay==true) {
        return false;
      }
      if (this.selectedSrc == null) {
        return false;
      }
      return this.selectedSrc?.showOverlay ?? false;
    },
    listenerCount() {
      return this.nowPlaying?.listeners
    },
    volume() {
      return this.player?.volume()
    },
    blackoutBottomBar() {
      return false;
    }
  },
  watch: {
    hook() {
      this.stop()
    }
  },
  mounted() {
    this.ready = true;
    this.$nextTick(()=> {
      this.fetchNowplaying();
      this.selectedChannel = this.channels.find((item)=>item.channelId=='main')
      this.selectedContext = 'preview'
      setTimeout(()=> {
        this.playVideo();
      }, 1200);
      this.playback = 'Idle';
    })
  }
}
</script>

<style>
  #videoDiv iframe { pointer-events: none; }
  .video-panel {
    height: 460px;
    margin: auto;
  }
  .video-bottom-bar {
    opacity: 0;
    text-align: right; bottom: 47px;
    width: 100%; position: relative;  z-index:100;
    background: rgba(0,0,0,.20); color: #fff; border-bottom: 3px;
  }
  .video-panel:hover .video-bottom-bar {
    opacity: 1;
  }

  .video-bottom-bar.active {
    background: #000;
  }
  .video-overlay {
    position:relative;
    top: -450px;
    left: 7px;
    padding-top: 10px;
    font-size: 14px;
    min-height: 100px;
    margin-top: 15px;
  }
  .video-overlay-inner {
    padding-bottom: 15px;
    padding-left: 10px;
    max-width: 250px;
    opacity: 0.9;  transition-delay: 250ms; transition-property:  opacity;
    color: #fff; background-color: rgba(0,0,0,0.4); z-index: 5;
  }
  .widenOverlay .video-overlay-inner {
    max-width: 300px;
  }
  .widenOverlay .video-overlay-inner {
    background-color: rgba(0,0,0,1);
  }
  .video-subtitle-1 {  margin-bottom: 10px; font-weight: 600; }
  .video-subtitle-2 {  font-weight: 600;  margin-bottom: 0px;  }
  .video-slide .v-sheet .row:hover .twitch-title-container {
    opacity: 1;
    transition-delay: 0ms; transition-property:  opacity;
  }
  #videojs-player { width: 100%; height: 100%; }
  .video-panel .muteButtonOverlay { opacity: 0; }
  .video-panel:hover .muteButtonOverlay { opacity: 1; }
  .v-carousel__controls { bottom: 0px !important; }

.blink_me {
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>