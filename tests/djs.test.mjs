import test from "node:test";
import assert from "node:assert/strict";
import { djProfile } from "../lib/djs.js";
import djPlugin from "../plugins/dj.js";

test("only the two supplied DJ profiles enable DJ mode", () => {
  assert.equal(djProfile("djaffirmation").image, "dj-affirmation.webp");
  assert.equal(djProfile("drastic").image, "dj-drastic.webp");
  for (const value of [
    undefined,
    null,
    "",
    "unknown",
    "constructor",
    "__proto__",
    ["drastic", "djaffirmation"],
  ])
    assert.equal(djProfile(value), null);
});

test("DJ mode survives navigation alongside attribution and other query values", () => {
  let guard;
  djPlugin(
    {
      route: { query: { dj: "drastic" } },
      app: {
        router: {
          beforeEach(fn) {
            guard = fn;
          },
        },
      },
    },
    () => {},
  );
  assert.deepEqual(
    guard({
      path: "/stations/2",
      query: { src: "discord", sort: "popular" },
      hash: "#shows",
    }),
    {
      path: "/stations/2",
      query: { src: "discord", sort: "popular", dj: "drastic" },
      hash: "#shows",
    },
  );
  assert.equal(guard({ query: { dj: "drastic" } }), true);
});
