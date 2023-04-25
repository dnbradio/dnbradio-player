<template>
  <div v-show="loaded">
    <vue-headful :title="pageTitle" :description="pageDescription" :keywords="pageKeywords" :image="pageImage" lang="en"
      ref="headful" />
    <div class="viscanvas-container" id="viscanvas-container">
      <canvas id="viscanvas"></canvas>
    </div>
    <div class="animate-border">
      <v-toolbar :width="windowWidth" min-width="300" color="transparent" dark flat
        style="margin: auto; opacity: 1; position: relative; z-index: 1000">
        <!-- <v-app-bar-nav-icon></v-app-bar-nav-icon> -->
        <!-- <v-btn icon class="ml-2">
          <v-icon medium dark>view_headline</v-icon>
        </v-btn> -->

        <v-btn v-if="currentVis" icon style="opacity: 1" @click="playerToggleVisuals" value="vis">
          <v-icon medium dark>brightness_2</v-icon>
        </v-btn>
        <v-btn v-else icon style="opacity: 0.3" @click="playerToggleVisuals" value="vis">
          <v-icon medium dark>brightness_2</v-icon>
        </v-btn>

        <v-spacer></v-spacer>

        <v-btn icon @click="showStationDetails = !showStationDetails" style="opacity: 0.3">
          <v-icon medium dark>mdi-information-outline</v-icon>
        </v-btn>

        <v-btn icon @click="launchPopup" v-if="$device.isDesktop" style="opacity: 0.3">
          <v-icon medium dark>mdi-open-in-new</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card class="transparent" style="margin: auto; margin-top: -50px; position: relative; z-index: 1" flat
        :width="windowWidth" min-width="300" v-touch="{
            left: () => swipe('Left'),
            right: () => swipe('Right'),
            up: () => swipe('Up'),
            down: () => swipe('Down'),
          }">
        <v-card style="margin: auto; margin-top: -10px; text-align: center" flat class="categoryCont transparent"
          v-if="station">
          <small><small>STATION</small></small>
          <h2 class="categoryTitle">{{ station.title }}</h2>

          <h4 class="categorySubtitle" style="text-transform: uppercase">
            <small>{{ station.subtitle }}</small>
          </h4>
          <div class="categoryDescription">
            <small>
              {{ station.description }}
            </small>
          </div>
          <div class="faded">
            <div v-if="nowplaying && nowplaying.listeners">
              <small>{{ nowplaying.listeners }} listeners</small>
            </div>
            <div v-else>
              <br />
            </div>
          </div>
          <div>
            <div v-if="windowHeight <= 680"
              style="text-align: center; height: 165px;display: flex; justify-content: center; align-items: center;">
              <v-img :max-width="180" :src="cover" aspect-ratio="1" style="margin: auto; background-color: transparent"
                :class="isLoading || isPlaying ? 'pulse' : 'faded'" @click="playIfStopped()"></v-img>
            </div>
            <div v-if="windowHeight > 681 && windowHeight < 799"
              style="text-align: center; height: 265px; display: flex; justify-content: center; align-items: center;">
              <v-img :max-width="210" :src="cover" aspect-ratio="1" style="margin: auto; background-color: transparent"
                :class="isLoading || isPlaying ? 'pulse' : 'faded'" @click="playIfStopped()"></v-img>
            </div>
            <div v-if="windowHeight >= 850"
              style="text-align: center; height: 265px; display: flex; justify-content: center; align-items: center;">
              <v-img :max-width="250" :src="cover" aspect-ratio="1" style="margin: auto; background-color: transparent"
                :class="isLoading || isPlaying ? 'pulse' : 'faded'" @click="playIfStopped()"></v-img>
            </div>
          </div>
        </v-card>
        <v-card-text style="text-align: center; min-height: 100px" p0>
          <small>
            <span v-if="isOffline" style="color: red"><strong>DEVICE OFFLINE!</strong><br /><br /></span>
            <span v-else-if="isLoading" style="color: yellow">please wait...<br /></span>
            <span v-else-if="isStalled" style="color: red"><strong>{{ stalledMessage }}1</strong><br /><br /></span>
            <span v-else-if="!isPlaying">STOPPED</span>
            <span v-else>
              <span v-if="nowplaying.song_type == 'L'">LIVE BROADCAST</span>
              <span v-else-if="nowplaying.song_type == 'S'">PLAYLIST ROTATION</span>
              <span v-else>NOW PLAYING</span>
            </span>
          </small>
          <div v-if="artist || title">
            <strong>
              <span v-html="decodeURIComponent(artist.replace(/\\'/g, '\''))"></span>
            </strong>
            <br />
            <span v-html="decodeURIComponent(title.replace(/\\'/g, '\''))"></span>
          </div>
          <div v-else>
            <small>CLICK PLAY TO<br />START YOUR STREAM<br /></small>
          </div>
        </div>
      </v-card>
      <v-card-text style="text-align: center; min-height: 100px" p0>
        <small>
          <span v-if="isOffline" style="color: red"
            ><strong>DEVICE OFFLINE!</strong><br /><br
          /></span>
          <span v-else-if="isLoading" style="color: yellow"
            >please wait...<br
          /></span>
          <span v-else-if="isStalled" style="color: red"
            ><strong>{{ stalledMessage || 'Connection error. Please try again later.' }}</strong><br /><br
          /></span>
          <span v-else-if="!isPlaying">STOPPED</span>
          <span v-else>
            <span v-if="nowplaying.song_type == 'L'">LIVE BROADCAST</span>
            <span v-else-if="nowplaying.song_type == 'S'"
              >PLAYLIST ROTATION</span
            >
            <span v-else>NOW PLAYING</span>
          </span>
        </small>
        <div v-if="artist || title">
          <strong>
            <span v-html="decodeURIComponent(artist.replace(/\\'/g, '\''))"></span>
          </strong>
          <br />
          <span v-html="decodeURIComponent(title.replace(/\\'/g, '\''))"></span>
        </div>
        <div v-else>
          <small>CLICK PLAY TO<br />START YOUR STREAM<br /></small>
        </div>
        <div v-else><br /><br /></div>
      </v-card-text>
      <v-card-actions p0 fluid>
        <v-row justify="space-around">
          <v-btn
            icon
            @click="loadPrev(false)"
            style="margin-top: 15px; color: #a0a0a0"
          >
            <v-icon medium dark>skip_previous</v-icon>
          </v-btn>
          <v-btn icon @click="volDown" style="margin-top: 15px; color: #a0a0a0">
            <v-icon medium dark>mdi-volume-minus</v-icon>
          </v-btn>
          <v-icon size="50" v-if="!isPlaying" @disable="isLoading" @click="play"
            >play_circle_filled</v-icon
          >
          <v-icon size="50" v-if="isPlaying" @click="pause"
            >pause_circle_filled</v-icon
          >
          <v-btn icon @click="volUp" style="margin-top: 15px; color: #a0a0a0">
            <v-icon medium dark>mdi-volume-plus</v-icon>
          </v-btn>
          <v-btn
            icon
            @click="loadNext(false)"
            style="margin-top: 15px; color: #a0a0a0"
          >
            <v-icon medium dark>skip_next</v-icon>
          </v-btn>
          <!-- <v-icon small dark>settings_input_antenna</v-icon> -->
        </v-row>
      </v-card-actions>

        <v-bottom-navigation class="flat stationNav" grow background-color="transparent"
          style="border: 0px; margin: auto; box-shadow: none">
          <!-- <v-btn icon :class="(!shuffleOn) ? 'iconoff' : 'iconon'"
            @click="shuffleOn=!shuffleOn"
            value="shuffle">
              <v-icon medium dark>shuffle</v-icon>
          </v-btn> -->

          <v-btn icon style="opacity: 1; padding: 0px" :disabled="!station || !station.podcast"
            @click="$router.push('/stations/' + currIndex + '/podcast')" value="podcast" small>
            <span><small>podcast</small></span>
            <v-icon dark>voicemail</v-icon>
          </v-btn>

          <v-btn icon style="opacity: 1" :disabled="!station"
            @click="$router.push('/stations/' + currIndex + '/schedule')" value="calendar" small>
            <span><small>schedule</small></span>
            <v-icon dark>mdi-calendar-month</v-icon>
          </v-btn>

          <v-btn icon @click="$router.push('/stations/' + currIndex + '/donate')" value="favorite" small>
            <span><small>donate</small></span>
            <v-icon dark color="red">favorite</v-icon>
          </v-btn>

          <v-btn icon style="opacity: 0.8" :disabled="!station" @click="launchLink('https://shop.dnbradio.com')"
            value="shop" small>
            <span><small>merch</small></span>
            <v-icon dark>mdi-tshirt-crew</v-icon>
          </v-btn>

          <v-btn icon style="opacity: 0.8" :disabled="!station" @click="$router.push('/stations/' + currIndex + '/chat')"
            value="chat" small>
            <span>chat</span>
            <v-icon dark>mdi-forum-outline</v-icon>
          </v-btn>
          <!-- <v-btn icon :class="(!likedOn) ? 'iconoff' : 'iconon'"
          v-if="!likedOn"
          @click="likedOn=!likedOn"
          value="favorite">
            <v-icon medium dark>favorite_border</v-icon>
        </v-btn>
        <v-btn icon :class="(!likedOn) ? 'iconoff' : 'iconon'"
          v-else
          @click="likedOn=!likedOn"
          value="favorite">
            <v-icon medium dark>favorite</v-icon>
        </v-btn> -->
        </v-bottom-navigation>
        <v-row>
          <v-col class="text-center" style="margin-top: 10px; color: rgb(99, 99, 99)">
            <v-btn small type="text" rounded color="transparent"
              @click="$router.push('/stations/' + currIndex + '/donate')">
              <small class="hidden-sm-and-up"><small>Keepin' the beats rollin' on dnbradio!</small></small>
              <small class="hidden-xs-only">Keepin' the beats rollin' on dnbradio!</small>
            </v-btn>
            <br />
            <span style="font-size: 9px; opacity: 40%"><a href="https://github.com/dnbradio/dnbradio-player"
                title="Contribute to dnbradio-player on GitHub" target="_blank"
                style="text-decoration: none; color: #a0a0a0">dnbradio-player/{{ APP_BRANCH }}:v{{ APP_VERSION }}
                <img src="/player/github-mark-white.svg" height="12" alt="GitHub" style="margin-left: 3px" /> </a></span>
          </v-col>
        </v-row>
      </v-card>
    </div>

    <v-dialog v-model="showStationDetails" fullscreen transition="dialog-top-transition">
      <v-card v-if="station">
        <v-toolbar dark>
          <v-btn icon dark @click="showStationDetails = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Station Info</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items> </v-toolbar-items>
        </v-toolbar>
        <v-card-subtitle class="pb-0">
          <v-row justify="space-between">
            <v-col class="flex-grow-1" cols="9">
              <h2>{{ station.title }} - {{ station.subtitle }}</h2>
              <br />{{ station.description }}
            </v-col>
            <v-col class="flex-shrink-0">
              <v-img :max-width="150" :src="cover" aspect-ratio="1" style="background-color: transparent"></v-img>
            </v-col>
          </v-row>
        </v-card-subtitle>

        <v-card-text class="text--primary">
          <!-- <div class="pb-2">
            <v-btn><v-icon left>share</v-icon>Share</v-btn>
          </div> -->
          <div class="pb-2" v-if="station.website">
            <v-btn rounded @click="launchLink(station.website)"><v-icon left>mdi-web</v-icon>Website</v-btn>
          </div>
          <div class="pb-6" v-if="station.podcast && station.podcast.website">
            <v-btn rounded @click="launchLink(station.podcast.website)"><v-icon left>voicemail</v-icon> Podcast</v-btn>
          </div>

          <div class="pb-2" v-if="station.facebook">
            <v-btn rounded @click="launchLink(station.facebook)"><v-icon left>mdi-facebook</v-icon> Facebook</v-btn>
          </div>
          <div class="pb-2" v-if="station.twitter">
            <v-btn rounded @click="launchLink(station.twitter)"><v-icon left>mdi-twitter</v-icon> Twitter</v-btn>
          </div>
          <div class="pb-2" v-if="station.instagram">
            <v-btn rounded @click="launchLink(station.instagram)"><v-icon left>mdi-instagram</v-icon> Instagram</v-btn>
          </div>
          <div class="pb-2" v-if="station.soundcloud">
            <v-btn rounded @click="launchLink(station.soundcloud)"><v-icon left>mdi-soundcloud</v-icon> Soundcloud</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Station from "@/models/Station";
