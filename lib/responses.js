/**
 * Standard API Response Builders
 *
 * Provides consistent JSON response formatting across
 * all API endpoints. Follows the JSend specification
 * for structured API responses.
 *
 * @module responses
 * @see https://github.com/omniti-labs/jsend
 */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

/**
 * Returns a success JSON response.
 *
 * @param {Object} data - Response payload
 * @param {number} [status=200] - HTTP status code
 * @returns {Response}
 */
export function jsonSuccess(data, status = 200) {
  return new Response(
    JSON.stringify({ status: "success", data }),
    { status, headers: JSON_HEADERS }
  );
}

/**
 * Returns an error JSON response.
 *
 * @param {string} message - Error description
 * @param {number} [status=500] - HTTP status code
 * @param {string} [code] - Machine-readable error code
 * @returns {Response}
 */
export function jsonError(message, status = 500, code) {
  const body = { status: "error", message };
  if (code) body.code = code;
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}
