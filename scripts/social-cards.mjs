import { djProfile } from "../lib/djs.js";
import stationsData from "../data/stations.js";
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

const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export async function xPlayerCardTags(route, dj) {
  // A webamp page gets its station's card, so its own URL can be posted too.
  const stationRoute = route.replace(/\/?(webamp|embed)$/, "") || "/";
  const match = stationRoute.match(
    /^\/(?:stations\/(\d+)|(darkstep)|x-card-test\/(\w+))?$/,
  );
  const shape = X_CARD_SHAPES[match && match[3] ? match[3] : "square"];
  if (!match || !shape) {
    return "";
  }
  const station = (await stationsData()).find((item) =>
    match[2] ? item.pathname === "darkst" : item.id === Number(match[1] || 1),
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
    // Other stations use wide link cards. The main-stream default is Winamp.
    "og:image":
      stationId === 1 ? image : `${base}x-card/og-station-${stationId}.png`,
    "og:image:type": "image/png",
    "og:image:width": stationId === 1 ? String(shape.image[0]) : "1200",
    "og:image:height": stationId === 1 ? String(shape.image[1]) : "630",
    "og:image:alt": `${station.title} player in a classic Winamp skin`,
  };
  const profile =
    stationId === 1 && ["/", "/stations/1"].includes(route) && djProfile(dj);
  if (profile) {
    for (const key of Object.keys(tags))
      if (key.startsWith("twitter:player")) delete tags[key];
    Object.assign(tags, {
      "twitter:card": "summary_large_image",
      "twitter:title": `DNBRadio · ${profile.name}`,
      "twitter:description": `Press play. ${profile.name} follows the bass, mids and highs of live DNBRadio.`,
      "twitter:image": `${base}djs/${profile.id}-preview.png`,
      "twitter:image:alt": profile.alt,
      "og:title": `DNBRadio · ${profile.name}`,
      "og:description": `Press play. ${profile.name} follows the bass, mids and highs of live DNBRadio.`,
      "og:url": tags["og:url"] + `?dj=${profile.id}`,
      "og:image": `${base}djs/${profile.id}-preview.png`,
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt": profile.alt,
    });
  }
  return Object.entries(tags)
    .map(
      ([key, value]) =>
        `<meta ${
          key.startsWith("og:") ? "property" : "name"
        }="${key}" content="${escapeAttr(value)}">`,
    )
    .join("");
}
