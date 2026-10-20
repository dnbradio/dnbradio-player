function entryTitle(entry) {
  return entry.artist ? `${entry.artist} - ${entry.title}` : entry.title;
}

export function toM3u(entries) {
  const lines = ["#EXTM3U"];
  entries.forEach((entry) => {
    lines.push(`#EXTINF:${entry.seconds || -1},${entryTitle(entry)}`);
    lines.push(entry.url);
  });
  return lines.join("\r\n") + "\r\n";
}

export function toPls(entries) {
  const lines = ["[playlist]"];
  entries.forEach((entry, i) => {
    lines.push(`File${i + 1}=${entry.url}`);
    lines.push(`Title${i + 1}=${entryTitle(entry)}`);
    lines.push(`Length${i + 1}=${entry.seconds || -1}`);
  });
  lines.push(`NumberOfEntries=${entries.length}`, "Version=2");
  return lines.join("\r\n") + "\r\n";
}

// Entries pointing at local paths can't be opened from a browser, so only
// http(s) URLs are kept.
export function parsePlaylist(text) {
  const entries = [];
  if (/^\s*\[playlist\]/i.test(text)) {
    const files = {};
    const titles = {};
    text.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*(File|Title)(\d+)\s*=\s*(.*)$/i);
      if (match) {
        (match[1].toLowerCase() === "file" ? files : titles)[match[2]] =
          match[3].trim();
      }
    });
    Object.keys(files)
      .sort((a, b) => a - b)
      .forEach((n) => entries.push({ url: files[n], title: titles[n] || "" }));
  } else {
    let title = "";
    text.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (line.startsWith("#EXTINF:")) {
        title = line.slice(line.indexOf(",") + 1).trim();
      } else if (line && !line.startsWith("#")) {
        entries.push({ url: line, title });
        title = "";
      }
    });
  }
  return entries.filter((entry) => /^https?:\/\//i.test(entry.url));
}