import { EventBus } from "@/components/eventbus.js";

import plankton from "@/vis/plankton";
import stars from "@/vis/stars";

// if (process.BROWSER_BUILD && window) {
//   plankton = require('@/components/plankton.js');
// }

export default {
  props: ["station"],
  data() {
    return {
      pageTitle: null,
      pageDescription: null,
      pageImage: null,
      pageKeywords: null,
      currentVis: null,
      visOn: false,
      npInterval: null,
      bottomNav: "favorite",
      shuffleOn: false,
      likedOn: false,
      showStationDetails: false,
      loaded: false,
      nowplaying: {
        artist: null,
        title: null,
        listeners: null,
        albumyear: null,
        album: null,
        song_type: null,
        label: null,
      },
      isPlaying: false,
      isLoading: false,
      isStalled: false,
      stalledInterval: null,
      stalledMessage: "",
      stalledRetriesRemaining: 90,
      stalledRetriesOfflineRemaining: 225,
    };
  },
  methods: {
    playerToggleVisuals() {
      this.$store.commit('player/TOGGLE_VISUALS');
    },
    attachListeners() {
      console.log("attachListeners", [this.$sound], this.$media);
      clearInterval(this.npInterval);
      this.$sound.onloaded = () => {
        this.isLoading = false;
        console.log("loaded", this.$sound);
      };
      this.$sound.addEventListener("progress", (event) => {
        if (this.stalledInterval) {
          clearInterval(this.stalledInterval);
        }
      });
      this.$sound.addEventListener("playing", (event) => {
        if (this.stalledInterval) {
          clearInterval(this.stalledInterval);
        }
      });
      this.$sound.onplay = () => {
        this.isLoading = false;
        this.isPlaying = true;
        this.stalledMessage = "";
        this.stalledRetriesRemaining = 90;
        this.stalledRetriesOfflineRemaining = 225;
        if (this.stalledInterval) {
          clearInterval(this.stalledInterval);
        }
        this.isStalled = false;
        console.log("onplay called", this.$sound);
        this.npInterval = setInterval(() => {
          if (this.isOffline == false) {
            this.fetchNowplaying();
          }
        }, 15000);
      };
      this.$sound.addEventListener("stalled", (err) => {
        console.log("STALLED CAUGHT", err, this.$sound);
      });
      this.$sound.addEventListener("abort", (err) => {
        console.log("ABORT CAUGHT", err, this.$sound);
      });
      this.$sound.addEventListener("emptied", (err) => {
        console.log("EMPTIED CAUGHT", err, this.$sound);
      });
      this.$sound.addEventListener("suspend", (err) => {
        if (this.stalledInterval) {
          clearInterval(this.stalledInterval);
        }
        console.log("SUSPEND CAUGHT", err, this.$sound);
      });
      this.$sound.onerror;
      this.$sound.addEventListener("error", (err) => {
        console.log("ERROR CAUGHT", this.$sound);
        if (!this.$sound) {
          return;
        }
        this.isStalled = true;
        // if (this.$sound) {
        //   this.$sound.pause();
        // }
        if (this.stalledInterval) {
          clearInterval(this.stalledInterval);
        }
        this.stalledInterval = setInterval(() => {
          console.log("retrying playback...", this.stalledRetriesRemaining);
          if (this.isOffline) {
            console.log(
              "skipping retry (device offline)",
              this.stalledRetriesOfflineRemaining
            );
            this.stalledRetriesOfflineRemaining--;
            if (this.stalledRetriesOfflineRemaining == 0) {
              console.log("giving up");
              clearInterval(this.stalledInterval);
              this.stalledRetriesRemaining = 90;
              this.stalledRetriesOfflineRemaining = 225;
              if (this.$sound) {
                this.$sound.pause();
              }
            }
            return;
          }
          console.log(
            "readystate",
            this.$sound?.readyState,
            "paused",
            this.$sound?.paused,
            "ended",
            this.$sound?.ended,
            "networkState",
            this.$sound?.networkState,
            "buffered",
            this.$sound?.buffered
          );
          if (this.$sound?.readyState < 2) {
            return;
          }
          this.stalledMessage = "Retrying in 3s...";
          this.initPlayer();
          // if (this.$sound) {
          //   this.$sound.pause();
          // }
          setTimeout(() => {
            if (!this.$sound) {
              return;
            }
            console.log("running play()");
            this.$sound.play();
          }, 1500);
          this.stalledRetriesRemaining--;
          if (this.stalledRetriesRemaining == 0) {
            console.log("giving up");
            clearInterval(this.stalledInterval);
            this.stalledRetriesRemaining = 90;
            this.stalledRetriesOfflineRemaining = 225;
            if (this.$sound) {
              this.$sound.pause();
            }
          }
        }, 3000);
      });

      if (navigator.mediaSession) {
        navigator.mediaSession.setActionHandler("play", () => {
          this.$sound.play();
          this.isPlaying = true;
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          this.$sound.pause();
          this.$sound.src = "";
          this.isPlaying = false;
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          this.loadPrev(true);
          this.isPlaying = false;
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          this.loadNext(true);
          this.isPlaying = false;
        });

        // navigator.mediaSession.setActionHandler('seekbackward', function() {});
        // navigator.mediaSession.setActionHandler('seekforward', function() {});
      }
    },
    initStream() {
      if (this.playerVisualsEnabled) {
        console.log('restarting stars');
        this.startStars(); // restart
      } else {
        this.stopStars();
      }
      if (this.$sound?.src == this.station?.streams?.[0]?.url) {
        if (this.$sound?.paused) {
          this.$sound.play();
        }
        console.log("stream already loaded");
        this.isPlaying = true;
        return true;
      }
      const streamUrl = this.station?.streams?.[0]?.url
        ? [this.station.streams[0].url]
        : null;
      const streamMimeType = this.station?.streams?.[0]?.mimetype;
      if (streamUrl) {
        this.$sound.src = streamUrl;
        this.$sound.type = streamMimeType;
        this.attachListeners();
        return true;
      } else {
        return false;
      }
    },
    async initPlayer(auto) {
      if (this.$sound && this.paused == true && this.readyState == 4) {
        this.play();
        this.isLoading = false;
        return;
      }
      this.isLoading = true;

      // fetch station info
      this.fetchNowplaying()
        .then(() => {
          if (!this.station) {
            throw "station not ready";
          }
          this.isLoading = false;
        })
        .catch((err) => {
          console.log(err);
        });
    },
    togglePlankton() {
      if (this.visOn == false) {
        this.currentVis = "plankton";
        this.visOn = true;
        plankton();
      } else {
        this.currentVis = null;
        var element = document.getElementById("viscanvas");
        element.parentNode.removeChild(element);
        if (window.animId) {
          cancelAnimationFrame(window.animId);
        }
        let tela = window.document.createElement("canvas");
        tela.id = "viscanvas";
        document.getElementById("viscanvas-container").appendChild(tela);
        this.visOn = false;
        for (var i = 0; i < window.timeouts.length; i++) {
          clearTimeout(window.timeouts[i]);
        }
      }
    },
    launchPopup() {
      this.pause();
      var windowopen;
      if (windowopen == true) {
        wind.focus();
        return true;
      } else {
        let width = 430;
        let height = 580;
        if (
          (window.innerHeight == height || window.outerHeight == height) &&
          (window.innerWidth == width || window.outerWidth == width)
        ) {
          return false;
        }
        var props =
          "width=" +
          width +
          ",height=" +
          height +
          ",left=25,top=25,screenX=100,screenY=100,resizable=0,scrollbars=0,toolbar=no,location=no,status=no,menubar=no,copyhistory=no,directories=no";
        var wind = window.open(window.location.href, "formPopup", props);
        var windopen = true;
        return true;
      }
    },
    launchLink(link) {
      this.$dialog
        .confirm({
          title: "Do you want to proceed?",
          text:
            "You are about to launch the following external link in a new browser tab:" +
            "<br /><br />" +
            link,
          actions: {
            false: "Cancel",
            true: { text: "YES, LAUNCH THE LINK.", color: "primary" },
          },
        })
        .then((res) => {
          if (res) {
            window.open(link, "_blank");
          }
        });
    },
    playIfStopped() {
      if (!this.isPlaying) {
        this.initPlayer();
      }
    },
    swipe(direction) {
      switch (direction) {
        case "left":
          this.loadPrev();
          break;
        case "right":
          this.loadNext();
          break;
      }
    },
    loadPodcast() {
      clearInterval(this.npInterval);
      if (this.$sound) {
        this.$sound.pause();
        this.$sound.src = "";
      }
      this.$sound = null;
      //this.$dialog.confirm({text: 'This station\'s podcast is available on the station\'s website. We will be adding a podcast listening feature to this app soon, but in the meantime please visit the station\'s website to listen to the podcast there.'})
      this.$router.push("/stations/" + this.currIndex + "/podcast");
    },
    loadPrev(auto) {
      clearInterval(this.npInterval);
      if (this.$sound) {
        this.$sound.pause();
        this.$sound.src = "";
        this.$sound = null;
      }
      this.$sound = null;
      if (this.shuffleOn) {
        this.loadRandom();
        return;
      }
      //this.$sound.stop();
      this.$router.push("/stations/" + this.prevIndex);
    },
    loadNext(auto) {
      console.log("loadNext");
      clearInterval(this.npInterval);
      if (this.$sound) {
        this.$sound.src = this.nextStation.streams[0].url;
      }
      if (this.shuffleOn) {
        this.loadRandom();
        return;
      }
      this.$router.push("/stations/" + this.nextIndex);
    },
    loadRandom() {
      if (this.$sound) {
        this.$sound.pause();
        this.$sound.src = this.previousStation.streams[0].url;
      }
      this.$router.push("/stations/" + this.randomIndex);
    },
    async play() {
      //EventBus.$emit('stop-howler');
      this.isPlaying = true;
      if (this.$sound) {
        this.$sound.play();
        this.fetchNowplaying();
        this.isLoading = false;
      } else {
        await this.initPlayer();
      }
    },
    pause() {
      this.isPlaying = false;
      this.isLoading = false;
      clearInterval(this.npInterval);
      if (this.$sound) {
        this.$sound.pause();
      }
    },
    volUp() {
      if (this.$sound.volume == 1) {
        return;
      }
      let newVol = this.$sound.volume + 0.1;
      newVol = newVol > 1 ? 1 : newVol;
      this.$sound.volume = newVol;
    },
    volDown() {
      if (this.$sound.volume == 0) {
        return;
      }
      let newVol = this.$sound.volume - 0.1;
      newVol = newVol < 0 ? 0 : newVol;
      this.$sound.volume = newVol;
    },
    decodeHTMLEntities(text) {
      var entities = [
        ["amp", "&"],
        ["apos", "'"],
        ["#x27", "'"],
        ["#x2F", "/"],
        ["#39", "'"],
        ["#47", "/"],
        ["lt", "<"],
        ["gt", ">"],
        ["nbsp", " "],
        ["quot", '"'],
      ];

      for (var i = 0, max = entities.length; i < max; ++i)
        text = text.replace(
          new RegExp("&" + entities[i][0] + ";", "g"),
          entities[i][1]
        );

      return text;
    },
    fetchNowplaying() {
      if (!this.station) {
        return;
      }
      //return this.$axios.get('/api/now_playing?url=' + this.station.nowplaying_url.url, { progress: false }).then((res) => {
      return this.$axios
        .get("" + this.station.nowplaying_url.url, { progress: false })
        .then((res) => {
          switch (this.station.nowplaying_url.type) {
            case "icecast":
              this.nowplaying = res.data?.icestats?.source;
              this.nowplaying.artist = this.nowplaying.title.split(" - ")[0];
              this.nowplaying.title = this.nowplaying.title
                .replace("(Original Title)", "")
                .split(" - ")[1];
              this.nowplaying.album = this.station.server_description;
              this.nowplaying.listeners = this.nowplaying.listeners || 0;
              this.pageTitle =
                this.nowplaying.artist +
                " - " +
                this.nowplaying.title +
                " [" +
                this.nowplaying.listeners +
                " tuned] - " +
                this.station.name;
              this.pageDescription = this.station.subtitle;
              this.pageKeywords =
                this.station.description + " " + this.station.subtitle;
              this.pageImage = this.station.cover;
              break;
              break;
            case "sam":
              this.nowplaying = res.data;
              this.nowplaying.title = this.nowplaying.title.replace(
                "(Original Title)",
                ""
              );
              this.nowplaying.album = this.station.name;
              this.pageTitle =
                this.nowplaying.artist +
                " - " +
                this.nowplaying.title +
                " [" +
                this.nowplaying.listeners +
                " tuned] - " +
                this.station.name;
              this.pageDescription = this.station.subtitle;
              this.pageKeywords =
                this.station.description + " " + this.station.subtitle;
              this.pageImage = this.station.cover;
              break;
            case "jt":
              this.nowplaying = res.data;
              this.nowplaying.artist = this.nowplaying.h1;
              this.nowplaying.title = this.nowplaying.h2;
              this.nowplaying.listeners = this.nowplaying.listening;
              this.nowplaying.albumyear = null;
              this.nowplaying.album = this.station.name;
              this.nowplaying.song_type = "";
              this.nowplaying.label = null;
              this.pageTitle = this.nowplaying.h1;
              this.pageDescription = this.station.subtitle;
              this.pageKeywords =
                this.station.description + " " + this.station.subtitle;
              this.pageImage = this.station.cover;
              break;
            case "shoutcast":
              // let d = res.data.replace(/(<([^>]+)>)/gi, "").split(",");
              // let rejoin = null;
              // if (d[8]) {
              //   rejoin = d[6] + ", " + d[7] + ", " + d[8];
              // } else if (d[7]) {
              //   rejoin = d[6] + ", " + d[7];
              // } else {
              //   rejoin = d[6];
              // }
              const d = res.data;
              let parts = d.songtitle.split(" - ");
              let artist = parts[0];
              let title = parts[1];
              let data = {
                listeners: d.currentlisteners,
                status: d.streamstatus,
                peak: d.peaklisteners,
                max: d.maxlisteners,
                bitrate: d.bitrate,
                artist: artist,
                title: title,
              };
              console.log(data);
              this.nowplaying.artist = data.artist;
              this.nowplaying.title = data.title.replace(
                "(Original Title)",
                ""
              );
              this.nowplaying.listeners = data.listeners;
              this.nowplaying.albumyear = null;
              this.nowplaying.album = this.station.name;
              this.nowplaying.song_type = "";
              this.nowplaying.label = null;
              this.pageTitle =
                this.nowplaying.artist +
                " - " +
                this.nowplaying.title +
                " [" +
                this.nowplaying.listeners +
                " tuned] - " +
                this.station.name;
              this.pageDescription = this.station.subtitle;
              this.pageKeywords =
                this.station.description + " " + this.station.subtitle;
              this.pageImage = this.station.cover;
              break;
            default:
              this.nowplaying.artist = this.station.name;
              this.nowplaying.title = this.station.subtitle;
              this.nowplaying.listeners = null;
              this.nowplaying.albumyear = null;
              this.nowplaying.album = this.station.name;
              this.nowplaying.song_type = "";
              this.nowplaying.label = null;
              this.pageTitle =
                this.nowplaying.artist +
                " - " +
                this.nowplaying.title +
                " - " +
                this.station.name;
              this.pageDescription = this.station.subtitle;
              this.pageKeywords =
                this.station.description + " " + this.station.subtitle;
              this.pageImage = this.station.cover;
              break;
          }

          // navigator
          if (navigator && navigator.mediaSession) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: this.nowplaying.title,
              artist: this.nowplaying.artist,
              // album: this.nowplaying.album,
              artwork: [
                {
                  src:
                    "https://res.cloudinary.com/labelgrid/image/fetch/c_scale,w_96/v1586048258/" +
                    this.pageImage,
                  sizes: "96x96",
                  type: "image/png",
                },
                {
                  src:
                    "https://res.cloudinary.com/labelgrid/image/fetch/c_scale,w_128/v1586048258/" +
                    this.pageImage,
                  sizes: "128x128",
                  type: "image/png",
                },
                {
                  src:
                    "https://res.cloudinary.com/labelgrid/image/fetch/c_scale,w_192/v1586048258/" +
                    this.pageImage,
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src:
                    "https://res.cloudinary.com/labelgrid/image/fetch/c_scale,w_256/v1586048258/" +
                    this.pageImage,
                  sizes: "256x256",
                  type: "image/png",
                },
                {
                  src:
                    "https://res.cloudinary.com/labelgrid/image/fetch/c_scale,w_348/v1586048258/" +
                    this.pageImage,
                  sizes: "384x384",
                  type: "image/png",
                },
                {
                  src:
                    "https://res.cloudinary.com/labelgrid/image/fetch/c_scale,w_512/v1586048258/" +
                    this.pageImage,
                  sizes: "512x512",
                  type: "image/png",
                },
              ],
            });
          }
        })
        .catch((err) => {
          console.log("cannot fetch nowplaying", err.message);
        });
    },
    startStars() {
      this.currentVis = "stars";
      var element = document.getElementById("viscanvas");
      element.style.display = "block";
      stars();
    },
    stopStars() {
      this.currentVis = "";
      var element = document.getElementById("viscanvas");
      element.style.display = "none";
      if (window.animId) {
        cancelAnimationFrame(window.animId);
      }
    }
  },
  computed: {
    playerVisualsEnabled() {
      return this.$store.state.player.visualsEnabled;
    },
    stations() {
      return Station.query().get();
    },
    nextStationIndex() {
      let index = this.stations.findIndex(
        (station) => station.id === this.station.id
      );
      if (index === this.stations.length - 1) {
        return 0;
      } else {
        return index + 1;
      }
    },
    nextStation() {
      return this.stations[this.nextStationIndex];
    },
    previousStationIndex() {
      let index = this.stations.findIndex(
        (station) => station.id === this.station.id
      );
      if (index === 0) {
        return this.stations.length - 1;
      } else {
        return index - 1;
      }
    },
    previousStation() {
      return this.stations[this.previousStationIndex];
    },
    APP_BRANCH() {
      return this.$config.APP_BRANCH || "main";
    },
    APP_VERSION() {
      return this.$config.APP_VERSION;
    },
    isOffline() {
      return this.$nuxt.isOffline;
    },
    windowHeight() {
      if (process.client) {
        return window.innerHeight;
      }
    },
    windowWidth() {
      if (process.client) {
        return window.innerWidth;
      }
    },
    paused() {
      return this.$sound.paused;
    },
    // readyState
    //  Type	Description
    // Number	Represents the ready state of the audio/video element:
    // 0 = HAVE_NOTHING - no information whether or not the audio/video is ready
    // 1 = HAVE_METADATA - metadata for the audio/video is ready
    // 2 = HAVE_CURRENT_DATA - data for the current playback position is available, but not enough data to play next frame/millisecond
    // 3 = HAVE_FUTURE_DATA - data for the current and at least the next frame is available
    // 4 = HAVE_ENOUGH_DATA - enough data available to start playing
    readyState() {
      return this.$sound.readyState;
    },
    currIndex() {
      return this.$route.params.stationId ? this.$route.params.stationId : 1;
    },
    randomIndex() {
      let stations = Station.query().get();
      let currIndex = stations.find((item) => item.id == this.station.id).id;
      let rand = null;
      while (rand === null || rand === currIndex) {
        rand = Math.round(Math.random() * stations.length);
      }
      return rand;
    },
    nextIndex() {
      let stations = Station.query().get();
      let nextIndex =
        stations.find((item) => item.id == this.station.id).id + 1;
      if (nextIndex > stations.length) {
        nextIndex = 1;
      }
      return nextIndex;
    },
    prevIndex() {
      let stations = Station.query().get();
      let prevIndex =
        stations.find((item) => item.id == this.station.id).id - 1;
      if (prevIndex < 1) {
        prevIndex = stations.length;
      }
      return prevIndex;
    },
    cover() {
      return this.station.cover || "https://picsum.photos/350/165?random";
    },
    artist() {
      return this.nowplaying ? this.nowplaying.artist : null;
    },
    title() {
      return this.nowplaying ? this.nowplaying.title : null;
    },
    albumyear() {
      return this.nowplaying ? this.nowplaying.album_year : null;
    },
    song_type() {
      return this.nowplaying ? this.nowplaying.song_type : null;
    },
    label() {
      return this.nowplaying ? this.nowplaying.label : null;
    },
    listeners() {
      return this.nowplaying ? this.nowplaying.listeners : null;
    },
    streamurl() {
      return this.station?.streams?.[0].url;
    },
  },
  mounted() {
    // if fresh load then startStars
    console.log('this.$route?.from?.name', this.$route)
    if (this.$store.state.player.initialLoad) {
      setTimeout(() => {
        this.playerToggleVisuals();
      }, 800);
    }
    this.$store.dispatch("player/SET_INITIAL_LOAD", false);
    console.log("sound readyState", this.$sound.readyState);
    if (
      this.$sound?.readyState > 0 &&
      this.$sound?.paused == false &&
      this.$sound?.ended == false
    ) {
      this.isPlaying = true;
    }
    this.pageTitle =
      "dnbradio.com : All flavors of dnb from dj's across the globe! [dnbradio.com [all flavors]] - dnbradio.com";
    this.pageDescription = "All flavors of dnb from dj's across the globe!";
    this.pageImage = "https://dnbradio.com/img/logotags.png";
    this.pageKeywords = "dnbradio.com all flavors";
    // navigator
    this.$nextTick(() => {
      this.loaded = true;
      this.initStream();
      this.fetchNowplaying();

      // try again if empty
      setTimeout(() => {
        // no artist or title
        if (!this.nowplaying.artist || !this.nowplaying.title) {
          this.fetchNowplaying();
        }
      }, 2000);
    });
  },
  watch: {
    playerVisualsEnabled(val) {
      if (val === false) {
        this.stopStars();
      } else {
        this.startStars();
      }
    },
    streamurl(val) {
      console.log("streamurl changed", val);
      this.initStream();
    },
  },
};
</script>

<style>
.pulse {
  transform: scale(1);
  /* animation: pulse 2s infinite; */
  animation: pulse 2s 3;
}

.faded {
  opacity: 0.4;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
  }

  70% {
    transform: scale(1);
  }

  100% {
    transform: scale(0.95);
  }
}

.iconoff {
  opacity: 0.6;
}

.iconon {
  opacity: 1;
}

.iconon.theme--dark.v-btn.v-btn--icon {
  color: #fb1313;
}

html {
  overflow-y: auto;
}

.v-application--wrap {
  z-index: 100;
}

.viscanvas-container {
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 0;
  top: 0px;
  left: 0px;
}

#viscanvas {
  top: 0px;
  left: 0px;
  display: block;
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 0;
}

.stationNav {
  top: 10px;
  max-width: 450px;
}
</style>
<style scoped>
.animate-border {
  --angle: 0deg;
  border: 3px solid;
  border-image: linear-gradient(var(--angle), white, black, white) 1;
  position: relative;
  animation: 10s rotate linear infinite;
  padding: 10px;
  padding-bottom: 20px;
  backdrop-filter: blur(10px);
}

@keyframes rotate {
  to {
    --angle: 360deg;
  }
}

@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
</style>