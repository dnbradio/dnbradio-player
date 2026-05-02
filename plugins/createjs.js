import Vue from "vue";
//import createjs from 'createjs'
const media = require("simple-media-element");

Vue.config.productionTip = false;
Vue.prototype.$media = media;
Vue.prototype.$sound = media.audio(
  {
    src: "", // default
    type: "audio/mpeg"
  },
  {
    loop: true,
    volume: 1,
    autoplay: true,
    poster:
      "https://dnbradio.com/images/logotags.png",
    preload: "auto"
  }
);

Vue.prototype.$sound.addEventListener("timeupdate", function(event) {
  $nuxt.$emit("audioProgress", event);
});
Vue.prototype.$sound.addEventListener("durationchange", function(event) {
  $nuxt.$emit("audioDuration", event);
});
