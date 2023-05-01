<template>
  <v-footer padless>
    <v-card flat tile color="black" class="lighten-1 white--text text-center" width="100%">
      <v-card-text class="white--text">
         <strong>dnbradio.com — {{ new Date().getFullYear() }}</strong>
      </v-card-text>
      <v-card-text>
        <span v-for="item in icons" :key="item.icon">
          <v-btn icon :href="item.link" class="mx-4 grey--text darken-2">
            <v-icon size="24px">{{ item.icon }}</v-icon>
          </v-btn>
        </span>
      </v-card-text>
      <v-card-text class="white--text pt-0">
        We are a collective of radio presenters dedicated to building a community that gives to charitable causes through music.
      </v-card-text>
      <v-divider></v-divider>
    </v-card>
  </v-footer>
</template>

<script>
  export default {
    data: () => ({
      icons: [
        { icon: 'mdi-facebook', link: 'https://facebook.com/dnbradio' },
        { icon: 'mdi-twitter', link: 'https://twitter.com/dnbradio' },
        { icon: 'mdi-twitch', link: 'https://www.twitch.tv/dnbradioofficial' },
        { icon: 'mdi-instagram', link: 'https://instagram.com/dnbradio' },
      ],
    }),
  }
</script>