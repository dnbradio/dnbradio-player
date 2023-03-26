#!/bin/bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
source /root/.bashrc

git stash && \
git pull && \
pnpm install && \
pnpm run generate && \
rm -rf /var/www/dnbradio_site/html/player-bak; \
mv /var/www/dnbradio_site/html/player/ /var/www/dnbradio_site/html/player-bak; \
mv dist /var/www/dnbradio_site/html/player
