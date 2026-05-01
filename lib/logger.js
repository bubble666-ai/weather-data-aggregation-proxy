/**
 * Structured Request Logger
 *
 * Lightweight structured logging for edge runtime.
 * Outputs JSON-formatted log entries compatible with
 * Vercel's log drain and third-party observability tools.
 *
 * @module logger
 */

import { config } from "./config.js";

/**
 * Log levels aligned with syslog severity
 * @enum {number}
 */
const Level = {
  DEBUG: 7,
  INFO: 6,
  WARN: 4,
  ERROR: 3,
};

/**
 * Emits a structured log entry.
 *
 * @param {string} level - Log level name
 * @param {string} message - Human-readable message
 * @param {Object} [meta={}] - Additional structured fields
 */
function emit(level, message, meta = {}) {
  if (!config.enableRequestLogging) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: config.serviceName,
    version: config.serviceVersion,
    message,
    ...meta,
  };

  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else if (level === "WARN") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (msg, meta) => emit("DEBUG", msg, meta),
  info: (msg, meta) => emit("INFO", msg, meta),
  warn: (msg, meta) => emit("WARN", msg, meta),
  error: (msg, meta) => emit("ERROR", msg, meta),

  /**
   * Logs an incoming request summary.
   * @param {Request} req
   */
  logRequest(req) {
    const url = new URL(req.url);
    emit("INFO", "incoming_request", {
      method: req.method,
      path: url.pathname,
      query: url.search || undefined,
      userAgent: req.headers.get("user-agent"),
    });
  },

  /**
   * Logs an upstream response summary.
   * @param {number} status
   * @param {number} durationMs
   */
  logResponse(status, durationMs) {
    emit("INFO", "upstream_response", {
      status,
      duration_ms: durationMs,
    });
  },
};
