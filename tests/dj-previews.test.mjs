import test from "node:test";
import assert from "node:assert/strict";
import { djNginxMaps, djPreviewFile } from "../scripts/dj-previews.mjs";

test("nginx and local server select the same preview, including encoded and repeated keys", () => {
  const config = djNginxMaps();
  const cases = config.split("\n").flatMap((line) => {
    const match = line.match(/^\s+"~(.+)" (\w+|"");$/);
    return match ? [[new RegExp(match[1]), match[2].replaceAll('"', "")]] : [];
  });
  for (const query of [
    "",
    "src=discord",
    "dj=drastic",
    "src=discord&dj=djaffirmation&v=2",
    "dj=unknown",
    "dj=constructor",
    "dj=Drastic",
    "dj=drastic&dj=djaffirmation",
    "dj=drastic&dj",
    "dj&dj=drastic",
    "%64%6A=drastic",
    "dj=%64rastic",
    "dj=drastic&%64j=drastic",
    "d%6a=djaffirmation&dj=drastic",
    "x=dj=drastic",
  ]) {
    const expected = djPreviewFile("/", new URLSearchParams(query));
    const selected = cases.find(([regex]) => regex.test(query))?.[1];
    assert.equal(selected || null, expected?.split("/")[1] || null, query);
    assert.equal(
      djPreviewFile("/stations/2/", new URLSearchParams(query)),
      null,
    );
    assert.equal(
      djPreviewFile("/stations/1/podcast", new URLSearchParams(query)),
      null,
    );
  }
});
