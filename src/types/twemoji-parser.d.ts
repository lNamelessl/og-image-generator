declare module 'twemoji-parser' {
  export interface TwemojiMatch {
    url: string;
    text: string;
    indices: [number, number];
    type: string;
  }
  /** Split text into emoji matches (URLs point at the upstream twemoji CDN). */
  export function parse(text: string): TwemojiMatch[];
  /** Convert a UTF-16 string to a list of hex codepoint strings. */
  export function toCodePoints(utf16: string): string[];
}
