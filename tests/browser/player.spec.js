import { test, expect } from "@playwright/test";

let toneData;

// A real PCM recording exercises HTMLMediaElement playback without
// depending on the radio network or third-party APIs being available in CI.
function tone() {
  if (toneData) return toneData;
  const rate = 8000,
    // Longer than GPU-heavy CI checks, so a live fixture never ends mid-test.
    length = rate * 120;
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
  toneData = data;
  return toneData;
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

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    // Stable UI rendering: start with the original preset. Separate unit tests
    // vary random sources, and the renderer matrix still exercises all 29.
    Math.random = () => 0.1;
    // Enforce a consistent user-gesture policy across browser engines.
    let activated = false;
    document.addEventListener(
      "click",
      () => {
        activated = true;
      },
      true,
    );
    document.addEventListener(
      "keydown",
      () => {
        activated = true;
      },
      true,
    );
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!activated)
        return Promise.reject(
          new DOMException("User gesture required", "NotAllowedError"),
        );
      return nativePlay.call(this);
    };
    const create = document.createElement.bind(document);
    window.testAudio = [];
    Object.defineProperty(window, "currentAudio", {
      get: () =>
        document.getElementById("app").__vue_app__.config.globalProperties
          .$player.audio,
    });
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
      url.includes("/streamtest/") ||
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
    if (!url.startsWith(new URL(baseURL).origin + "/")) return route.abort();
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

test("broadcast overlays stay transparent and chat shows newest messages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 400, height: 180 });
  await page.route("**/api/chat_log", (route) =>
    route.fulfill({
      json: Array.from({ length: 30 }, (_, i) => ({
        nick: "DJ",
        message: "Message " + (30 - i),
      })),
    }),
  );
  await page.goto("./stations/1/widget-chat");
  await expect(page.locator(".chat-line")).toHaveCount(30);
  await expect
    .poll(() =>
      page
        .locator(".broadcast-widget")
        .evaluate((element) =>
          Math.abs(
            element.scrollHeight - element.clientHeight - element.scrollTop,
          ),
        ),
    )
    .toBeLessThan(2);
  expect(
    await page.evaluate(() =>
      ["html", "body", "#app"].map(
        (selector) =>
          getComputedStyle(document.querySelector(selector)).backgroundColor,
      ),
    ),
  ).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
  await expect(page.locator(".chat-line").last()).toHaveText("DJMessage 30");
});

test("Webamp keeps its framing rules in a landscape embed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 280 });
  await page.goto("./webamp/");
  await expect(page.locator("#main-window")).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/dnb-embed/);
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).overflowY),
  ).toBe("hidden");
});

