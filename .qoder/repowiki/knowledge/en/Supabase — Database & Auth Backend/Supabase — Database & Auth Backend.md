---
kind: external_dependency
name: Supabase — Database & Auth Backend
slug: supabase
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

### Supabase
- Role in this repo: primary PostgreSQL database, row-level security policies, and session/auth storage for the ticketing platform.
- Integration point: `lib/supabase.js` creates a public client via `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and a server-only service-role client via `SUPABASE_SERVICE_ROLE_KEY` (used by API routes).
- Schema is defined in `supabase/schema.sql` (users, events, ticket_types, tickets, check_ins, payments, promo_codes) with RLS policies enabling public read of published events and service-role full access.
- Auth is custom-built on top of Supabase tables (`bcryptjs` hashing, base64 session cookie `tf_session`) rather than Supabase Auth; Supabase is used as the data layer only.
- Verify exact env var names and RLS policy behavior against the official Supabase docs.