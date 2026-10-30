import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canonicalTag, xPlayerCardTags } from "../scripts/social-cards.mjs";
import { staticRoutes } from "../scripts/static-routes.mjs";

test("social cards keep production station and Webamp URLs", async () => {
  const previous = process.env.ROUTER_BASE;
  process.env.ROUTER_BASE = "/player/";
  try {
    const html = await xPlayerCardTags("/stations/2/webamp");
    assert.match(html, /name="twitter:card" content="player"/);
    assert.match(
      html,
      /name="twitter:player" content="https:\/\/dnbradio.com\/player\/stations\/2\/webamp\/"/,
    );
    assert.match(
      html,
      /property="og:image" content="https:\/\/dnbradio.com\/player\/x-card\/og-station-2.png"/,
    );
    assert.equal(await xPlayerCardTags("/stations/1/podcast"), "");
  } finally {
    if (previous === undefined) delete process.env.ROUTER_BASE;
    else process.env.ROUTER_BASE = previous;
  }
});

test("all deployed station, embed, and broadcast-widget paths are generated", () => {
  for (const id of [1, 2, 3, 4, 5]) {
    for (const page of [
      "webamp",
      "embed",
      "podcast",
      "schedule",
      "donate",
      "chat",
      "widget-chat",
      "widget-nowplaying",
      "widget-upnext",
      "widget-donators",
      "widget-listeners",
      "widget-socials",
      "widget-marquee",
    ]) {
      assert.ok(staticRoutes.includes(`/stations/${id}/${page}`));
    }
  }
});

test("DJ metadata uses the selected head, with Winamp as the main-stream default", async () => {
  process.env.ROUTER_BASE = "/player/";
  for (const id of ["drastic", "djaffirmation"]) {
    const html = await xPlayerCardTags("/", id);
    assert.match(html, new RegExp(`/djs/${id}-preview.png`));
    assert.match(html, /summary_large_image/);
    assert.doesNotMatch(html, /twitter:player/);
    assert.match(
      html,
      new RegExp(`og:url" content="https://dnbradio.com/player/\\?dj=${id}`),
    );
    assert.doesNotMatch(
      await xPlayerCardTags("/stations/2", id),
      /dj-previews|djs\//,
    );
  }
  for (const id of [undefined, "unknown", ["drastic", "djaffirmation"]]) {
    const html = await xPlayerCardTags("/", id);
    assert.match(
      html,
      /og:image" content="https:\/\/dnbradio.com\/player\/x-card\/winamp-station-1.png/,
    );
    assert.match(html, /og:image:height" content="1200"/);
  }
});

test("the player installs as its own app scoped to its folder", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../static/manifest.webmanifest", import.meta.url)),
  );
  assert.equal(manifest.name, "DNBRADIO Player");
  // Relative to the manifest, so every build base (/player/, /player-dev/) scopes to itself.
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  for (const icon of manifest.icons) {
    const png = await readFile(
      new URL(`../static/${icon.src}`, import.meta.url),
    );
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  assert.match(
    html,
    /<link rel="manifest" href="%BASE_URL%manifest.webmanifest" \/>/,
  );
});

test("each generated page names its own production URL as canonical", () => {
  const previous = process.env.ROUTER_BASE;
  process.env.ROUTER_BASE = "/player/";
  try {
    assert.equal(
      canonicalTag("/"),
      '<link rel="canonical" href="https://dnbradio.com/player/" />',
    );
    assert.equal(
      canonicalTag("/stations/2/webamp"),
      '<link rel="canonical" href="https://dnbradio.com/player/stations/2/webamp/" />',
    );
  } finally {
    if (previous === undefined) delete process.env.ROUTER_BASE;
    else process.env.ROUTER_BASE = previous;
  }
});
