/**
 * Weather Dashboard API — Edge Proxy Handler
 *
 * Forwards incoming weather data requests to the configured
 * backend weather aggregation service. Streams responses in
 * real-time for live forecast feeds.
 */

export const config = { runtime: "edge" };

// Backend weather service URL (set via Vercel env vars)
const WEATHER_SERVICE_URL = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");

// Headers that should not be forwarded to the upstream service
const HOP_BY_HOP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
]);

export default async function handler(req) {
  if (!WEATHER_SERVICE_URL) {
    return new Response("Service unavailable: weather backend is not configured", {
      status: 500,
    });
  }

  try {
    // Build the upstream URL preserving the original path & query string
    const pathStart = req.url.indexOf("/", 8);
    const upstreamUrl =
      pathStart === -1
        ? WEATHER_SERVICE_URL + "/"
        : WEATHER_SERVICE_URL + req.url.slice(pathStart);

    // Prepare clean headers for upstream request
    const cleanHeaders = new Headers();
    let clientIp = null;
    for (const [key, value] of req.headers) {
      if (HOP_BY_HOP_HEADERS.has(key)) continue;
      if (key.startsWith("x-vercel-")) continue;
      if (key === "x-real-ip") {
        clientIp = value;
        continue;
      }
      if (key === "x-forwarded-for") {
        if (!clientIp) clientIp = value;
        continue;
      }
      cleanHeaders.set(key, value);
    }
    // Forward client IP for geo-based weather lookups
    if (clientIp) cleanHeaders.set("x-forwarded-for", clientIp);

    const method = req.method;
    const hasBody = method !== "GET" && method !== "HEAD";

    return await fetch(upstreamUrl, {
      method,
      headers: cleanHeaders,
      body: hasBody ? req.body : undefined,
      duplex: "half",
      redirect: "manual",
    });
  } catch (err) {
    console.error("weather proxy error:", err);
    return new Response("Bad Gateway: Weather service unreachable", { status: 502 });
  }
}