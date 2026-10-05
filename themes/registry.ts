import type { SatoriElement } from './elements.js';
import type { ThemeParams } from './dark.js';
import { buildDark } from './dark.js';
import { buildLight } from './light.js';
import { buildGradient } from './gradient.js';
import { buildCard } from './card.js';

export type { ThemeParams };

interface ThemeDef {
  build: (p: ThemeParams) => SatoriElement;
  description: string;
  sampleQuery: string;
}

export const THEMES: Record<string, ThemeDef> = {
  dark: {
    build: buildDark,
    description: 'Charcoal background, indigo accent bar, bold white headline',
    sampleQuery: 'title=Deploy%20and%20Host%20your%20OG%20Image%20API&subtitle=Satori%20%2B%20resvg%20%E2%80%94%20no%20headless%20Chrome&theme=dark',
  },
  light: {
    build: buildLight,
    description: 'White background, black side rule, near-black headline',
    sampleQuery: 'title=Understanding%20Flexbox%20Layout%20in%202026&subtitle=A%20practical%20field%20guide&theme=light',
  },
  gradient: {
    build: buildGradient,
    description: 'Navy-to-violet gradient, centered balanced headline',
    sampleQuery: 'title=Ship%20faster%20%F0%9F%9A%80&subtitle=Open%20Graph%20cards%20on%20Railway&theme=gradient',
  },
  card: {
    build: buildCard,
    description: 'Blog card: rounded frame, divider, footer mark',
    sampleQuery: 'title=Understanding%20Flexbox%20Layout%20in%202026&subtitle=A%20practical%20field%20guide%20for%20design%20engineers&theme=card',
  },
};

export const DEFAULT_THEME = 'dark';

export interface ThemeInfo {
  name: string;
  description: string;
  sampleUrl: string;
}

export function listThemes(baseUrl: string): ThemeInfo[] {
  return Object.entries(THEMES).map(([name, def]) => ({
    name,
    description: def.description,
    sampleUrl: `${baseUrl}/og?${def.sampleQuery}`,
  }));
}

export function isKnownTheme(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(THEMES, name);
}
