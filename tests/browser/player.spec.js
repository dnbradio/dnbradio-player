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

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => {
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
