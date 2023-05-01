<template>
  <v-tabs dark hide-slider class="mainmenu">
    <v-tab>home</v-tab>
    <v-tab @click="launchPlay">listen</v-tab>
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

<style>
.v-tabs.mainmenu { width: 800px; padding-left: 40px; }
.v-tabs__wrapper {    }
.v-tabs.mainmenu .v-tab {  font-size:0.7em; }
 .theme--dark.v-tabs.mainmenu > .v-tabs-bar {
    background-color: #676b6f;
}
</style>