for (const [id, name, image] of [
  ["djaffirmation", "DJ Affirmation", "dj-affirmation.webp"],
  ["drastic", "Drastic", "dj-drastic.webp"],
]) {
  test(`${name} reacts to audio, respects motion controls and survives navigation`, async ({
    page,
    browserName,
  }) => {
    await page.addInitScript(() => {
      window.analysisReads = 0;
      window.analysisPeak = 0;
      const read = AnalyserNode.prototype.getByteFrequencyData;
      AnalyserNode.prototype.getByteFrequencyData = function (bins) {
        read.call(this, bins);
        window.analysisReads++;
        window.analysisPeak = Math.max(window.analysisPeak, ...bins);
      };
    });
    await page.goto(`./?dj=${id}&src=discord`);
    const head = page.locator(".dj-mode__head");
    await expect(head).toHaveAttribute("src", new RegExp(image));
    await expect(head).toHaveAttribute("alt", new RegExp(name));
    await page.locator(".player__controls .play-button").click();
    await expect
      .poll(() => page.evaluate(() => window.analysisReads))
      .toBeGreaterThan(0);
    if (browserName !== "webkit" || process.platform !== "darwin") {
      await expect
        .poll(() => page.evaluate(() => window.analysisPeak))
        .toBeGreaterThan(0);
    } else {
      test.info().annotations.push({
        type: "verification-limit",
        description:
          "macOS Playwright WebKit returns zero FFT bins for decoded media. Nonzero FFT is required in Chromium and Linux WebKit CI.",
      });
    }
    await expect
      .poll(() => head.evaluate((el) => el.style.transform))
      .toContain("translate");
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        value: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(head).toHaveCSS("transform", "none");
    const hiddenReads = await page.evaluate(() => window.analysisReads);
    const hiddenTime = await page.evaluate(
      () => window.testAudio[0].currentTime,
    );
    await expect
      .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
      .toBeGreaterThan(hiddenTime);
    expect(await page.evaluate(() => window.analysisReads)).toBe(hiddenReads);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect
      .poll(() => page.evaluate(() => window.analysisReads))
      .toBeGreaterThan(hiddenReads);
    await page.getByRole("button", { name: "Motion on", exact: true }).click();
    await expect(head).toHaveCSS("transform", "none");
    const time = await page.evaluate(() => window.testAudio[0].currentTime);
    await expect
      .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
      .toBeGreaterThan(time);
    await page.getByRole("button", { name: "Motion off", exact: true }).click();
    await expect
      .poll(() => head.evaluate((el) => el.style.transform))
      .toContain("translate");
    await page.locator('a.station-nav__item[href*="schedule"]').click();
    await expect(page).toHaveURL(new RegExp(`dj=${id}`));
    await expect(page).toHaveURL(/src=discord/);
    await page.locator(".mini__body").click();
    await expect(head).toBeVisible();
    await expect
      .poll(() => head.evaluate((el) => el.style.transform))
      .toContain("translate");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(
      page.getByRole("button", { name: "Reduced motion", exact: true }),
    ).toBeDisabled();
    await expect(head).toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect
      .poll(() => head.evaluate((el) => el.style.transform))
      .toContain("translate");
    await page.locator(".player__controls .play-button").click();
    await expect(head).toHaveCSS("transform", "none");
  });
}

test("DJ mode falls back to native playback if CORS analysis cannot load the stream", async ({
  page,
}) => {
  let rejected = false;
  await page.route("**/listen/**", async (route) => {
    if (
      await page.evaluate(
        () =>
          window.testAudio.filter((a) => a.preload === "none").at(-1)
            .crossOrigin === "anonymous",
      )
    ) {
      rejected = true;
      return route.abort("failed");
    }
    return route.fulfill({
      status: 200,
      contentType: "audio/wav",
      body: tone(),
    });
  });
  await page.goto("./?dj=drastic");
  await page.locator(".player__controls .play-button").click();
  await expect(
    page.getByRole("button", { name: "Motion unavailable", exact: true }),
  ).toBeDisabled();
  expect(rejected).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const audio = window.testAudio.at(-1);
        return !audio.paused && audio.currentTime > 0;
      }),
    )
    .toBe(true);
  await page.locator(".player__controls .play-button").click();
  await expect
    .poll(() =>
      page.evaluate(() => window.testAudio.at(-1).getAttribute("src")),
    )
    .toBe(null);
});

test("normal and unknown DJ queries keep the original audio path", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.contexts = 0;
    const Context = window.AudioContext || window.webkitAudioContext;
    window.AudioContext = new Proxy(Context, {
      construct(target, args) {
        window.contexts++;
        return Reflect.construct(target, args);
      },
    });
  });
  for (const query of [
    "",
    "?dj=unknown",
    "?dj=constructor",
    "?dj=drastic&dj=djaffirmation",
  ]) {
    await page.goto("./" + query);
    await expect(page.locator(".dj-mode")).toHaveCount(0);
    await page.locator(".player__controls .play-button").click();
    await expect
      .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
      .toBeGreaterThan(0);
    expect(
      await page.evaluate(() => ({
        contexts: window.contexts,
        cors: window.testAudio[0].crossOrigin,
      })),
    ).toEqual({ contexts: 0, cors: null });
  }
});

