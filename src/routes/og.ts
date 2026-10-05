import { Hono } from 'hono';
import { parseParams } from '../params.js';
import { renderOg } from '../render.js';
import { LogoError } from '../logo.js';

export const ogRouter = new Hono();

async function handle(paramsRaw: Record<string, unknown>): Promise<Response> {
  const parsed = parseParams(paramsRaw);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { png, cached } = await renderOg(parsed.params);
  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400',
      'x-cache': cached ? 'HIT' : 'MISS',
    },
  });
}

ogRouter.get('/og', async (c) => {
  const query: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(c.req.query())) query[k] = v;
  try {
    return await handle(query);
  } catch (err) {
    if (err instanceof LogoError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

ogRouter.post('/og', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400);
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return c.json({ error: 'Request body must be a JSON object' }, 400);
  }
  try {
    return await handle(body as Record<string, unknown>);
  } catch (err) {
    if (err instanceof LogoError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});
