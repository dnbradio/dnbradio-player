import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { nextTick } from "vue";
import {
  createRouter,
  createMemoryHistory,
  isNavigationFailure,
} from "vue-router";

async function loadModule(path, transform = (source) => source) {
  const source = transform(
    await readFile(new URL(path, import.meta.url), "utf8"),
  );
  return (
    await import(
      `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
    )
  ).default;
}

const attribution = await loadModule("../plugins/source-attribution.js");
const stations = await (await loadModule("../data/stations.js"))();
const { adjacentStation, freshStreamUrl } =
  await import("./load-module.mjs").then(({ loadModule: load }) =>
    load(new URL("../lib/stations.js", import.meta.url)),
  );

async function visit(url) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: {} }],
  });
  const injected = {};
  attribution(
    { route: router.resolve(url), app: { router } },
    (name, value) => {
      injected[name] = value;
    },
  );
  await router.push(url);
  return { router, streamUrl: injected.stationStreamUrl };
}

async function navigate(router, url) {
  await router.push(url).catch((error) => {
    if (!isNavigationFailure(error)) throw error;
  });
  await nextTick();
}

for (const source of ["web", "discord", "tunein", "radionet"]) {
  test(`${source} selects its main-station mount and leaves other stations alone`, async () => {
    const { streamUrl } = await visit(`/?src=${source}`);
    assert.equal(
      streamUrl(stations[0]),
      `https://azura.drmnbss.org/listen/dnbradio/${source}.mp3`,
    );
    for (const station of stations.slice(1)) {
      assert.equal(streamUrl(station), station.streams[0].url);
    }
    assert.equal(
      stations[0].streams[0].url,
      "https://azura.drmnbss.org/listen/dnbradio/web.mp3",
    );
  });
}

for (const query of [
  "",
  "?src",
  "?src=unknown",
  "?src=alexa",
  "?src=DISCORD",
  "?src=__proto__",
  "?src=constructor",
  "?src=toString",
  "?src=https://evil.example/audio.mp3",
  "?src=discord&src=tunein",
]) {
  test(`${query || "no query"} falls back to web`, async () => {
    const { streamUrl } = await visit(`/${query}`);
    assert.equal(
      streamUrl(stations[0]),
      "https://azura.drmnbss.org/listen/dnbradio/web.mp3",
    );
  });
}

test("navigation preserves the initial source, other query options, and hash", async () => {
  const { router, streamUrl } = await visit("/?src=discord");
  await navigate(router, "/stations/2/schedule?calendar=1#today");
  assert.deepEqual(router.currentRoute.value.query, {
    calendar: "1",
    src: "discord",
  });
  assert.equal(router.currentRoute.value.hash, "#today");
  await navigate(router, "/stations/1?src=tunein");
  assert.equal(router.currentRoute.value.query.src, "discord");
  await new Promise((resolve) => {
    const off = router.afterEach(() => {
      off();
      resolve();
    });
    router.back();
  });
  assert.equal(router.currentRoute.value.path, "/stations/2/schedule");
  assert.deepEqual(router.currentRoute.value.query, {
    calendar: "1",
    src: "discord",
  });
  await new Promise((resolve) => {
    const off = router.afterEach(() => {
      off();
      resolve();
    });
    router.forward();
  });
  assert.equal(router.currentRoute.value.path, "/stations/1");
  assert.equal(
    streamUrl(stations[0]),
    "https://azura.drmnbss.org/listen/dnbradio/discord.mp3",
  );
  const fresh = await visit("/");
  assert.equal(
    fresh.streamUrl(stations[0]),
    "https://azura.drmnbss.org/listen/dnbradio/web.mp3",
  );
});

test("initial play and previous/next use the attributed stream with a cache buster", async () => {
  const { streamUrl } = await visit("/?src=discord");
  // plugins/player.js plays freshStreamUrl($stationStreamUrl(station)).
  assert.match(freshStreamUrl(streamUrl(stations[0])), /\/discord\.mp3\?\d+$/);

  let station = stations[1];
  for (const step of [-1, 1]) {
    const next = adjacentStation(stations, station, step);
    const url = freshStreamUrl(streamUrl(next));
    if (next.id === 1) {
      assert.match(url, /\/discord\.mp3\?\d+$/);
    } else {
      assert.equal(url.split("?")[0], next.streams[0].url);
    }
  }
  for (const item of stations.slice(1)) {
    assert.equal(
      freshStreamUrl(streamUrl(item)).split("?")[0],
      item.streams[0].url,
    );
  }
});

test("previous and next wrap around the station list", () => {
  assert.equal(
    adjacentStation(stations, stations[0], -1).id,
    stations.at(-1).id,
  );
  assert.equal(
    adjacentStation(stations, stations.at(-1), 1).id,
    stations[0].id,
  );
  assert.equal(adjacentStation(stations, stations[1], 1).id, stations[2].id);
});
