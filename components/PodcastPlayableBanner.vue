<template>
<v-responsive>
  <v-card width="100%" class="transparent">
    <div style="border: 1px solid #2e2e2e; border-radius: 16px;  margin: auto;">
      <v-img  width="600" height="180"
      :alt="item.title" 
      cover
      :src="image" cover class="show-banner" 
      @click="viewPodcast(item.id)">
        <v-app-bar flat color="rgba(0, 0, 0, 0)" style="height: auto; padding:0px">
          <div class="black--text yellow pl-1 pr-2 rounded-pill">
            <v-icon class="black--text" small>mdi-play</v-icon> 
            <small>{{ Number(item.plays).toLocaleString() }}</small>
          </div>
          <v-spacer />
          <v-app-bar-nav-icon v-if="item.tracklist" title="TRACKLIST: yes">
            <v-icon class="v-app-bar-icon">mdi-format-list-checkbox</v-icon>
          </v-app-bar-nav-icon>
        </v-app-bar>
      </v-img>
    </div>
    <v-card-text style="width: 270px; margin: auto;" class="pt-0 pl-0">
      <v-row dense>
      <v-col :cols="12">
          <div class="subtitle-2 white--text" style="line-height: normal;">
            <div class="text-truncate pt-0 mt-0"><router-link :to="`set/${item.id}`">{{ item.title }}</router-link></div>
            <div class="subtitle-2"> 
              <v-avatar size="16">
                <img :alt="item.title" src="https://cdn.pixabay.com/photo/2020/06/24/19/12/cabbage-5337431_1280.jpg" />
              </v-avatar> by {{ item.artist }}
            </div>
            <div class="grey--text text--darken-2"><small>recorded {{ timestamp }}</small></div>
          </div>
      </v-col>
      </v-row>
    </v-card-text>
  </v-card>

    <!-- <v-card>
 
      <v-img :src=""></v-img>
 

    <v-list-item-content>
      <v-list-item-title v-html="item.artist"></v-list-item-title>
      <v-list-item-subtitle v-html="item.title"></v-list-item-subtitle>
      <v-list-item-subtitle class="text-right" style="margin-top:-60px;"><small>RECORDED:<br />{{ item.timestamp }}</small></v-list-item-subtitle>
    </v-list-item-content>
  </v-vard> -->
</v-responsive>
</template>

<script>
export default {
  data() {
    return {

    }
  },
  methods: {
    viewPodcast(id) {
      this.$router.push(`/sets/${id}`)
    }
  },
  props: [ 'item', 'index' ],
  computed: {
    timestamp() {
      return this.item?.timestamp?.substr(0,10);
    },
    image() {
      if (this.item.picture.indexOf('http') !== -1) {
        return `https://res.cloudinary.com/labelgrid/image/fetch/w_355,h_180/${this.item.picture}`;
      } else if (this.item.picture) {
        return `https://res.cloudinary.com/labelgrid/image/fetch/w_355,h_180/https://dnbradio.com/assets/swframework/${this.item.picture}`
      } else {
        return '/dnbradio_podcast_banner.jpeg'
      }
    }
  }
}
</script>

<style scope>
.v-app-bar-icon {
  color: #121212 !important; background-color: yellow; border-radius: 4px;
}
.repeating-gradient {
  background-image: repeating-linear-gradient(-45deg,
    rgba(22, 21, 21, 0.25),
    rgba(83, 83, 83, 0.25) 5px,
    rgba(49, 49, 49, 0.25) 5px,
    rgba(12, 12, 12, 0.25) 10px
  );
}
.show-banner {
  border-radius: 4px;
  border: 0px solid yellow;
}
.show-banner:hover {
  cursor: pointer;
  border: 2px solid yellow;
}
.show-banner:hover .v-image__image {
  background-size: cover;
}

.subtitle-2 a { color: yellow; text-decoration: none !important; font-size: 12px;}
.subtitle-2 a:hover { color: white !important; text-decoration: none !important;}
</style>