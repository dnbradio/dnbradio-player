import { test, expect } from "@playwright/test";

// A real, short PCM recording exercises HTMLMediaElement playback without
// depending on the radio network or third-party APIs being available in CI.
function tone() {
  const rate = 8000,
    length = rate * 20;
  const data = Buffer.alloc(44 + length * 2);
  data.write("RIFF");
  data.writeUInt32LE(data.length - 8, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24);
  data.writeUInt32LE(rate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(length * 2, 40);
  for (let i = 0; i < length; i++)
    data.writeInt16LE(
      Math.round(Math.sin((2 * Math.PI * 220 * i) / rate) * 1000),
      44 + i * 2,
    );
  return data;
}
const episode = {
  id: 58124,
  artist: "Test DJ",
  title: "Release check",
  image: "",
  timestamp: "2026-10-29T00:00:00Z",
  plays: 12,
  playback_url: "https://audio.example.test/episode.wav",
  download_url: "https://audio.example.test/episode.wav",
};
const nowplaying = {
  listeners: { current: 7 },
  live: { is_live: false },
  now_playing: {
    song: { artist: "Test Artist", title: "Live test" },
    elapsed: 0,
    duration: 300,
  },
  song_history: [],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const create = document.createElement.bind(document);
    window.testAudio = [];
    document.createElement = (tag, ...args) => {
      const element = create(tag, ...args);
      if (tag === "audio") window.testAudio.push(element);
      return element;
    };
    localStorage.setItem("dnbradio-player-whats-new-2026-11", "1");
  });
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (
      url.includes("/listen/") ||
      url.startsWith("https://audio.example.test/")
    ) {
      return route.fulfill({
        status: 200,
        contentType: "audio/wav",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: tone(),
      });
    }
    if (url.includes("/api/nowplaying/"))
      return route.fulfill({ json: nowplaying });
    if (url.includes("/api/schedule")) return route.fulfill({ json: [] });
    if (url.includes("/api/podcast/58124"))
      return route.fulfill({ json: { data: episode } });
    if (url.includes("/api/podcast"))
      return route.fulfill({
        json: { data: [episode], pagination: { total_pages: 1, total: 1 } },
      });
    if (!url.startsWith("http://127.0.0.1:4173/")) return route.abort();
    return route.continue();
  });
});

test("live audio survives navigation, stops its connection, and keeps attribution", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./?src=discord");
  await page.locator(".player__controls .play-button").click();
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0]?.paused))
    .toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0]?.readyState))
    .toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => window.testAudio[0].src)).toContain(
    "/discord.mp3?",
  );
  await page.locator('a.station-nav__item[href*="schedule"]').click();
  await expect(page.locator(".mini")).toBeVisible();
  expect(await page.evaluate(() => window.testAudio[0].paused)).toBe(false);
  await page.locator(".mini .play-button").click();
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0].getAttribute("src")))
    .toBe(null);
  expect(page.url()).toContain("src=discord");
  expect(errors).toEqual([]);
});

test("direct episode links reload and play", async ({ page }) => {
  await page.goto("./stations/1/podcast/58124");
  await expect(
    page.locator(".ep__title").filter({ hasText: "Release check" }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Forward 30 seconds" }),
  ).toBeVisible();
  await page.locator(".play-button").first().click();
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0]?.paused))
    .toBe(false);
});

test("native sheets support keyboard dismissal and restore focus", async ({
  page,
}) => {
  await page.goto("./");
  const trigger = page.getByRole("button", {
    name: "Stations and station info",
  });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("unknown app paths show the recovery page", async ({ page }) => {
  await page.goto("./missing-route");
  await expect(
    page.getByRole("heading", { name: "This page doesn't exist" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to the player" }).click();
  await expect(page.locator(".player__controls")).toBeVisible();
});
