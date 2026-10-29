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

// Every play opens a fresh connection at the live edge.
export function freshStreamUrl(url, now = Date.now()) {
  return url + "?" + now.toString();
}
