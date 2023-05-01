<template>
  <div>
    <v-card v-show="loaded" class="transparent" style="margin:auto; margin-top:0px;"
      flat
      :max-width="560"
       v-touch="{
        left: () => swipe('Left'),
        right: () => swipe('Right'),
        up: () => swipe('Up'),
        down: () => swipe('Down')
      }"
      >

      <v-row justify="space-between" style="opacity: 0.6;">
        <v-btn icon class="ml-2" style="opacity:0;">
          <v-icon medium dark>view_headline</v-icon>
        </v-btn>
        <v-btn icon class="mr-2" @click="showStationDetails=!showStationDetails">
          <v-icon medium dark>more_horiz</v-icon>
        </v-btn>
      </v-row>

      <v-card 
      style="margin:auto;
      text-align: center;"
      flat
      class='categoryCont transparent'
      v-show="1">
        <small>PODCAST</small>
        <h2 class="categoryTitle">{{ episode.title }}</h2>
        
        <h4 class="categorySubtitle" style="text-transform: uppercase;"><small>{{ episode.subtitle }}</small></h4>
        <div class="categoryDescription">
          <small>
            {{ episode.description }}
          </small>
        </div>
        <div>
          <div style="text-align:center;">

            <v-img
              :max-width="200"
              :src="cover"
              aspect-ratio="1"
              style="margin:auto; background-color: transparent;"
              :class="(isLoading || isPlaying) ? 'pulse' : 'faded'"
              @click="playIfStopped()"
            ></v-img>

          </div>
        </div>
      </v-card>
      <v-card-text style='text-align:center;'>
        <small>
          <span v-if="isLoading" style="color:yellow;">please wait...</span>
          <span v-else-if="!isPlaying">STOPPED</span>
          <span v-else>
            <span>NOW PLAYING</span>
          </span>
        </small>
        <!-- <div v-if="isPlaying">
          <strong>
            {{ this.artist }}
          </strong>
          <br />
          {{ this.title }}
          
        </div> -->
        <div v-if="!isPlaying">
            CLICK PLAY TO<br />START YOUR STREAM
        </div>
        <div v-else>
          <br /><br />
        </div>
      </v-card-text>
      <v-card-actions fluid>

          <v-row justify="space-around">
              <v-btn icon @click="loadPrev" style="margin-top:25px;">
                <v-icon medium dark >skip_previous</v-icon>
              </v-btn>
              <v-icon size="70" v-if="!isPlaying" @click="play">play_circle_filled</v-icon>
              <v-icon size="70" v-if="isPlaying" @click="pause">pause_circle_filled</v-icon>
              <v-btn icon @click="loadNext" style="margin-top:25px;">
                <v-icon medium dark>skip_next</v-icon>
              </v-btn>
              <!-- <v-icon small dark>settings_input_antenna</v-icon> -->
          </v-row>

      </v-card-actions>
      <v-card-actions>
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
            @click="$router.push('/stations/' + currIndex + '/schedule')">
              <v-icon medium dark>calendar_today</v-icon>
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
      </v-card-actions>
    </v-card>

  </div>
</template>

<script>
import Station from '@/models/Station'

export default {
  props: ['station'],
  data() {
    return {
      items: null,
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
        label: null
      },
      isPlaying: false,
      isLoading: false
    }
  },
  methods: {
    playIfStopped() {
      if (!this.isPlaying) {
        this.play()
      }
    },
    swipe (direction) {
      switch(direction) {
        case 'left':
          this.loadPrev();
          break;
        case 'right':
          this.loadNext();
          break; 
      }
    },
    loadPodcast() {
      //this.$dialog.confirm({text: 'This station\'s podcast is available on the station\'s website. We will be adding a podcast listening feature to this app soon, but in the meantime please visit the station\'s website to listen to the podcast there.'})
      this.$router.push('/stations/' + this.currIndex + '/podcast');
    },
    loadPrev() {
      if (this.shuffleOn) {
        this.loadRandom();
        return;
      }
      this.sound.stop();
      this.$router.push('/stations/' + this.nextIndex)
    },
    loadNext() {
      if (this.shuffleOn) {
        this.loadRandom();
        return;
      }
      this.sound.stop();
      this.$router.push('/stations/' + this.prevIndex)
    },
    loadRandom() {
      this.sound.stop();
      this.$router.push('/stations/' + this.randomIndex)
    },
    play() {
      this.isPlaying = true
      this.isLoading = true
      // this.sound.once('load', ()=> {
      //   this.isLoading = false
      //   this.sound.play();
      // });
      // this.sound.once('play', ()=> {
      //   this.isPlaying = true
      // });
      //this.sound.src = this.episode.download_url
      //this.sound.load();
        this.$sound = this.$media.audio({src: this.episode.download_url, type: 'audio/mpeg'}, {
          loop: false,
          volume: 1,
          autoplay: true,
          poster: this.cover
        })
        this.isPlaying = true
    },
    pause() {
      this.isPlaying = false
      this.isLoading = false
      if (this.$sound) {
        this.$sound.pause();
        this.$sound = null;
      }
    },
    decodeHTMLEntities(text) {
        var entities = [
            ['amp', '&'],
            ['apos', '\''],
            ['#x27', '\''],
            ['#x2F', '/'],
            ['#39', '\''],
            ['#47', '/'],
            ['lt', '<'],
            ['gt', '>'],
            ['nbsp', ' '],
            ['quot', '"']
        ];

        for (var i = 0, max = entities.length; i < max; ++i) 
            text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);

        return text;
    },
  },
  computed: {
    currIndex() {
      return this.$route.params.id
    },
    randomIndex() {
      let stations = Station.query().get()
      let currIndex = stations.findIndex((item) => item.id == this.station.id)
      let rand = null
      while(rand === null || rand === currIndex){
        rand = Math.round(Math.random() * (stations.length - 1));
      }
      return rand;
    },
    nextIndex() {
      let stations = Station.query().get()
      let nextIndex = stations.findIndex((item) => item.id == this.station.id) + 1
      if (nextIndex > stations.length-1) {
        nextIndex = 0
      }
      return nextIndex
    },
    prevIndex() {
      let stations = Station.query().get()
      let prevIndex = stations.findIndex((item) => item.id == this.station.id) - 1
      if (prevIndex < 0) {
        prevIndex = stations.length-1
      }
      return prevIndex
    },
    cover() {
      return this.episode.image || 'https://picsum.photos/350/165?random'
    },
    streamurl() {
      return this.episode.download_url
    },
    episode() {
      return this.item.filter((item) => item.id == this.$route.params.id);
    }
  },
  mounted() {

    if (this.station && this.station.podcast) {
      this.$axios.get(this.station.podcast.url).then((res) => {
        this.items = res.data.items
      })
    }

    // this.sound = new Howl({
    //   format: 'mp3',
    //   preload: false,
    //   autoplay: false,
    //   html5: true
    // });

    this.$nextTick(() => {
      this.loaded = true
    })
  }
}
</script>

<style>
.pulse {
	transform: scale(1);
	/* animation: pulse 2s infinite; */
  animation: pulse 2s 3;
}
.faded {
  opacity: 0.40;
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
.iconoff { opacity: 0.6; }
.iconon { opacity: 1;  }
.iconon.theme--dark.v-btn.v-btn--icon {
    color: #fb1313;
}
</style>