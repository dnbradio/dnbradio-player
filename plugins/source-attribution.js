const mounts = Object.freeze({
  web: "web.mp3",
  discord: "discord.mp3",
  tunein: "tunein.mp3",
  radionet: "radionet.mp3",
});

export default function ({ route, app }, inject) {
  const source =
    typeof route.query.src === "string" &&
    Object.prototype.hasOwnProperty.call(mounts, route.query.src)
      ? route.query.src
      : "web";

  inject("stationStreamUrl", (station) =>
    station?.id === 1
      ? `https://azura.drmnbss.org/listen/dnbradio/${mounts[source]}`
      : station?.streams?.[0]?.url
  );

  if (source !== "web") {
    app.router.beforeEach((to, from, next) => {
      if (to.query.src === source) {
        next();
      } else {
        next({
          path: to.path,
          query: { ...to.query, src: source },
          hash: to.hash,
        });
      }
    });
  }
}