test("DJ analysis setup failures preserve native audio playback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    AudioContext.prototype.createMediaElementSource = () => {
      throw new DOMException("Unavailable", "NotSupportedError");
    };
  });
  await page.goto("./?dj=djaffirmation");
  await page.locator(".player__controls .play-button").click();
  await expect(
    page.getByRole("button", { name: "Motion unavailable", exact: true }),
  ).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => window.testAudio.at(-1).currentTime))
    .toBeGreaterThan(0);
});

test("initial reduced motion keeps the DJ still while audio plays", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./?dj=drastic");
  await page.locator(".player__controls .play-button").click();
  await expect(
    page.getByRole("button", { name: "Reduced motion", exact: true }),
  ).toBeDisabled();
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
    .toBeGreaterThan(0);
  await expect(page.locator(".dj-mode__head")).toHaveCSS("transform", "none");
});

test("a DJ query keeps podcasts on native audio without analysis", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.contexts = 0;
    const Context = window.AudioContext;
    window.AudioContext = class extends Context {
      constructor(...args) {
        super(...args);
        window.contexts++;
      }
    };
  });
  await page.goto("./stations/1/podcast/58124?dj=drastic");
  const play = page.locator(".ep__controls .play-button");
  await play.click();
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.contexts)).toBe(0);
  expect(await page.evaluate(() => window.testAudio[0].crossOrigin)).toBe(null);
  await expect(page.locator(".dj-mode")).toHaveCount(0);
  await page.evaluate(() =>
    document
      .getElementById("app")
      .__vue_app__.config.globalProperties.$router.push("/"),
  );
  await expect(page.locator(".player__controls")).toBeVisible();
  await expect(page.locator(".dj-mode")).toHaveCount(0);
  await page.evaluate(() => {
    const dj =
      document.getElementById("app").__vue_app__.config.globalProperties.$dj
        .current;
    dj.toggle();
    dj.toggle();
  });
  expect(await page.evaluate(() => window.contexts)).toBe(0);
  expect(await page.evaluate(() => window.testAudio[0].crossOrigin)).toBe(null);
  const time = await page.evaluate(() => window.testAudio[0].currentTime);
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
    .toBeGreaterThan(time);
});

test("an analysis failure before play cannot assign an empty source or start audio", async ({
  page,
}) => {
  await page.addInitScript(() => {
    AudioContext.prototype.resume = () =>
      Promise.reject(new DOMException("Unavailable", "NotSupportedError"));
  });
  await page.goto("./?dj=djaffirmation");
  await page.getByRole("button", { name: "Motion on", exact: true }).click();
  await page.getByRole("button", { name: "Motion off", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Motion unavailable", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => ({
      paused: window.testAudio.at(-1).paused,
      src: window.testAudio.at(-1).getAttribute("src"),
    })),
  ).toEqual({ paused: true, src: null });
  await page.locator(".player__controls .play-button").click();
  await expect
    .poll(() => page.evaluate(() => window.testAudio.at(-1).currentTime))
    .toBeGreaterThan(0);
});

test("DJ mode stops on other stations and returns on the main stream", async ({
  page,
}) => {
  await page.goto("./?dj=drastic&src=discord");
  await page.locator(".player__controls .play-button").click();
  await expect
    .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
    .toBeGreaterThan(0);
  await expect(page.locator(".dj-mode__head")).toBeVisible();
  await page.getByRole("button", { name: "Next station", exact: true }).click();
  await expect(page).toHaveURL(/stations\/2/);
  await expect(page.locator(".dj-mode")).toHaveCount(0);
  expect(await page.evaluate(() => window.testAudio.at(-1).crossOrigin)).toBe(
    null,
  );
  await expect
    .poll(() => page.evaluate(() => window.testAudio.at(-1).currentTime))
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Previous station", exact: true })
    .click();
  await expect(page.locator(".dj-mode__head")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.testAudio.at(-1).currentTime))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.testAudio.at(-1).crossOrigin)).toBe(
    "anonymous",
  );
  for (const path of [
    "stations/2",
    "stations/3",
    "stations/4",
    "stations/5",
    "darkstep",
  ]) {
    await page.goto(`./${path}?dj=drastic`);
    await expect(page.locator(".dj-mode")).toHaveCount(0);
    await page.locator(".player__controls .play-button").click();
    await expect
      .poll(() => page.evaluate(() => window.testAudio[0].currentTime))
      .toBeGreaterThan(0);
    expect(await page.evaluate(() => window.testAudio[0].crossOrigin)).toBe(
      null,
    );
  }
});

