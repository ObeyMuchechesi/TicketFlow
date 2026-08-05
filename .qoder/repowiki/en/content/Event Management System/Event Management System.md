# Event Management System

<cite>
**Referenced Files in This Document**
- [schema.sql](file://supabase/schema.sql)
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [admin/events/index.js](file://pages/admin/events/index.js)
- [admin/events/new.js](file://pages/admin/events/new.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [checkin/[eventId].js](file://pages/checkin/[eventId].js)
- [supabase.js](file://lib/supabase.js)
- [auth.js](file://lib/auth.js)
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

## Introduction
This document explains the Event Management System sub-feature, focusing on how events are created, edited, and managed through their lifecycle (draft → published → sold_out → completed → cancelled). It covers the data model for events and ticket types, capacity management, pricing controls, inventory tracking, and availability enforcement. It also documents the admin interface components and API endpoints used to perform CRUD operations, handle forms, validate inputs, and manage status transitions.

## Project Structure
The Event Management System spans:
- Database schema defining events, ticket types, tickets, payments, promo codes, and check-ins
- Admin UI pages for listing, creating, editing, and managing event details
- API routes for event CRUD, ticket type management, and ticket purchase flows
- Check-in flow that updates attendance and supports gate operations

```mermaid
graph TB
subgraph "Admin UI"
A["Admin Events List<br/>pages/admin/events/index.js"]
B["New Event Wizard<br/>pages/admin/events/new.js"]
C["Event Detail & Status<br/>pages/admin/events/[id].js"]
end
subgraph "API Routes"
D["Events API<br/>pages/api/events/index.js"]
E["Event by ID API<br/>pages/api/events/[id].js"]
F["Ticket Types API<br/>pages/api/ticket-types/index.js"]
G["Ticket Purchase API<br/>pages/api/tickets/purchase.js"]
end
subgraph "Check-in"
H["Gate Scanner UI<br/>pages/checkin/[eventId].js"]
end
subgraph "Data Layer"
I["Supabase Client<br/>lib/supabase.js"]
J["Auth Helpers<br/>lib/auth.js"]
K["Database Schema<br/>supabase/schema.sql"]
end
A --> D
B --> D
B --> F
C --> E
C --> D
H --> G
D --> I
E --> I
F --> I
G --> I
D --> J
E --> J
F --> J
G --> I
I --> K
```

**Diagram sources**
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [admin/events/index.js](file://pages/admin/events/index.js)
- [admin/events/new.js](file://pages/admin/events/new.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [checkin/[eventId].js](file://pages/checkin/[eventId].js)
- [supabase.js](file://lib/supabase.js)
- [auth.js](file://lib/auth.js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [schema.sql](file://supabase/schema.sql)
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [admin/events/index.js](file://pages/admin/events/index.js)
- [admin/events/new.js](file://pages/admin/events/new.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [checkin/[eventId].js](file://pages/checkin/[eventId].js)
- [supabase.js](file://lib/supabase.js)
- [auth.js](file://lib/auth.js)

## Core Components
- Data Model:
  - events: core event metadata, capacity, and status
  - ticket_types: per-event ticket tiers with price and quantity tracking
  - tickets: individual ticket records with QR token and status
  - payments: payment records linked to tickets
  - promo_codes: discount codes scoped to events
  - check_ins: gate entry logs
- Admin Interfaces:
  - Events list page
  - New event wizard with multi-step form and autosave
  - Event detail page with tabs for overview, ticket types, and attendees
- APIs:
  - Event CRUD endpoints
  - Ticket type CRUD endpoints
  - Ticket purchase endpoint enforcing availability and applying promos
- Gate/Check-in:
  - Real-time scanning and manual search for attendee verification

**Section sources**
- [schema.sql](file://supabase/schema.sql)
- [admin/events/index.js](file://pages/admin/events/index.js)
- [admin/events/new.js](file://pages/admin/events/new.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [checkin/[eventId].js](file://pages/checkin/[eventId].js)

## Architecture Overview
The system follows a Next.js serverless API pattern backed by Supabase. Admin UI pages call API routes which enforce role-based access and interact with Supabase using a service role client. The database enforces constraints and RLS policies for public read access to published events and related ticket types.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant API as "Next.js API"
participant Auth as "Auth Helper"
participant DB as "Supabase Service Client"
participant Schema as "DB Schema"
Admin->>API : POST /api/events (create)
API->>Auth : requireRole(super_admin|organiser)
Auth-->>API : user context
API->>DB : insert events
DB-->>API : created event
API-->>Admin : {event}
Admin->>API : POST /api/ticket-types (create tiers)
API->>DB : insert ticket_types
DB-->>API : created tier
API-->>Admin : {ticketType}
Admin->>API : PUT /api/events/ : id (status update)
API->>DB : update events.status
DB-->>API : updated event
API-->>Admin : {event}
```

**Diagram sources**
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)
- [schema.sql](file://supabase/schema.sql)

## Detailed Component Analysis

### Data Model and Relationships
The schema defines the following key entities and relationships:
- events: id, organiser_id, event_name, slug, date, time, venue, description, poster_image, performer_images, theme_color, capacity, status
- ticket_types: id, event_id (FK), name, price, quantity_available, quantity_sold, color
- tickets: id, event_id (FK), ticket_type_id (FK), buyer info, qr_code_token, is_checked_in, checked_in_at, purchase_date, status
- payments: id, ticket_id (FK), amount, currency, payment_method, transaction_ref, status, paid_at
- promo_codes: id, event_id (FK), code, discount_percent, max_uses, times_used, expires_at, is_active
- check_ins: id, ticket_id (FK), event_id (FK), staff_id, scanned_at, method, device_info

Relationships:
- One event has many ticket types
- One ticket type belongs to one event
- One event has many tickets
- One ticket belongs to one ticket type and one event
- Payments link to tickets
- Promo codes scope to events
- Check-ins link tickets and events

```mermaid
erDiagram
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
CHECK_INS {
uuid id PK
uuid ticket_id FK
uuid event_id FK
uuid staff_id FK
timestamptz scanned_at
text method
text device_info
}
EVENTS ||--o{ TICKET_TYPES : "has many"
EVENTS ||--o{ TICKETS : "has many"
TICKET_TYPES ||--o{ TICKETS : "has many"
TICKETS ||--o{ PAYMENTS : "has many"
EVENTS ||--o{ PROMO_CODES : "has many"
EVENTS ||--o{ CHECK_INS : "has many"
TICKETS ||--o{ CHECK_INS : "has many"
```

**Diagram sources**
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [schema.sql](file://supabase/schema.sql)

### Event Creation Workflow (Wizard)
The new event wizard collects basic info, branding, ticket types, venue, schedule, payments, and publish settings. It validates step-by-step, autosaves to localStorage, creates the event via API, then creates associated ticket types.

Key behaviors:
- Auto-generates slug from event name
- Validates required fields per step
- Persists draft state locally
- Submits event creation and multiple ticket type creations concurrently
- Redirects to event detail after success

```mermaid
flowchart TD
Start(["Open New Event"]) --> Step0["Basic Info<br/>Name, Slug, Date, Venue"]
Step0 --> Validate0{"Valid?"}
Validate0 --> |No| ShowErr0["Show errors"]
Validate0 --> |Yes| Step1["Branding<br/>Poster, Theme, Capacity"]
Step1 --> Validate1{"Valid?"}
Validate1 --> |No| ShowErr1["Show errors"]
Validate1 --> |Yes| Step2["Ticket Types<br/>Add at least 1 complete tier"]
Step2 --> Validate2{"At least 1 valid tier?"}
Validate2 --> |No| ShowErr2["Show error"]
Validate2 --> |Yes| Step3["Venue Details"]
Step3 --> Step4["Schedule"]
Step4 --> Step5["Payments Settings"]
Step5 --> Step6["Publish/Draft"]
Step6 --> Submit["POST /api/events"]
Submit --> CreateTT["POST /api/ticket-types (batch)"]
CreateTT --> Done(["Redirect to Event Detail"])
```

**Diagram sources**
- [admin/events/new.js](file://pages/admin/events/new.js)
- [events/index.js](file://pages/api/events/index.js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)

**Section sources**
- [admin/events/new.js](file://pages/admin/events/new.js)
- [events/index.js](file://pages/api/events/index.js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)

### Event Editing and Status Transitions
The event detail page allows updating the event’s status directly from a dropdown. The API route accepts PUT requests to update event fields, including status.

Status values enforced by schema:
- draft
- published
- sold_out
- completed
- cancelled

```mermaid
sequenceDiagram
participant UI as "Event Detail UI"
participant API as "PUT /api/events/ : id"
participant DB as "Supabase"
UI->>API : { status }
API->>DB : UPDATE events SET status = ? WHERE id = ?
DB-->>API : Updated event
API-->>UI : { event }
UI-->>UI : Refresh stats and tabs
```

**Diagram sources**
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [events/[id].js](file://pages/api/events/[id].js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [events/[id].js](file://pages/api/events/[id].js)
- [schema.sql](file://supabase/schema.sql)

### Ticket Type Configuration and Inventory Tracking
Ticket types are created per event with name, price, and available quantity. The purchase flow checks remaining availability before issuing tickets and increments quantity_sold accordingly.

Key points:
- Each ticket type tracks quantity_available and quantity_sold
- Availability is enforced at purchase time
- Revenue per tier is computed from quantity_sold × price
- Admin UI shows progress bars and revenue summaries

```mermaid
classDiagram
class TicketType {
+uuid id
+uuid event_id
+string name
+decimal price
+int quantity_available
+int quantity_sold
+string color
}
class Event {
+uuid id
+string event_name
+int capacity
+string status
}
class Ticket {
+uuid id
+uuid event_id
+uuid ticket_type_id
+string qr_code_token
+boolean is_checked_in
+string status
}
Event "1" --> "many" TicketType : "owns"
Event "1" --> "many" Ticket : "has"
TicketType "1" --> "many" Ticket : "issues"
```

**Diagram sources**
- [schema.sql](file://supabase/schema.sql)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)

**Section sources**
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [schema.sql](file://supabase/schema.sql)

### Capacity Management and Sold-Out Logic
Capacity is stored at the event level. While ticket types track per-tier availability, overall capacity can be used for display and gating logic. The admin UI computes total available across all ticket types and shows sold vs available counts.

Operational notes:
- Total sold is sum of quantity_sold across ticket types
- Available = total quantity_available - total sold
- When total sold reaches total capacity, set status to sold_out
- Public listing only includes published events

```mermaid
flowchart TD
Start(["Monitor Sales"]) --> ComputeSold["Sum quantity_sold across ticket types"]
ComputeSold --> CompareCap{"sold >= capacity?"}
CompareCap --> |Yes| SetSoldOut["Set event.status = 'sold_out'"]
CompareCap --> |No| KeepStatus["Keep current status"]
SetSoldOut --> End(["Update UI & Listings"])
KeepStatus --> End
```

**Diagram sources**
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [schema.sql](file://supabase/schema.sql)

### Pricing Controls and Promotions
Pricing is defined per ticket type. Promo codes can apply percentage discounts during purchase. The purchase flow applies active promo codes if within usage limits and expiration.

Key behaviors:
- Unit price comes from ticket type
- Discount applied as percentage reduction
- Promo code usage incremented atomically
- Payment recorded with final amount

```mermaid
sequenceDiagram
participant Buyer as "Buyer"
participant API as "POST /api/tickets/purchase"
participant DB as "Supabase"
participant Stripe as "Stripe (optional)"
Buyer->>API : { eventId, ticketTypeId, quantity, buyerInfo, paymentMethod, promoCode? }
API->>DB : SELECT ticket_types WHERE id=? AND event_id=?
DB-->>API : ticket type + availability
API->>DB : SELECT promo_codes WHERE event_id=? AND code=? AND active
DB-->>API : promo (if any)
alt paymentMethod == stripe
API->>Stripe : create checkout session with discounted unit price
Stripe-->>API : checkoutUrl
API-->>Buyer : { checkoutUrl }
else other methods
API->>DB : INSERT tickets (one per quantity)
API->>DB : UPDATE ticket_types.quantity_sold += quantity
API->>DB : INSERT payments
API-->>Buyer : { success, tokens }
end
```

**Diagram sources**
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [schema.sql](file://supabase/schema.sql)

### Admin Interface Components
- Events List: Displays cards with event name, date, status badge, tickets sold, and checked-in count. Click navigates to detail.
- New Event Wizard: Multi-step form with validation, autosave, and concurrent creation of event and ticket types.
- Event Detail: Tabs for overview, ticket types, and attendees; inline status update; capacity and revenue metrics.

```mermaid
graph LR
L["Events List<br/>cards + status badges"] --> D["Event Detail<br/>tabs + status select"]
D --> T["Ticket Types Tab<br/>progress bars + revenue"]
D --> A["Attendees Tab<br/>searchable table"]
N["New Event Wizard<br/>steps + validation"] --> D
```

**Diagram sources**
- [admin/events/index.js](file://pages/admin/events/index.js)
- [admin/events/new.js](file://pages/admin/events/new.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)

**Section sources**
- [admin/events/index.js](file://pages/admin/events/index.js)
- [admin/events/new.js](file://pages/admin/events/new.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)

### API Endpoints Summary
- GET /api/events: Lists published events with ticket types
- POST /api/events: Creates an event (requires super_admin or organiser)
- GET /api/events/:id: Fetches event with ticket types
- PUT /api/events/:id: Updates event fields including status
- DELETE /api/events/:id: Deletes an event
- POST /api/ticket-types: Creates a ticket type for an event
- PUT /api/ticket-types: Updates a ticket type
- DELETE /api/ticket-types: Deletes a ticket type
- POST /api/tickets/purchase: Purchases tickets, enforces availability, applies promos

All protected endpoints use role-based authorization helpers.

**Section sources**
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [auth.js](file://lib/auth.js)

### Check-In Flow and Attendance Tracking
The check-in interface supports QR scanning and manual search. Scanning triggers verification against tickets and updates check-in status and logs.

```mermaid
sequenceDiagram
participant Gate as "Gate Staff UI"
participant API as "POST /api/checkin/scan"
participant DB as "Supabase"
Gate->>API : { token, eventId }
API->>DB : Find ticket by qr_code_token and event_id
DB-->>API : ticket record
alt ticket valid and not checked in
API->>DB : Update tickets.is_checked_in = true, checked_in_at
API->>DB : Insert check_ins record
API-->>Gate : { SUCCESS, ticket details }
else invalid or already used
API-->>Gate : { INVALID/ALREADY_USED, reason }
end
```

**Diagram sources**
- [checkin/[eventId].js](file://pages/checkin/[eventId].js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [checkin/[eventId].js](file://pages/checkin/[eventId].js)
- [schema.sql](file://supabase/schema.sql)

## Dependency Analysis
- UI components depend on API routes for data and mutations
- API routes depend on Supabase client and auth helpers
- Database schema enforces referential integrity and constraints
- Public read policies allow unauthenticated access to published events and their ticket types

```mermaid
graph TB
UI_Admin["Admin UI Pages"] --> API_Events["/api/events/*"]
UI_Admin --> API_TTypes["/api/ticket-types/*"]
UI_Checkin["Checkin UI"] --> API_Purchase["/api/tickets/purchase"]
API_Events --> Supabase["Supabase Service Client"]
API_TTypes --> Supabase
API_Purchase --> Supabase
Supabase --> Schema["DB Schema"]
API_Events --> Auth["requireRole"]
API_TTypes --> Auth
```

**Diagram sources**
- [admin/events/index.js](file://pages/admin/events/index.js)
- [admin/events/new.js](file://pages/admin/events/new.js)
- [admin/events/[id].js](file://pages/admin/events/[id].js)
- [checkin/[eventId].js](file://pages/checkin/[eventId].js)
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [supabase.js](file://lib/supabase.js)
- [auth.js](file://lib/auth.js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [supabase.js](file://lib/supabase.js)
- [auth.js](file://lib/auth.js)
- [schema.sql](file://supabase/schema.sql)

## Performance Considerations
- Use batched ticket type creation to reduce round trips during event setup
- Avoid heavy client-side computations; rely on server-side queries for aggregated stats
- Leverage indexes defined in schema for fast lookups (slug, status, qr_code_token, email, event_id)
- For high-volume check-in, consider server-side rate limiting and connection pooling
- Cache static event listings where appropriate to reduce repeated queries

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing required fields on event creation: Ensure event_name, slug, date, and venue are provided
- Insufficient permissions: Verify user role and session cookie presence
- Ticket availability errors: Confirm quantity_available exceeds requested quantity
- Promo code not applied: Check code case, event scoping, active flag, and expiration
- Check-in failures: Validate token exists for the event and ticket is not already used

Relevant files:
- Validation and error handling in event creation and ticket purchases
- Role checks in API routes
- Database constraints and policies

**Section sources**
- [events/index.js](file://pages/api/events/index.js)
- [events/[id].js](file://pages/api/events/[id].js)
- [ticket-types/index.js](file://pages/api/ticket-types/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [auth.js](file://lib/auth.js)
- [schema.sql](file://supabase/schema.sql)

## Conclusion
The Event Management System provides a robust foundation for organizing events, configuring ticket types, managing capacity and pricing, and controlling availability throughout the event lifecycle. The admin interface streamlines creation and editing workflows, while APIs enforce security and business rules. The check-in flow ensures accurate attendance tracking. Together, these components deliver a cohesive solution for event organizers and gate staff.

[No sources needed since this section summarizes without analyzing specific files]