<template>
  <v-app dark v-cloak>
    <client-only>
      <v-main class="module">
        <v-container class="module-inside">
          <nuxt />
        </v-container>
      </v-main>
    </client-only>
  </v-app>
</template>

<script>
export default {
  data() {
    return {};
  },
  beforeCreate() {
    if (process.client) {
      let userAgent = navigator.userAgent;
      console.log(userAgent);
      if (
        /iphone_os_4|iphone_os_5|iphone_os_6|iphone_os_7|iphone_os_8|iphone_os_9|safari\/525|safari\/533|safari\/534|safari\/601|safari\/600/i.test(
          userAgent
        )
      ) {
        console.log("redirecting...");
        window.location.href = "https://dnbradio.com/mobile";
        return;
      }
    }
  }
};
</script>
<style>
.theme--dark.v-application {
  background: black;
}
.v-dialog--active .theme--dark.v-sheet {
  background: black;
}
[v-cloak] {
  display: none;
}
.vuedl-layout {
  background-color: darkslategrey;
}
.v-dialog.v-dialog--active v-card.v-sheet.theme--dark {
  background: #100f0f;
}
.v-autocomplete__content .theme--dark.v-card {
  background: #191919;
}
.theme--dark.v-list-item .v-list-item__mask {
  color: rgba(255, 255, 255, 0.73);
  background: #040404;
}

.module {
  position: relative;
}
.module::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* background-image: url('https://res.cloudinary.com/dgp7z9vkg/image/upload/c_scale,w_1436/v1585703166/bg.jpg'); */
  filter: grayscale(100%);
  background-size: cover;
  background-position: top;
  filter: brightness(80%) blur(115px) opacity(0.3);
  background-repeat: no-repeat;
  position: fixed;
  width: 100%;
}
.module-inside {
  /* This will make it stack on top of the ::before */
  position: relative;
  padding:  2px;
}

</style>
