Self-hosted Open Graph image generator: an HTTP API that renders social preview
cards (`GET /og?title=...&theme=...` → PNG) with [satori](https://github.com/vercel/satori)
and [@resvg/resvg-js](https://github.com/thx/resvg-js) — **no headless Chrome, no browser
binaries**. One tiny Node service, four built-in themes, the Inter typeface and 4,009
offline color-emoji assets baked in.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/og-image-generator)

- `GET /og` and `POST /og` → `image/png` (1200×630 by default, size configurable 200–4096)
- Themes: `dark`, `light`, `gradient`, `card` — see the previews in the repo README
- `GET /themes` lists built-ins; `GET /health` returns status, uptime and memory
- Long titles wrap and clamp with an ellipsis; emoji (including ZWJ, skin-tone and flags) render offline
- `Cache-Control: public, max-age=86400` on every render plus an in-memory LRU cache
- Remote `logo` URLs are **disabled by default** behind an SSRF-hardened fetcher
- Zero environment variables required — deploy and it works

# Deploy and Host

Deploying provisions a single Railway service called `og-image`, built from the repo's
root `Dockerfile` (Node 22 slim, multi-stage, non-root runtime) and served on Railway's
injected `PORT`. A public domain is attached automatically, and Railway health-checks the
deployment against `GET /health` with an ON_FAILURE restart policy (10 retries). No
environment variables and no database are needed; the first successful deployment serves
`/health` immediately after start.

## About Hosting

You host one stateless Node.js container. Because rendering happens in-process (satori
builds SVG, resvg rasterizes it — no browser subprocess), a 512 MB instance stays far
under budget: after 20 sequential 1200×630 renders the service idles around 90–135 MB RSS.
That keeps typical hosting at roughly $5/month on Railway's smallest instance. Images are
served with `Cache-Control: public, max-age=86400` and an LRU cache, so repeat traffic is
cheap. Optional configuration (all off/optional by default): `ALLOW_REMOTE_ASSETS=true`
to enable remote `logo` URLs, `CACHE_MAX_ENTRIES` to tune the LRU, and a `/fonts` volume
mount to add fallback fonts (e.g. Noto Sans for CJK).

## Why Deploy

Every other OG-image route wants a browser: Puppeteer/Chrome images weigh 1 GB+ and eat
512 MB+ of RAM per render spike, and the hosted APIs are per-call billed and
platform-locked. This template runs the renderer in-process with pinned native binaries
(~150 MB image, tens of milliseconds per render), works from any HTTP client, and you own
the whole pipeline — self-hosted, platform-neutral, MIT-licensed template code with all
bundled assets properly attributed (Inter: SIL OFL 1.1; twemoji: CC-BY 4.0; satori and
resvg-js: MPL-2.0 — see `NOTICE.md`).

## Common Use Cases

- Open Graph / Twitter-card images for blogs, docs sites and landing pages, generated at
  build time or on first share
- Dynamic per-user or per-post social cards (title/subtitle/logo come from the query
  string or a JSON POST)
- Preview thumbnails for CMS entries, e-commerce products, or link aggregators
- Anywhere you need a real PNG at social-media dimensions without maintaining a browser
  fleet — including private/self-hosted networks, since rendering is 100% offline

## Dependencies for

This template has no external dependencies: a single `og-image` service, no database, no
workers, no required environment variables, and no outbound calls at runtime.

### Deployment Dependencies

None. The container ships everything: Node 22, satori, resvg-js (prebuilt linux-x64-gnu
binary), the Inter typeface, and the twemoji asset set. The only optional toggle is
`ALLOW_REMOTE_ASSETS` (default `false`) if you want to pass remote logo URLs to `/og`;
when enabled, fetches are SSRF-guarded (private/loopback/link-local/CGNAT ranges,
redirects, size and content-type are all validated).
