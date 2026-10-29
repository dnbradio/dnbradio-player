// Playback state. The audio element and its event handling live in
// plugins/player.js; components read this state and call this.$player.
export const state = () => ({
  visualsEnabled: false,
  initialLoad: true,
  // { kind: "station", stationId } or { kind: "episode", episode }
  source: null,
  // idle | loading | playing | paused | reconnecting | error
  status: "idle",
  message: "",
  volume: 1,
  volumeSupported: true,
  currentTime: 0,
  duration: 0,
  nowplaying: {},
  sleepAt: null,
  episodes: [],
});

export const getters = {
  isPlaying: (state) => state.status === "playing",
  isBusy: (state) => ["loading", "reconnecting"].includes(state.status),
  isActive: (state) =>
    ["loading", "playing", "reconnecting"].includes(state.status),
  playingStationId: (state) =>
    state.source && state.source.kind === "station"
      ? state.source.stationId
      : null,
  episode: (state) =>
    state.source && state.source.kind === "episode"
      ? state.source.episode
      : null,
};

export const mutations = {
  TOGGLE_VISUALS: (state) => {
    state.visualsEnabled = !state.visualsEnabled;
  },
  SET_VISUALS: (state, payload) => {
    state.visualsEnabled = Boolean(payload);
  },
  SET_INITIAL_LOAD: (state, payload) => {
    state.initialLoad = payload;
  },
  SET_SOURCE: (state, payload) => {
    state.source = payload;
  },
  SET_STATUS: (state, { status, message = "" }) => {
    state.status = status;
    state.message = message;
  },
  SET_VOLUME: (state, payload) => {
    state.volume = payload;
  },
  SET_VOLUME_SUPPORTED: (state, payload) => {
    state.volumeSupported = payload;
  },
  SET_POSITION: (state, { currentTime, duration }) => {
    state.currentTime = currentTime || 0;
    state.duration = Number.isFinite(duration) ? duration : 0;
  },
  SET_NOWPLAYING: (state, { stationId, data }) => {
    state.nowplaying = { ...state.nowplaying, [stationId]: data };
  },
  SET_SLEEP: (state, payload) => {
    state.sleepAt = payload;
  },
  SET_EPISODES: (state, payload) => {
    state.episodes = payload;
  },
};

export const actions = {
  TOGGLE_VISUALS({ commit }) {
    commit("TOGGLE_VISUALS");
  },
  SET_INITIAL_LOAD({ commit }, payload) {
    commit("SET_INITIAL_LOAD", payload);
  },
};
