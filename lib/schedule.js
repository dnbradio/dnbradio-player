// Helpers for the /api/schedule feed: a flat list of show occurrences with
// UTC ISO start/end times.
const DAY = 24 * 60 * 60 * 1000;

export function startOfLocalDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

export function sameLocalDay(a, b) {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

export function overlapsLocalDay(show, day) {
  const start = startOfLocalDay(day);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return show.startAt < end && show.endAt > start;
}

export function normalizeShows(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      ...item,
      startAt: new Date(item.start),
      endAt: new Date(item.end),
    }))
    .filter((item) => {
      const key = item.id + "@" + item.start;
      if (seen.has(key) || isNaN(item.startAt)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.startAt - b.startAt);
}

export function liveShow(shows, now = new Date()) {
  return shows.find((show) => show.startAt <= now && show.endAt > now) || null;
}

export function upcomingShows(shows, now = new Date(), limit = 3) {
  return shows.filter((show) => show.startAt > now).slice(0, limit);
}

export function weekDays(now = new Date()) {
  const today = startOfLocalDay(now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() + index * DAY + DAY / 2);
    return startOfLocalDay(date);
  });
}

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: "long" });

export function recurrence(show) {
  const day = WEEKDAY.format(show.startAt);
  switch (show.occurs) {
    case "weekly":
      return "Every " + day;
    case "even":
    case "odd":
      return "Every other " + day;
    case "last":
      return "Last " + day + " of the month";
    case 1:
    case "1":
      return "First " + day + " of the month";
    default:
      return "";
  }
}

const TIME = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

export function timeRange(show) {
  return TIME.format(show.startAt) + " – " + TIME.format(show.endAt);
}

export function formatTime(date) {
  return TIME.format(date);
}

export function relativeTime(date, now = new Date()) {
  const minutes = Math.round((date - now) / 60000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }
  return rtf.format(Math.round(hours / 24), "day");
}

export function timezoneLabel(now = new Date()) {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return (
    zone.replace(/_/g, " ") +
    " (GMT" +
    sign +
    hours +
    (minutes ? ":" + String(minutes).padStart(2, "0") : "") +
    ")"
  );
}

function icsDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function icsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

export function showIcs(show, stationTitle, url) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//dnbradio//player//EN",
    "BEGIN:VEVENT",
    "UID:" + show.id + "-" + icsDate(show.startAt) + "@dnbradio.com",
    "DTSTAMP:" + icsDate(new Date()),
    "DTSTART:" + icsDate(show.startAt),
    "DTEND:" + icsDate(show.endAt),
    ...(showRrule(show) ? ["RRULE:" + showRrule(show)] : []),
    "SUMMARY:" +
      icsText(show.host + " – " + show.title + " on " + stationTitle),
    "DESCRIPTION:" + icsText((show.description || "") + "\n\nListen: " + url),
    "URL:" + url,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

const cache = {};

// Shared by the player, the now playing sheet, and the schedule page;
// refetched after five minutes.
export function fetchSchedule(url) {
  const hit = cache[url];
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) {
    return hit.promise;
  }
  const promise = fetch(url)
    .then((response) => response.json())
    .then(normalizeShows)
    .catch(() => {
      delete cache[url];
      return [];
    });
  cache[url] = { at: Date.now(), promise };
  return promise;
}

const RRULE = {
  weekly: "FREQ=WEEKLY",
  even: "FREQ=WEEKLY;INTERVAL=2",
  odd: "FREQ=WEEKLY;INTERVAL=2",
};

export function showRrule(show) {
  const day = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][
    show.startAt.getUTCDay()
  ];
  if (RRULE[show.occurs]) {
    return RRULE[show.occurs];
  }
  if (show.occurs === "last") {
    return "FREQ=MONTHLY;BYDAY=-1" + day;
  }
  if (show.occurs === 1 || show.occurs === "1") {
    return "FREQ=MONTHLY;BYDAY=1" + day;
  }
  return "";
}

export function googleCalendarUrl(show, stationTitle, url) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: show.host + " – " + show.title + " on " + stationTitle,
    dates: icsDate(show.startAt) + "/" + icsDate(show.endAt),
    details: (show.description || "") + "\n\nListen: " + url,
  });
  const rule = showRrule(show);
  if (rule) {
    params.set("recur", "RRULE:" + rule);
  }
  return "https://calendar.google.com/calendar/render?" + params.toString();
}
