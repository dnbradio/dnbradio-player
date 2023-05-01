<template>
  <div>
    <v-snackbar v-model="snackbar" timeout="2500">
      {{ snackbarMessage }}
    </v-snackbar>
    <v-app-bar app style="background-color: rgba(0,0,0,0.4);">
      <v-toolbar-title>
        <nuxt-link to="/" title="dnbradio.com">
          <!-- <v-icon class="mr-2" color="white">mdi-radio-tower</v-icon> -->
        <v-img src="/logo1.png" alt="dnbradio - Est. 2003" style="width: 48px; margin-right: 15px;">

        </v-img></nuxt-link>
      </v-toolbar-title> 
        <v-menu :close-on-content-click="false" offset-y style="z-index:999;">
          <template v-slot:activator="{ on }">
            <v-btn text dark v-on="on">
              <v-icon class="mr-2"  color="yellow">mdi-headphones</v-icon> Listen
            </v-btn>
          </template>
          <v-list style="min-width: 492px;">
            <v-list-item class="grey--text text--darken-1">Top channels:</v-list-item>
            <v-list-item>
              <v-btn text href="/" color="white"><v-icon medium color="white">mdi-broadcast</v-icon> LIVE (Main)</v-btn>
              <v-btn text href="/ch/plush"><v-icon medium color="white" style="transform: rotate(8deg); margin-right: -15px; margin-top: 7px;">mdi-drag-vertical-variant</v-icon><v-icon>mdi-album</v-icon> <span class="grey--text text--darken-1">Plush</span></v-btn>
              <v-btn medium text href="/ch/section8"  class="grey--text text--darken-1"><big class="white--text" style="font-size:1.9em; margin-right:-2px;">S</big>ection8</v-btn>
              <v-btn text href="/ch/dark.st" class="grey--text text--darken-3">D<v-icon light large color="#bd0505" style="transform: rotate(5deg); margin-right: -3px; margin-left: -3px; margin-top: 2px;">mdi-skull-crossbones</v-icon>rk</v-btn>
            </v-list-item>
            <v-list-item class="grey--text text--darken-1">Video channels:</v-list-item>
            <v-list-item>
              <v-btn text href="https://www.twitch.tv/dnbradioofficial"><v-icon color="#6441a5">mdi-twitch</v-icon> Twitch</v-btn> 
              <v-btn text href="https://www.mixcloud.com/live/dnbradiofm/"><span style="color: #52aad8; margin-right: -1px; font-size: 1.8em;">M</span>ixcloud</v-btn>
            </v-list-item>
            <v-list-item class="grey--text text--darken-1">Use your own player:</v-list-item>
            <v-list-item>
              <v-btn small text color="grey darken-1" href="https://source.dnbradio.com/listen.pls?sid=1">MP3 @ 320kbps </v-btn>
            <v-btn small text color="grey darken-1"  href="https://source.dnbradio.com/listen.pls?sid=300">AAC @ 32kbps</v-btn>
            </v-list-item>
          </v-list>

        </v-menu>
 
        <v-menu :close-on-content-click="false" offset-y style="z-index:999;">
          <template v-slot:activator="{ on }">
            <v-btn text dark v-on="on" title="Podcast">
              <!-- <v-badge
                color="error"
                content="23"
                >         -->
                    <v-icon class="mr-2"  color="yellow">mdi-music-box-multiple-outline</v-icon> Mix Archive
              <!-- </v-badge> -->
            </v-btn>
          </template>
          <v-list style="width:340px;">
            <v-list-item class="grey--text text--darken-1">
              <v-btn text href="/sets" color="white"><v-icon class="mr-1">mdi-library</v-icon> Browse..</v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn text href="/sets?sortby=trending" color="yellow"><v-icon>mdi-fire</v-icon> Trending</v-btn>
              <v-btn text href="/sets?sortby=new"><v-icon class="mr-1">mdi-star-plus-outline</v-icon> New</v-btn>
              <v-btn text href="/sets?sortby=old"><v-icon class="mr-1">mdi-star-plus-outline</v-icon> Old</v-btn>
            </v-list-item>
            <v-divider />
            <v-list-item class="grey--text text--darken-1">Tags..</v-list-item>
            <v-list-item style="text-align:left;">
              <v-row class="pr-8 pb-8">
                <v-col :cols="6" v-for="(tag,index) in tags" :key="tag"><v-btn :color="(index==0) ? 'yellow' : ''" small text style="display: inline-block;"
                :href="`/sets?tag=${tag}`"><v-icon>mdi-pound</v-icon>{{ tag }}</v-btn></v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-btn text title="Schedule" dark href="/schedule">
          <v-icon class="mr-2" color="yellow">mdi-calendar-range-outline</v-icon> SCHEDULE
        </v-btn>

        <v-btn text href="https://shop.dnbradio.com" target="_blank">
          <v-icon class="mr-1" color="blue">mdi-tshirt-crew</v-icon>
        </v-btn>
        <!-- <v-btn text><v-icon class="mr-2">mdi-calendar</v-icon></v-btn> -->

        <v-menu :close-on-content-click="false" offset-y style="z-index:999;">
          <template v-slot:activator="{ on }">
            <v-btn
              text
              dark
              v-on="on"
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <div  style="overflow-x: scroll; ">
            <v-row no-gutters>

                  <v-col :cols="12">
                  <v-list>
                    <!-- <v-list-item class="grey--text text--darken-1">
                      <span>Site Map</span>
                    </v-list-item>
                    <v-divider /> -->
                    <!-- <v-list-item><v-btn text href="/sets" color="white darken-1"><v-icon class="mr-1">mdi-music-box-multiple-outline</v-icon> Podcast</v-btn></v-list-item>

                    <v-list-item><v-btn text href="/schedule" color="white darken-1"><v-icon class="mr-1">mdi-calendar</v-icon> Schedule</v-btn></v-list-item> -->
                    <v-list-item><v-btn text href="https://shop.dnbradio.com"><v-icon class="mr-1" color="blue">mdi-tshirt-crew</v-icon> GET MERCH</v-btn></v-list-item>
                    <v-list-item><v-btn text href="/chat" color="grey darken-0"><v-icon class="mr-1" color="#5865F2">mdi-chat</v-icon> Discord / IRC</v-btn></v-list-item>
                    <v-list-item><v-btn text href="/mobile" color="grey darken-0"><v-icon class="mr-1" color="white">mdi-cellphone</v-icon> Mobile App</v-btn></v-list-item>
                  <v-list-item class="grey--text text--darken-1">
                    <span>Support</span>
                  </v-list-item>
                  <v-list-item><v-btn text href="https://patreon.com/dnbradio"><v-icon class="mr-2" color="green">mdi-patreon</v-icon> Patreon</v-btn></v-list-item>
                  <v-list-item><v-btn text href="/donate"><v-icon class="mr-1" color="red">mdi-charity</v-icon> Pledge</v-btn></v-list-item>
 
                  </v-list>
                  </v-col>
                  <v-col :cols="6" v-if="1==0">

                <v-list style="width: 220px;">
                  <v-list-item class="grey--text text--darken-1"></v-list-item>
                  <v-divider />
                  
                  <v-list-item><v-btn text href="/about" color="grey darken-1">About Us</v-btn></v-list-item>
                  <v-list-item><v-btn text href="/dmca" color="grey darken-1">DMCA</v-btn></v-list-item>
                  <v-list-item><v-btn text href="/faq" color="grey darken-1">FAQ</v-btn></v-list-item>

                  
                  <!-- <v-list-item><v-btn text href="/contact" color="grey darken-1">Contact Us</v-btn></v-list-item> -->

 
                  <v-divider />
                  
                  <v-list-item>
                      <!-- <v-btn x-small fab text ><v-icon small medium>mdi-watch</v-icon></v-btn>
                      <v-btn x-small fab text ><v-icon small medium>mdi-cellphone</v-icon></v-btn>
                      <v-btn x-small fab text ><v-icon medium>mdi-laptop</v-icon></v-btn>
                      <v-btn x-small fab text ><v-icon medium>mdi-car</v-icon></v-btn>
                      <v-btn x-small fab text ><v-icon medium>mdi-office-building</v-icon></v-btn> -->
                      <v-spacer></v-spacer>
                      <v-btn plain text href="/mobile" color="white" class="mr-2"><v-icon color="white">mdi-apple-ios</v-icon></v-btn>
                      <v-btn plain text href="/mobile" color="#a4c639"><v-icon>mdi-android</v-icon></v-btn>

                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </div>
        </v-menu>


         <v-spacer></v-spacer>
       
        <v-menu :close-on-content-click="false" offset-y style="z-index:999;">
          <template v-slot:activator="{ on }">
            <v-btn
              text
              dark
              v-on="on"
            >
               <v-icon>mdi-account</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item class="grey--text text--darken-1">DJ Tools</v-list-item>
            <v-list-item>
              <v-btn text href="/start" color="yellow"><v-icon class="mr-1">mdi-broadcast</v-icon> Start streaming</v-btn>
            </v-list-item>
            <v-divider />
            <!-- <v-list-item>
              <v-btn text href="/dj/profile"><v-icon class="mr-1">mdi-account-music-outline</v-icon> My dj profile</v-btn>
            </v-list-item> -->
            <v-list-item>
              <v-btn text href="/sets/?filter=mine"><v-icon class="mr-1">mdi-music-box-multiple-outline</v-icon> My mixes</v-btn>
            </v-list-item>
            <!-- <v-list-item>
              <v-btn text href="/dj/snippets"><v-icon class="mr-1">mdi-scissors-cutting</v-icon> My snippets</v-btn>
            </v-list-item> -->
            <v-divider />
            <v-list-item class="grey--text text--darken-1">Your Account</v-list-item>
            <v-list-item>
              <v-btn text href="/me"><v-icon class="mr-1">mdi-account-circle</v-icon> User settings</v-btn>
            </v-list-item>
            <v-list-item>
              <v-btn text href="/login">Login</v-btn> 
              <v-btn text href="/logout">Logout</v-btn>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <!-- <v-btn text href="/faq">FAQ</v-btn> -->
              <v-btn x-small text href="https://patreon.com/dnbradio"><v-icon  class="mr-2" color="green">mdi-patreon</v-icon> Patreon</v-btn>
              <v-btn x-small text href="/donate"><v-icon color="red" class="mr-1">mdi-charity</v-icon> Pledge</v-btn>
            </v-list-item>

          </v-list>
        </v-menu>
 

 
 




    </v-app-bar>
  </div>
</template>

<script>
export default {
  data: () => ({
    snackbar: false,
    snackbarMessage: '',
    search: '',
    showSearch: false,
    tags: [  'liquid', 'deep', 'moody', 'minimal', 'atmospheric', 'drum and bass', 'jungle', 'dnb', 'dark' ],
  }),
  methods: {
    launchLink(url) {
      window.location = url
    }
  },
  mounted() {
    this.$bus.$on('snackbar', message => {
      this.snackbarMessage = message;
      this.snackbar = true;
    });
  },
  computed: {
  }
}
</script>

<style>

</style>