<template>
<div class="chatlog">
  <v-card
    max-width="420"
    class="mx-auto"
    flat
    transparent>
  <div>
    <v-list  dark style="background:transparent;">
      <div v-for="(item, index) in filteredData" :key="index">
      <template>

        <v-list-item
          class="message"
        >
        <v-col class="shrink" style="min-width:80px">
          <v-list-item-content class="text-right">
            <!-- <v-img :src="item.avatar"></v-img> -->
            <span style="color: #39FF14;">{{ item.nick }}</span>
          </v-list-item-content>
        </v-col>
        <v-col class="grow">
          <v-list-item-content class="text-left"  >
            <div v-html="item.message"  class="text-left"></div>
            <!-- <v-list-item-subtitle v-html="item.subtitle"></v-list-item-subtitle> -->
          </v-list-item-content>
        </v-col>
        </v-list-item>
      </template>
      </div>
    </v-list>
    </div>
  </v-card>
</div>
</template>

<script>

// init data
import stations from '@/data/stations'

// models
import Station from '@/models/Station'

// comp
import StationList from '~/components/StationList'
import Logo from '~/components/Logo.vue'

export default {
  layout: 'ls-widget',
  components: {
    Logo,
    StationList
  },
  data() {
    return {
      data: []
    }
  },
  methods: {
    fetchData() {
      this.$axios.get('https://dnbradio.hardcoding.nl/api/chat_log', {progress: false}).then((res) => {
        this.data = res.data
        setTimeout(() => {
          document.querySelector('.chatlog').scrollTo(0,document.querySelector(".chatlog").scrollHeight)
        }, 1000)
      })
    }
  },
  mounted() {
    this.fetchData();
    setInterval(() => {
      this.fetchData()
    }, 5000);
  },
  computed: {
    filteredData() {
      return this.data.slice(0, 30).map((item) => {
        item.message = item.message.replace('ACTION ', '').replace('', '')
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .trim();
        return item
      }).reverse()
    }
  }
}
</script>
<style>
  .theme--light.v-card, .theme--light.v-sheet { background-color: transparent !important; }
  .chatlog { color: #fff; max-height: 380px; font-size: 14px; overflow-x: hidden; overflow-y: scroll;}
  .chatlog::-webkit-scrollbar { display: none; }
  .v-list-item.message { min-height: 10px !important; }
  .chatlog, .v-list-item__title { font-size: 14px; }
  .chatlog .v-list-item__content { color: #efefef !important; font-family: 'Roboto', sans-serif;  font-weight: bold; padding: 0px; }
  .v-list .col { padding: 0px; padding-top: 0px; }
  .v-list-item { min-height: 10px; }
</style>