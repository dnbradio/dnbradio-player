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

// X (Twitter) player card. X's crawler does not run JS, and with ssr: false a
// page's head() never reaches the generated HTML, so the card tags are written
// into each station page and each webamp page by the generate:page hook below.
// The webamp pages must also be frameable by X; see "X player card" in the
// README for the nginx side.
const stationsData = require("./data/stations").default;
const X_CARD_ORIGIN = process.env.CF_PAGES_URL || "https://dnbradio.com";
const X_CARD_SHAPES = {
  square: {
    player: [480, 480],
    image: [1200, 1200],
    imagePath: (id) => `x-card/winamp-station-${id}.png`,
  },
  portrait: {
    player: [480, 600],
    image: [960, 1200],
    imagePath: () => "x-card/winamp-portrait.png",
  },
  landscape: {
    player: [480, 280],
    image: [960, 560],
    imagePath: (id) => `x-card/station-${id}.png`,
  },
};
const X_CARD_TEST_ROUTES = process.env.CF_PAGES
  ? Object.keys(X_CARD_SHAPES).map((shape) => `/x-card-test/${shape}`)
  : [];
const DARK_LOADING_SCREEN =
  "<style>body,#nuxt-loading{background:#000!important}</style>";
const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

async function xPlayerCardTags(route) {
  // A webamp page gets its station's card, so its own URL can be posted too.
  const stationRoute = route.replace(/\/?(webamp|embed)$/, "") || "/";
  const match = stationRoute.match(
    /^\/(?:stations\/(\d+)|(darkstep)|x-card-test\/(\w+))?$/
  );
  const shape = X_CARD_SHAPES[match && match[3] ? match[3] : "square"];
  if (!match || !shape) {
    return "";
  }
  const station = (await stationsData()).find((item) =>
    match[2] ? item.pathname === "darkst" : item.id === Number(match[1] || 1)
  );
  if (!station) {
    return "";
  }
  const stationId = station.id;
  const base = X_CARD_ORIGIN + (process.env.ROUTER_BASE || "/");
  const pagePath = route.slice(1);
  const playerPath =
    stationId === 1 ? "webamp/" : `stations/${stationId}/webamp/`;
  const title = `${station.title} - ${station.subtitle}`;
  const image = base + shape.imagePath(stationId);
  const tags = {
    "twitter:card": "player",
    "twitter:site": `@${station.twitterId || "dnbradio"}`,
    "twitter:title": title,
    "twitter:description": station.description,
    "twitter:player": base + playerPath,
    "twitter:player:width": String(shape.player[0]),
    "twitter:player:height": String(shape.player[1]),
    "twitter:image": image,
    "twitter:image:alt": `${station.title} player in a classic Winamp skin`,
    "og:type": "music.radio_station",
    "og:site_name": "dnbradio.com",
    "og:title": title,
    "og:description": station.description,
    "og:url": base + (pagePath ? pagePath + "/" : ""),
    // Facebook and Threads only show a link card (no third-party players),
    // and crop it to 1.91:1, so they get their own wide image.
    "og:image": `${base}x-card/og-station-${stationId}.png`,
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": `${station.title} player in a classic Winamp skin`,
  };
  return Object.entries(tags)
    .map(
      ([key, value]) =>
        `<meta ${
          key.startsWith("og:") ? "property" : "name"
        }="${key}" content="${escapeAttr(value)}">`
    )
    .join("");
}

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
    ],
  },
  loading: { color: "#fff" },
  plugins: [
    { ssr: false, src: "~/plugins/source-attribution.js" },
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
      const webamp = resolve(__dirname, "pages/stations/_stationId/webamp.vue");
      routes.push({ name: "webamp", path: "/webamp", component: webamp });
      // The player's first URLs, still used by X cards posted before the move.
      routes.push({ name: "embed", path: "/embed", component: webamp });
      routes.push({
        name: "stations-stationId-embed",
        path: "/stations/:stationId/embed",
        component: webamp,
      });
      if (X_CARD_TEST_ROUTES.length) {
        routes.push({
          name: "x-card-test",
          path: "/x-card-test/:shape",
          component: webamp,
        });
      }
    },
  },
  hooks: {
    async "generate:page"(page) {
      const tags = await xPlayerCardTags(page.route);
      const loadingScreen =
        /\/(webamp|embed)$/.test(page.route) ||
        page.route.startsWith("/x-card-test/")
          ? DARK_LOADING_SCREEN
          : "";
      page.html = page.html.replace(
        "</head>",
        () => `${tags}${loadingScreen}</head>`
      );
    },
  },
  generate: {
    devtools: process.env.DEVTOOLS ? process.env.DEVTOOLS : false,
    routes: [
      "/",
      "/webamp",
      "/stations/1/webamp",
      "/stations/2/webamp",
      "/stations/3/webamp",
      "/stations/4/webamp",
      "/stations/5/webamp",
      "/embed",
      "/stations/1/embed",
      "/stations/2/embed",
      "/stations/3/embed",
      "/stations/4/embed",
      "/stations/5/embed",
      ...X_CARD_TEST_ROUTES,
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