test("link crawlers receive DJ previews only on the main stream", async ({
  request,
}) => {
  const meta = (html, key) =>
    html.match(new RegExp(`(?:property|name)="${key}" content="([^"]+)"`))?.[1];
  for (const path of ["", "stations/1/"]) {
    for (const id of ["drastic", "djaffirmation"]) {
      const html = await (
        await request.get(`./${path}?src=discord&dj=${id}`)
      ).text();
      expect(meta(html, "og:image")).toContain(`/djs/${id}-preview.png`);
      expect(meta(html, "twitter:image")).toBe(meta(html, "og:image"));
      expect(meta(html, "og:url")).toContain(`?dj=${id}`);
      expect(meta(html, "twitter:card")).toBe("summary_large_image");
    }
  }
  for (const query of [
    "",
    "?dj=unknown",
    "?dj=drastic&dj=djaffirmation",
    "?dj=drastic&%64j=drastic",
  ]) {
    const html = await (await request.get(`./${query}`)).text();
    expect(meta(html, "og:image")).toContain("/x-card/winamp-station-1.png");
    expect(meta(html, "twitter:image")).toBe(meta(html, "og:image"));
  }
  const html = await (await request.get("./stations/2/?dj=drastic")).text();
  expect(meta(html, "og:image")).toContain("og-station-2.png");
  const image = await request.get("./djs/drastic-preview.png");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
});

test("a late main-stream analysis failure cannot replace another station's audio", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const resume = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function () {
      resume.call(this);
      return new Promise((resolve, reject) => {
        window.rejectOldAnalysis = reject;
      });
    };
  });
  await page.goto("./?dj=drastic");
  await page.locator(".player__controls .play-button").click();
  await page.getByRole("button", { name: "Next station", exact: true }).click();
  await expect(page.locator(".dj-mode")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.testAudio.at(-1).currentTime))
    .toBeGreaterThan(0);
  const count = await page.evaluate(() => window.testAudio.length);
  await page.evaluate(() =>
    window.rejectOldAnalysis(
      new DOMException("Unavailable", "NotSupportedError"),
    ),
  );
  expect(await page.evaluate(() => window.testAudio.length)).toBe(count);
  expect(await page.evaluate(() => window.testAudio.at(-1).paused)).toBe(false);
});

