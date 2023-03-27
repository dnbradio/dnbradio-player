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
pnpm run branch-generate
pnpm run branch-upload
```

## Production - Deploy main branch

Generates and deploys static site to `dnbradio.com/player`

```bash
pnpm run generate
pnpm run upload
```
