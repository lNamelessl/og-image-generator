import { DEFAULT_THEME, THEMES } from '../themes/registry.js';

export interface OgParams {
  title: string;
  subtitle?: string;
  theme: string;
  logo?: string;
  width: number;
  height: number;
}

export type ParseResult =
  | { ok: true; params: OgParams }
  | { ok: false; error: string };

const TITLE_MAX = 280;
const SUBTITLE_MAX = 160;
const LOGO_MAX = 2048;
const MIN_SIZE = 200;
const MAX_SIZE = 4096;

function clampInt(value: unknown, fallback: number, min: number, max: number): number | null {
  if (value === undefined || value === null || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

/**
 * Normalize and validate request params. Accepts GET query records and
 * parsed POST JSON bodies alike (values may be string | number | undefined).
 */
export function parseParams(raw: Record<string, unknown>): ParseResult {
  const title = typeof raw.title === 'string' || typeof raw.title === 'number'
    ? String(raw.title).trim()
    : '';
  if (!title) {
    return { ok: false, error: 'Missing required parameter: title' };
  }
  if (title.length > TITLE_MAX) {
    return { ok: false, error: `title exceeds ${TITLE_MAX} characters` };
  }

  const subtitleRaw = typeof raw.subtitle === 'string' || typeof raw.subtitle === 'number'
    ? String(raw.subtitle).trim()
    : undefined;
  if (subtitleRaw && subtitleRaw.length > SUBTITLE_MAX) {
    return { ok: false, error: `subtitle exceeds ${SUBTITLE_MAX} characters` };
  }

  const theme = typeof raw.theme === 'string' && raw.theme ? raw.theme : DEFAULT_THEME;
  if (!Object.prototype.hasOwnProperty.call(THEMES, theme)) {
    return { ok: false, error: `Unknown theme "${theme}". Known themes: ${Object.keys(THEMES).join(', ')}` };
  }

  const width = clampInt(raw.width, 1200, MIN_SIZE, MAX_SIZE);
  if (width === null) {
    return { ok: false, error: `width must be an integer between ${MIN_SIZE} and ${MAX_SIZE}` };
  }
  const height = clampInt(raw.height, 630, MIN_SIZE, MAX_SIZE);
  if (height === null) {
    return { ok: false, error: `height must be an integer between ${MIN_SIZE} and ${MAX_SIZE}` };
  }

  const logo = typeof raw.logo === 'string' ? raw.logo.trim() : undefined;
  if (logo && logo.length > LOGO_MAX) {
    return { ok: false, error: `logo URL exceeds ${LOGO_MAX} characters` };
  }

  return {
    ok: true,
    params: {
      title,
      subtitle: subtitleRaw || undefined,
      theme,
      logo: logo || undefined,
      width,
      height,
    },
  };
}
