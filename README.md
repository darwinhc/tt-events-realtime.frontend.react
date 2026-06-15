# Events Realtime

A single-screen event browser built with React, TypeScript, Tailwind CSS,
shadcn/ui primitives, Lucide React, and Vite.

The screen contains an event list and the selected event detail. It connects
to the existing REST and WebSocket endpoints so changes appear in place.

Event locations use a local ISO 3166-1 alpha-2 country catalog provided by
`i18n-iso-countries`; city remains a free-text field. Protected event actions
send the current visible user name as a Bearer token, following the current
FastAPI OpenAPI contract.

## Run locally

Use Node.js 24 LTS and npm 11.

```bash
nvm use
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies `/api` and `/ws` to
`http://localhost:8000` by default.

To use remote services, set:

```bash
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

## Validate

```bash
npm run lint
npm test
npm run test:coverage
npm run build
```
