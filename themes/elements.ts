/**
 * Minimal element helpers for satori (no JSX compiler in the container).
 *
 * satori accepts plain objects of the shape `{ type, props: { style, children } }`.
 * The helper supports BOTH call styles and never clobbers `children` passed via props:
 *   h('div', { style, children: title })
 *   h('div', { style }, title, subtitle)
 */

export interface SatoriElement {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: unknown;
    [key: string]: unknown;
  };
}

export function h(
  type: string,
  props: SatoriElement['props'] = {},
  ...children: unknown[]
): SatoriElement {
  if (children.length === 0) return { type, props };
  return {
    type,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  };
}
