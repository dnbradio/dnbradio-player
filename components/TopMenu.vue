<template>
  <v-tabs dark grow style="border-radius: 10px;" hide-slider>
    <v-tab>home</v-tab>
    <v-tab @click="launchPlay">listen
    </v-tab>
    <v-tab>schedule</v-tab>
    <v-tab>playlist</v-tab>
    <v-tab>archives</v-tab>
    <v-tab>shop</v-tab>
    <v-tab>donate</v-tab>
    <v-tab>chat</v-tab>
  </v-tabs>
</template>

<script>
export default {
  methods: {
    launchPlay() {

    }
  },
}
</script>