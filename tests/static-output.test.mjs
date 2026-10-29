import assert from "node:assert/strict";
import test from "node:test";
import { xPlayerCardTags } from "../scripts/social-cards.mjs";
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
