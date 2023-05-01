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
        <div>
          <v-col cols="12" class="text-center">
            <div class="twitch-panel">

              <div id="twitchDiv"></div>
              
              <div class="flying-emoji-outer-placement">
                <flying-emoji ref="FlyingEmoji" />
              </div>

              <div style="position:absolute; top: 65%; left: 0%; width: 100%; z-index: 999;" v-if="muted">
                <div class="large-play-button" style="  margin:auto;">
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
              <div class="twitch-bottom-bar" :class="(blackoutBottomBar) ? 'active' : ''">
                <v-toolbar dense flat style="background:transparent;" rounded>
                  <v-toolbar-items>
                      <v-btn small text v-if="playback!='Playing'" key="mdi-play" @click="play"><v-icon>mdi-play</v-icon></v-btn> 
                      <v-btn small text v-if="playback=='Playing'" key="mdi-stop" @click="stop"><v-icon>mdi-stop</v-icon></v-btn> 
                      <v-btn small text v-if="muted" key="mdi-volume" @click="unmute"><v-icon>mdi-volume-off</v-icon></v-btn> 
                      <v-btn small text v-if="!muted" key="mdi-volume-off" @click="mute"><v-icon>mdi-volume-high</v-icon></v-btn>
                  </v-toolbar-items>
                  <v-toolbar-items>
                      <v-menu :close-on-content-click="false" offset-x x-small >
                      <template v-slot:activator="{ on }">
                        <v-btn
                          text
                          small
                          dark
                          v-on="on"
                        >
                          <v-icon color="red">mdi-charity</v-icon>
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item><v-btn x-small text href="/donate"><v-icon  class="mr-2" color="red">mdi-charity</v-icon> Pledge</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text href="https://shop.dnbradio.com"><v-icon  class="mr-2" color="blue">mdi-tshirt-crew</v-icon> Shop</v-btn></v-list-item>
                        <v-list-item><v-btn x-small text href="https://patreon.com/dnbradio"><v-icon  class="mr-2" color="green">mdi-patreon</v-icon> Patreon</v-btn></v-list-item>

                      </v-list>
                    </v-menu>
                  </v-toolbar-items>
                  <v-toolbar-items>
                      <v-menu :close-on-content-click="true" offset-x x-small >
                      <template v-slot:activator="{ on }">
                        <v-btn
                          text
                          dark
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
                  <v-btn fab rounded small text title="React" @click="pushEmoji('🔥')"><big style="font-size:1.5em;">🔥</big></v-btn> 
                  <v-btn fab rounded small text title="React" @click="pushEmoji('💯 ')"><big style="font-size:1.5em;">💯 </big></v-btn> 
                  <!-- <v-btn fab rounded small text title="React" @click="pushEmoji('🖤 ')"><big> 🖤 </big></v-btn>  -->
                  
  <!-- 
                  <v-toolbar-items>
                      <v-menu :close-on-content-click="false" offset-x x-small >
                      <template v-slot:activator="{ on }">
                        <v-btn
                          text
                          x-small
                          dark
                          v-on="on"
                        >
                          <v-icon color="grey darken-3">mdi-discord</v-icon>
                        </v-btn>
                      </template>
                      <v-list>

                      </v-list>
                    </v-menu>
                  </v-toolbar-items> -->

                </v-toolbar>

              </div>
              <div class="twitch-overlay">
                <!-- <div class="twitch-title">[ Main Channel ]</div> -->
                <!-- <div class="twitch-subtitle-1">24/7 DnB Stream + Daily Live DJ Schedule</div> -->
                <div class="twitch-title"><big style="color: yellow; font-weight: 500;">{{listenerCount}} CURRENT LISTENERS</big></div>
                <div class="twitch-donations">
                  <strong style="color: yellow;">TOP DONATIONS</strong> 
                  <span  style="font-size: 11px;">
                    <donations />
                  </span>
                </div>
              </div>

            </div>
            
            
          </v-col>
        </div>
          
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
  props: ['station', 'hook'],
  components: { Donations, FlyingEmoji },
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
      this.player.play()
    },
    stop() {
      this.player.pause()
    },
    unmute() {
      this.player.setMuted(false);
    },
    mute() {
      this.player.setMuted(true);
    },
    fetchNowplaying() {
      if (!this.station) {
        throw 'station not ready'
      }
       this.$axios.get('' + this.station.nowplaying_url.url, { progress: false }).then((res) => {
        this.nowPlaying = res.data
      }).catch(err=> {});
    },
    pushEmoji(emoji) {
      this.$refs.FlyingEmoji.push(emoji);
    }
  },
  computed: {
    listenerCount() { 
      return this.nowPlaying?.listeners
    },
    playerState() { 
      return this?.player?.getPlayerState();
    },
    playback() {
      return this.playerState?.playback
    },
    volume() {
      return this.playerState?.volume
    },
    muted() {
      return this.playerState?.muted
    },
    paused() {
      return this.playerState?.playback == 'Idle'
    },
    currentTime() {
      return this.playerState?.currentTime
    },
    blackoutBottomBar() {
      return (this.currentTime < 5.2 || this?.playerState?.playback != 'Playing')  ? true : false
    }
  },
  watch: {
    hook() {
      this.stop()
    }
  },
  mounted() {
    this.$nextTick(()=> {
      this.fetchNowplaying();
      this.ready = true;
      setTimeout(() => {
        var options = {
          width: '811',
          height: '456',
          branding: false,
          showInfo: false,
          channel: "dnbradioofficial",
          autoplay: true,
          muted: true,
          // only needed if your site is also embedded on embed.example.com and othersite.example.com 
          //parent: ["www.dnbradio.com", "dnbradio.com"],
        };

        setTimeout(() => {
          try {
            this.player = new Twitch.Player("twitchDiv", options);
          } catch (e) {
            console.log(e.error);
          }
        }, 1200);
        //this.player.setMute(false);
        console.log(this.player);
        this.isPlaying = true
        //this.$refs.FlyingEmoji.push('❤️');
        
      }, 600)
      
    })
  }
}
</script>

<style>
  #twitchDiv iframe {   border-radius: 10px; pointer-events: none; }
  .twitch-panel { 
    width: 813px; 
    height: 458px;  
    margin: auto;
    margin-top: 20px;
    border-radius: 10px;
  }
  .twitch-bottom-bar { 
    text-align: right; bottom: 90px;
    width: 813px; position: absolute; 
    background: transparent; color: #fff; border-bottom: 3px; 
  }
 
  .twitch-bottom-bar.active {
    background: #000;
  }
  .twitch-overlay {  
    position:relative;
    top: -453px;
    left: 10px;
    padding: 10px;
    font-size: 14px;
    opacity: 0.9;  transition-delay: 250ms; transition-property:  opacity;
    color: #fff; background: #000;  
    width: 266px;  overflow-x: scroll;
    border-radius: 12px; 
  }
  .twitch-subtitle-1 {  margin-bottom: 10px; font-weight: 600; }
  .twitch-subtitle-2 {  font-weight: 600;  margin-bottom: 0px;  }
  .twitch-slide .v-sheet .row:hover .twitch-title-container { 
    opacity: 1;  
    transition-delay: 0ms; transition-property:  opacity; 
  }



</style>