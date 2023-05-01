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
      <v-card dark class="transparent">
        <v-card-text>
          <h1>Start Streaming</h1>
          <p>On the final step, select your relay and configure your encoder on your local machine.</p>

          <h2 class="mt-12">Artist name(s)</h2>
          <v-text-field v-model="form.artist" :counter="50" required
            :rules="[rules.required, rules.alphanum, rules.counter50]" 
            placeholder="DJ / Artist name(s)"
            hint="alpha-numeric only" />
          <h2>Show title</h2>
          <v-text-field v-model="form.title" :counter="50" required 
            :rules="[rules.required, rules.alphanum, rules.counter50]"
            placeholder="Show title"
            hint="alpha-numeric only" />
          <h2 class="mt-12">Show description</h2>
          <v-textarea v-model="form.description" 
            placeholder="Show description"
            persistent-hint
            hint="Extended show description, links, contact info, booking info." />
          <h2 class="mt-12">Genre</h2>
          <v-select v-model="form.genre" 
            :items="genreOptions"
            multiple
            placeholder="Genre(s)"
            hint="Separate by comma; examples: liquid, jungle, oldschool, neuro, various dnb" />
          <h2>Mood</h2>
          <v-text-field v-model="form.mood" 
            placeholder="Mood"
            hint="Separate by comma; examples: melodic, uplifting, mellow, dark)" />
          <h2 class="mt-12">Website</h2>
          <v-text-field v-model="form.website" 
            type="url"
            :rules="[rules.url]"
            placeholder="Website URL" />
        </v-card-text>
      </v-card>
      <v-card class="mt-6 transparent" dark>
        <v-card-text>
          <h1>Encoder Settings</h1>
          <h2>Target Relay</h2>
          <p class="mt-3">Choose the closest server and add these setting to your encoder.</p>
          <v-select v-model="selectedRelayIndex" required large
            :items="relayOptions">
          </v-select>
          <div style="text-align: right;"><v-btn  @click="showRelay=1" class="mb-12">View relay connection details</v-btn></div>
          <h1>Record?</h1>
          <v-checkbox v-model="form.archive" label="Record this show to the archives?" style="width:290px;" />

          <div class="pt-6 pb-6">
            <h1>Notice</h1>
            <h2>Check your connection</h2>
            <p class="mt-3 pb-12">Ensure your encoder (BUTT, Nicecast, ShoutCAST, or other) are configured properly before continuing.</p>

            <h1 class="mt-12">Start Streaming</h1>
            <h2>Is your encoder connected and sending data?</h2>
            <p>A countdown timer will appear on the next page.</p>
            <v-btn class="mt-3" light @click="submit" color="yellow">YES, START STREAMING</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-form>

    <v-dialog v-model="showRelay" light>
      <v-card dark>
        <h2>{{ selectedRelay.name }}</h2>
        <div>
          <vue-json-pretty :data="selectedRelay"> </vue-json-pretty>
        </div>
      </v-card>
    </v-dialog>
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
.theme--dark.v-card > .v-card__text h1 { margin-top: 40px; }
.theme--dark.v-card > .v-card__text h2 { margin-top: 20px; }
</style>