import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

const lib = (path) => loadModule(new URL(path, import.meta.url));
const { cleanMeta, stripTags } = await lib("../lib/text.js");
const { normalizeNowPlaying } = await lib("../lib/nowplaying.js");
const schedule = await lib("../lib/schedule.js");

test("metadata is decoded to plain text", () => {
  assert.equal(cleanMeta("Drum &amp; Bass"), "Drum & Bass");
  assert.equal(cleanMeta("Don\\'t Stop"), "Don't Stop");
  assert.equal(cleanMeta("Caf%C3%A9"), "Café");
  // A literal percent sign used to throw in decodeURIComponent.
  assert.equal(cleanMeta("100% Dub"), "100% Dub");
  assert.equal(cleanMeta("Track (Original Title)"), "Track");
  assert.equal(
    cleanMeta("<img src=x onerror=alert(1)>"),
    "<img src=x onerror=alert(1)>"
  );
  assert.equal(cleanMeta(null), "");
  assert.equal(stripTags("One<br />Two &amp; Three"), "One\nTwo & Three");
});

const station = {
  id: 1,
  title: "dnbradio.com",
  subtitle: "all flavors",
  nowplaying_url: { type: "azuracast" },
};

test("AzuraCast playlist rotation", () => {
  const np = normalizeNowPlaying(station, {
    listeners: { current: 99 },
    live: { is_live: false, streamer_name: "" },
    now_playing: {
      played_at: 100,
      elapsed: 10,
      duration: 300,
      streamer: "",
      song: { artist: "Apex", title: "Falling", album: "Vol 11", art: "a.jpg" },
    },
    playing_next: {
      song: { artist: "Thomas B", title: "Psychedelic Reality", art: "b.jpg" },
    },
    song_history: [
      {
        played_at: 50,
        song: { artist: "Bladerunner", title: "Run For Cover", art: "c.jpg" },
      },
      { played_at: 40, song: { artist: "", title: "" } },
    ],
  });
  assert.equal(np.live, false);
  assert.equal(np.artist, "Apex");
  assert.equal(np.listeners, 99);
  assert.equal(np.next.title, "Psychedelic Reality");
  assert.equal(np.history.length, 1);
  assert.equal(np.history[0].playedAt, 50000);
});

test("AzuraCast live broadcast uses the streamer as artist", () => {
  const np = normalizeNowPlaying(station, {
    listeners: { current: 0 },
    live: {
      is_live: true,
      streamer_name: "Valis",
      broadcast_start: 1000,
      art: "dj.jpg",
    },
    now_playing: {
      streamer: "Valis",
      song: { artist: "", title: "Kief Science Session", art: "x.jpg" },
    },
    playing_next: { song: { artist: "A", title: "B" } },
    song_history: [],
  });
  assert.equal(np.live, true);
  assert.equal(np.artist, "Valis");
  assert.equal(np.title, "Kief Science Session");
  assert.equal(np.art, "dj.jpg");
  assert.equal(np.liveSince, 1000000);
  assert.equal(np.next, null);
  assert.equal(np.listeners, 0);
});

test("non-AzuraCast stations fall back to their description", () => {
  const np = normalizeNowPlaying(
    { ...station, nowplaying_url: { type: "icecast" } },
    {}
  );
  assert.equal(np.artist, "dnbradio.com");
  assert.equal(np.title, "all flavors");
});

const show = (start, end, occurs = "weekly") => ({
  id: 7,
  host: "Valis",
  title: "Kief, Science; Session",
  start,
  end,
  occurs,
});

test("schedule finds the live show and the next ones, without duplicates", () => {
  const shows = schedule.normalizeShows([
    show("2026-10-29T20:00:00Z", "2026-10-29T22:00:00Z"),
    show("2026-10-29T18:00:00Z", "2026-10-29T20:00:00Z"),
    show("2026-10-29T18:00:00Z", "2026-10-29T20:00:00Z"),
    show("2026-10-29T23:00:00Z", "2026-10-30T01:00:00Z"),
  ]);
  assert.equal(shows.length, 3);
  const now = new Date("2026-10-29T19:00:00Z");
  assert.equal(schedule.liveShow(shows, now).start, "2026-10-29T18:00:00Z");
  assert.deepEqual(
    schedule.upcomingShows(shows, now).map((item) => item.start),
    ["2026-10-29T20:00:00Z", "2026-10-29T23:00:00Z"]
  );
  assert.equal(
    schedule.liveShow(shows, new Date("2026-10-30T02:00:00Z")),
    null
  );
});

test("calendar entries repeat like the show", () => {
  const [weekly] = schedule.normalizeShows([
    show("2026-11-01T11:00:00Z", "2026-11-01T12:00:00Z"),
  ]);
  assert.equal(schedule.showRrule(weekly), "FREQ=WEEKLY");
  assert.equal(
    schedule.showRrule({ ...weekly, occurs: "even" }),
    "FREQ=WEEKLY;INTERVAL=2"
  );
  assert.equal(
    schedule.showRrule({ ...weekly, occurs: "last" }),
    "FREQ=MONTHLY;BYDAY=-1SU"
  );
  assert.equal(
    schedule.showRrule({ ...weekly, occurs: 1 }),
    "FREQ=MONTHLY;BYDAY=1SU"
  );
  assert.equal(schedule.showRrule({ ...weekly, occurs: null }), "");
  const ics = schedule.showIcs(
    weekly,
    "dnbradio.com",
    "https://dnbradio.com/player/"
  );
  assert.match(ics, /DTSTART:20261101T110000Z/);
  assert.match(ics, /RRULE:FREQ=WEEKLY/);
  assert.ok(
    ics.includes(
      "SUMMARY:Valis – Kief\\, Science\\; Session on dnbradio.com\r\n"
    )
  );
  const google = new URL(
    schedule.googleCalendarUrl(
      weekly,
      "dnbradio.com",
      "https://dnbradio.com/player/"
    )
  );
  assert.equal(
    google.searchParams.get("dates"),
    "20261101T110000Z/20261101T120000Z"
  );
  assert.equal(google.searchParams.get("recur"), "RRULE:FREQ=WEEKLY");
});
