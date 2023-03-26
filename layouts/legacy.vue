<template>
  <div style="width: 1280px; margin:auto; margin-top: 50px;">
    <client-only>
      <v-container fluid>
        <v-row justify="“center”" align="“center”" dense>
          <v-col cols="2">
            <v-card flat style="background:none; width: 220px;">
              <div style="min-height: 440px; padding:10px;">
                <img
                  src="https://res.cloudinary.com/labelgrid/image/upload/c_scale,w_269/v1597369102/logotags_zoom_1400_dnbr_dnbr-cropped.png"
                  width="203"
                  height="212"
                />
                <h1 class="homeTitle" style="text-align:center;">
                  DNBRADIO: 24/7 Drum and Bass, Darkstep, Liquid DNB, Jungle
                </h1>
                <div
                  style="line-height: 2.5em; width: 120px; margin: auto; text-align:center;color:#fff;"
                >
                  <p>
                    <v-icon size="70" style="color: #fff;"
                      >play_circle_filled</v-icon
                    >
                  </p>
                  <p>Welcome, guest.</p>
                  <v-btn small>login</v-btn>
                  <br />
                  <v-btn smal>signup</v-btn>
                  <br /><br />Switch bitrate: <br /><v-btn fab>192k</v-btn>
                  <v-btn fab>96k</v-btn>
                  <v-btn small>HELP</v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="8">
            <v-card width="925" style="padding: 10px;">
              <nuxt />
            </v-card>
          </v-col>
          <v-col cols="2">
            <v-card flat style="background:none;">
              <div
                style=" height: 440px; padding: 0px; font-size: 13px; color: #fff;"
              >
                <br />
                <v-btn>Donate</v-btn>
                <br /><br />Donations help pay licensing, hosting, and
                development.<br /><br />

                <strong>Latest Contributions</strong>
                <div
                  v-for="person in persons"
                  :key="person.name"
                  style="font-size: 1.1em;"
                >
                  {{ person.amount }} {{ person.name }}
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card
              flat
              style="text-align:center;background: none; color:#fff;font-size: 14px;"
            >
              home | join| play | schedule | archive | playlist | shop | chat |
              donate
              <br /><small
                >Copyright © {{ currentYear }} - dnbradio - All Rights
                Reserved.</small
              >
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </client-only>
  </div>
</template>
<script>
export default {
  data() {
    return {
      persons: [
        { name: "george", amount: "$30.00" },
        { name: "sharkdnb", amount: "$30.00" },
        { name: "davetherave_11", amount: "$25.00" },
        { name: "remman4", amount: "$20.00" },
        { name: "Industry", amount: "$29.00" },
        { name: "disorderkc", amount: "$20.00" },
        { name: "flapjack89", amount: "$15.00" }
      ]
    };
  },
  computed: {
    currentYear() {
      return new Date().getFullYear();
    }
  }
};
</script>
<style>
body {
  background-color: #000400;
  background-image: url(/player/bg_gradient.jpg);
  background-repeat: repeat-x;
  margin: 0px;
  font-family: Tahoma, Helvetica, Verdana;
  font-size: 1em;
  margin-top: 0px;
  padding: 0px;
  margin-bottom: 20px;
}
h1.homeTitle {
  font-size: 14px;
  margin: 0px;
  color: #fff;
}
.v-tab--active {
  color: #fff !important;
}
</style>
