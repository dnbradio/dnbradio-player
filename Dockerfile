FROM node:22.21.1-slim
WORKDIR /src
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV HOST=0.0.0.0
ENV PORT=4173
EXPOSE 4173
CMD ["pnpm", "start"]
