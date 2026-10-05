import { h, type SatoriElement } from './elements.js';
import type { ThemeParams } from './dark.js';

export function buildLight(p: ThemeParams): SatoriElement {
  return h('div',
    { style: { width: '100%', height: '100%', display: 'flex', background: '#ffffff' } },
    h('div', { style: { display: 'flex', width: 18, background: '#18181b' } }),
    h('div',
      {
        style: {
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: 72,
        },
      },
      h('div', {
        style: { display: 'block', fontSize: 24, letterSpacing: 4, color: '#71717a', textTransform: 'uppercase' },
        children: 'Social Preview',
      }),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 28 } },
        h('div', {
          style: {
            display: 'block', fontSize: 68, fontWeight: 700, color: '#18181b',
            lineHeight: 1.15, lineClamp: 3,
          },
          children: p.title,
        }),
        p.subtitle
          ? h('div', {
              style: {
                display: 'block', fontSize: 32, color: '#52525b',
                lineHeight: 1.35, lineClamp: 2,
              },
              children: p.subtitle,
            })
          : null)));
}
