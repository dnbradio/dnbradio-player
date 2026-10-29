export function stationPath(station) {
  return "/stations/" + station.id;
}

export function adjacentStation(stations, current, step) {
  if (!stations.length) {
    return null;
  }
  const index = stations.findIndex((item) => item.id == current.id);
  const next = (index + step + stations.length) % stations.length;
  return stations[next];
}

// Icecast uses _ic2 to bypass its Safari cache redirect, which can point at
// an internal proxy address. Refresh it on every play to reconnect at live.
export function freshStreamUrl(url, now = Date.now()) {
  const stream = new URL(url);
  stream.searchParams.set("_ic2", now.toString());
  return stream.href;
}
