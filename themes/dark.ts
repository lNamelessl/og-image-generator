import { h, type SatoriElement } from './elements.js';

export interface ThemeParams {
  title: string;
  subtitle?: string;
  logoDataUrl?: string;
}

export function buildDark(p: ThemeParams): SatoriElement {
  return h('div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#09090b',
        padding: 72,
      },
    },
    h('div', { style: { display: 'flex', width: 96, height: 10, background: '#6366f1', borderRadius: 6 } }),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 28 } },
      h('div', {
        style: {
          display: 'block', fontSize: 68, fontWeight: 700, color: '#fafafa',
          lineHeight: 1.15, lineClamp: 3,
        },
        children: p.title,
      }),
      p.subtitle
        ? h('div', {
            style: {
              display: 'block', fontSize: 32, color: '#a1a1aa',
              lineHeight: 1.35, lineClamp: 2,
            },
            children: p.subtitle,
          })
        : null),
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      p.logoDataUrl
        ? h('img', { src: p.logoDataUrl, width: 72, height: 72, style: { objectFit: 'contain' } })
        : h('div', { style: { display: 'block', fontSize: 24, color: '#71717a' }, children: 'Open Graph Image API' }),
      h('div', { style: { display: 'block', fontSize: 24, color: '#52525b' }, children: 'satori + resvg' })));
}
