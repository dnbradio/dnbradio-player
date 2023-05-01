<template>
  <v-container>
    <v-card v-if="activeView=='countdown'" class="mt-16">
      <v-card-text class="text-center">
        <h2 v-if="countDown>0">Your stream will start in: {{ countDown }}</h2>
        <div v-else>
          <h2>Stream started</h2>
          <p>Redirecting..</p>
        </div>
      </v-card-text>
    </v-card>
    <v-form v-if="activeView=='form'" ref="form" v-model="valid" lazy-validation>
      <v-card class="transparent" flat>
        <v-card-text>
          <h1>Start Streaming</h1>
          <p>On the final step, select your relay and configure your encoder on your local machine.</p>

          <h2 class="mt-12">Show Information</h2>
          <v-text-field v-model="form.artist" :counter="50" required
            :rules="[rules.required, rules.alphanum, rules.counter50]"
            placeholder="DJ / Artist name(s)"
            hint="alpha-numeric only" />
           <v-text-field v-model="form.title" :counter="50" required
            :rules="[rules.required, rules.alphanum, rules.counter50]"
            placeholder="Show title"
            hint="alpha-numeric only" />
           <v-textarea v-model="form.description"
            placeholder="Show description"
            persistent-hint
            hint="Description, links, contact info, booking info." />
           <v-select v-model="form.genre"
            :items="genreOptions"
            multiple
            placeholder="Genre(s)"
            hint="Separate by comma; examples: liquid, jungle, oldschool, neuro, various dnb" />
           <v-text-field v-model="form.mood"
            placeholder="Mood"
            hint="Separate by comma; examples: melodic, uplifting, mellow, dark)" />
           <v-text-field v-model="form.website"
            type="url"
            :rules="[rules.url]"
            placeholder="Website URL" />
        </v-card-text>
      </v-card>
      <v-card class="mt-6 transparent">
        <v-card-text>
          <h2>Encoder Settings</h2>
           <p class="mt-3">Choose the closest server and add these setting to your encoder.</p>
          <v-select v-model="selectedRelayIndex" required large
            :items="relayOptions">
          </v-select>
          <div style="text-align: right;"><v-btn  @click="showRelay=!showRelay" class="mb-12">View relay connection details</v-btn></div>
          <div v-if="showRelay" light width="350">
            <v-card  style="padding: 20px;">
              <h2>{{ selectedRelay.name }}</h2>
              <div>
                host: {{ selectedRelay.host }}<br />
                port: {{ selectedRelay.port }}<br />
                <span v-if="selectedRelay.username">
                  username: {{ selectedRelay.username }}<br />
                </span>
                password: {{ selectedRelay.password }}<br />
                mountpoint: {{ selectedRelay.mountpoint || 'leave blank' }}<br />
              </div>
            </v-card>
          </div>


          <h3>Record?</h3>
          <v-checkbox v-model="form.archive" label="Record this show to the archives?" style="width:290px;" />

          <div class="pt-6 pb-6">
            <h3>Notice</h3>
            <p>Check your connection</p>
            <p class="mt-3 pb-12">Ensure your encoder (BUTT, Nicecast, ShoutCAST, or other) are configured properly before continuing.</p>

            <h3 class="mt-12">Start Streaming</h3>
            <p>Before you start, make sure your encoder connected and sending data. A countdown timer will appear on the next page.</p>
            <br /> <v-btn class="mt-5" light @click="submit" color="yellow">START STREAMING</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-form>

  </v-container>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

export default {
  components: { VueJsonPretty },
  methods: {
    submit() {
      this.activeView = 'countdown'
      this.countDownTimer();
      return;
      this.$axios.post('/api/recordings', this.form).then((res)=> {
        this.countDownTimer();
      }).catch(err=> {
        this.$dialog.message.error(err.message, {
          centered: true
        })
      });
    },
    countDownTimer() {
      if(this.countDown > 0) {
        setTimeout(() => {
          this.countDown -= 1
          this.countDownTimer()
        }, 1000)
      }
    }
  },
  layout: 'legacy',
  data() {
    return {
      countDown: 20,
      activeView: 'form',
      genres: [
        'drum and bass',
        'dark',
        'jungle',
        'liquid',
        'neuro',
        'breakcore',
        'crossbreed',
        'jumpup',
        'various',
        'classics',
        'techstep',
        'smooth',
      ],
      rules: {
        required: (value) => !!value || 'Required.',
        url: (value) => {
          let url;
          try {
            url = new URL(str);
          } catch (_) { return false; }
          return url.protocol === "http:" || url.protocol === "https:" || 'URL is not valid';
        },
        alphanum: (value) => {
          const pattern = /^[a-z0-9,\- _=\[\]\(\)\+|\.;]+$/i
          return pattern.test(value) || 'Invalid.'
        },
        email: value => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return pattern.test(value) || 'Invalid e-mail.'
        },
        counter50: (value) => !value || value.length <= 50 || 'Max 50 characters',
      },
      valid: false,
      showRelay: false,
      selectedRelayIndex: 0,
      relays: [
        {
          name: 'Relay 1 (UK)',
          type: 'shoutcast',
          host: 'djsource.dnbradio.com',
          port: '6005',
          password: 'dnbdj2',
          mountpoint: '',
        },
        {
          name: 'Relay 2 (US)',
          type: 'shoutcast',
          host: 'us.djsource.dnbradio.com',
          port: '6005',
          password: 'dnbdj2',
          mountpoint: '',
        },
        {
          name: 'Alternate 1 (NL)',
          type: 'shoutcast',
          host: 'djsource.hardcoding.nl',
          port: '8002',
          password: 'dnbdj2',
          mountpoint: '',
        },
        {
          name: 'OGG Vorbis',
          type: 'icecast',
          host: 'djsource.dnbradio.com',
          port: '13128',
          username: 'dj',
          password: 'dnboggdj',
          mountpoint: '/dnbradio_dj.ogg',
        }
      ],
      form: {
        filename: 'http://djsource.dnbradio.com:6005',
        cued: 0,
        artist: null,
        title: null,
        userId: null,
        description: null,
        website: null,
        cued: 0,
        tags: null,
        genre: null,
        mood: null,
        label: 'DNBRADIO',
        album: null,
        albumyear: null,
        archive: 1,
        posttoSoundcloud: null,
        active: 1
      }
    }
  },
  computed: {
    formExtended() {
      return {
        ...this.form,
        genre: this.form.genre?.join(', ') ?? '',
        filename: this.selectedRelayUrl,
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
			  rssPublishDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        album: 'dnbradio archives',
        albumyear: new Date().toISOString().slice(0, 4),
        userId: null
      }
    },
    selectedRelayUrl() {
      if (!this.selectedRelay) {
        return ''
      }
      return 'http://' + this.selectedRelay.host + ':' + this.selectedRelay.port;
    },
    genreOptions() {
      let genres = this.genres.map(item=>item)
      genres.sort((a,b)=>a.localeCompare(b))
      return genres;
    },
    selectedRelay() {
      return this.relays?.[this.selectedRelayIndex ?? 0]
    },
    relayOptions() {
      return this.relays.map((item,index)=>({ value: index, text: `${item.name} - ${item.host}:${item.port}` }));
    }
  },
  mounted() {
    this.$nextTick(()=> {
    })
  }
}
</script>

<style scoped>
.theme--light.v-card > .v-card__text h1 { margin-top: 40px; }
.theme--light.v-card > .v-card__text h2 { margin-top: 20px; }
.theme--light.v-card > .v-card__text h3 { margin-top: 20px; }
</style>