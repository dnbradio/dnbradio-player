import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const engine = (
  await readFile(new URL("../plugins/player.js", import.meta.url), "utf8")
)
  .replace(/^import .*;\n/gm, "")
  .replace("export default function", "function plugin");

test("podcast retries keep the pending position and source changes clear it", () => {
  const timers = new Map();
  let timerId = 0;
  const handlers = {};
  const audio = {
    volume: 1,
    currentTime: 0,
    duration: 3600,
    src: "",
    setAttribute() {},
    getAttribute() {
      return this.src;
    },
    removeAttribute() {
      this.src = "";
    },
    addEventListener(name, fn) {
      handlers[name] = fn;
    },
    play() {
      return Promise.resolve();
    },
    pause() {},
    load() {
      this.currentTime = 0;
    },
  };
  const state = { source: null, nowplaying: {}, status: "idle" };
  const store = {
    state: { player: state },
    getters: {},
    watch() {},
    commit(type, payload) {
      if (type === "player/SET_SOURCE") {
        state.source = payload;
        this.getters["player/episode"] =
          payload?.kind === "episode" ? payload.episode : null;
      }
      if (type === "player/SET_STATUS") state.status = payload.status;
    },
  };
  let player;
  const context = vm.createContext({
    document: { createElement: () => audio, addEventListener() {} },
    window: { addEventListener() {} },
    navigator: { onLine: true },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    stationsData: () => Promise.resolve([]),
    normalizeNowPlaying: () => ({}),
    adjacentStation() {},
    freshStreamUrl: (url) => url,
    stationPath() {},
    setTimeout(fn) {
      timers.set(++timerId, fn);
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    store,
    inject(key, value) {
      if (key === "player") player = value;
    },
  });
  vm.runInContext(engine + ";plugin({app: {}, store}, inject)", context);
  const retry = () => {
    handlers.error();
    const [id, fn] = [...timers.entries()].at(-1);
    timers.delete(id);
    fn();
  };
  player.playEpisode({ id: 1, playback_url: "one.mp3" });
  audio.currentTime = 1200;
  retry();
  retry();
  handlers.loadedmetadata();
  assert.equal(audio.currentTime, 1200);
  retry();
  player.playEpisode({ id: 2, playback_url: "two.mp3" });
  audio.currentTime = 0;
  handlers.loadedmetadata();
  assert.equal(audio.currentTime, 0);
});

test("replacing a deep link cannot leave the app via Back; pushes and pop work", async () => {
  const source = await readFile(
    new URL("../lib/history.js", import.meta.url),
    "utf8"
  );
  let onPop;
  const history = {
    state: { key: "initial" },
    pushState(state) {
      this.state = state;
    },
    replaceState(state) {
      this.state = state;
    },
  };
  const context = vm.createContext({
    window: {
      history,
      addEventListener(name, fn) {
        if (name === "popstate") onPop = fn;
      },
    },
  });
  vm.runInContext(source.replace(/export /g, "") + ";trackHistory()", context);
  const canGoBack = () => vm.runInContext("canGoBack()", context);
  history.replaceState({ key: "sort" }, "", "?sort=popular");
  assert.equal(canGoBack(), false);
  assert.equal(history.state.key, "sort");
  history.pushState({ key: "episode" }, "", "/episode/1");
  const pushed = history.state;
  assert.equal(canGoBack(), true);
  history.replaceState({ key: "updated" }, "", "?q=a");
  onPop({ state: { dnbradioDepth: 0 } });
  assert.equal(canGoBack(), false);
  onPop({ state: pushed });
  assert.equal(canGoBack(), true);
});
