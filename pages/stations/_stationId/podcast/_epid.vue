<template>
  <div>
    <v-toolbar
      color="transparent"
      dark
      flat
      style="margin:auto; opacity: 0.24;"
    >
      <v-btn class="ml-3" @click="$router.go(-1)">
        <v-icon medium transparent>arrow_back</v-icon> Back
      </v-btn>
      <v-divider />
      <v-btn
        class="ml-6"
        @click="$router.push('/stations/' + currenStationIndex)"
      >
        <v-icon medium transparent>mdi-radio</v-icon>
        <span class="pl-1">SWITCH TO RADIO</span>
      </v-btn>
    </v-toolbar>
    <v-card
      v-if="loaded && episode"
      class="transparent"
      style="margin:auto; margin-top:0px;"
      flat
      :max-width="560"
      v-touch="{
        left: () => swipe('Left'),
        right: () => swipe('Right'),
        up: () => swipe('Up'),
        down: () => swipe('Down')
      }"
    >
      <v-card
        style="margin:auto;
      text-align: center;"
        flat
        class="categoryCont transparent"
        v-show="1"
        v-if="episode"
      >
        <small>EPISODE</small>
        <h2 class="categoryTitle">{{ episode.artist }}</h2>

        <h4 class="categorySubtitle" style="text-transform: uppercase;">
          <small>{{ episode.title }}</small>
        </h4>
        <!-- <div class="categoryDescription">
            <small>
              {{ episode.description }}
            </small>
          </div> -->

        <div
          v-if="windowHeight <= 680"
          style="text-align:center; height: 165px;"
        >
          <v-img
            contain
            :max-width="180"
            :src="cover"
            aspect-ratio="1"
            style="margin:auto; background-color: transparent;"
            :class="isLoading || isPlaying ? 'pulse' : 'faded'"
            @click="playIfStopped()"
          ></v-img>
        </div>
        <div
          v-if="windowHeight > 681 && windowHeight < 799"
          style="text-align:center; height: 265px;"
        >
          <v-img
            contain
            :max-width="210"
            :src="cover"
            aspect-ratio="1"
            style="margin:auto; background-color: transparent;"
            :class="isLoading || isPlaying ? 'pulse' : 'faded'"
            @click="playIfStopped()"
          ></v-img>
        </div>
        <div
          v-if="windowHeight >= 850"
          style="text-align:center; height: 285px;"
        >
          <v-img
            contain
            :max-width="250"
            :src="cover"
            aspect-ratio="1"
            style="margin:auto; background-color: transparent;"
            :class="isLoading || isPlaying ? 'pulse' : 'faded'"
            @click="playIfStopped()"
          ></v-img>
        </div>
        <!-- <div>
          <div style="text-align:center;">
            <v-avatar color="black" size="400">
              <v-img
              :src="cover"
              contain
              style="margin:auto; background-color: transparent;"
              :class="(isLoading || isPlaying) ? 'pulse' : ''"
              @click="playIfStopped()"
              ></v-img>
            </v-avatar>
          </div>
        </div> -->
      </v-card>
      <v-card-text style="text-align:center;">
        <small>
          <span v-if="isLoading" style="color:yellow;"
            >LOADING - please wait...</span
          >
          <span
            v-else-if="!isPlaying && this.durationString != '00:00:00'"
            style="color:green;"
            >READY!</span
          >
          <span v-else-if="!isPlaying && !this.durationString">LOADING...</span>
          <span v-else>
            <span>PLAYING</span>
          </span>
          <br /><br />
          <span v-if="durationString" style="font-size:2.4em;">
            <span
              v-if="durationString == '00:00:00'"
              style="opacity: 0.2; color: #d1d1d1;"
            >
              00:00:00
            </span>
            <span v-else style="color:green;">
              {{ this.currentTimeString }}
            </span>
            /
            <span
              v-if="durationString == '00:00:00'"
              style="opacity: 0.2; color: #d1d1d1;"
            >
              --:--:--
            </span>
            <span v-else style="color:green;">
              {{ this.durationString }}
            </span>
          </span>
        </small>
        <!-- <div v-if="isPlaying">
          <strong>
            {{ this.artist }}
          </strong>
          <br />
          {{ this.title }}

        </div>
        <div v-else-if="!isPlaying">
            CLICK PLAY TO<br />START YOUR STREAM
        </div>
        <div v-else>
          <br /><br />
        </div> -->
      </v-card-text>
      <!-- <v-progress-linear
        color="teal"
        :buffer-value="amountLoaded"
        v-model="progress"
        stream
        reactive
          ></v-progress-linear>
      <v-card-actions fluid> -->

      <v-row justify="space-around">
        <v-btn icon @click="loadPrev" style="margin-top:15px;">
          <v-icon medium dark>skip_previous</v-icon>
        </v-btn>
        <v-btn icon @click="seek(-30)" style="margin-top:15px;">
          <v-icon medium dark>mdi-rewind-30</v-icon>
        </v-btn>
        <v-icon size="50" v-if="!isPlaying" @click="play"
          >play_circle_filled</v-icon
        >
        <v-icon size="50" v-if="isPlaying" @click="pause"
          >pause_circle_filled</v-icon
        >
        <v-btn icon @click="seek(30)" style="margin-top:15px;">
          <v-icon medium dark>mdi-fast-forward-30</v-icon>
        </v-btn>
        <v-btn icon @click="loadNext" style="margin-top:15px;">
          <v-icon medium dark>skip_next</v-icon>
        </v-btn>
        <!-- <v-icon small dark>settings_input_antenna</v-icon> -->
      </v-row>

      <v-row>
        <v-col
          class="text-center"
          style="margin-top: 10px;color: rgb(99, 99, 99);"
        >
          <v-btn
            type="text"
            rounded
            color="transparent"
            @click="$router.push('/stations/' + currIndex + '/donate')"
          >
            <small>This station depends on your donations to survive!</small>
          </v-btn>
        </v-col>
      </v-row>
      <!-- <v-card-actions v-if="station">
        <v-container fluid>
          <v-row justify="space-around">
            <v-btn icon :class="(!shuffleOn) ? 'iconoff' : 'iconon'"
            @click="shuffleOn=!shuffleOn">
              <v-icon medium dark>shuffle</v-icon>
            </v-btn>
            <v-btn icon style="opacity: 0.7;" :disabled="!station.podcast" @click="loadPodcast">
              <v-icon medium dark>voicemail</v-icon>
            </v-btn>
            <v-btn icon style="opacity: 0.7;" :disabled="!station.schedule"
            @click="$router.push('/stations/' + station.id + '/schedule')">
              <v-icon medium dark>mdi-calendar-month</v-icon>
            </v-btn>
            <v-btn icon :class="(!likedOn) ? 'iconoff' : 'iconon'"
            v-if="!likedOn"
            @click="likedOn=!likedOn">
              <v-icon medium dark>favorite_border</v-icon>
            </v-btn>
            <v-btn icon :class="(!likedOn) ? 'iconoff' : 'iconon'"
            v-else
            @click="likedOn=!likedOn">
              <v-icon medium dark>favorite</v-icon>
            </v-btn>
          </v-row>
        </v-container>
      </v-card-actions> -->
    </v-card>
  </div>