test("visualizations cycle through stars, audio-reactive MilkDrop, rain and off", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  const toggle = page.getByRole("button", { name: /^Visualizations:/ });
  await expect(toggle).toHaveAttribute(
    "aria-label",
    "Visualizations: Off. Next: Stars",
  );
  await toggle.click();
  await expect(page.locator('[data-visualization="stars"]')).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute(
    "aria-label",
    "Visualizations: MilkDrop. Next: Rain",
  );
  await page.locator(".player__controls .play-button").click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const canvas = document.querySelector(
          '[data-visualization="milkdrop"] canvas:last-child',
        );
        if (!canvas) return false;
        const data = canvas
          .getContext("2d")
          .getImageData(0, 0, canvas.width, canvas.height).data;
        return data.some((value, index) => index % 4 !== 3 && value > 30);
      }),
    )
    .toBe(true);
  const time = await page.evaluate(() => window.currentAudio.currentTime);
  await toggle.click();
  await expect(page.locator('[data-visualization="rain"]')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.currentTime))
    .toBeGreaterThan(time);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[data-visualization="off"]')).toBeHidden();
  await expect(page.locator(".player__icon .mdi-waveform")).toHaveCount(1);
  // Butterchurn 3 owns an internal WebGL canvas and copies into this 2D canvas.
  // Re-entering MilkDrop must create a fresh renderer after losing the old GL context.
  await toggle.click();
  await toggle.click();
  await expect(page.locator('[data-visualization="milkdrop"]')).toHaveAttribute(
    "data-milkdrop-input",
    "live",
  );
  await expect(
    page.getByRole("status").filter({ hasText: "unavailable" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("turning on MilkDrop during podcast playback keeps position", async ({
  page,
}) => {
  await page.route("https://audio.example.test/**", (route) => {
    const data = tone();
    const range = route.request().headers().range;
    const start = range ? Number(range.match(/bytes=(\d+)/)[1]) : 0;
    const requestedEnd = range?.match(/bytes=\d+-(\d+)/)?.[1];
    const end = requestedEnd
      ? Math.min(Number(requestedEnd), data.length - 1)
      : data.length - 1;
    return route.fulfill({
      status: range ? 206 : 200,
      contentType: "audio/wav",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": "bytes",
        ...(range
          ? {
              "Content-Range": `bytes ${start}-${end}/${data.length}`,
            }
          : {}),
      },
      body: data.subarray(start, end + 1),
    });
  });
  await page.goto("./");
  await page.locator('a.station-nav__item[href*="podcast"]').click();
  await page.locator(".play-button").first().click();
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.readyState))
    .toBeGreaterThanOrEqual(2);
  await page.evaluate(() => {
    window.currentAudio.currentTime = 7;
  });
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.currentTime))
    .toBeGreaterThanOrEqual(7);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const toggle = page.getByRole("button", { name: /^Visualizations:/ });
  await toggle.click();
  await toggle.click();
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.currentTime))
    .toBeGreaterThanOrEqual(7);
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.paused))
    .toBe(false);
});

test("player collapses upward to a 40px marquee while visuals and audio keep running", async ({
  page,
}) => {
  await page.goto("./?dj=drastic");
  await page.locator(".player__controls .play-button").click();
  const visuals = page.getByRole("button", { name: /^Visualizations:/ });
  await visuals.click();
  await visuals.click();
  const bounds = await page.locator(".player").boundingBox();
  await page
    .getByRole("button", { name: "Minimize player", exact: true })
    .click();
  await expect
    .poll(async () =>
      Math.round((await page.locator(".player").boundingBox()).height),
    )
    .toBe(40);
  const collapsed = await page.locator(".player").boundingBox();
  expect(collapsed.y).toBe(bounds.y);
  await expect(page.locator(".player__marquee")).toHaveAttribute(
    "aria-label",
    /Test Artist.*Live test/,
  );
  await expect(page.locator(".player__controls")).toBeHidden();
  await expect(page.locator(".dj-mode")).toHaveCount(0);
  await expect(page.locator("[data-visualization=milkdrop]")).toBeVisible();
  const time = await page.evaluate(() => window.currentAudio.currentTime);
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.currentTime))
    .toBeGreaterThan(time);
  await visuals.click();
  await expect(page.locator("[data-visualization=rain]")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".player__marquee-track")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.locator(".player__marquee").dblclick();
  await expect(
    page.getByRole("button", { name: "Minimize player", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".player__controls")).toBeVisible();
  await page
    .getByRole("button", { name: "Minimize player", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand player", exact: true })
    .click();
  await expect(page.locator(".player__controls")).toBeVisible();
});

test("MilkDrop uses an inaudible test signal while idle and returns to real audio", async ({
  page,
}) => {
  const { instrumentAudioRouting } = await import("./audio-routing.js");
  await page.addInitScript(instrumentAudioRouting);
  await page.goto("./");
  const visuals = page.getByRole("button", { name: /^Visualizations:/ });
  await visuals.click();
  await visuals.click();
  const host = page.locator("[data-visualization=milkdrop]");
  await expect(host).toHaveAttribute("data-milkdrop-input", "test");
  await expect
    .poll(() => page.evaluate(() => milkdropRouting.peak()))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(() => milkdropRouting.activeSources().length),
  ).toBe(1);
  expect(await page.evaluate(() => milkdropRouting.hasAudiblePath())).toBe(
    false,
  );
  expect(await page.evaluate(() => window.currentAudio.paused)).toBe(true);
  await expect(
    page.getByRole("status").filter({ hasText: "silent test signal" }),
  ).toBeVisible();
  await page.locator(".player__controls .play-button").click();
  await expect(host).toHaveAttribute("data-milkdrop-input", "live");
  expect(
    await page.evaluate(() => milkdropRouting.activeSources().length),
  ).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(window.currentAudio, "readyState", {
      configurable: true,
      value: 2,
    });
    window.currentAudio.dispatchEvent(new Event("waiting"));
  });
  await expect(host).toHaveAttribute("data-milkdrop-input", "test");
  expect(await page.evaluate(() => milkdropRouting.hasAudiblePath())).toBe(
    false,
  );
  await page.evaluate(() => {
    delete window.currentAudio.readyState;
    window.currentAudio.dispatchEvent(new Event("playing"));
  });
  await expect(host).toHaveAttribute("data-milkdrop-input", "live");
  await page.locator(".player__controls .play-button").click();
  await expect(host).toHaveAttribute("data-milkdrop-input", "test");
  expect(await page.evaluate(() => milkdropRouting.hasAudiblePath())).toBe(
    false,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => page.evaluate(() => milkdropRouting.activeSources().length))
    .toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(host).toHaveAttribute("data-milkdrop-input", "test");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(
    await page.evaluate(() => milkdropRouting.activeSources().length),
  ).toBe(0);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(host).toHaveAttribute("data-milkdrop-input", "test");
  await visuals.click();
  await expect
    .poll(() => page.evaluate(() => milkdropRouting.activeSources().length))
    .toBe(0);
});

