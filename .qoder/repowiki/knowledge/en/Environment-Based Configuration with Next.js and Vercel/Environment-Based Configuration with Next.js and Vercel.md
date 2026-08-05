---
kind: configuration_system
name: Environment-Based Configuration with Next.js and Vercel
category: configuration_system
scope:
    - '**'
source_files:
    - lib/supabase.js
    - lib/stripe.js
    - next.config.js
    - vercel.json
    - package.json
---

This repository uses a straightforward environment-variable-based configuration system centered around Next.js's built-in `process.env` mechanism, deployed on Vercel. There is no dedicated config file loader or centralized configuration module; instead, each service client reads its own required variables directly at module load time.

**What system/approach is used**
- Next.js runtime environment variables via `process.env`, with `NEXT_PUBLIC_` prefixed variables exposed to the browser and non-prefixed variables kept server-side only.
- Vercel deployment configuration through `vercel.json` for build/runtime behavior and security headers.
- No `.env` files are committed; placeholders and warnings guide developers to create local `.env.local` files.

**Key files and packages**
- `lib/supabase.js` — Creates Supabase clients using `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client) and `SUPABASE_SERVICE_ROLE_KEY` (server-only admin client via `getServiceClient`). Falls back to placeholder values and logs a warning when variables are missing.
- `lib/stripe.js` — Initializes Stripe SDK with `STRIPE_SECRET_KEY`, falling back to a test key placeholder.
- `pages/api/tickets/purchase.js` and `pages/api/tickets/stripe-success.js` — Read `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL` inline for payment flows.
- `next.config.js` — Static Next.js configuration (React StrictMode, allowed remote image domains).
- `vercel.json` — Vercel-specific settings: framework detection, build/dev/install commands, region (`iad1`), and security headers applied to all `/api/*` routes.
- `package.json` — Declares runtime dependencies including `@supabase/supabase-js`, `stripe`, `bcryptjs`, and defines dev/build/start scripts.

**Architecture and conventions**
- Each integration module owns its own environment variable loading; there is no single configuration registry or validation layer.
- Client-facing variables use the `NEXT_PUBLIC_` prefix so they are bundled into the browser bundle; server-only secrets (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) are consumed only in API routes and server-side code.
- Missing variables produce console warnings or fall back to placeholder strings rather than throwing errors, allowing development without full configuration.
- The Supabase client pattern separates an anonymous public client from a service-role admin client obtained through a dedicated `getServiceClient()` function.

**Conventions and constraints**
- Environment variables must be set in `.env.local` during development; the code explicitly warns when they are absent.
- `NEXT_PUBLIC_*` variables are safe for client-side exposure; all other secrets must remain server-side only.
- Placeholder fallbacks (`placeholder-key`, `sk_test_placeholder`, `https://placeholder.supabase.co`) allow the app to start without configured credentials but will not function against real services.
- Vercel deployment enforces specific regions (`iad1`) and applies security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`) to every API route.