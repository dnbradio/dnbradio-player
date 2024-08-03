const nodeExternals = require("webpack-node-externals");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const VuetifyLoaderPlugin = require("vuetify-loader/lib/plugin");
const IgnorePlugin = require("webpack").IgnorePlugin;
const MomentTimezoneDataPlugin = require("moment-timezone-data-webpack-plugin");
const rightNow = new Date();
const APP_VERSION = rightNow
  .toISOString()
  .slice(2, 16)
  .replace(/-/g, ".")
  .replace(/:/g, "")
  .replace(/T/g, ".");
require("dotenv").config();
const features = [
  "fetch",
  "Object.entries",
  "Object.values",
  "IntersectionObserver",
  "Array.from",
].join("%2C");

module.exports = {
  ssr: false,
  target: "static",
  telemetry: false,
  privateRuntimeConfig: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_ACCESS_REGION: process.env.AWS_ACCESS_REGION,
    MONGO_INITDB_HOST: process.env.MONGO_INITDB_HOST,
    MONGO_INITDB_DATABASE: process.env.MONGO_INITDB_DATABASE,
    MONGO_INITDB_ROOT_USERNAME: process.env.MONGO_INITDB_ROOT_USERNAME,
    MONGO_INITDB_ROOT_PASSWORD: process.env.MONGO_INITDB_ROOT_PASSWORD,
  },
  publicRuntimeConfig: {
    APP_VERSION: process.env.APP_VERSION || APP_VERSION,
    APP_BRANCH: process.env.APP_BRANCH || "",
    APP_BASE_URL: process.env.ROUTER_BASE || "/",
  },
  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: "%s - dnbradio.com",
    title:
      "dnbradio - Listen live 24/7 to drum & bass mixes, liquid, jungle, & neuro streamed globally",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content:
          "24/7 drum & bass, jungle, neuro, and drum funk with live dj's streaming worldwide",
      },
    ],
    link: [
      {
        rel: "icon",
        type: "image/png",
        href: "https://dnbradio.com/img/logotags.png",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons",
      },
      {
        rel: "image_src",
        type: "image/png",
        href: "https://dnbradio.com/img/logotags.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        href: "https://dnbradio.com/img/logotags.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "https://dnbradio.com/img/logotags.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "https://dnbradio.com/img/logotags.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "https://dnbradio.com/img/logotags.png",
      },
    ],
    script: [
      { src: "https://code.createjs.com/1.0.0/soundjs.min.js", mode: "client" },
      // { src: "https://player.twitch.tv/js/embed/v1.js", mode: "client" },
      {
        src: `https://polyfill.io/v3/polyfill.min.js?features=${features}`,
        body: true,
      },
      {
        src: "https://plausible.io/js/script.js",
        defer: true,
        "data-domain": "dnbradio.com",
      },
    ],
  },
  loading: { color: "#fff" },
  plugins: [
    { ssr: false, src: "~/plugins/vuetify.js" },
    { ssr: false, src: "~plugins/createjs.js" },
    { ssr: false, src: "~plugins/headful.js" },
  ],
  //buildModules: ["@nuxtjs/vuetify"],
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    "@nuxtjs/axios",
    "@nuxtjs/proxy",
    "nuxtjs-mdi-font",
    "vuetify-dialog/nuxt",
    // "@nuxtjs/pwa",
    "@nuxtjs/device",
  ],
  server: {
    port: process.env.NODE_PORT || 8000,
    host: process.env.NODE_HOST || "0.0.0.0",
  },
  build: {
    postcss: null,
    extractCSS: true,
    extend(config, ctx) {
      if (ctx && ctx.isClient) {
        if (process.env.NODE_ENV !== "production") {
          //config.plugins.push(new BundleAnalyzerPlugin());
        }
        config.plugins.push(new VuetifyLoaderPlugin());
        config.plugins.push(
          new IgnorePlugin(/^\.\/locale$/, /moment-timezone$/)
        );
        const currentYear = new Date().getFullYear();
        const plugin = new MomentTimezoneDataPlugin({
          startYear: currentYear - 2,
          endYear: currentYear + 10,
        });
        config.plugins.push(plugin);
        config.optimization.splitChunks.maxSize = 51200;
      }
    },
  },
  router: {
    // middleware: 'user-agent',
    base: process.env.ROUTER_BASE
      ? process.env.ROUTER_BASE
      : process.env.NODE_ENV == "development"
      ? "/"
      : "/",
    extendRoutes(routes, resolve) {
      routes.push({
        name: "station1",
        path: "/",
        component: resolve(__dirname, "pages/stations/_stationId/index.vue"),
      });
      routes.push({
        name: "darkst",
        path: "/darkstep",
        component: resolve(__dirname, "pages/stations/_stationId/index.vue"),
      });
    },
  },
  generate: {
    devtools: process.env.DEVTOOLS ? process.env.DEVTOOLS : false,
    routes: [
      "/",
      "/stations/1",
      "/stations/1/widget-chat",
      "/stations/1/widget-vis",
      "/stations/1/widget-upnext",
      "/stations/1/widget-nowplaying",
      "/stations/1/widget-donators",
      "/stations/1/widget-listeners",
      "/stations/1/widget-marquee",
      "/stations/1/widget-socials",
      "/stations/1/donate",
      "/stations/1/schedule",
      "/stations/1/chat",
      "/stations/1/podcast",
      "/stations/2",
      "/stations/2/schedule",
      "/stations/2/chat",
      "/stations/2/podcast",
      "/stations/2/widget-upnext",
      "/stations/2/widget-nowplaying",
      "/stations/3",
      "/stations/3/schedule",
      "/stations/3/chat",
      "/stations/3/podcast",
      "/stations/4",
      "/stations/4/schedule",
      "/stations/4/chat",
      "/stations/4/podcast",
      "/stations/5",
      "/stations/5/schedule",
      "/stations/5/chat",
      "/stations/5/podcast",
      "/stations/5/widget-vis",
      "/stations/5/widget-upnext",
      "/stations/5/widget-nowplaying",
      "/stations/5/widget-donators",
      "/stations/5/widget-listeners",
      "/stations/5/widget-marquee",
      "/stations/5/widget-socials",
      "/stations/5/widget-chat",
      "/stations/4/widget-vis",
      "/stations/4/widget-upnext",
      "/stations/4/widget-nowplaying",
      "/stations/4/widget-donators",
      "/stations/4/widget-listeners",
      "/stations/4/widget-marquee",
      "/stations/4/widget-socials",
    ],
  },
};