test("visualizations load MilkDrop on demand and retain the selected mode", async ({
  page,
}) => {
  const chunks = [];
  page.on("request", (request) => {
    if (/\/milkdrop-.*\.js/.test(request.url())) chunks.push(request.url());
  });
  await page.goto("./");
  const visuals = page.getByRole("button", { name: /^Visualizations:/ });
  expect(chunks).toHaveLength(0);
  await visuals.click();
  expect(chunks).toHaveLength(0);
  await visuals.click();
  await expect.poll(() => chunks.length).toBe(1);
  await expect(
    page.locator("[data-visualization=milkdrop] canvas:last-child"),
  ).toHaveCSS("opacity", "1");
  const player = page.locator(".player");
  await player.evaluate((element) => element.classList.add("player--framed"));
  await expect(player).toHaveCSS("background-image", "none");
  await expect(player).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(player).toHaveCSS("backdrop-filter", "none");
  await visuals.click();
  await expect(player).toHaveCSS("backdrop-filter", "blur(10px)");
  await expect(player).not.toHaveCSS("background-image", "none");
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Visualizations:/ }),
  ).toHaveAttribute("aria-label", "Visualizations: Rain. Next: Off");
  await expect(page.locator(".dj-mode")).toHaveCount(0);
});

test("MilkDrop WebGL failure leaves other effects and native playback usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === "webgl2" ? null : get.call(this, type, ...args);
    };
  });
  await page.goto("./");
  const visuals = page.getByRole("button", { name: /^Visualizations:/ });
  await visuals.click();
  await visuals.click();
  await expect(
    page.getByRole("status").filter({ hasText: "MilkDrop requires WebGL 2" }),
  ).toBeVisible();
  await page.locator(".player__controls .play-button").click();
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.currentTime))
    .toBeGreaterThan(0);
  await visuals.click();
  await expect(page.locator("[data-visualization=rain]")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.currentTime))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.currentAudio.crossOrigin)).toBe(null);
});

