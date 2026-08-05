---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### TiketFlow
- Definition：The project's product name — a digital ticketing SaaS platform where event organisers can create events, sell tickets, receive payments, and manage QR-code check-in at venues.
- Aliases：TicketFlow

### super_admin
- Definition：A user role in the TiketFlow system with full platform access, distinct from organiser and gate_staff roles. The default super_admin account is seeded in the schema.
- Aliases：superadmin

### organiser
- Definition：A user role representing an event creator who can create and manage their own events, ticket types, and promo codes within the TiketFlow platform.
- Aliases：event_organiser

### gate_staff
- Definition：A user role with permission to perform QR-code check-ins at event venues; used by the checkin flow to mark tickets as scanned.
- Aliases：staff、gate_staff

### qr_code_token
- Definition：A unique token generated per ticket that serves as the scannable identifier for check-in; stored in the `tickets` table and validated during the scan flow.
- Aliases：token、qr_token

### check_in
- Definition：The act of scanning or manually validating a ticket at the venue, recorded in the `check_ins` table with timestamp, staff ID, and device info; updates the ticket status to 'used'.
- Aliases：scan、checkin

### promo_code
- Definition：An event-specific discount code with configurable percentage discount, max uses, and expiry date; tracked in the `promo_codes` table with `times_used` counter.
- Aliases：discount_code、coupon

### ecocash
- Definition：A mobile money payment method supported alongside Stripe, Visa, Mastercard, and PayPal; represents EcoCash transactions in the `payments` table.
- Aliases：EcoCash

### tf_session
- Definition：A base64-encoded JSON cookie containing userId, role, and expiration time, used for server-side authentication in place of a dedicated auth provider.
- Aliases：session_cookie、session token
