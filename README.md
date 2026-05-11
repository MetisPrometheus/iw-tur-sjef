# tur-sjef

Collaborative road-trip planner. Friends share a trip URL, drop in stops along an
A→B→C→D route, pick category slots per day (lunch, dinner, activity, lodging…),
pull nearby Google Places, suggest options, vote — the highest voted suggestions
win per slot. A Mapbox map shows the road route and where the winners sit.

No auth: anyone with the slug can join. Pick a display name on first visit,
stored in `localStorage`.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind
- Postgres on the `iw-infra` Hetzner box
- Google Places (server-side proxy) for nearby search
- Mapbox GL JS + Directions API for the route map
- SWR polling for "realtime" updates (3s when tab focused)

## Local dev

```bash
# One-time: provision the Postgres DB + /etc/tur-sjef/env on the box
sudo bash /opt/projects/iw-infra/setup.sh tur-sjef

# Pull DATABASE_URL into .env.local
sudo cat /etc/tur-sjef/env >> .env.local   # then dedupe DATABASE_URL line

npm install
npm run db:migrate
npm run dev
```

## Deploy (Vercel)

Vercel project `tursjef` → `tursjef.vercel.app` → later `tursjef.com`.

Env vars to set in Vercel:
- `DATABASE_URL` (use the `tur_sjef_rw` connection string from the box, with `?sslmode=require`)
- `GOOGLE_PLACES_API_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
