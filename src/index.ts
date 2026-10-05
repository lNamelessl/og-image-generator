import { serve } from '@hono/node-server';
import { app } from './app.js';
import { loadFonts } from './fonts.js';

// Fail fast at boot if the bundled fonts are missing (misconfigured ASSETS_DIR).
loadFonts();

// Railway injects PORT at runtime; PORT=3000 is only the baked-in default for
// plain `docker run`. Listen on all interfaces for container networking.
const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`og-image-generator listening on 0.0.0.0:${info.port}`);
});
