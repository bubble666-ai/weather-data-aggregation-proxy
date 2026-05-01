/**
 * HTTP Header Sanitizer
 *
 * Strips hop-by-hop and platform-injected headers before
 * forwarding requests to upstream services. Implements
 * RFC 7230 §6.1 hop-by-hop header removal and preserves
 * client identity through X-Forwarded-For normalization.
 *
 * @module sanitizer
 */

/** Headers defined as hop-by-hop per RFC 7230 §6.1 */
const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

/** Platform-specific headers injected by the edge runtime */
const PLATFORM_HEADERS = new Set([
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
]);

const PLATFORM_PREFIX = "x-vercel-";

/**
 * Creates a sanitized copy of the incoming request headers,
 * removing hop-by-hop and platform headers while normalizing
 * the client IP chain.
 *
 * @param {Headers} incomingHeaders - Original request headers
 * @returns {{ headers: Headers, clientIp: string|null }}
 */
export function sanitizeHeaders(incomingHeaders) {
  const cleaned = new Headers();
  let clientIp = null;

  for (const [key, value] of incomingHeaders) {
    // Drop hop-by-hop headers (RFC 7230)
    if (HOP_BY_HOP.has(key)) continue;

    // Drop platform-injected headers
    if (PLATFORM_HEADERS.has(key)) continue;
    if (key.startsWith(PLATFORM_PREFIX)) continue;

    // Extract real client IP
    if (key === "x-real-ip") {
      clientIp = value;
      continue;
    }
    if (key === "x-forwarded-for") {
      if (!clientIp) clientIp = value;
      continue;
    }

    cleaned.set(key, value);
  }

  // Re-attach normalized client IP for upstream geo-resolution
  if (clientIp) {
    cleaned.set("x-forwarded-for", clientIp);
  }

  return { headers: cleaned, clientIp };
}
