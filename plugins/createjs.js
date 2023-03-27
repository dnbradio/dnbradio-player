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
      "https://res.cloudinary.com/labelgrid/image/upload/c_scale,w_869/v1597369102/logotags_zoom_1400_dnbr_dnbr-cropped.png",
    preload: "auto"
  }
);

Vue.prototype.$sound.addEventListener("timeupdate", function(event) {
  $nuxt.$emit("audioProgress", event);
});
Vue.prototype.$sound.addEventListener("durationchange", function(event) {
  $nuxt.$emit("audioDuration", event);
});
