/**
 * Upstream Data Gateway
 *
 * Handles request forwarding to the configured upstream
 * data aggregation service. Supports full-duplex streaming
 * for real-time data feeds (e.g., live weather telemetry).
 *
 * @module gateway
 */

import { config } from "./config.js";
import { sanitizeHeaders } from "./sanitizer.js";

/**
 * Resolves the full upstream URL from the incoming request.
 *
 * @param {string} requestUrl - Full incoming request URL
 * @returns {string} Upstream target URL
 */
function resolveUpstreamUrl(requestUrl) {
  const pathStart = requestUrl.indexOf("/", 8); // skip https://
  if (pathStart === -1) {
    return config.upstreamBaseUrl + "/";
  }
  return config.upstreamBaseUrl + requestUrl.slice(pathStart);
}

/**
 * Forwards an incoming request to the upstream data service.
 * Streams the response body without buffering for optimal
 * latency on real-time data feeds.
 *
 * @param {Request} req - Incoming edge request
 * @returns {Promise<Response>} Upstream response
 */
export async function forwardToUpstream(req) {
  const upstreamUrl = resolveUpstreamUrl(req.url);
  const { headers } = sanitizeHeaders(req.headers);

  const method = req.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers,
    body: hasBody ? req.body : undefined,
    duplex: "half",
    redirect: "manual",
  });

  return upstreamResponse;
}
