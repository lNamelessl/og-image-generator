import { h, type SatoriElement } from './elements.js';
import type { ThemeParams } from './dark.js';

export function buildCard(p: ThemeParams): SatoriElement {
  return h('div',
    {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', background: '#ffffff',
        border: '2px solid #e4e4e7', borderRadius: 24, padding: 64, margin: 24,
      },
    },
    h('div', {
      style: {
        display: 'block', fontSize: 60, fontWeight: 700, color: '#111111',
        lineHeight: 1.2, lineClamp: 3,
      },
      children: p.title,
    }),
    p.subtitle
      ? h('div', {
          style: { display: 'block', fontSize: 34, color: '#3f3f46', lineHeight: 1.4, lineClamp: 2 },
          children: p.subtitle,
        })
      : null,
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 24 } },
      h('div', { style: { display: 'flex', width: '100%', height: 2, background: '#e4e4e7' } }),
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        h('div', { style: { display: 'block', fontSize: 28, color: '#71717a' }, children: 'Blog' }),
        p.logoDataUrl
          ? h('img', { src: p.logoDataUrl, width: 48, height: 48, style: { objectFit: 'contain' } })
          : h('div', { style: { display: 'flex', width: 48, height: 48, borderRadius: 12, background: '#6366f1' } }))));
}
