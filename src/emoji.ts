import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse as twemojiParse, toCodePoints } from 'twemoji-parser';

const ASSETS_DIR = process.env.ASSETS_DIR || path.resolve('assets');
const EMOJI_DIR = path.join(ASSETS_DIR, 'emoji');

const emojiCache = new Map<string, Buffer>();

/**
 * Map an emoji string to a vendored twemoji asset filename.
 * Primary: twemoji-parser (handles ZWJ, skin tones, flags, VS16).
 * Fallback: hex codepoints joined with '-', with VS16 (fe0f) stripped —
 * twemoji's filename convention.
 */
export function emojiFileName(segment: string): string | null {
  try {
    const matches = twemojiParse(segment);
    if (matches.length > 0) {
      const base = matches[matches.length - 1].url.split('/').pop();
      if (base && existsSync(path.join(EMOJI_DIR, base))) return base;
    }
  } catch {
    // fall through to the manual mapper
  }
  const seq = [...toCodePoints(segment)];
  const candidates = [seq.join('-'), seq.filter((c) => c !== 'fe0f').join('-')];
  for (const c of candidates) {
    if (existsSync(path.join(EMOJI_DIR, `${c}.svg`))) return `${c}.svg`;
  }
  return null;
}

/**
 * satori loadAdditionalAsset hook.
 *
 * IMPORTANT (satori 0.35 contract): the return type selects the dispatch path.
 * - string  -> treated as a grapheme IMAGE (URL or data URI)
 * - object  -> pushed into the FONT loader (expects {name,data,...})
 * So emoji MUST be returned as a base64 data-URI string, and font-code
 * requests must resolve to undefined (a safe no-op).
 */
export async function loadAdditionalAsset(
  code: string,
  segment: string,
): Promise<string | undefined> {
  if (code !== 'emoji') return undefined;
  const file = emojiFileName(segment);
  if (!file) return undefined;
  let data = emojiCache.get(file);
  if (!data) {
    data = readFileSync(path.join(EMOJI_DIR, file));
    emojiCache.set(file, data);
  }
  return `data:image/svg+xml;base64,${data.toString('base64')}`;
}