test("MilkDrop CORS failure restores native audio without requiring a DJ", async ({
  page,
}) => {
  await page.route("**/listen/**", (route) => {
    if (route.request().headers().origin) return route.abort("failed");
    return route.fulfill({
      status: 200,
      contentType: "audio/wav",
      body: tone(),
    });
  });
  await page.goto("./");
  const visuals = page.getByRole("button", { name: /^Visualizations:/ });
  await visuals.click();
  await visuals.click();
  await page.locator(".player__controls .play-button").click();
  await expect
    .poll(() => page.evaluate(() => window.currentAudio.currentTime))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.currentAudio.crossOrigin)).toBe(null);
  await expect(page.locator(".dj-mode")).toHaveCount(0);
  await visuals.click();
  await expect(page.locator("[data-visualization=rain]")).toBeVisible();
});

test("MilkDrop resumes after audio-context interruption", async ({ page }) => {
  await page.goto("./");
  const visuals = page.getByRole("button", { name: /^Visualizations:/ });
  await visuals.click();
  await visuals.click();
  const host = page.locator("[data-visualization=milkdrop]");
  await expect(host).toHaveAttribute("data-milkdrop-input", "test");
  await page.evaluate(() =>
    document
      .getElementById("app")
      .__vue_app__.config.globalProperties.$player.getVisualizationAudio()
      .context.suspend(),
  );
  await expect(host).toHaveAttribute("data-milkdrop-input", "inactive");
  await page.evaluate(() =>
    document
      .getElementById("app")
      .__vue_app__.config.globalProperties.$player.getVisualizationAudio()
      .context.resume(),
  );
  await expect(host).toHaveAttribute("data-milkdrop-input", "test");
});

test("MilkDrop visibly responds to bass attacks instead of only elapsed time", async ({
  page,
}) => {
  // This test compiles the entire bundled library on software GPU runners.
  test.setTimeout(90_000);
  let moduleUrl;
  page.on("response", (response) => {
    if (/\/milkdrop-[^/]+\.js$/.test(new URL(response.url()).pathname)) {
      moduleUrl = response.url();
    }
  });
  await page.goto("./");
  const fx = page.getByRole("button", { name: /^Visualizations:/ });
  await fx.click();
  await fx.click();
  await expect(page.locator("[data-visualization=milkdrop]")).toHaveAttribute(
    "data-milkdrop-input",
    "test",
  );
  // Stop the full-screen instance while exercising a separate 64px renderer.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const result = await page.evaluate(async (url) => {
    const { createMilkDrop } = await import(url);
    const context = new AudioContext();
    const source = context.createGain();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const visualizer = await createMilkDrop(context, canvas, source, 64, 64);
    try {
      const visited = new Set();
      let response;
      for (let presetIndex = 0; presetIndex < 29; presetIndex++) {
        const name = canvas.dataset.milkdropPreset;
        visited.add(name);
        if (
          name === "Flexi, martin + geiss - dedicated to the sherwin maxawow"
        ) {
          // Exercise the real FFT, compiled preset and renderer with bass attacks.
          const runner = visualizer.renderer.presetEquationRunner;
          const run = runner.runFrameEquations.bind(runner);
          let frame;
          runner.runFrameEquations = (vars) => {
            frame = run(vars);
            return frame;
          };
          function render(amplitude) {
            const wave = Uint8Array.from({ length: 1024 }, (_, i) =>
              Math.round(
                128 + amplitude * Math.sin((2 * Math.PI * 2 * i) / 1024),
              ),
            );
            visualizer.render({
              elapsedTime: 1 / 60,
              audioLevels: {
                timeByteArray: wave,
                timeByteArrayL: wave,
                timeByteArrayR: wave,
              },
            });
            return { zoom: frame.zoom, alpha: frame.wave_a };
          }
          let steady;
          for (let i = 0; i < 100; i++) steady = render(10);
          const attack = render(90);
          for (let i = 0; i < 100; i++) render(90);
          response = { steady, attack, settled: render(90) };
        } else visualizer.render({ elapsedTime: 1 / 60 });
        if (presetIndex < 28) await visualizer.nextPreset(0);
      }
      return { ...response, presets: visited.size };
    } finally {
      visualizer.dispose();
      await context.close();
    }
  }, moduleUrl);
  expect(result.presets).toBe(29);
  expect(result.steady.alpha).toBeLessThan(0.05);
  expect(result.attack.alpha).toBeGreaterThan(0.3);
  expect(result.attack.zoom).toBeLessThan(result.steady.zoom - 0.01);
  expect(result.settled.alpha).toBeLessThan(0.05);
});

