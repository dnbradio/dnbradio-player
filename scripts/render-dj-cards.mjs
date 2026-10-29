// Regenerate the committed social cards with: node scripts/render-dj-cards.mjs
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { djProfiles } from "../lib/djs.js";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  for (const profile of Object.values(djProfiles)) {
    const head = (await readFile(`static/djs/${profile.image}`)).toString(
      "base64",
    );
    await page.setContent(`<html><style>
      *{box-sizing:border-box}body{margin:0;background:#050505;color:#fff;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;gap:70px;width:1200px;height:630px}
      img{width:360px;height:360px;object-fit:contain}small{font-size:24px;letter-spacing:5px;color:#9ba0a8}h1{font-size:52px;margin:25px 0}p{font-size:26px;color:#b5b7be}
      </style><body><img src="data:image/webp;base64,${head}"><div><small>DNBRADIO</small><h1>${profile.name}</h1><p>Press play. Follow the bass.</p></div></body></html>`);
    await page.locator("img").evaluate((img) => img.decode());
    await page.screenshot({ path: `static/djs/${profile.id}-preview.png` });
  }
} finally {
  await browser.close();
}
