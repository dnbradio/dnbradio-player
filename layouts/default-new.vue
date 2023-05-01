<template>
  <v-app dark v-cloak>
    <div class="module">
      <v-main>
        <v-container class="module-inside">
          <nuxt />
        </v-container>
      </v-main>
    </div>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
    }
  },
  beforeCreate() {
    if (process.client) {
      let userAgent = navigator.userAgent
      console.log(userAgent);
      if (/iphone_os_4|iphone_os_5|iphone_os_6|iphone_os_7|iphone_os_8|iphone_os_9|safari\/525|safari\/533|safari\/534|safari\/601|safari\/600/i.test(userAgent)) {
        console.log('redirecting...');
        window.location.href='https://dnbradio.com/mobile';
        return;
      }
    }
  }
}
</script>
<style>
  .theme--dark.v-application { background: black; }
  .v-dialog--active .theme--dark.v-sheet { background: black; }
  [v-cloak] {
    display: none;
  }
  .vuedl-layout { background-color: darkslategrey; }
  .v-dialog.v-dialog--active v-card.v-sheet.theme--dark { background: #100f0f; }
  .v-autocomplete__content .theme--dark.v-card { background: #191919; }
  .theme--dark.v-list-item .v-list-item__mask {
      color: rgba(255, 255, 255, 0.73);
      background: #040404;
  }
  .v-card.v-sheet.theme--dark {
    
  }
  .module {
  position: relative;
}
 
.module-inside {
  /* This will make it stack on top of the ::before */
  position: relative;
}
</style>

