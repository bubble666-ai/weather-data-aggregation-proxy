# ☁️ Weather Dashboard API

A lightweight **weather data aggregation proxy** built on **Vercel Edge Functions**. It fetches real-time weather data from your configured backend weather service and delivers it with ultra-low latency through Vercel's global CDN.

---

## Features

- ⚡ **Edge-optimized** — Runs on Vercel's edge network for minimal latency
- 🌍 **Global CDN** — Weather data served from the closest edge node
- 🔒 **Secure** — TLS-encrypted connections to your backend weather provider
- 🪶 **Zero dependencies** — Pure Web Standards API (Fetch, Headers, ReadableStream)
- 📡 **Real-time streaming** — Supports streamed responses for live weather feeds

---

## How It Works

```
┌──────────┐   HTTPS/TLS    ┌──────────────┐   HTTP/2   ┌──────────────┐
│  Client   │ ──────────────► │ Vercel Edge  │ ──────────► │  Weather     │
│ (Browser/ │   API request  │  (Proxy)     │  forward   │  Backend     │
│  Mobile)  │                │              │            │  Service     │
└──────────┘                └──────────────┘            └──────────────┘
```

1. Client sends an API request to the Vercel edge endpoint.
2. The edge function forwards the request to your configured weather backend.
3. Response is streamed back to the client in real-time.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)
- A backend weather API endpoint (e.g., your own aggregation server)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/weather-dashboard-api.git
cd weather-dashboard-api
```

### 2. Configure Environment

Set your backend weather API URL:

```bash
vercel env add TARGET_DOMAIN
# Value: https://your-weather-backend.example.com
# Environments: Production, Preview
```

### 3. Deploy

```bash
vercel --prod
```

Your API will be available at `https://your-project.vercel.app`.

---

## API Usage

### Get Weather Data

```bash
curl https://your-project.vercel.app/api/current?city=london
```

### Streamed Response

```bash
curl https://your-project.vercel.app/api/forecast?city=tokyo&days=7
```

### Example Response

```json
{
  "city": "London",
  "temperature": 15.2,
  "humidity": 72,
  "condition": "Partly Cloudy",
  "wind": {
    "speed": 12.5,
    "direction": "NW"
  },
  "updated_at": "2025-01-15T10:30:00Z"
}
```

---

## Configuration

| Variable | Description | Required |
|---|---|---|
| `TARGET_DOMAIN` | Full URL of your backend weather service (e.g., `https://api.weather-backend.com`) | ✅ |

---

## Architecture

The proxy strips unnecessary headers and forwards clean requests to your backend:

- Removes hop-by-hop headers (`connection`, `keep-alive`, `transfer-encoding`, etc.)
- Strips Vercel internal headers (`x-vercel-*`)
- Preserves client IP via `x-forwarded-for` for geo-based weather lookups
- Supports all HTTP methods (GET, POST, PUT, etc.)
- Streams response bodies without buffering for optimal performance

---

## Vercel Limits (Hobby Plan)

| Limit | Value |
|---|---|
| Edge Requests | 1M / month |
| Fast Data Transfer | 100 GB / month |
| Response Timeout | 25 seconds |
| Streaming Duration | 300 seconds |

> For higher limits, consider upgrading to [Vercel Pro](https://vercel.com/pricing).

---

## Troubleshooting

### `502 Bad Gateway`
Your backend weather service is unreachable. Check:
- `TARGET_DOMAIN` is correctly set
- Backend server is running
- Firewall allows inbound connections

### `500 Internal Server Error`
Environment variable `TARGET_DOMAIN` is not configured. Run:
```bash
vercel env ls
```

### Slow Responses
Ensure your backend server is in a region close to Vercel's edge nodes for optimal performance.

---

## Development

```bash
# Run locally
vercel dev

# View logs
vercel logs --follow
```

---

## Project Structure

```
├── api/
│   └── index.js          # Edge function handler
├── package.json
├── vercel.json           # Routing configuration
└── README.md
```

---

## License

MIT

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
