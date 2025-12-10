# Vote Ronda — Upstash-backed (serverless-ready)

Project ini adalah implementasi voting sederhana untuk Vercel / Next.js, mirip dengan repo asli namun diperbaiki:
- Single source of truth: Upstash Redis (REST).
- Atomic operations (SET NX + HINCRBY) untuk mencegah double-vote.
- Frontend membaca hasil dari API; public page konsisten.
- Minimal but production-ready: retry, input sanitasi, cookie auth, migration script.

Required environment variables (Vercel Project Settings):
- UPSTASH_REDIS_REST_URL (e.g. https://xxx.upstash.io)
- UPSTASH_REDIS_REST_TOKEN
- NEXT_PUBLIC_POLL_ID (optional, default: "ronda")
(Optional) ALLOWED_PHONES for dev mode (JSON array or newline/CSV) or create data/allowed.json

How to run locally
1. Copy `.env.local.example` to `.env.local` and fill values (DO NOT commit `.env.local`).
2. npm install
3. npm run dev
4. Visit http://localhost:3000

Deploy to Vercel
1. Push repository to GitHub.
2. In Vercel Project Settings → Environment Variables, add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (no quotes).
3. Deploy (Vercel will build & deploy automatically).

Testing
- Login at `/` with an allowed phone.
- Go to `/vote`, select option, click "Kirim Vote".
  - First vote -> 200 ok and UI success.
  - Subsequent attempt from same phone -> 409 Already voted.
- Public: `/public` reads aggregated counts from Redis.

Migration
- If you used a local votes.json, run:
  UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/migrate.js ./data/votes.json

Security notes
- Cookie is client-readable to display phone in UI. For stronger security, sign cookie server-side (HMAC/JWT).
- Rotate Upstash token immediately if leaked. Do NOT commit tokens or `.env.local`.
- Upstash free tier has quotas — monitor usage.

If you want, I can:
- Produce a patch/PR for an existing repo (requires repo write access).
- Add cookie signing (HMAC) for stronger authenticity.
- Add admin endpoint to export raw vote list (requires auth).
