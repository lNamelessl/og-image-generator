import { Hono } from 'hono';
import { listThemes, THEMES } from '../../themes/registry.js';
import { cacheSize } from '../render.js';

export const metaRouter = new Hono();

function baseUrl(c: { req: { url: string } }): string {
  const u = new URL(c.req.url);
  return `${u.protocol}//${u.host}`;
}

metaRouter.get('/themes', (c) => {
  return c.json({
    default: 'dark',
    themes: listThemes(baseUrl(c)),
  });
});

metaRouter.get('/health', (c) => {
  const mem = process.memoryUsage();
  return c.json({
    status: 'ok',
    uptimeSec: Math.round(process.uptime()),
    memory: {
      rssMB: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024)),
    },
    cacheEntries: cacheSize(),
    themes: Object.keys(THEMES).length,
  });
});
