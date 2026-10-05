import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { loadFonts } from './fonts.js';
import { loadAdditionalAsset } from './emoji.js';
import { fetchLogoAsDataUrl, LogoError } from './logo.js';
import { THEMES, type ThemeParams } from '../themes/registry.js';
import type { SatoriElement } from '../themes/elements.js';
import type { OgParams } from './params.js';

export interface RenderResult {
  png: Buffer;
  cached: boolean;
}

// Simple in-memory LRU on the encoded PNG bytes (a 1200x630 card is ~30-250KB,
// so the default cap stays well under 25MB).
const CACHE_MAX = Math.max(0, Number(process.env.CACHE_MAX_ENTRIES ?? 100));
const cache = new Map<string, Buffer>();

export function cacheSize(): number {
  return cache.size;
}

function cacheKey(params: OgParams): string {
  return JSON.stringify([
    params.title,
    params.subtitle ?? null,
    params.theme,
    params.logo ?? null,
    params.width,
    params.height,
  ]);
}

async function buildElement(params: OgParams): Promise<SatoriElement> {
  const theme = THEMES[params.theme];
  if (!theme) throw new LogoError(`Unknown theme: ${params.theme}`);
  const themeParams: ThemeParams = {
    title: params.title,
    subtitle: params.subtitle,
    logoDataUrl: params.logo ? await fetchLogoAsDataUrl(params.logo) : undefined,
  };
  return theme.build(themeParams);
}

export async function renderOg(params: OgParams): Promise<RenderResult> {
  const key = cacheKey(params);
  const hit = cache.get(key);
  if (hit) {
    // refresh recency
    cache.delete(key);
    cache.set(key, hit);
    return { png: hit, cached: true };
  }

  const fonts = loadFonts();
  const element = await buildElement(params);

  // satori's public types predate its runtime contract (verified in satori 0.35
  // dist: string returns become grapheme images, falsy returns are skipped), so
  // the options object is cast at this single call site.
  const satoriOptions = {
    width: params.width,
    height: params.height,
    fonts: fonts.satori,
    loadAdditionalAsset,
  } as unknown as Parameters<typeof satori>[1];

  const svg = await satori(element as unknown as Parameters<typeof satori>[0], satoriOptions);

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: {
      fontFiles: fonts.resvgFiles,
      loadSystemFonts: false,
      defaultFontFamily: 'Inter',
    },
  });
  const png = Buffer.from(resvg.render().asPng());

  if (CACHE_MAX > 0) {
    if (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, png);
  }
  return { png, cached: false };
}
