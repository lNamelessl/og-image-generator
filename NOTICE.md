# NOTICE — bundled third-party assets and libraries

This project bundles and depends on the following third-party works. They are
not covered by the project's own LICENSE.

## Inter typeface — bundled into the container image

- Source: https://github.com/rsms/inter (release v4.1, files `extras/ttf/Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`)
- License: SIL Open Font License 1.1 — permits bundling and redistribution.
- The complete license text is shipped in the image at `/app/assets/fonts/LICENSE.txt`.

## Twemoji emoji artwork — bundled into the container image

- Source: https://github.com/jdecked/twemoji (tag v17.0.3, `assets/svg/*.svg`, 4,009 files)
- Graphics license: CC-BY 4.0 — attribution required (this file is that attribution).
- Code and site contents in that repository are MIT; only the SVG artwork is bundled here.

## Runtime dependencies (npm, not redistributed in-repo)

- `satori` — MPL-2.0 — https://github.com/vercel/satori
- `@resvg/resvg-js` — MPL-2.0 — https://github.com/thx/resvg-js
- `hono`, `@hono/node-server` — MIT
- `twemoji-parser` — MIT
- `ipaddr.js` — MIT
