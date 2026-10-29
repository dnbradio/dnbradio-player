import { cleanMeta } from "./text";

function track(song, playedAt) {
  if (!song) {
    return null;
  }
  return {
    artist: cleanMeta(song.artist),
    title: cleanMeta(song.title),
    album: cleanMeta(song.album),
    art: song.art || null,
    playedAt: playedAt ? playedAt * 1000 : null,
  };
}

// Normalizes an AzuraCast /api/nowplaying response. Older station types
// (SAM, Icecast, SHOUTcast) were retired when every station moved to
// AzuraCast; anything else falls back to the station's own description.
export function normalizeNowPlaying(station, data, fetchedAt = Date.now()) {
  if (station.nowplaying_url?.type !== "azuracast" || !data?.now_playing) {
    return {
      live: false,
      streamer: "",
      artist: station.title,
      title: station.subtitle,
      art: null,
      listeners: null,
      elapsed: null,
      duration: null,
      liveSince: null,
      next: null,
      history: [],
      fetchedAt,
    };
  }
  const np = data.now_playing;
  const streamer = cleanMeta(np.streamer || data.live?.streamer_name || "");
  const current = track(np.song, np.played_at);
  return {
    live: Boolean(data.live?.is_live || streamer),
    streamer,
    artist: streamer || current.artist,
    title: current.title,
    art: (streamer && data.live?.art) || current.art,
    listeners: data.listeners?.current ?? null,
    elapsed: Number.isFinite(np.elapsed) ? np.elapsed : null,
    duration: np.duration || null,
    liveSince: data.live?.broadcast_start
      ? data.live.broadcast_start * 1000
      : null,
    next: streamer ? null : track(data.playing_next?.song),
    history: (data.song_history || [])
      .map((item) => track(item.song, item.played_at))
      .filter((item) => item.artist || item.title),
    fetchedAt,
  };
}
