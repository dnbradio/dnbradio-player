import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const Vue = require("vue");
const VueRouter = require("vue-router");
Vue.use(VueRouter);

async function loadModule(path, transform = (source) => source) {
  const source = transform(
    await readFile(new URL(path, import.meta.url), "utf8")
  );
  return (
    await import(
      `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
    )
  ).default;
}

const attribution = await loadModule("../plugins/source-attribution.js");
const stations = await (await loadModule("../data/stations.js"))();
const details = await loadModule("../components/StationDetails.vue", (source) =>
  source
    .split("<script>")[1]
    .split("</script>")[0]
    .replace(/^import .*;$/gm, "")
);

async function visit(url) {
  const router = new VueRouter({ mode: "abstract", routes: [{ path: "*" }] });
  const injected = {};
  attribution(
    { route: router.resolve(url).route, app: { router } },
    (name, value) => {
      injected[name] = value;
    }
  );
  await router.push(url);
  return { router, streamUrl: injected.stationStreamUrl };
}

async function navigate(router, url) {
  await router.push(url).catch((error) => {
    if (!VueRouter.isNavigationFailure(error)) throw error;
  });
  await Vue.nextTick();
}

for (const source of ["web", "discord", "tunein", "radionet"]) {
  test(`${source} selects its main-station mount and leaves other stations alone`, async () => {
    const { streamUrl } = await visit(`/?src=${source}`);
    assert.equal(
      streamUrl(stations[0]),
      `https://azura.drmnbss.org/listen/dnbradio/${source}.mp3`
    );
    for (const station of stations.slice(1)) {
      assert.equal(streamUrl(station), station.streams[0].url);
    }
    assert.equal(
      stations[0].streams[0].url,
      "https://azura.drmnbss.org/listen/dnbradio/web.mp3"
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
      "https://azura.drmnbss.org/listen/dnbradio/web.mp3"
    );
  });
}

test("navigation preserves the initial source, other query options, and hash", async () => {
  const { router, streamUrl } = await visit("/?src=discord");
  await navigate(router, "/stations/2/schedule?calendar=1#today");
  assert.deepEqual(router.currentRoute.query, {
    calendar: "1",
    src: "discord",
  });
  assert.equal(router.currentRoute.hash, "#today");
  await navigate(router, "/stations/1?src=tunein");
  assert.equal(router.currentRoute.query.src, "discord");
  router.back();
  await Vue.nextTick();
  assert.equal(router.currentRoute.path, "/stations/2/schedule");
  assert.deepEqual(router.currentRoute.query, {
    calendar: "1",
    src: "discord",
  });
  router.forward();
  await Vue.nextTick();
  assert.equal(router.currentRoute.path, "/stations/1");
  assert.equal(
    streamUrl(stations[0]),
    "https://azura.drmnbss.org/listen/dnbradio/discord.mp3"
  );
  const fresh = await visit("/");
  assert.equal(
    fresh.streamUrl(stations[0]),
    "https://azura.drmnbss.org/listen/dnbradio/web.mp3"
  );
});

test("initial play and previous/next/shuffle use the attributed stream with a cache buster", async () => {
  const { router, streamUrl } = await visit("/?src=discord");
  const context = {
    station: stations[0],
    stations,
    $stationStreamUrl: streamUrl,
    $sound: { src: "", pause() {} },
    $router: {
      push: (url) =>
        router.push(
          url,
          () => {},
          () => {}
        ),
    },
    $nextTick: (callback) => callback(),
    stopStars() {},
    attachListeners() {},
    pause() {},
    previousStation: stations[0],
    nextStation: stations[0],
    prevIndex: 1,
    nextIndex: 1,
    randomIndex: 1,
  };
  context.streamurl = details.computed.streamurl.call(context);
  assert.equal(details.methods.initStream.call(context), true);
  assert.match(context.$sound.src, /\/discord\.mp3\?\d+$/);
  assert.equal(context.$sound.type, "audio/mpeg");

  context.station = stations[1];
  for (const method of ["loadPrev", "loadNext", "loadRandom"]) {
    details.methods[method].call(context);
    assert.match(context.$sound.src, /\/discord\.mp3\?\d+$/, method);
    await Vue.nextTick();
  }
  for (const station of stations.slice(1)) {
    context.nextStation = station;
    context.nextIndex = station.id;
    details.methods.loadNext.call(context);
    assert.equal(context.$sound.src.split("?")[0], station.streams[0].url);
    await Vue.nextTick();
  }
});

test("shuffle always selects an existing different station", () => {
  for (const station of stations) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const id = details.computed.randomIndex.call({ station, stations });
      assert.ok(stations.some((item) => item.id === id));
      assert.notEqual(id, station.id);
    }
  }
});
