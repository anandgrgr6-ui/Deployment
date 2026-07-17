# Frontend — Rane Driver Behaviour Observation

Vite + React app. Talks to the Node backend under `/api` (proxied to
`http://localhost:3006` in dev — see `vite.config.js`).

## Run
```bash
npm install
npm run dev      # http://localhost:5173
```

## Build
```bash
npm run build    # outputs to dist/ (the backend can serve this)
```

See the root `README.md` for full setup (Supabase, backend, seeding, email).
