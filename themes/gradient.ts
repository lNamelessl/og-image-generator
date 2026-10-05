import { h, type SatoriElement } from './elements.js';
import type { ThemeParams } from './dark.js';

export function buildGradient(p: ThemeParams): SatoriElement {
  return h('div',
    {
      style: {
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 55%, #6d28d9 100%)',
        padding: 96,
      },
    },
    h('div', {
      style: {
        display: 'block', fontSize: 84, fontWeight: 700, color: '#ffffff',
        lineHeight: 1.12, textAlign: 'center', textWrap: 'balance', lineClamp: 3,
      },
      children: p.title,
    }),
    p.subtitle
      ? h('div', {
          style: {
            display: 'block', marginTop: 32, fontSize: 34, color: 'rgba(255,255,255,0.75)',
            textAlign: 'center', lineClamp: 2,
          },
          children: p.subtitle,
        })
      : null);
}
