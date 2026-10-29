# DNBRadio Player

Static Vue 3 application built with Vite. Live: https://dnbradio.com/player/

The approved player layout and native audio engine are retained. Vue Router
handles navigation, Vuex 4 holds playback state, and ordinary HTML/CSS controls
replace Vuetify. Webamp is loaded only on its dedicated embed routes.
The deprecated `server/` directory is historical and is not part of this build.

## Development and verification

Use Node 22.23.4 (`.node-version`) and pnpm 8.15.9.

```sh
corepack enable
corepack prepare pnpm@8.15.9 --activate
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm exec playwright install chromium webkit
pnpm test:browser
```

The browser suite serves the production files under `/player/`. It verifies
actual HTML audio playback using a generated PCM fixture, persistent playback
while navigating, source attribution, direct episode reloads, native dialog
keyboard behavior and error-page recovery in Chromium and mobile WebKit.
It does not depend on public radio/API uptime. Live stream/device testing
complements this suite.

## Build and deployment

`pnpm generate-prod` builds `/player/` for the existing Forge deployment.
`pnpm generate-cloudflare` builds `/` for branch previews. Both create static
route HTML (including X/OG card metadata) and `200.html` for client-side links.
`scripts/static-routes.mjs` declares generated station and widget URLs.
The build exposes only APP_BASE_URL, APP_BRANCH and APP_VERSION to the client.

The Player checks workflow runs unit tests, production generation and browser
checks on pull requests and main/staging pushes. The existing Deploy workflow
uses the pinned toolchain, frozen lockfile and unit tests before copying files.
Merge after Player checks and preview checks pass on the proposed head.

Production nginx must retain this scoped fallback for podcast deep links:

```nginx
location /player/ {
    try_files $uri $uri/ /player/200.html;
}
```

`pnpm start` serves a local production build at http://127.0.0.1:4173/player/.
Use HOST and PORT to override the bind address and port. This preview server
is for validation and container previews; production remains static nginx.
Docker Compose maps host NODE_PORT (default 4173) to the container listener on 4173.

## Player

One audio element (`plugins/player.js`) plays for the whole app, so a station
or podcast keeps playing while the listener browses the schedule, podcasts,
donate, or chat pages; those pages show a mini player above their bottom nav.
Playback state lives in `store/player.js`; components call `this.$player`.

- Pausing a station drops the connection, and Play reconnects at the live
  edge. A dropped stream retries with backoff for up to ten minutes, and
  immediately when the device comes back online.
- Lock screens and headsets get the station or track title and artwork,
  play/pause/stop, and previous/next station (seek for podcasts).
- iOS ignores `HTMLMediaElement.volume`, so the volume buttons are hidden
  there and their slots stay empty, keeping play and the station arrows in
  place.
- Tapping the track (or the line under it) opens recently played, up next,
  the next live shows, and a sleep timer. The home icon opens the station
  list with each station's now playing.
- Desktop keys: Space or K plays and pauses, Left and Right switch stations,
  Up and Down change volume.
- The visuals toggle and volume are saved in `localStorage`
  (`dnbradio-player`).

Live station requests use a fresh Icecast `_ic2` token on each play and retry.
This avoids Icecast's Safari redirect to an internal proxy address while keeping
main-channel source attribution. Jungletrain uses the HTTPS stream published
on its own player. Native WebKit buffering may still add a few seconds before
live audio starts, even when the connection succeeds immediately.

## DJ motion

Open `/player/?dj=djaffirmation` or `/player/?dj=drastic` to add the corresponding
DJ head alongside the approved main-stream artwork. DJ mode only appears and
analyses audio on station 1. Other stations and podcasts use native playback
without DJ analysis. Selecting MilkDrop separately opts into audio analysis for
its visualization on any supported stream. The DJ selection persists through navigation, including `src`
attribution, so returning to the main stream restores the head.
Missing, unknown and repeated DJ values use the normal player.

A Web Audio analyser drives bass bob, midrange tilt and treble shake from the
same audio element used for playback. It starts on a user playback gesture.
Motion off, reduced motion, pause, buffering and a hidden tab stop animation.
Turning motion off leaves audio connected. If analysis or a CORS request fails,
the player replaces the analysed element with ordinary native audio and disables
motion for that page load. Streams keep their existing retry behavior.

