---
kind: external_dependency
name: Stripe — Payment Processing
slug: stripe
category: external_dependency
category_hints:
    - vendor_identity
    - sdk_real_api
scope:
    - '**'
---

### Stripe
- Role in this repo: payment processing for ticket purchases alongside EcoCash; Stripe is one of several supported `payment_method` values in the `payments` table.
- Integration point: `lib/stripe.js` instantiates the Stripe SDK with `STRIPE_SECRET_KEY` and pins `apiVersion: '2023-10-16'`; client-side integration uses `@stripe/stripe-js` and `@stripe/react-stripe-js`.
- The stable shape: checkout flows go through Next.js API routes that create Stripe sessions/confirmations, then record a `pending` payment row which is updated to `completed` on success.
- Verify exact Checkout/Session API calls and webhook handling against the official Stripe docs.