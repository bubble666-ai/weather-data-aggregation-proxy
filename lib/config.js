/**
 * Application Configuration Manager
 *
 * Centralizes environment variable access and provides
 * runtime validation for required service parameters.
 *
 * @module config
 */

const REQUIRED_VARS = ["TARGET_DOMAIN"];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true, missing: [] };
}

export const config = Object.freeze({
  /** Upstream data service base URL */
  upstreamBaseUrl: (process.env.TARGET_DOMAIN || "").replace(/\/$/, ""),

  /** Service metadata */
  serviceName: process.env.SERVICE_NAME || "weather-data-aggregation-proxy",
  serviceVersion: process.env.SERVICE_VERSION || "2.4.0",
  environment: process.env.NODE_ENV || "production",

  /** Feature flags */
  enableRequestLogging: process.env.ENABLE_LOGGING !== "false",
  enableMetrics: process.env.ENABLE_METRICS !== "false",

  /** Timeout settings (ms) */
  upstreamTimeoutMs: parseInt(process.env.UPSTREAM_TIMEOUT_MS || "25000", 10),

  /** Validation helper */
  validate: validateEnv,
});
