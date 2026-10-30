import { mkdir, readFile, writeFile } from "node:fs/promises";
process.env.ROUTER_BASE = process.argv[2] || "/player/";
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(process.env.ROUTER_BASE))
  throw new Error("Invalid base path");
const { build } = await import("vite");
await build();
const { canonicalTag, xPlayerCardTags } = await import("./social-cards.mjs");
const { staticRoutes } = await import("./static-routes.mjs");
const { djProfiles } = await import("../lib/djs.js");
const { mainDjRoutes, djPreviewFile, djNginxMaps } =
  await import("./dj-previews.mjs");
const html = await readFile("dist/index.html", "utf8");
for (const route of staticRoutes) {
  const tags = await xPlayerCardTags(route);
  const output = "dist" + (route === "/" ? "" : route);
  await mkdir(output, { recursive: true });
  await writeFile(
    output + "/index.html",
    html
      .replace(
        '<html lang="en">',
        '<html lang="en" class="' +
          (route.includes("/widget-")
            ? "broadcast-overlay"
            : /\/(webamp|embed)$/.test(route) ||
                route.startsWith("/x-card-test/")
              ? "dnb-embed"
              : "") +
          '">',
      )
      .replace("</head>", `${canonicalTag(route)}${tags}</head>`),
  );
}
await writeFile("dist/200.html", html);
console.log(
  `Generated ${staticRoutes.length} routes and SPA fallback at ${process.env.ROUTER_BASE}`,
);

for (const route of mainDjRoutes) {
  for (const id of Object.keys(djProfiles)) {
    const file =
      "dist/" + djPreviewFile(route, new URLSearchParams({ dj: id }));
    // Fail the build rather than publish a preview referencing missing artwork.
    await readFile(`dist/djs/${id}-preview.png`);
    await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true });
    await writeFile(
      file,
      html.replace(
        "</head>",
        `${canonicalTag(route)}${await xPlayerCardTags(route, id)}</head>`,
      ),
    );
  }
}
await writeFile(
  "dist/dj-previews/nginx-maps.conf",
  djNginxMaps(process.env.ROUTER_BASE),
);
