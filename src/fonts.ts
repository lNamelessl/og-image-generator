import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ASSETS_DIR = process.env.ASSETS_DIR || path.resolve('assets');
// Optional volume mount point for user-supplied fonts (documented in README).
const EXTRA_FONTS_DIR = process.env.FONTS_DIR || '/fonts';

const FONT_EXTENSIONS = new Set(['.ttf', '.otf']);

// Inter statics bundled with the image (see NOTICE.md). Weights cover the
// styles the built-in themes use (400 body, 500/600 accents, 700 headlines).
const BUNDLED: Array<[file: string, weight: number]> = [
  ['Inter-Regular.ttf', 400],
  ['Inter-Medium.ttf', 500],
  ['Inter-SemiBold.ttf', 600],
  ['Inter-Bold.ttf', 700],
];

export interface SatoriFont {
  name: string;
  weight: number;
  style: 'normal';
  data: Buffer;
}

export interface LoadedFonts {
  satori: SatoriFont[];
  /** Absolute font file paths handed to resvg so SVG rasterization matches. */
  resvgFiles: string[];
}

function loadExtraFonts(): Array<{ family: string; file: string }> {
  if (!existsSync(EXTRA_FONTS_DIR)) return [];
  try {
    return readdirSync(EXTRA_FONTS_DIR)
      .filter((f) => FONT_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .map((f) => ({
        family: path.basename(f, path.extname(f)),
        file: path.join(EXTRA_FONTS_DIR, f),
      }));
  } catch {
    return [];
  }
}

let cached: LoadedFonts | null = null;

export function loadFonts(): LoadedFonts {
  if (cached) return cached;
  const satori: SatoriFont[] = [];
  const resvgFiles: string[] = [];

  for (const [file, weight] of BUNDLED) {
    const full = path.join(ASSETS_DIR, 'fonts', file);
    if (!existsSync(full)) {
      throw new Error(`Bundled font missing: ${full} (ASSETS_DIR=${ASSETS_DIR})`);
    }
    satori.push({ name: 'Inter', weight, style: 'normal', data: readFileSync(full) });
    resvgFiles.push(full);
  }

  // Custom fonts mounted at /fonts are registered under their filename stem and
  // act as glyph fallbacks for scripts Inter does not cover (e.g. CJK).
  for (const extra of loadExtraFonts()) {
    try {
      satori.push({
        name: extra.family,
        weight: 400,
        style: 'normal',
        data: readFileSync(extra.file),
      });
      resvgFiles.push(extra.file);
    } catch {
      // unreadable font file: skip it rather than fail startup
    }
  }

  cached = { satori, resvgFiles };
  return cached;
}