test("MilkDrop rotates during playback and triple taps or N advance without changing transport", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  // A real small viewport limits GPU work without changing native input metrics.
  await page.setViewportSize({ width: 320, height: 480 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Advance visual frame timestamps without changing media time or watchdog timers.
  await page.addInitScript(() => {
    window.tapTrace = [];
    for (const type of ["pointerup", "touchend", "click"]) {
      document.addEventListener(
        type,
        (event) => {
          window.tapTrace.push({
            type,
            target: event.target.className,
            pointer: event.pointerType,
            primary: event.isPrimary,
            button: event.button,
            time: event.timeStamp,
            touches: event.changedTouches?.length,
          });
          if (window.tapTrace.length > 12) window.tapTrace.shift();
        },
        true,
      );
    }
    window.visualTimeOffset = 0;
    const request = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      request((time) => callback(time + window.visualTimeOffset));
  });
  async function advanceFrames(count) {
    for (let i = 0; i < count; i++)
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => {
              window.visualTimeOffset += 1000;
              resolve();
            }),
          ),
      );
  }
  await page.goto("./");
  const fx = page.getByRole("button", { name: /^Visualizations:/ });
  await fx.click();
  await fx.click();
  const host = page.locator("[data-visualization=milkdrop]");
  const canvas = host.locator("canvas:last-child");
  await expect(canvas).toHaveAttribute("data-milkdrop-preset", /.+/);
  const initial = await canvas.getAttribute("data-milkdrop-preset");
  await advanceFrames(20);
  await expect(canvas).toHaveAttribute("data-milkdrop-preset", initial);
  // Keep clear of the title button: mobile WebKit adjusts taps on nearby
  // subtitle text onto that control, opening the station dialog.
  const surface = page.locator(".player");
  const box = await surface.boundingBox();
  const position = { x: 4, y: box.height / 2 };
  if (isMobile) {
    for (let i = 0; i < 3; i++) {
      await page.touchscreen.tap(box.x + position.x, box.y + position.y);
      if (i < 2)
        await expect(canvas).toHaveAttribute("data-milkdrop-preset", initial);
    }
  } else await surface.click({ clickCount: 3, position });
  try {
    await expect(canvas).not.toHaveAttribute("data-milkdrop-preset", initial);
  } catch (error) {
    console.log(
      "Triple-tap input trace:",
      await page.evaluate(() => window.tapTrace),
    );
    throw error;
  }
  expect(await page.evaluate(() => window.currentAudio.paused)).toBe(true);
  const manual = await canvas.getAttribute("data-milkdrop-preset");
  await page.keyboard.press("n");
  await expect(canvas).not.toHaveAttribute("data-milkdrop-preset", manual);
  const keyboard = await canvas.getAttribute("data-milkdrop-preset");
  // Three control clicks must not count as a preset gesture.
  const minimize = page.getByRole("button", {
    name: /^(Minimize|Expand) player$/,
  });
  for (let i = 0; i < 3; i++) await minimize.click();
  await expect(canvas).toHaveAttribute("data-milkdrop-preset", keyboard);
  await minimize.click();
  await page.locator(".player__controls .play-button").click();
  await expect(host).toHaveAttribute("data-milkdrop-input", "live");
  await advanceFrames(20);
  await expect(canvas).not.toHaveAttribute("data-milkdrop-preset", keyboard);
  expect(await page.evaluate(() => window.currentAudio.paused)).toBe(false);
  const playing = await canvas.getAttribute("data-milkdrop-preset");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await advanceFrames(20);
  await expect(canvas).toHaveAttribute("data-milkdrop-preset", playing);
  await page.keyboard.press("n");
  await expect(canvas).not.toHaveAttribute("data-milkdrop-preset", playing);
  await fx.click();
  await page.keyboard.press("n");
  expect(errors).toEqual([]);
});
