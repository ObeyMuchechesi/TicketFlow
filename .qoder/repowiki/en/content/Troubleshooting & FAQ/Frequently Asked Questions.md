# Frequently Asked Questions

<cite>
**Referenced Files in This Document**
- [package.json](file://package.json)
- [next.config.js](file://next.config.js)
- [vercel.json](file://vercel.json)
- [pages/_app.js](file://pages/_app.js)
- [components/Layout.js](file://components/Layout.js)
- [lib/supabase.js](file://lib/supabase.js)
- [lib/auth.js](file://lib/auth.js)
- [lib/stripe.js](file://lib/stripe.js)
- [supabase/schema.sql](file://supabase/schema.sql)
- [pages/api/auth/login.js](file://pages/api/auth/login.js)
- [pages/api/tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [pages/events/[slug].js](file://pages/events/[slug].js)
- [pages/checkin/[eventId].js](file://pages/checkin/[eventId].js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This FAQ covers common questions for TicketFlow users and developers, including setup, feature usage, customization, deployment, architecture decisions, integrations, operations, troubleshooting, best practices, and known limitations. It is designed to be accessible to both non-technical and technical readers.

## Project Structure
TicketFlow is a Next.js application with:
- Pages for public event browsing, admin dashboard, and gate check-in
- API routes for authentication, ticket purchase, promo validation, and check-in
- Shared libraries for Supabase client, Stripe integration, and auth utilities
- A Supabase schema defining core entities and security policies
- Vercel configuration for deployment and security headers

```mermaid
graph TB
subgraph "Frontend"
App["pages/_app.js"]
Layout["components/Layout.js"]
EventPage["pages/events/[slug].js"]
CheckinPage["pages/checkin/[eventId].js"]
end
subgraph "API Routes"
Login["pages/api/auth/login.js"]
Purchase["pages/api/tickets/purchase.js"]
end
subgraph "Libraries"
Supabase["lib/supabase.js"]
Auth["lib/auth.js"]
Stripe["lib/stripe.js"]
end
subgraph "Data & Config"
Schema["supabase/schema.sql"]
NextCfg["next.config.js"]
Vercel["vercel.json"]
Pkg["package.json"]
end
App --> Layout
EventPage --> Purchase
CheckinPage --> Purchase
Purchase --> Supabase
Purchase --> Stripe
Login --> Auth
Login --> Supabase
Supabase --> Schema
NextCfg --> App
Vercel --> App
Pkg --> App
```

**Diagram sources**
- [pages/_app.js:1-14](file://pages/_app.js#L1-L14)
- [components/Layout.js:1-281](file://components/Layout.js#L1-L281)
- [pages/events/[slug].js](file://pages/events/[slug].js#L1-L800)
- [pages/checkin/[eventId].js](file://pages/checkin/[eventId].js#L1-L800)
- [pages/api/auth/login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [pages/api/tickets/purchase.js:1-123](file://pages/api/tickets/purchase.js#L1-L123)
- [lib/supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [lib/auth.js:1-47](file://lib/auth.js#L1-L47)
- [lib/stripe.js:1-6](file://lib/stripe.js#L1-L6)
- [supabase/schema.sql:1-166](file://supabase/schema.sql#L1-L166)
- [next.config.js:1-14](file://next.config.js#L1-L14)
- [vercel.json:1-18](file://vercel.json#L1-L18)
- [package.json:1-24](file://package.json#L1-L24)

**Section sources**
- [package.json:1-24](file://package.json#L1-L24)
- [next.config.js:1-14](file://next.config.js#L1-L14)
- [vercel.json:1-18](file://vercel.json#L1-L18)
- [pages/_app.js:1-14](file://pages/_app.js#L1-L14)
- [components/Layout.js:1-281](file://components/Layout.js#L1-L281)

## Core Components
- Authentication: Cookie-based session tokens created on login; role checks via helper functions.
- Database: Supabase client with anon and service-role clients; RLS policies defined in schema.
- Payments: Stripe Checkout for card payments; other methods create tickets immediately (placeholder).
- UI: Global layout with theme switching and toast provider; reusable UI components.

Key implementation references:
- Session creation and cookie handling: [login route:1-31](file://pages/api/auth/login.js#L1-L31), [auth helpers:1-47](file://lib/auth.js#L1-L47)
- Supabase clients: [client setup:1-23](file://lib/supabase.js#L1-L23)
- Stripe initialization: [stripe client:1-6](file://lib/stripe.js#L1-L6)
- App shell and providers: [_app entry:1-14](file://pages/_app.js#L1-L14), [Layout:1-281](file://components/Layout.js#L1-L281)

**Section sources**
- [pages/api/auth/login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [lib/auth.js:1-47](file://lib/auth.js#L1-L47)
- [lib/supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [lib/stripe.js:1-6](file://lib/stripe.js#L1-L6)
- [pages/_app.js:1-14](file://pages/_app.js#L1-L14)
- [components/Layout.js:1-281](file://components/Layout.js#L1-L281)

## Architecture Overview
TicketFlow follows a Next.js pages-and-API structure:
- Public pages render event details and checkout flows
- API routes handle secure server-side logic (auth, purchases, promo codes)
- Supabase provides the database and row-level security
- Stripe Checkout handles payment processing securely off-site

```mermaid
sequenceDiagram
participant User as "User"
participant FE as "Event Page<br/>pages/events/[slug].js"
participant API as "Purchase API<br/>pages/api/tickets/purchase.js"
participant DB as "Supabase<br/>lib/supabase.js"
participant Pay as "Stripe<br/>lib/stripe.js"
User->>FE : Select tickets and submit purchase
FE->>API : POST /api/tickets/purchase {eventId, ticketTypeId, quantity, buyer info, paymentMethod}
API->>DB : Validate ticket type and availability
alt Payment method is Stripe
API->>Pay : Create Checkout session with metadata
Pay-->>API : Checkout URL
API-->>FE : {checkoutUrl}
FE-->>User : Redirect to Stripe Checkout
else Other methods
API->>DB : Insert tickets and update sold counts
API-->>FE : {success, tokens}
FE-->>User : Show confirmation and QR tokens
end
```

**Diagram sources**
- [pages/events/[slug].js](file://pages/events/[slug].js#L185-L238)
- [pages/api/tickets/purchase.js:1-123](file://pages/api/tickets/purchase.js#L1-L123)
- [lib/supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [lib/stripe.js:1-6](file://lib/stripe.js#L1-L6)

## Detailed Component Analysis

### Authentication Flow
- Users log in via email/password; credentials are verified against hashed storage
- On success, a session cookie is set with an expiration
- Role-based access can be enforced using helper functions

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Login API<br/>pages/api/auth/login.js"
participant DB as "Supabase<br/>getServiceClient()"
participant Auth as "Auth Helpers<br/>lib/auth.js"
Client->>API : POST /api/auth/login {email, password}
API->>DB : Fetch user by email and active status
DB-->>API : User record
API->>Auth : verifyPassword(password, hash)
Auth-->>API : boolean
alt Valid
API->>Auth : createSessionToken(userId, role)
Auth-->>API : token
API-->>Client : Set-Cookie + {user}
else Invalid
API-->>Client : 401 error
end
```

**Diagram sources**
- [pages/api/auth/login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [lib/auth.js:1-47](file://lib/auth.js#L1-L47)
- [lib/supabase.js:16-22](file://lib/supabase.js#L16-L22)

**Section sources**
- [pages/api/auth/login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [lib/auth.js:1-47](file://lib/auth.js#L1-L47)

### Ticket Purchase Flow
- Validates inputs and availability
- Applies promo code if provided
- For Stripe, creates a Checkout session and redirects
- For other methods, creates tickets immediately and records payment placeholder

```mermaid
flowchart TD
Start(["POST /api/tickets/purchase"]) --> Validate["Validate required fields"]
Validate --> Availability["Check ticket type and availability"]
Availability --> Promo{"Promo code provided?"}
Promo --> |Yes| ApplyPromo["Validate and apply discount"]
Promo --> |No| CalcPrice["Calculate unit price"]
ApplyPromo --> CalcPrice
CalcPrice --> Method{"Payment method"}
Method --> |Stripe| CreateCheckout["Create Stripe Checkout session"]
CreateCheckout --> ReturnURL["Return checkoutUrl"]
Method --> |Other| CreateTickets["Insert tickets and increment sold"]
CreateTickets --> RecordPayment["Record payment entry"]
RecordPayment --> ReturnTokens["Return success and tokens"]
ReturnURL --> End(["End"])
ReturnTokens --> End
```

**Diagram sources**
- [pages/api/tickets/purchase.js:1-123](file://pages/api/tickets/purchase.js#L1-L123)

**Section sources**
- [pages/api/tickets/purchase.js:1-123](file://pages/api/tickets/purchase.js#L1-L123)

### Check-In Workflow
- Gate staff scan or search tickets
- System validates ticket status and marks checked-in
- Stats refresh periodically for real-time feedback

```mermaid
sequenceDiagram
participant Staff as "Gate Staff"
participant UI as "Check-In Page<br/>pages/checkin/[eventId].js"
participant API as "Check-In API<br/>/api/checkin/scan"
participant DB as "Supabase"
Staff->>UI : Enter token or search attendee
UI->>API : POST /api/checkin/scan {token, eventId}
API->>DB : Validate ticket and update status
DB-->>API : Updated ticket data
API-->>UI : Result {valid, reason, message}
UI-->>Staff : Visual feedback and stats refresh
```

**Diagram sources**
- [pages/checkin/[eventId].js](file://pages/checkin/[eventId].js#L38-L52)

**Section sources**
- [pages/checkin/[eventId].js](file://pages/checkin/[eventId].js#L1-L800)

### Data Model and Security
- Core tables include users, events, ticket_types, tickets, check_ins, payments, promo_codes
- Row-Level Security enabled across tables
- Public read policies allow viewing published events and their ticket types
- Indexes optimize lookups for tokens, emails, and event IDs

```mermaid
erDiagram
USERS {
uuid id PK
text email UK
text password_hash
text full_name
text role
text phone
boolean is_active
timestamptz created_at
}
EVENTS {
uuid id PK
uuid organiser_id FK
text event_name
text slug UK
date date
text time
text venue
text description
text poster_image
jsonb performer_images
text theme_color
int capacity
text status
timestamptz created_at
}
TICKET_TYPES {
uuid id PK
uuid event_id FK
text name
decimal price
int quantity_available
int quantity_sold
text color
timestamptz created_at
}
TICKETS {
uuid id PK
uuid event_id FK
uuid ticket_type_id FK
text buyer_name
text buyer_email
text buyer_phone
text qr_code_token UK
boolean is_checked_in
timestamptz checked_in_at
uuid checked_in_by FK
timestamptz purchase_date
text status
}
CHECK_INS {
uuid id PK
uuid ticket_id FK
uuid event_id FK
uuid staff_id FK
timestamptz scanned_at
text method
text device_info
}
PAYMENTS {
uuid id PK
uuid ticket_id FK
decimal amount
text currency
text payment_method
text transaction_ref
text status
timestamptz paid_at
}
PROMO_CODES {
uuid id PK
uuid event_id FK
text code
int discount_percent
int max_uses
int times_used
date expires_at
boolean is_active
}
EVENTS ||--o{ TICKET_TYPES : "has many"
EVENTS ||--o{ TICKETS : "has many"
TICKET_TYPES ||--o{ TICKETS : "has many"
TICKETS ||--o{ CHECK_INS : "has many"
TICKETS ||--o{ PAYMENTS : "has many"
EVENTS ||--o{ PROMO_CODES : "has many"
```

**Diagram sources**
- [supabase/schema.sql:1-166](file://supabase/schema.sql#L1-L166)

**Section sources**
- [supabase/schema.sql:1-166](file://supabase/schema.sql#L1-L166)

## Dependency Analysis
- Frontend depends on Next.js runtime and React
- API routes depend on Supabase client and optional Stripe SDK
- Configuration files define image domains, build commands, and security headers

```mermaid
graph LR
Pkg["package.json"] --> Next["Next.js Runtime"]
Next --> React["React"]
Next --> Pages["pages/*"]
Pages --> API["pages/api/*"]
API --> Supabase["lib/supabase.js"]
API --> Stripe["lib/stripe.js"]
API --> Auth["lib/auth.js"]
Supabase --> Schema["supabase/schema.sql"]
Next --> NextCfg["next.config.js"]
Vercel["vercel.json"] --> Next
```

**Diagram sources**
- [package.json:1-24](file://package.json#L1-L24)
- [next.config.js:1-14](file://next.config.js#L1-L14)
- [vercel.json:1-18](file://vercel.json#L1-L18)
- [lib/supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [lib/stripe.js:1-6](file://lib/stripe.js#L1-L6)
- [lib/auth.js:1-47](file://lib/auth.js#L1-L47)
- [supabase/schema.sql:1-166](file://supabase/schema.sql#L1-L166)

**Section sources**
- [package.json:1-24](file://package.json#L1-L24)
- [next.config.js:1-14](file://next.config.js#L1-L14)
- [vercel.json:1-18](file://vercel.json#L1-L18)

## Performance Considerations
- Use Supabase indexes already defined for frequent queries (tokens, emails, event IDs)
- Prefer service-role client only on server-side API routes to avoid exposing sensitive keys
- Minimize client-side heavy animations on low-power devices; consider battery-friendly modes in check-in UI
- Cache static assets and images via CDN; configure allowed remote image domains explicitly

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Supabase environment variables not set
  - Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured
  - Service-role key must be set for server-side operations
  - Reference: [Supabase client setup:1-23](file://lib/supabase.js#L1-L23)
- Login fails with invalid credentials
  - Verify user exists and is active; ensure password hashing matches
  - Reference: [Login route:1-31](file://pages/api/auth/login.js#L1-L31), [Auth helpers:1-47](file://lib/auth.js#L1-L47)
- Stripe Checkout redirect not working
  - Confirm STRIPE_SECRET_KEY is set and valid
  - Ensure success_url and cancel_url are correctly configured
  - Reference: [Stripe client:1-6](file://lib/stripe.js#L1-L6), [Purchase route:47-76](file://pages/api/tickets/purchase.js#L47-L76)
- Images not loading
  - Add hostnames to next.config.js remotePatterns
  - Reference: [Next config:4-10](file://next.config.js#L4-L10)
- Deployment header errors
  - Review vercel.json headers for API routes
  - Reference: [Vercel config:7-16](file://vercel.json#L7-L16)

**Section sources**
- [lib/supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [pages/api/auth/login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [lib/auth.js:1-47](file://lib/auth.js#L1-L47)
- [lib/stripe.js:1-6](file://lib/stripe.js#L1-L6)
- [pages/api/tickets/purchase.js:47-76](file://pages/api/tickets/purchase.js#L47-L76)
- [next.config.js:4-10](file://next.config.js#L4-L10)
- [vercel.json:7-16](file://vercel.json#L7-L16)

## Conclusion
TicketFlow provides a modern, secure ticketing platform built with Next.js, Supabase, and Stripe. The FAQ above addresses typical setup, usage, customization, deployment, and operational concerns. For advanced scenarios, consult the referenced source files and adjust configurations accordingly.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Setup and Installation
- Install dependencies and run development server
  - Reference: [Scripts:5-9](file://package.json#L5-L9)
- Configure environment variables
  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
  - Reference: [Supabase client:3-8](file://lib/supabase.js#L3-L8), [Stripe client:3-5](file://lib/stripe.js#L3-L5)
- Initialize database schema
  - Run SQL in Supabase editor
  - Reference: [Schema:1-166](file://supabase/schema.sql#L1-L166)

**Section sources**
- [package.json:5-9](file://package.json#L5-L9)
- [lib/supabase.js:3-8](file://lib/supabase.js#L3-L8)
- [lib/stripe.js:3-5](file://lib/stripe.js#L3-L5)
- [supabase/schema.sql:1-166](file://supabase/schema.sql#L1-L166)

### Feature Usage
- Browse and purchase tickets
  - Reference: [Event page flow:185-238](file://pages/events/[slug].js#L185-L238)
- Admin dashboard and reports
  - Reference: [Admin index:1-585](file://pages/admin/index.js#L1-L585)
- Gate check-in
  - Reference: [Check-in page:1-800](file://pages/checkin/[eventId].js#L1-L800)

**Section sources**
- [pages/events/[slug].js](file://pages/events/[slug].js#L185-L238)
- [pages/admin/index.js:1-585](file://pages/admin/index.js#L1-L585)
- [pages/checkin/[eventId].js](file://pages/checkin/[eventId].js#L1-L800)

### Customization Options
- Themes and branding
  - Reference: [Layout themes:5-11](file://components/Layout.js#L5-L11)
- Image domains and security headers
  - Reference: [Next config:4-10](file://next.config.js#L4-L10), [Vercel headers:7-16](file://vercel.json#L7-L16)

**Section sources**
- [components/Layout.js:5-11](file://components/Layout.js#L5-L11)
- [next.config.js:4-10](file://next.config.js#L4-L10)
- [vercel.json:7-16](file://vercel.json#L7-L16)

### Deployment Procedures
- Deploy to Vercel
  - Framework detection and build commands
  - Reference: [Vercel config:1-6](file://vercel.json#L1-L6)
- Environment variables on Vercel
  - Set all required env vars in project settings

**Section sources**
- [vercel.json:1-6](file://vercel.json#L1-L6)

### Best Practices
- Always use service-role client on server-side API routes
- Enforce input validation and availability checks before creating tickets
- Store secrets securely and never commit .env files
- Enable Row-Level Security and review policies regularly

[No sources needed since this section provides general guidance]

### Known Limitations
- Non-Stripe payment methods currently create tickets immediately without external verification
- Promo code validation is basic; consider adding stricter constraints
- Live visitor count is simulated; replace with analytics integration for production

[No sources needed since this section provides general guidance]

### External Resources and Support
- Supabase documentation: https://supabase.com/docs
- Stripe documentation: https://stripe.com/docs
- Next.js documentation: https://nextjs.org/docs
- Community support channels: Refer to repository README or organization site for links

[No sources needed since this section provides general guidance]