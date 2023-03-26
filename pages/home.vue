<template>
  <div>
    <v-container fluid style="background: #fff;" >
      <v-row>
        <v-col cols="12" style="background: #000;">
          <TopMenu />
        </v-col>
        <v-col cols="12" style="width: 650px; background: #000;">
            <div id="twitchDiv"></div>
        </v-col>
        <v-col cols="8" style="background: #fff; font-size: 12px; color: #000;">
          <v-card flat>
            Column 1
          </v-card>
        </v-col>
        <v-col cols="4" style="background: #fff; font-size: 12px; color: #000;">
          <v-card flat>
            <h3>Get involved!</h3>
            <br />
            <v-btn>Donate to dnbradio</v-btn>
            <br /><small>helps pay server fees</small>
          </v-card>

          <v-card flat style="margin-top: 15px;">
            <h3>Playing Next</h3>
            <p style="font-size:11px;">
              01.)	Q-Project - Champion Sound - TS HC will never die remix
              <br />02.) Fistfunk - Rebellion
              <br />03.) Marcus_Intalex_and_ST_Files - Lose Control
            </p>
          </v-card>

          <v-card flat style="margin-top: 15px;">
            <h3>Recently Played</h3>
            <p>
              01.)	Q-Project - Champion Sound - TS HC will never die remix
              <br />02.) Fistfunk - Rebellion
              <br />03.) Marcus_Intalex_and_ST_Files - Lose Control
              <br />04.) EZ_Rollers - Diff Step
              <br />05.) Soligen &amp; Type 2 - I Can Tell (Original Mix)
              <br />06.) Nightwalker - Hacker
              <br />07.) Signal - Ten Paths
              <br />08.) Cause4Concern - Ricochet
            </p>
          </v-card>

          <v-card flat style="margin-top: 15px; text-align:center;">
            <img src="https://dnbradio.com/img/mediakit_ildnb_small.jpg" />
          </v-card>
        </v-col>
        <v-col cols="12" style="text-align:center;">
          <a href="/archive">
            <img src="https://feeds.feedburner.com/dnbradioarchive.gif?w=2&c=1&bb=3lhq" style="margin: auto;" width="468" height="60" />
          </a>
        </v-col>
      </v-row>
    </v-container>
     
  </div>
</template>

<script>
import TopMenu from '~/components/TopMenu'
export default {
  layout: 'legacy',
  components: { TopMenu },
  methods: {
    launchPlay() {
      
    }
  },
  mounted() {
    var options = {
      width: '100%',
      height: '330',
      branding: false,
      showInfo: false,
      channel: "dnbradioofficial",
      autoplay: false,
      muted: false,
      // only needed if your site is also embedded on embed.example.com and othersite.example.com 
      parent: ["www.dnbradio.com", "dnbradio.com", "192.168.50.213:9000"],
    };
    var player = new Twitch.Player("twitchDiv", options);
    player.setVolume(1);
  }
}

 
</script>
<style>
.playerNavBar {  margin-top: 12px; text-align: right; font-size: 16px; margin-bottom: 10px;}
.playerNavBar a { color: white !important; text-decoration: none; padding: 5px; 
  background-color: #837D7D; }
.playerNavBar a:hover { background-color: #3D3838 !important; }
</style>	
 