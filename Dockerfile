# ---------- build stage: compile TS, fetch pinned font + emoji assets ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src
COPY themes ./themes
RUN npm run build

# Pinned assets: Inter static TTFs (OFL, see NOTICE.md) + twemoji SVG set (CC-BY 4.0)
RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /app/assets/fonts /app/assets/emoji \
 && curl -fsSL -o /tmp/inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip \
 && unzip -j /tmp/inter.zip "extras/ttf/Inter-Regular.ttf" "extras/ttf/Inter-Medium.ttf" "extras/ttf/Inter-SemiBold.ttf" "extras/ttf/Inter-Bold.ttf" "LICENSE.txt" -d /app/assets/fonts \
 && rm /tmp/inter.zip \
 && curl -fsSL -o /tmp/twemoji.zip https://github.com/jdecked/twemoji/archive/refs/tags/v17.0.3.zip \
 && unzip -j /tmp/twemoji.zip "twemoji-17.0.3/assets/svg/*.svg" -d /app/assets/emoji \
 && rm /tmp/twemoji.zip

# ---------- runtime stage: prod deps only, non-root ----------
FROM node:22-slim
ENV NODE_ENV=production \
    PORT=3000 \
    ASSETS_DIR=/app/assets
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/assets ./assets
COPY LICENSE NOTICE.md ./

USER node
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
