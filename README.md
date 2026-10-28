# dnbradio-player - Static site generated using Nuxt.

> Note: Please ignore server components found in `./server/` and also ignore any proxy definitions found in the `nuxt.config.js`. They are deprecated.

## Live example:

> A production instance of `dnbradio-player` can be found here: https://dnbradio.com/player

Screenshot:

<img src="https://github.com/dnbradio/dnbradio-player/raw/main/static/dnbradio-screenshot.png" width="300" />

## Environment

See env.example for environment variables to get you started.

```
# .env
NODE_PORT=9000
NODE_HOST=0.0.0.0
NODE_ENV=development
```

## Install dependencies

```bash
pnpm run install
```

## Local Development

Serve the app with hot reload on your localhost

```bash
pnpm run dev
```

## Debugging

This runs `nuxt generate --devtools && nuxt start` which starts a nuxt server for the static content, but with vue-dev-tools enabled.

```bash
pnpm run debug
```

## Development - Deploy a branch

Generates and deploys static site to `dnbradio.com/player-${branch_name}`. Based on the current branch you have checked out.

```bash
pnpm run generate
pnpm run upload
```

## Production - Deploy main branch

Generates and deploys static site to `dnbradio.com/player`

```bash
pnpm run generate-prod
pnpm run upload-prod
```

## X player card

Posting `https://dnbradio.com/player/` (or `/player/stations/<id>/`, `/player/darkstep/`, `/player/webamp/`, `/player/stations/<id>/webamp/`) on X renders a playable player inside the post on desktop web. Mobile apps and other clients show the station image and link through to the full player.

- `pages/stations/_stationId/webamp.vue` is the framed player, served at `/player/webamp/` (station 1) and `/player/stations/<id>/webamp/`. `/player/embed/` and `/player/stations/<id>/embed/` serve the same page for X cards posted before the card moved to `/webamp/`. It runs [Webamp](https://github.com/captbaritone/webamp) (Winamp 2 in the browser, MIT) with the base Winamp skin, the classic skins in `static/skins/` (Options > Skins), the spectrum/oscilloscope visualizer, and the equalizer. Playback starts only from Play, and no stream is opened before that.
  - The default playlist is the five stations plus the 20 newest podcasts (with playcounts). It can't be emptied: Remove all or New list starts a separate list, and Load list > default brings it back. Stations removed from it are offered again in Add URL.
  - ADD > Add URL, ADD > Add file, LIST OPTS > Save list (.m3u or .pls) and Load list open Winamp-style windows from `components/embed/`. Winamp's main menu (top-left icon or right-click) adds DNBRADIO Schedule, DNBRADIO Podcasts, and Station Info windows.
  - The kbps, kHz, and mono/stereo readouts come from the stream's or file's own frame headers (`components/embed/audioInfo.js`); Webamp alone shows fixed values for anything it doesn't tag-scan.
  - MilkDrop runs through Webamp's bundled Butterchurn engine and presets. Open the main menu (top-left icon or right-click) and select Milkdrop. It starts closed and opens in the playlist's place. While focused, Space advances presets and L opens the preset list. Presets also cycle every 15 seconds during playback. Double-click the visuals for fullscreen where the browser or embedding frame allows it. Rendering needs WebGL 2.
  - Every load starts with the main window above the playlist at its base size; the EQ, MilkDrop, and the DNBRADIO windows open in the playlist's place. Window placement is not remembered. Skin, volume, balance, EQ settings, visualizer, and both playlists are kept in `localStorage` (`dnbradio-embed`).
- `nuxt.config.js` writes the `twitter:*` and `og:*` tags into each station page and each webamp page at generate time (`generate:page` hook). The site runs with `ssr: false`, so a page's `head()` never reaches the HTML that X's crawler reads. The card is square (480×480 player) to match the Winamp layout.
- `static/x-card/winamp-station-<id>.png` are the 1200×1200 card images: screenshots of the embed for each station in a playing state (fed a short sample of that station's stream), taken in headless Chrome at 480×480 and 2.5× scale. Retake them when the stations or the layout change.
- Facebook and Threads don't play third-party players from link previews (Facebook's `og:video` only takes MP4 or the retired Flash type), so they show a link card. `og:image` points at `static/x-card/og-station-<id>.png` (1200×630, the 1.91:1 ratio both crop to), made from the square card with the station name beside it; `twitter:image` keeps the square image for X.
- Cloudflare Pages previews point their card tags at the preview itself and add `/x-card-test/square/`, `/x-card-test/portrait/`, and `/x-card-test/landscape/`, so card shapes can be compared on X before deploying.

The skins in `static/skins/` are classic Winamp skins, shipped unmodified, as TopazAmp's readme asks:

- Green Dimension V2 (2004): credited in its README to a stylized handle.
- Internet Archive: LuigiHann.
- Mac OS X 1.5 (Aqua): DeeLight.
- TopazAmp 1.2: © 1999 Kelly McLarnon, topazdesigns.com ("distribute freely, but please don't modify the images").
- Vizor 1.01: © 2002 ViDA.
- XMMS Turquoise: the XMMS player's Turquoise skin (the archive has no readme).
- Zaxon Remake 1.0: Daniel Jansson, dj-designs.com.

Webamp reads audio through the Web Audio API, so a stream or file only plays in the embed if every response on its way sends CORS headers. The AzuraCast streams do. Podcast files served through `archive-proxy.dnbradio.com` do too: that site's nginx config adds `Access-Control-Allow-Origin: *` to its redirect. Two sources still send no CORS header, so they show a message in the marquee and Webamp moves on:

- the jungletrain SHOUTcast stream;
- podcast episodes hosted on SoundCloud, whose `feeds.soundcloud.com` redirect sends none. On 2026-10-24 that was 5 of the 20 newest episodes.

The webamp pages must be frameable by X. Forge's default nginx config sends `X-Frame-Options: SAMEORIGIN` for the whole site, so the `dnbradio.com` site config drops it for the embed paths only:

```nginx
# top of the site file, outside the server block
map $uri $dnb_frame_options {
    default "SAMEORIGIN";
    ~^/player/(stations/[0-9]+/)?(webamp|embed)(/|/index\.html)?$ "";
}
map $uri $dnb_frame_ancestors {
    default "";
    ~^/player/(stations/[0-9]+/)?(webamp|embed)(/|/index\.html)?$ "frame-ancestors 'self' https:";
}

# in the dnbradio.com server block, replacing add_header X-Frame-Options "SAMEORIGIN";
add_header X-Frame-Options $dnb_frame_options;
add_header Content-Security-Policy $dnb_frame_ancestors;
```

An empty value makes `add_header` skip the header. `frame-ancestors` allows any HTTPS parent rather than only x.com, because tweets embedded on other sites add that site to the frame chain.

Check after a deploy:

```bash
curl -sI https://dnbradio.com/player/webamp/ | grep -iE 'x-frame|content-security'   # CSP only
curl -sI https://dnbradio.com/player/ | grep -i x-frame                             # SAMEORIGIN
curl -s https://dnbradio.com/player/ | grep -o '<meta name="twitter:[^>]*>'
```

X caches a card for about 7 days per URL. To see a change sooner, post the URL with a new query string (`https://dnbradio.com/player/?v=2`), and give a changed card image a new file name. X no longer has a card validator, so check the card in the x.com desktop composer preview.
