/**
 * Weather Data Aggregation Gateway — Edge Handler
 *
 * Primary entry point for the edge-deployed data aggregation
 * service. Routes requests to internal endpoints (health,
 * metrics, docs) or forwards them to the upstream weather
 * data provider for real-time aggregation.
 *
 * Architecture:
 *   Client → Edge (this handler) → Upstream Data Service
 *
 * @module handler
 * @version 2.4.0
 */

import { config } from "../lib/config.js";
import { forwardToUpstream } from "../lib/gateway.js";
import { logger } from "../lib/logger.js";
import { jsonSuccess, jsonError } from "../lib/responses.js";

export const runtime = "edge";

/* ───────────────────── Internal Route Handlers ───────────────────── */

/** GET /health — Liveness probe for uptime monitors */
function handleHealth() {
  return jsonSuccess({
    status: "healthy",
    service: config.serviceName,
    version: config.serviceVersion,
    environment: config.environment,
    timestamp: new Date().toISOString(),
    upstreamConfigured: !!config.upstreamBaseUrl,
  });
}

/** GET /metrics — Basic runtime metrics (Prometheus-compatible) */
function handleMetrics() {
  const now = Date.now();
  const lines = [
    `# HELP service_info Static service metadata`,
    `# TYPE service_info gauge`,
    `service_info{service="${config.serviceName}",version="${config.serviceVersion}",env="${config.environment}"} 1`,
    `# HELP service_uptime_seconds Approximate handler uptime`,
    `# TYPE service_uptime_seconds gauge`,
    `service_uptime_seconds ${Math.floor(now / 1000)}`,
    `# HELP upstream_configured Whether upstream target is set`,
    `# TYPE upstream_configured gauge`,
    `upstream_configured ${config.upstreamBaseUrl ? 1 : 0}`,
  ];

  return new Response(lines.join("\n") + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** GET / — Service landing page / API documentation */
function handleRoot() {
  return jsonSuccess({
    service: config.serviceName,
    version: config.serviceVersion,
    description: "Real-time weather data aggregation and distribution gateway",
    endpoints: {
      "/health": "Service health check (GET)",
      "/metrics": "Prometheus-compatible metrics (GET)",
      "/api/v1/*": "Weather data proxy — forwards to upstream provider",
    },
    documentation: "https://github.com/bubble666-ai/weather-data-aggregation-proxy",
    timestamp: new Date().toISOString(),
  });
}

/* ───────────────────── Request Router ───────────────────── */

/**
 * Internal routes served directly by the edge function.
 * Everything else is forwarded to the upstream data service.
 */
const INTERNAL_ROUTES = new Map([
  ["/health", handleHealth],
  ["/healthz", handleHealth],
  ["/metrics", handleMetrics],
]);

/**
 * Extracts the pathname from a full request URL.
 * @param {string} url
 * @returns {string}
 */
function extractPath(url) {
  const idx = url.indexOf("/", 8); // skip "https://"
  if (idx === -1) return "/";
  const qIdx = url.indexOf("?", idx);
  return qIdx === -1 ? url.slice(idx) : url.slice(idx, qIdx);
}

/* ───────────────────── Main Edge Handler ───────────────────── */

/**
 * Edge function entry point. Handles all incoming requests:
 *  1. Internal management endpoints (health, metrics)
 *  2. Data aggregation proxy (everything else → upstream)
 *
 * @param {Request} req - Incoming edge request
 * @returns {Promise<Response>}
 */
export default async function handler(req) {
  const startTime = Date.now();
  const pathname = extractPath(req.url);

  // Log incoming request
  logger.logRequest(req);

  // Serve root landing page
  if (pathname === "/" && req.method === "GET") {
    return handleRoot();
  }

  // Check internal routes
  const internalHandler = INTERNAL_ROUTES.get(pathname);
  if (internalHandler && req.method === "GET") {
    return internalHandler();
  }

  // Validate upstream configuration
  if (!config.upstreamBaseUrl) {
    logger.error("upstream_not_configured", {
      hint: "Set TARGET_DOMAIN environment variable",
    });
    return jsonError(
      "Service unavailable: upstream data provider is not configured",
      503,
      "UPSTREAM_NOT_CONFIGURED"
    );
  }

  // Forward to upstream data service
  try {
    const response = await forwardToUpstream(req);
    const durationMs = Date.now() - startTime;

    logger.logResponse(response.status, durationMs);
    return response;
  } catch (err) {
    const durationMs = Date.now() - startTime;

    logger.error("upstream_request_failed", {
      error: err.message,
      duration_ms: durationMs,
      path: pathname,
    });

    return jsonError(
      "Bad Gateway: upstream data service is unreachable",
      502,
      "UPSTREAM_UNREACHABLE"
    );
  }
}