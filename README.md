# @weatherstack/data-aggregation-proxy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bubble666-ai/weather-data-aggregation-proxy)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![Runtime](https://img.shields.io/badge/runtime-Vercel%20Edge-black)

A production-grade **weather data aggregation gateway** deployed on Vercel Edge Functions. Aggregates and distributes real-time weather data from upstream providers with ultra-low latency through a global edge network.

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Monitoring](#monitoring)
- [Deployment](#deployment)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

```
                        ┌─────────────────────────────────────────┐
                        │           Vercel Edge Network           │
┌──────────┐            │  ┌───────────┐    ┌──────────────────┐  │    ┌────────────┐
│  Client  │── HTTPS ──►│  │  Router   │───►│  Data Gateway    │──│───►│  Upstream   │
│ (Mobile/ │            │  │           │    │  (stream proxy)  │  │    │  Weather    │
│  Web/IoT)│◄── JSON ──│  │  /health  │    │                  │◄─│────│  Provider   │
└──────────┘            │  │  /metrics │    └──────────────────┘  │    └────────────┘
                        │  └───────────┘                          │
                        │         iad1 · cdg1 · hnd1              │
                        └─────────────────────────────────────────┘
```

**Data Flow:**
1. Client sends an API request to the nearest edge node
2. Edge router handles internal endpoints (`/health`, `/metrics`) locally
3. Data requests are forwarded to the upstream weather provider
4. Responses are streamed back without buffering for real-time telemetry

---

## Features

| Feature | Description |
|---|---|
| ⚡ **Edge-Native** | Runs on Vercel's edge runtime — cold starts under 5ms |
| 🌍 **Multi-Region** | Deployed to IAD (US-East), CDG (Europe), HND (Asia-Pacific) |
| 📡 **Real-Time Streaming** | Full-duplex streaming via `ReadableStream` / `half-duplex` fetch |
| 🔒 **Header Sanitization** | RFC 7230 compliant hop-by-hop header removal |
| 📊 **Prometheus Metrics** | Built-in `/metrics` endpoint for observability |
| 🏥 **Health Checks** | `/health` and `/healthz` for uptime monitoring |
| 📝 **Structured Logging** | JSON log output compatible with Vercel Log Drains |
| 🧩 **Modular Architecture** | Clean separation: config, sanitizer, gateway, logger, responses |
| 0️⃣ **Zero Dependencies** | Pure Web Standards API — no npm packages required |

---

## Project Structure

```
├── api/
│   └── index.js              # Edge handler — request router + gateway
├── lib/
│   ├── config.js              # Environment & service configuration
│   ├── gateway.js             # Upstream request forwarding (streaming)
│   ├── sanitizer.js           # HTTP header sanitization (RFC 7230)
│   ├── logger.js              # Structured JSON logging
│   └── responses.js           # Standard API response builders (JSend)
├── package.json
├── vercel.json                # Edge routing, regions & headers
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- An upstream weather data API endpoint

### Quick Start

```bash
# Clone
git clone https://github.com/bubble666-ai/weather-data-aggregation-proxy.git
cd weather-data-aggregation-proxy

# Set upstream provider URL
vercel env add TARGET_DOMAIN
# → Enter: https://your-weather-backend.example.com

# Deploy to production
vercel --prod
```

---

## Configuration

All configuration is managed through environment variables:

| Variable | Required | Default | Description |
|---|---|---|---|
| `TARGET_DOMAIN` | ✅ | — | Full URL of the upstream weather data provider |
| `SERVICE_NAME` | ❌ | `weather-data-aggregation-proxy` | Service identifier for logs |
| `SERVICE_VERSION` | ❌ | `2.4.0` | Reported version in health checks |
| `ENABLE_LOGGING` | ❌ | `true` | Enable/disable structured request logging |
| `ENABLE_METRICS` | ❌ | `true` | Enable/disable metrics endpoint |
| `UPSTREAM_TIMEOUT_MS` | ❌ | `25000` | Upstream request timeout in milliseconds |

### Setting Environment Variables

```bash
# Via CLI
vercel env add TARGET_DOMAIN

# Or via Vercel Dashboard
# Project → Settings → Environment Variables
```

---

## API Reference

### `GET /`
Service information and available endpoints.

```bash
curl https://your-project.vercel.app/
```

```json
{
  "status": "success",
  "data": {
    "service": "weather-data-aggregation-proxy",
    "version": "2.4.0",
    "description": "Real-time weather data aggregation and distribution gateway",
    "endpoints": {
      "/health": "Service health check (GET)",
      "/metrics": "Prometheus-compatible metrics (GET)",
      "/api/v1/*": "Weather data proxy — forwards to upstream provider"
    }
  }
}
```

### `GET /health`
Liveness probe for uptime monitors and load balancers.

```bash
curl https://your-project.vercel.app/health
```

```json
{
  "status": "success",
  "data": {
    "status": "healthy",
    "service": "weather-data-aggregation-proxy",
    "version": "2.4.0",
    "upstreamConfigured": true,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### `GET /metrics`
Prometheus-compatible metrics output.

```bash
curl https://your-project.vercel.app/metrics
```

```
# HELP service_info Static service metadata
# TYPE service_info gauge
service_info{service="weather-data-aggregation-proxy",version="2.4.0",env="production"} 1
# HELP upstream_configured Whether upstream target is set
# TYPE upstream_configured gauge
upstream_configured 1
```

### `* /**`
All other requests are forwarded to the upstream weather data provider. The gateway preserves the original path, query parameters, method, and headers.

```bash
# Example: fetch current weather
curl https://your-project.vercel.app/api/v1/current?city=london

# Example: stream live forecast
curl https://your-project.vercel.app/api/v1/forecast/stream?lat=35.6&lon=139.7
```

---

## Monitoring

### Health Checks

Configure your uptime monitor (UptimeRobot, Pingdom, etc.) to poll:
```
GET https://your-project.vercel.app/health
```
Expected: `200 OK` with `status: "healthy"`

### Prometheus / Grafana

Scrape the metrics endpoint:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'weather-gateway'
    scrape_interval: 30s
    static_configs:
      - targets: ['your-project.vercel.app']
    metrics_path: '/metrics'
    scheme: 'https'
```

### Log Drains

Structured JSON logs are compatible with Vercel Log Drains → forward to Datadog, Logflare, or any SIEM.

---

## Deployment

### Multi-Region

The service is configured to deploy to three edge regions for global coverage:

| Region | Location | Code |
|---|---|---|
| US East | Washington, D.C. | `iad1` |
| Europe | Paris | `cdg1` |
| Asia Pacific | Tokyo | `hnd1` |

Requests are automatically routed to the nearest edge node.

### Production Deploy

```bash
vercel --prod
```

### Preview Deploy

```bash
vercel
```

---

## Performance

| Metric | Value |
|---|---|
| Cold start | < 5ms (edge runtime) |
| Header processing | < 0.1ms |
| Upstream forwarding | Network-bound (no buffering) |
| Response streaming | Zero-copy pass-through |
| Bundle size | ~3 KB (no dependencies) |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Write clean, documented code following the existing module pattern
4. Test with `vercel dev` locally
5. Submit a Pull Request

### Code Style

- ES Modules (`import/export`)
- JSDoc for all exported functions
- Structured logging (no `console.log` in business logic)
- Standard JSON responses via `lib/responses.js`

---

## License

MIT — see [LICENSE](./LICENSE) for details.
