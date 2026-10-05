import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export class LogoError extends Error {}

const FETCH_TIMEOUT_MS = 5000;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export function remoteAssetsEnabled(): boolean {
  return process.env.ALLOW_REMOTE_ASSETS === 'true';
}

/** Deny-listed IPv4 range names (ipaddr.js). Everything else (unicast) is allowed. */
const FORBIDDEN_V4 = new Set([
  'unspecified', 'broadcast', 'multicast', 'linkLocal', 'loopback',
  'carrierGradeNat', 'private', 'reserved',
]);

/** Deny-listed IPv6 range names. 6to4/teredo embed IPv4 and are blocked wholesale. */
const FORBIDDEN_V6 = new Set([
  'unspecified', 'linkLocal', 'multicast', 'loopback', 'uniqueLocal', 'reserved',
  'teredo', '6to4', 'rfc6052', 'rfc6145',
]);

function isForbiddenIp(ipStr: string): boolean {
  let ip;
  try {
    ip = ipaddr.parse(ipStr.trim().replace(/^\[|\]$/g, ''));
  } catch {
    return true; // unparseable address -> fail closed
  }
  const kind = ip.kind();
  if (kind === 'ipv6') {
    const v6 = ip as import('ipaddr.js').IPv6;
    const range = v6.range();
    if (range === 'ipv4Mapped') {
      return FORBIDDEN_V4.has(v6.toIPv4Address().range());
    }
    return FORBIDDEN_V6.has(range);
  }
  return FORBIDDEN_V4.has((ip as import('ipaddr.js').IPv4).range());
}

/** Resolve a hostname and reject if ANY address is private/loopback/link-local/CGNAT/reserved. */
async function assertPublicHost(hostname: string): Promise<void> {
  // Literal IP in the URL: no DNS lookup needed.
  if (ipaddr.isValid(hostname)) {
    if (isForbiddenIp(hostname)) {
      throw new LogoError(`Blocked logo host: ${hostname} resolves to a forbidden address range`);
    }
    return;
  }
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new LogoError(`Logo host does not resolve: ${hostname}`);
  }
  for (const { address } of addresses) {
    if (isForbiddenIp(address)) {
      throw new LogoError(
        `Blocked logo host: ${hostname} resolves to ${address}, which is in a forbidden range (loopback/private/CGNAT/link-local/metadata)`,
      );
    }
  }
}

async function fetchWithLimits(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'og-image-generator/1.0 (+logo fetcher)' },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a remote logo and return it as a base64 data URL.
 * SSRF guard: http/https only, manual redirects (<=3) with every hop's host
 * re-validated against DNS-resolved deny-listed ranges, 5s timeout, 2MB cap,
 * image/* content-type required.
 *
 * Residual risk: classic DNS-rebinding TOCTOU (validation and fetch resolve
 * independently). Documented in README; acceptable for an opt-in feature.
 */
export async function fetchLogoAsDataUrl(rawUrl: string): Promise<string> {
  if (!remoteAssetsEnabled()) {
    throw new LogoError(
      'Remote logo URLs are disabled on this instance (set ALLOW_REMOTE_ASSETS=true to enable)',
    );
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new LogoError('logo must be a valid absolute URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new LogoError('logo URL protocol must be http or https');
  }

  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(current.hostname);
    const res = await fetchWithLimits(current);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new LogoError('logo fetch: redirect without Location header');
      if (hop === MAX_REDIRECTS) throw new LogoError('logo fetch: too many redirects');
      current = new URL(location, current);
      continue;
    }

    if (!res.ok) {
      throw new LogoError(`logo fetch failed: HTTP ${res.status}`);
    }
    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!contentType.startsWith('image/')) {
      throw new LogoError(`logo fetch: unsupported content-type "${contentType || 'unknown'}" (image/* required)`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_LOGO_BYTES) {
      throw new LogoError(`logo exceeds ${MAX_LOGO_BYTES / (1024 * 1024)}MB limit`);
    }
    return `data:${contentType};base64,${buf.toString('base64')}`;
  }
  throw new LogoError('logo fetch: too many redirects'); // unreachable
}