The supplied artwork and frequency mapping come from the independently published
[DJ mockup](https://pages-d52757e2.s3.us-west-2.amazonaws.com/a/47f2e2701256b5a7763324ebe90d9e37/dj-affirmation.html?dj=drastic)
(source branch `feat/dj-affirmation-mockup`, commit `fd9415f`). The DJ integration retains the existing player controls.

## Background visualizations and minimal player

The waveform button cycles **Stars → MilkDrop → Rain → Off** and remembers the
selection. Existing saved stars preferences remain supported. MilkDrop lazily
loads the same pinned Butterchurn engine/presets as Webamp, using the player's
single playback graph. Stars and rain require no audio analysis. Native playback
remains the default outside main-stream DJ mode unless MilkDrop is selected.
Streams that reject analysis/CORS fall back to native playback; stars and rain
remain available. Changing audio sources preserves playback and podcast position.
MilkDrop starts on a random preset and shuffles through the bundled effects
without immediate repeats, blending for 3 seconds after every 15 seconds of
visible playback. Pausing, hidden tabs and reduced motion pause rotation.
Triple-tap the player background or press **N** to advance immediately, including
while paused. Playback buttons, links and text inputs retain their usual actions.

The top-left button collapses the player upward to a **40px marquee bar**. Artist,
title and station remain visible alongside play/pause, effect selection and
expand. Double-click the readout or use Expand to restore the full player.
Minimizing stops hidden DJ-head animation while audio and background effects
continue. Reduced motion replaces marquee scrolling with an ellipsis.

When MilkDrop is selected and playback is stopped, paused or buffering, it uses
an inaudible ambient harmonic source with a 24-second breathing cycle and a
slower rendering clock. It has no connection to speakers or the DJ analyser.
Real playback replaces the synthetic input. Leaving MilkDrop, hiding the tab,
reduced motion and component teardown stop the source and animation work.
No audio starts merely by selecting a visualization. WebGL 2 is required for
MilkDrop; unsupported devices retain the other effects and native playback.

Adapted from the approved FX mockup (`feat/dj-affirmation-mockup`, `917c2db`),
with the current main-stream DJ restrictions and social previews retained.

### DJ share previews

The build generates crawler-readable main-stream HTML variants for both DJs.
`?dj=djaffirmation` and `?dj=drastic` use committed 1200×630 head cards in
`static/djs/`. Regenerate them with `node scripts/render-dj-cards.mjs`.
Missing, unknown or repeated DJ values keep `x-card/winamp-station-1.png` on
both OG and X. Other stations retain their own station previews.

Production needs `dist/dj-previews/nginx-maps.conf` included in nginx's http
context, plus the scoped locations in `deploy/player.conf` in the site server
context. The maps select only allowlisted files on `/player/` and
`/player/stations/1/`. nginx `try_files` falls back to the regular page if a
variant is missing. The local preview server applies the same selection.
Install the maps outside the live build directory so a failed/partial upload
cannot affect nginx configuration reloads. Save the current configuration before
installing, run `nginx -t`, then reload. The generated map is base-path specific.

## X player card

Posting `https://dnbradio.com/player/` (or `/player/stations/<id>/`, `/player/darkstep/`, `/player/webamp/`, `/player/stations/<id>/webamp/`) on X renders a playable player inside the post on desktop web. Mobile apps and other clients show the station image and link through to the full player.

- `pages/stations/_stationId/webamp.vue` is the framed player, served at `/player/webamp/` (station 1) and `/player/stations/<id>/webamp/`. `/player/embed/` and `/player/stations/<id>/embed/` serve the same page for X cards posted before the card moved to `/webamp/`. It runs [Webamp](https://github.com/captbaritone/webamp) (Winamp 2 in the browser, MIT) with the base Winamp skin, the classic skins in `static/skins/` (Options > Skins), the spectrum/oscilloscope visualizer, and the equalizer. Playback starts only from Play, and no stream is opened before that.
  - The default playlist is the five stations plus the 20 newest podcasts (with playcounts). It can't be emptied: Remove all or New list starts a separate list, and Load list > default brings it back. Stations removed from it are offered again in Add URL.
  - ADD > Add URL, ADD > Add file, LIST OPTS > Save list (.m3u or .pls) and Load list open Winamp-style windows from `components/embed/`. Winamp's main menu (top-left icon or right-click) adds DNBRADIO Schedule, DNBRADIO Podcasts, and Station Info windows.
  - The kbps, kHz, and mono/stereo readouts come from the stream's or file's own frame headers (`components/embed/audioInfo.js`); Webamp alone shows fixed values for anything it doesn't tag-scan.
  - MilkDrop runs through Webamp's bundled Butterchurn engine and presets. Open the main menu (top-left icon or right-click) and select Milkdrop. By default it starts closed and opens in the playlist's place. While focused, Space advances presets and L opens the preset list. Presets also cycle every 15 seconds during playback. Double-click the visuals for fullscreen where the browser or embedding frame allows it. Rendering needs WebGL 2.
  - Without URL options, every load starts with the main window above the playlist at its base size; the EQ, MilkDrop, and the DNBRADIO windows open in the playlist's place. Window placement is not remembered. Skin, volume, balance, EQ settings, visualizer, and both playlists are kept in `localStorage` (`dnbradio-embed`).
- `scripts/social-cards.mjs` writes the `twitter:*` and `og:*` tags into each station and Webamp page during the static build so crawlers can read them without JavaScript. The card is square (480×480 player) to match the Winamp layout.
- `static/x-card/winamp-station-<id>.png` are the 1200×1200 card images: screenshots of the embed for each station in a playing state (fed a short sample of that station's stream), taken in headless Chrome at 480×480 and 2.5× scale. Retake them when the stations or the layout change.
- Facebook and Threads don't play third-party players from link previews (Facebook's `og:video` only takes MP4 or the retired Flash type), so they show a link card. For the main stream, `og:image` and `twitter:image` both use `static/x-card/winamp-station-1.png`. For other stations, `og:image` points at `static/x-card/og-station-<id>.png` (1200×630, the 1.91:1 ratio both crop to), made from the square card with the station name beside it; `twitter:image` keeps the square image for X.
- Cloudflare Pages previews point their card tags at the preview itself and add `/x-card-test/square/`, `/x-card-test/portrait/`, and `/x-card-test/landscape/`, so card shapes can be compared on X before deploying.

### Popup player source attribution

Use `https://dnbradio.com/player?src=discord` to attribute main-station listening
to Discord. The parameter is named `src`, not `utm`. Supported values are `web`,
`discord`, `tunein`, and `radionet`, selecting the corresponding `.mp3` mount at
`https://azura.drmnbss.org/listen/dnbradio/`. Missing, unknown, empty, or repeated
values use `web.mp3`. `alexa` is excluded because its mount is AAC.

The source is read once per page load and retained through in-app navigation,
including station switches and returning from the podcast or schedule pages.
Other stations keep their existing stream URLs. This applies to the popup
player, not the separate Webamp/embed player.

Run the source-selection, now playing, and schedule checks with
`pnpm test` after `pnpm install`.

Verify after deployment:

1. Open `/player?src=discord`, press Play, and check the browser Network panel
   for `https://azura.drmnbss.org/listen/dnbradio/discord.mp3?<timestamp>`.
2. Switch to another station and back using next/previous, then
   visit a schedule or podcast page and return. DNBRADIO should still request
   `discord.mp3`; other stations should request their usual streams.
3. Repeat with each supported source, no `src`, and `src=unknown`. Invalid
   values should request `web.mp3`. A fresh load without `src` resets to web.
4. With authorized AzuraCast access, inspect `GET /api/station/1/listeners`
   while playback is active and confirm the listener's `mount_name` is
   `/discord.mp3` (currently displayed as `/discord.mp3 (attribution)`), or
   the corresponding source mount.

#### Discord status embed configuration

The live-show "Tune in" embed is generated by AzuraCast station `1`'s enabled
Discord webhook `6`, named `streamer-connected`, on `live_connect`. Its
description currently links to `/player`, `/hi.pls`, the legacy
`source.dnbradio.com` stream, and `cast.dnbradio.com/public/dnbradio`. The embed's
title URL also points to `/player`. This was verified through a read-only
`GET /api/station/1/webhooks` on 2026-10-29. Laravel's
`dnbradio:discord-live-post` command sends scheduled show reminders instead.

After the player change is deployed, an authorized operator can update only
webhook `6`'s **Embed URL** to `https://dnbradio.com/player?src=discord` and its
**Description** to:

```text
Tune in: [web](https://dnbradio.com/player?src=discord) | [mp3](https://azura.drmnbss.org/listen/dnbradio/discord.mp3)
Rate by typing `!rate 10`
More commands: `!shazam` `!np` `!boh` `!sched`
```

Save the existing settings as a private rollback snapshot first. Keep the
webhook destination, trigger, content, title, author, thumbnail, and footer.
No AzuraCast settings or Discord posts are changed by this PR. Updating existing
Discord messages and channel topics is a separate operator action.

### Webamp URL options

These options work on `/player/webamp/`, station-specific webamp pages, and the legacy embed aliases. Combine them with `&`, for example:

`https://dnbradio.com/player/webamp/?milkdrop=1&skin=green-dimension-v2&min-player=1`

| Option                    | Startup behavior                                                                                                                                                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `milkdrop=1`              | Open MilkDrop directly below the player and hide the playlist. At desktop size the visualizer is approximately 730 × 370 px, using Webamp's native sprite increments. On mobile (touch devices or up to 767 px wide), the player starts at the top of the screen and MilkDrop fills the remaining visible height. |
| `skin=green-dimension-v2` | Select a bundled skin, overriding the saved skin. Unknown names leave the saved/default skin in place.                                                                                                                                                                                                            |
| `skin=default`            | Select the original Winamp skin, overriding the saved skin.                                                                                                                                                                                                                                                       |
| `min-player=1`            | Start the main player in its 14 px shade mode.                                                                                                                                                                                                                                                                    |
| `min-eq=1`                | Show the equalizer in shade mode below the main player.                                                                                                                                                                                                                                                           |
| `min-playlist=1`          | Show the playlist in shade mode, including when MilkDrop is open.                                                                                                                                                                                                                                                 |

Mobile sizing updates when windows are shaded or opened, the browser chrome changes the visible height, or the device rotates. Normal and minimized player heights are both accounted for.

Shaded EQ and playlist windows stack between the main player and MilkDrop. Only the exact value `1` enables a window option. URL layout options apply to the current visit; the selected skin is saved with the other player settings.

Skin names are case-insensitive: `green-dimension-v2`, `internet-archive`, `macosxaqua1-5`, `topazamp1-2`, `vizor1-01`, `xmms-turquoise`, and `zaxonremake1-0`.

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
