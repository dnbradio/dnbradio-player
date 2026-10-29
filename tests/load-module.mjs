import { readFile } from "node:fs/promises";

// Loads an ES module source file (the app has no "type": "module") by way of
// a data: URL, inlining its relative imports the same way.
export async function loadModule(url, transform = (source) => source) {
  let source = transform(await readFile(url, "utf8"));
  const imports = [...source.matchAll(/from "(\.{1,2}\/[^"]+)"/g)];
  for (const [statement, path] of imports) {
    const target = new URL(path.endsWith(".js") ? path : path + ".js", url);
    const inlined = await loadSource(target);
    source = source.replace(statement, `from "${inlined}"`);
  }
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
}

async function loadSource(url) {
  let source = await readFile(url, "utf8");
  const imports = [...source.matchAll(/from "(\.{1,2}\/[^"]+)"/g)];
  for (const [statement, path] of imports) {
    const target = new URL(path.endsWith(".js") ? path : path + ".js", url);
    source = source.replace(statement, `from "${await loadSource(target)}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(source).toString(
    "base64"
  )}`;
}
