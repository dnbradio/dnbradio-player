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

Posting `https://dnbradio.com/player/` (or `/player/stations/<id>/`, `/player/darkstep/`) on X renders a playable player inside the post on desktop web. Mobile apps and other clients show the station image and link through to the full player.

- `pages/stations/_stationId/embed.vue` is the framed player, served at `/player/embed/` (station 1) and `/player/stations/<id>/embed/`. Playback starts only from the play button.
- `nuxt.config.js` writes the `twitter:*` and `og:*` tags into each station page at generate time (`generate:page` hook). The site runs with `ssr: false`, so a page's `head()` never reaches the HTML that X's crawler reads.
- `static/x-card/station-<id>.png` are the 960×560 card images (same 12:7 ratio as the 480×280 player). Add one when adding a station.

The embed pages must be frameable by X. Forge's default nginx config sends `X-Frame-Options: SAMEORIGIN` for the whole site, so the `dnbradio.com` site config drops it for the embed paths only:

```nginx
# top of the site file, outside the server block
map $uri $dnb_frame_options {
    default "SAMEORIGIN";
    ~^/player/(stations/[0-9]+/)?embed(/|/index\.html)?$ "";
}
map $uri $dnb_frame_ancestors {
    default "";
    ~^/player/(stations/[0-9]+/)?embed(/|/index\.html)?$ "frame-ancestors 'self' https:";
}

# in the dnbradio.com server block, replacing add_header X-Frame-Options "SAMEORIGIN";
add_header X-Frame-Options $dnb_frame_options;
add_header Content-Security-Policy $dnb_frame_ancestors;
```

An empty value makes `add_header` skip the header. `frame-ancestors` allows any HTTPS parent rather than only x.com, because tweets embedded on other sites add that site to the frame chain.

Check after a deploy:

```bash
curl -sI https://dnbradio.com/player/embed/ | grep -iE 'x-frame|content-security'   # CSP only
curl -sI https://dnbradio.com/player/ | grep -i x-frame                             # SAMEORIGIN
curl -s https://dnbradio.com/player/ | grep -o '<meta name="twitter:[^>]*>'
```

X caches a card for about 7 days per URL. To see a change sooner, post the URL with a new query string (`https://dnbradio.com/player/?v=2`), and give a changed card image a new file name. X no longer has a card validator, so check the card in the x.com desktop composer preview.
