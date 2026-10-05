import { Hono } from 'hono';
import { ogRouter } from './routes/og.js';
import { metaRouter } from './routes/meta.js';
import { remoteAssetsEnabled } from './logo.js';

export const app = new Hono();

app.get('/', (c) => {
  return c.json({
    name: 'og-image-generator',
    description: 'Self-hosted Open Graph image generator (satori + resvg, no headless Chrome)',
    endpoints: {
      'GET /og': 'Render a PNG card. Params: title (required), subtitle, theme (dark|light|gradient|card), logo (https URL, needs ALLOW_REMOTE_ASSETS=true), width (200-4096, default 1200), height (200-4096, default 630)',
      'POST /og': 'Same parameters as a JSON body',
      'GET /themes': 'List built-in themes with sample URLs',
      'GET /health': 'Health check (status, uptime, memory, cache)',
    },
    remoteAssets: remoteAssetsEnabled() ? 'enabled' : 'disabled (ALLOW_REMOTE_ASSETS!=true)',
  });
});

app.route('/', ogRouter);
app.route('/', metaRouter);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error(`[error] ${c.req.method} ${c.req.path}:`, err);
  return c.json({ error: 'Internal error while rendering the image' }, 500);
});
