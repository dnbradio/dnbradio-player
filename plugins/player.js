// One audio element for the whole app, so playback keeps going while the
// listener browses the schedule, podcasts, or any other page. Components read
// state from store/player.js and control playback through this.$player.
import stationsData from "@/data/stations";
import { normalizeNowPlaying } from "~/lib/nowplaying";
import { adjacentStation, freshStreamUrl, stationPath } from "~/lib/stations";

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];
const RETRY_WINDOW = 10 * 60 * 1000;
const STALL_TIMEOUT = 12000;
const POLL_VISIBLE = 15000;
const POLL_HIDDEN = 30000;
const SLEEP_FADE_SECONDS = 15;
const SETTINGS_KEY = "dnbradio-player";
const PLAYER_ROUTES = ["station1", "darkst", "stations-stationId"];

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function writeSettings(patch) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...readSettings(), ...patch })
    );
  } catch (error) {
    // Private mode or storage full: settings just don't persist.
  }
}

// iOS ignores HTMLMediaElement.volume and always reads back 1.
function canSetVolume() {
  const probe = document.createElement("audio");
  probe.volume = 0.5;
  return Math.abs(probe.volume - 0.5) < 0.01;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pickEpisode(episode) {
  return {
    id: episode.id,
    artist: episode.artist,
    title: episode.title,
    image: episode.image,
    timestamp: episode.timestamp,
    plays: episode.plays,
    playback_url: episode.playback_url,
    download_url: episode.download_url,
    permalink: episode.permalink,
    profile: episode.profile,
  };
}

export default function ({ app, store }, inject) {
  const audio = document.createElement("audio");
  audio.preload = "none";
  audio.setAttribute("x-webkit-airplay", "allow");

  const commit = (type, payload) => store.commit("player/" + type, payload);
  const state = () => store.state.player;
  const source = () => state().source;
  const isLive = () => !source() || source().kind === "station";

  let stations = [];
  const ready = stationsData().then((list) => {
    stations = list;
    return list;
  });
  const stationById = (id) => stations.find((station) => station.id == id);

  // "play" while the listener wants sound, even during reconnects.
  let intent = "stop";
  let quiet = false;
  let srcSetAt = 0;
  let lastProgressAt = 0;
  let lastPositionCommit = 0;
  let resumeAt = null;
  let retryCount = 0;
  let retryStartedAt = 0;
  let retryTimer = null;
  let stallTimer = null;
  let sleepTimer = null;
  let fadeTimer = null;
  let fadeVolume = null;
  let pollTimer = null;
  let pollAll = false;
  let focusedStationId = 1;
  let lastMetaKey = "";

  const settings = readSettings();
  const volumeSupported = canSetVolume();
  commit("SET_VOLUME_SUPPORTED", volumeSupported);
  if (volumeSupported && typeof settings.volume === "number") {
    audio.volume = clamp(settings.volume, 0, 1);
  }
  commit("SET_VOLUME", audio.volume);
  if (settings.visuals) {
    commit("SET_VISUALS", true);
  }
  store.watch(
    (root) => root.player.visualsEnabled,
    (visuals) => writeSettings({ visuals })
  );

  function setStatus(status, message = "") {
    commit("SET_STATUS", { status, message });
    updateMediaSession();
  }

  function setSrc(url) {
    resumeAt = null;
    srcSetAt = Date.now();
    audio.src = url;
  }

  // Drops the connection. A live stream resumed from its buffer would play
  // stale audio and stay behind live, so pause means stop for stations.
  function release() {
    clearTimeout(stallTimer);
    srcSetAt = Date.now();
    audio.pause();
    resumeAt = null;
    audio.removeAttribute("src");
    audio.load();
  }

  function clearRetry() {
    clearTimeout(retryTimer);
    retryCount = 0;
    retryStartedAt = 0;
  }

  function start() {
    lastProgressAt = Date.now();
    armStallWatch();
    const attempt = audio.play();
    if (!attempt || !attempt.catch) {
      return;
    }
    attempt.catch((error) => {
      if (error && error.name === "AbortError") {
        return; // superseded by a newer source
      }
      if (error && error.name === "NotAllowedError") {
        // The browser wants a tap first (autoplay policy).
        intent = "stop";
        clearTimeout(stallTimer);
        if (isLive()) {
          release();
        }
        if (quiet) {
          quiet = false;
          commit("SET_SOURCE", null);
        }
        setStatus(source() ? "paused" : "idle");
        return;
      }
      fail();
    });
  }

  function armStallWatch() {
    clearTimeout(stallTimer);
    if (intent !== "play") {
      return;
    }
    stallTimer = setTimeout(() => {
      if (intent !== "play") {
        return;
      }
      if (Date.now() - lastProgressAt >= STALL_TIMEOUT) {
        fail();
      } else {
        armStallWatch();
      }
    }, STALL_TIMEOUT);
  }

  function fail() {
    if (intent !== "play") {
      return;
    }
    clearTimeout(stallTimer);
    if (quiet) {
      // A failed autoplay attempt stays silent.
      intent = "stop";
      quiet = false;
      release();
      commit("SET_SOURCE", null);
      setStatus("idle");
      return;
    }
    retryStartedAt = retryStartedAt || Date.now();
    if (Date.now() - retryStartedAt > RETRY_WINDOW) {
      intent = "stop";
      clearRetry();
      if (isLive()) {
        release();
      } else {
        audio.pause();
      }
      setStatus("error", "Can't connect · press play");
      return;
    }
    const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
    retryCount++;
    setStatus(
      "reconnecting",
      navigator.onLine === false ? "Offline · will reconnect" : "Reconnecting…"
    );
    clearTimeout(retryTimer);
    retryTimer = setTimeout(reconnect, delay);
  }

  function reconnect() {
    if (intent !== "play") {
      return;
    }
    if (navigator.onLine === false) {
      fail();
      return;
    }
    const current = source();
    if (current.kind === "station") {
      setSrc(
        freshStreamUrl(app.$stationStreamUrl(stationById(current.stationId)))
      );
    } else {
      if (resumeAt === null) {
        resumeAt = audio.currentTime;
      }
      srcSetAt = Date.now();
      audio.load();
    }
    start();
  }

  audio.addEventListener("playing", () => {
    quiet = false;
    clearRetry();
    lastProgressAt = Date.now();
    setStatus("playing");
    registerActionHandlers();
    armStallWatch();
  });
  audio.addEventListener("waiting", () => {
    if (intent === "play" && state().status === "playing") {
      setStatus("loading", "Buffering…");
    }
    armStallWatch();
  });
  audio.addEventListener("stalled", armStallWatch);
  audio.addEventListener("timeupdate", () => {
    lastProgressAt = Date.now();
    if (!isLive() && lastProgressAt - lastPositionCommit > 500) {
      lastPositionCommit = lastProgressAt;
      commitPosition();
    }
  });
  audio.addEventListener("loadedmetadata", () => {
    if (resumeAt !== null) {
      audio.currentTime = resumeAt;
      resumeAt = null;
    }
    commitPosition();
  });
  audio.addEventListener("durationchange", commitPosition);
  audio.addEventListener("volumechange", () => {
    commit("SET_VOLUME", audio.volume);
  });
  audio.addEventListener("error", () => {
    if (intent === "play" && audio.getAttribute("src")) {
      fail();
    }
  });
  audio.addEventListener("ended", () => {
    if (isLive()) {
      fail();
      return;
    }
    intent = "stop";
    setStatus("paused");
  });
  // Headphones unplugged, a call, or another app took the audio.
  audio.addEventListener("pause", () => {
    if (intent !== "play" || audio.ended || Date.now() - srcSetAt < 1500) {
      return;
    }
    setTimeout(() => {
      if (intent === "play" && audio.paused && state().status === "playing") {
        intent = "stop";
        clearTimeout(stallTimer);
        if (isLive()) {
          release();
        }
        setStatus("paused");
      }
    }, 300);
  });
  window.addEventListener("online", () => {
    if (intent === "play" && state().status === "reconnecting") {
      clearTimeout(retryTimer);
      reconnect();
    }
  });

  function commitPosition() {
    commit("SET_POSITION", {
      currentTime: audio.currentTime,
      duration: audio.duration,
    });
    if (
      !isLive() &&
      "mediaSession" in navigator &&
      navigator.mediaSession.setPositionState &&
      Number.isFinite(audio.duration)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          position: Math.min(audio.currentTime, audio.duration),
          playbackRate: 1,
        });
      } catch (error) {
        // Some browsers reject a position before metadata settles.
      }
    }
  }

  function artwork(...urls) {
    return urls.filter(Boolean).map((src) => ({ src, sizes: "512x512" }));
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator)) {
      return;
    }
    const session = navigator.mediaSession;
    const { status } = state();
    const current = source();
    session.playbackState =
      intent === "play" || status === "playing"
        ? "playing"
        : current
        ? "paused"
        : "none";
    if (!current) {
      lastMetaKey = "";
      session.metadata = null;
      return;
    }
    let meta;
    if (current.kind === "episode") {
      const episode = current.episode;
      meta = {
        title: episode.title,
        artist: episode.artist,
        album: "dnbradio.com live recordings",
        artwork: artwork(episode.image),
      };
    } else {
      const station = stationById(current.stationId);
      if (!station) {
        return;
      }
      const np = state().nowplaying[station.id];
      meta = {
        title: (np && np.title) || station.subtitle,
        artist: (np && np.artist) || station.title,
        album: station.title,
        artwork: artwork(np && np.art, station.cover),
      };
    }
    const key = JSON.stringify(meta);
    if (key !== lastMetaKey && typeof MediaMetadata !== "undefined") {
      lastMetaKey = key;
      session.metadata = new MediaMetadata(meta);
    }
  }

  // iOS only honors handlers registered once the element is the active
  // player, so this runs on every "playing".
  function registerActionHandlers() {
    if (!("mediaSession" in navigator)) {
      return;
    }
    const set = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        // Action not supported by this browser.
      }
    };
    set("play", () => player.play());
    set("pause", () => player.pause());
    set("stop", () => player.stop());
    if (isLive()) {
      // Without seek handlers, lock screens show previous/next, which
      // switch stations.
      set("seekbackward", null);
      set("seekforward", null);
      set("seekto", null);
      set("previoustrack", () => player.stepStation(-1));
      set("nexttrack", () => player.stepStation(1));
    } else {
      set("previoustrack", null);
      set("nexttrack", null);
      set("seekbackward", (details) =>
        player.seek(-(details.seekOffset || 30))
      );
      set("seekforward", (details) => player.seek(details.seekOffset || 30));
      set("seekto", (details) => player.seekTo(details.seekTime));
    }
  }

  async function refresh(station) {
    if (!station || !station.nowplaying_url || !station.nowplaying_url.url) {
      return;
    }
    try {
      const response = await fetch(station.nowplaying_url.url, {
        cache: "no-store",
      });
      const data = await response.json();
      commit("SET_NOWPLAYING", {
        stationId: station.id,
        data: normalizeNowPlaying(station, data),
      });
      updateMediaSession();
    } catch (error) {
      // Keep the last known now playing; the next poll tries again.
    }
  }

  function schedulePoll() {
    clearTimeout(pollTimer);
    const hidden = document.visibilityState === "hidden";
    if (hidden && intent !== "play") {
      return;
    }
    pollTimer = setTimeout(
      () => {
        const ids = new Set([focusedStationId]);
        const current = source();
        if (current && current.kind === "station") {
          ids.add(current.stationId);
        }
        if (pollAll && !hidden) {
          stations.forEach((station) => ids.add(station.id));
        }
        ids.forEach((id) => refresh(stationById(id)));
        schedulePoll();
      },
      hidden ? POLL_HIDDEN : POLL_VISIBLE
    );
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refresh(stationById(focusedStationId));
    }
    schedulePoll();
  });

  function clearSleep() {
    clearTimeout(sleepTimer);
    clearInterval(fadeTimer);
    sleepTimer = null;
    fadeTimer = null;
    if (fadeVolume !== null && volumeSupported) {
      audio.volume = fadeVolume;
    }
    fadeVolume = null;
    commit("SET_SLEEP", null);
  }

  function sleepNow() {
    const startVolume = audio.volume;
    fadeVolume = startVolume;
    let step = 0;
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      step++;
      if (volumeSupported) {
        audio.volume = Math.max(
          0,
          startVolume * (1 - step / SLEEP_FADE_SECONDS)
        );
      }
      if (step >= SLEEP_FADE_SECONDS) {
        clearSleep();
        player.pause();
        if (volumeSupported) {
          audio.volume = startVolume;
        }
      }
    }, 1000);
  }

  const player = {
    audio,
    ready,
    get stations() {
      return stations;
    },
    isPlayerRoute(route) {
      return PLAYER_ROUTES.includes(route.name);
    },
    playStation(station, options = {}) {
      if (!station) {
        return;
      }
      clearRetry();
      intent = "play";
      quiet = Boolean(options.quiet);
      focusedStationId = station.id;
      commit("SET_SOURCE", { kind: "station", stationId: station.id });
      commit("SET_POSITION", { currentTime: 0, duration: 0 });
      if (!quiet) {
        setStatus("loading");
      }
      setSrc(freshStreamUrl(app.$stationStreamUrl(station)));
      start();
      refresh(station);
      schedulePoll();
    },
    playEpisode(episode) {
      if (!episode) {
        return;
      }
      clearRetry();
      intent = "play";
      quiet = false;
      const current = store.getters["player/episode"];
      setStatus("loading");
      if (current && current.id === episode.id && audio.getAttribute("src")) {
        start();
        return;
      }
      commit("SET_SOURCE", { kind: "episode", episode: pickEpisode(episode) });
      commit("SET_POSITION", { currentTime: 0, duration: 0 });
      setSrc(episode.playback_url || episode.download_url);
      start();
    },
    play() {
      const current = source();
      if (current && current.kind === "episode") {
        player.playEpisode(current.episode);
      } else {
        player.playStation(
          stationById(current ? current.stationId : focusedStationId)
        );
      }
    },
    pause() {
      intent = "stop";
      quiet = false;
      clearRetry();
      clearTimeout(stallTimer);
      if (isLive()) {
        release();
      } else {
        srcSetAt = Date.now();
        audio.pause();
      }
      setStatus(source() ? "paused" : "idle");
    },
    toggle() {
      if (intent === "play") {
        player.pause();
      } else {
        player.play();
      }
    },
    stop() {
      intent = "stop";
      quiet = false;
      clearRetry();
      clearSleep();
      release();
      commit("SET_SOURCE", null);
      commit("SET_POSITION", { currentTime: 0, duration: 0 });
      setStatus("idle");
    },
    stepStation(step) {
      const current = source();
      const fromId =
        current && current.kind === "station"
          ? current.stationId
          : focusedStationId;
      const next = adjacentStation(stations, { id: fromId }, step);
      player.playStation(next);
      if (next && player.isPlayerRoute(app.router.currentRoute)) {
        app.router.push(stationPath(next)).catch(() => {});
      }
      return next;
    },
    seek(delta) {
      if (isLive() || !Number.isFinite(audio.duration)) {
        return;
      }
      audio.currentTime = clamp(audio.currentTime + delta, 0, audio.duration);
      commitPosition();
    },
    seekTo(time) {
      if (isLive() || !Number.isFinite(audio.duration)) {
        return;
      }
      audio.currentTime = clamp(time, 0, audio.duration);
      commitPosition();
    },
    setVolume(volume) {
      if (!volumeSupported) {
        return;
      }
      audio.volume = clamp(Math.round(volume * 100) / 100, 0, 1);
      writeSettings({ volume: audio.volume });
    },
    focusStation(station) {
      if (!station) {
        return;
      }
      focusedStationId = station.id;
      refresh(station);
      schedulePoll();
    },
    watchAllStations(enabled) {
      pollAll = enabled;
      if (enabled) {
        stations.forEach((station) => refresh(station));
      }
      schedulePoll();
    },
    setSleep(minutes) {
      clearSleep();
      if (!minutes) {
        return;
      }
      const delay = minutes * 60000;
      commit("SET_SLEEP", Date.now() + delay);
      sleepTimer = setTimeout(
        sleepNow,
        Math.max(0, delay - SLEEP_FADE_SECONDS * 1000)
      );
    },
  };

  inject("player", player);
  // Older code paths read the element directly.
  inject("sound", audio);
}
