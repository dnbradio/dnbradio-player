import { createRouter, createWebHistory } from "vue-router";
const player = () => import("../pages/stations/_stationId/index.vue");
const webamp = () => import("../pages/stations/_stationId/webamp.vue");
const routes = [
  { path: "/", name: "station1", component: player },
  { path: "/darkstep", name: "darkst", component: player },
  {
    path: "/stations/:stationId",
    name: "stations-stationId",
    component: player,
  },
  {
    path: "/webamp",
    name: "webamp",
    component: webamp,
    meta: { bare: true, surface: "webamp" },
  },
  {
    path: "/embed",
    name: "embed",
    component: webamp,
    meta: { bare: true, surface: "webamp" },
  },
  {
    path: "/stations/:stationId/webamp",
    name: "stations-stationId-webamp",
    component: webamp,
    meta: { bare: true, surface: "webamp" },
  },
  {
    path: "/stations/:stationId/embed",
    name: "stations-stationId-embed",
    component: webamp,
    meta: { bare: true, surface: "webamp" },
  },
  {
    path: "/x-card-test/:shape",
    name: "x-card-test",
    component: webamp,
    meta: { bare: true, surface: "webamp" },
  },
  {
    path: "/stations/:stationId/podcast",
    name: "stations-stationId-podcast",
    component: () => import("../pages/stations/_stationId/podcast/index.vue"),
  },
  {
    path: "/stations/:stationId/podcast/:epid",
    name: "stations-stationId-podcast-epid",
    component: () => import("../pages/stations/_stationId/podcast/_epid.vue"),
  },
  ...["schedule", "chat", "donate"].map((page) => ({
    path: `/stations/:stationId/${page}`,
    name: `stations-stationId-${page}`,
    component: () => import(`../pages/stations/_stationId/${page}.vue`),
  })),
  {
    path: "/stations/:stationId/widget-:widget",
    name: "station-widget",
    component: () => import("../pages/WidgetPage.vue"),
    meta: { bare: true, surface: "widget" },
  },
  { path: "/chat", redirect: "/stations/1/chat" },
  { path: "/home", redirect: "/" },
  { path: "/archive", redirect: "/stations/1/podcast" },
  {
    path: "/verify/:token",
    name: "verify-token",
    component: () => import("../pages/verify/_token.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../layouts/error.vue"),
  },
];
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    return saved || (to.path !== from.path ? { top: 0 } : undefined);
  },
});