</template>

<script>
import Station from "@/models/Station";
import stations from "@/data/stations";
import { EventBus } from "@/components/eventbus.js";

export default {
  async fetch() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
    this.loaded = true;
  },
  data() {
    return {
      sound: null,
      items: null,
      shuffleOn: false,
      likedOn: false,
      showStationDetails: false,
      loaded: false,
      currentTime: 0,
      duration: 0,
      nowplaying: {
        artist: null,
        title: null,
        listeners: null,
        albumyear: null,
        album: null,
        song_type: null,
        label: null
      },
      isPlaying: false,
      isLoading: false
    };
  },
  watch: {
    streamurl(val) {
      console.log("streamurl changed", val);
      if (!val) {
        return;
      }
      this.initStream({
        url: val,
        mimetype: "audio/mpeg"
      });
    }
  },
  methods: {
    playIfStopped() {
      if (!this.isPlaying) {
        this.play();
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
      //this.$dialog.confirm({text: 'This station\'s podcast is available on the station\'s website. We will be adding a podcast listening feature to this app soon, but in the meantime please visit the station\'s website to listen to the podcast there.'})
      this.$router.push("/stations/" + this.station.id + "/podcast");
    },
    loadPrev() {
      if (this.shuffleOn) {
        this.loadRandom();
        return;
      }
      if (this.$sound) {
        this.$sound.pause();
      }
      this.$router.push(
        "/stations/" + this.station.id + "/podcast/" + this.prevItem.id
      );
    },
    loadNext() {
      if (this.shuffleOn) {
        this.loadRandom();
        return;
      }
      if (this.$sound) {
        this.$sound.pause();
      }
      this.$router.push(
        "/stations/" + this.station.id + "/podcast/" + this.nextItem.id
      );
    },
    loadRandom() {
      if (this.$sound) {
        this.$sound.pause();
      }
      this.$router.push(
        "/stations/" + this.station.id + "/podcast/" + this.nextItem.id
      );
    },
    seek(x) {
      if (!this.$sound) {
        return;
      }
      let seek = this.$sound?.currentTime + x;
      this.$sound.currentTime = seek;
    },
    initStream(stream) {
      console.log("initStream", stream);
      if (!stream?.url) {
        return;
      }
      this.isLoading = true;
      if (this.$sound?.src == stream.url) {
        if (this.$sound?.paused) {
          this.$sound.play().catch(err => {
            console.log("play error", err);
            this.isPlaying = false;
          });
        } else {
          this.isPlaying = true;
        }
        console.log("stream already loaded");

        if (
          this.$sound.paused ||
          this.$sound.ended ||
          this.isPlaying == false
        ) {
          this.isLoading = false;
          //this.isPlaying = true;
        }
        return true;
      } else {
        const streamUrl = stream.url;
        const streamMimeType = stream.mimetype;
        if (this.$sound && streamUrl) {
          this.$sound.src = streamUrl;
          this.$sound.type = streamMimeType;
          //this.isPlaying = true;
          return true;
        } else {
          return false;
        }
      }
    },
    play() {
      this.initStream({
        url: this.streamurl,
        mimetype: "audio/mpeg"
      });
      if (this.$sound) {
        this.$sound
          .play()
          .catch(err => {
            console.log("play error", err);
            this.isPlaying = false;
          })
          .then(() => {
            this.isPlaying = true;
          });
      } else {
        this.isPlaying = false;
      }
      this.isLoading = false;
    },
    pause() {
      this.isPlaying = false;
      this.isLoading = false;
      if (this.$sound) {
        this.$sound.pause();
      }
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
        ["quot", '"']
      ];

      for (var i = 0, max = entities.length; i < max; ++i)
        text = text.replace(
          new RegExp("&" + entities[i][0] + ";", "g"),
          entities[i][1]
        );

      return text;
    },
    audioProgress(e) {
      this.currentTime = this.$sound?.currentTime || 0;
      this.duration = this.$sound?.duration || 0;
      this.isLoading = false;
      //console.log("audioProgress", this.$sound?.currentTime);
    },
    audioDuration(e) {
      this.duration = this.$sound?.duration || 0;
      this.currentTime = this.$sound?.currentTime || 0;
      this.isLoading = false;
      if (this.$sound) {
        this.$sound
          .play()
          .then(() => {
            this.play();
          })
          .catch(err => {
            console.log("play error", err);
            this.pause();
            this.isPlaying = false;
            return;
          });
      }
    }
  },
  beforeDestroy() {
    this.$root.$off("audioProgress", this.audioProgress);
    this.$root.$off("audioDuration", this.audioDuration);
  },
  async mounted() {
    const stationsInitData = await stations();
    Station.create({ data: stationsInitData });
    this.loaded = true;

    this.$root.$on("audioProgress", this.audioProgress);
    this.$root.$on("audioDuration", this.audioDuration);
    if (this.station && this.station.podcast) {
      this.$axios.get(this.station.podcast.url).then(res => {
        this.items = res.data.data;
      });
    }
    if (
      this.$sound?.readyState > 0 &&
      this.$sound?.paused == false &&
      this.$sound?.ended == false
    ) {
      //this.isPlaying = true;
    }
  },
  computed: {
    durationString() {
      const date = new Date(null);
      if (!this.duration) {
        return "00:00";
      }
      date.setSeconds(this.duration); // specify value for SECONDS here
      const result = date.toISOString().slice(11, 19);
      return result;
    },
    currentTimeString() {
      const date = new Date(null);
      date.setSeconds(this.currentTime); // specify value for SECONDS here
      const result = date.toISOString().slice(11, 19);
      return result;
    },
    windowHeight() {
      if (process.client) {
        return screen.height;
      }
    },
    windowWidth() {
      if (process.client) {
        return screen.width;
      }
    },
    currenStationIndex() {
      return this.$route.params && this.$route.params.stationId
        ? this.$route.params.stationId
        : 1;
    },
    stations() {
      return Station.query().get();
    },
    station() {
      let index = this.currenStationIndex ? this.currenStationIndex : 1;
      return this.stations.filter(item => item.id == index)[0];
    },
    episode() {
      if (!this.items) {
        return null;
      }
      return this.items.filter(item => item.id == this.currIndex)[0];
    },
    currIndex() {
      return this.$route.params.epid;
    },
    currentId() {
      return this.$route.params.epid;
    },
    nextItem() {
      if (this.items) {
        return this.items[this.nextIndex];
      }
    },
    prevItem() {
      if (this.items) {
        return this.items[this.prevIndex];
      }
    },
    randomIndex() {
      let currIndex = this.items.findIndex(item => item.id == this.station.id);
      return currIndex;
    },
    nextIndex() {
      let nextIndex =
        this.items.findIndex(item => item.id == this.currentId) + 1;
      if (nextIndex > this.items.length - 1) {
        nextIndex = 0;
      }
      return nextIndex;
    },
    prevIndex() {
      let prevIndex =
        this.items.findIndex(item => item.id == this.currentId) - 1;
      if (prevIndex < 0) {
        prevIndex = this.items.length - 1;
      }
      return prevIndex;
    },
    cover() {
      return this.episode.image || "https://picsum.photos/350/165?random";
    },
    streamurl() {
      return this.episode?.download_url;
    }
  }
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
</style>
