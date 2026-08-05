# Ticket Type Management

<cite>
**Referenced Files in This Document**
- [schema.sql](file://supabase/schema.sql)
- [index.js](file://pages/api/ticket-types/index.js)
- [new.js](file://pages/admin/events/new.js)
- [id.js](file://pages/admin/events/[id].js)
- [index.js](file://pages/api/events/index.js)
- [id.js](file://pages/api/events/[id].js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [scan.js](file://pages/api/checkin/scan.js)
- [token.js](file://pages/ticket/[token].js)
- [slug.js](file://pages/events/[slug].js)
- [supabase.js](file://lib/supabase.js)
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
This document explains how ticket types are managed within event configuration in the system. It covers the data model for ticket types (pricing, capacity limits, and related fields), the UI flows for adding/editing/removing ticket types, validation rules, pricing calculations, inventory management, and relationships to sales tracking and check-in processes. It also provides guidance for common scenarios such as tiered pricing, limited availability, and configuring sale periods.

## Project Structure
The ticket type feature spans database schema definitions, API routes for CRUD operations, admin UI for creation and editing, public event pages for selection and purchase, and gate check-in flows. The key areas include:
- Database schema defining events, ticket_types, tickets, payments, and check-ins
- Admin APIs for creating/updating/deleting ticket types
- Admin UI wizard for creating events with multiple ticket types
- Public event page for selecting ticket types and purchasing
- Check-in API for validating and marking tickets used

```mermaid
graph TB
subgraph "Admin"
A1["Admin Event Detail<br/>[id].js"]
A2["New Event Wizard<br/>new.js"]
end
subgraph "APIs"
B1["Ticket Types API<br/>ticket-types/index.js"]
B2["Events API<br/>events/index.js"]
B3["Event by ID API<br/>events/[id].js"]
B4["Purchase API<br/>tickets/purchase.js"]
B5["Check-in Scan API<br/>checkin/scan.js"]
end
subgraph "Public"
C1["Event Page<br/>events/[slug].js"]
C2["Ticket View<br/>ticket/[token].js"]
end
subgraph "Data"
D1["Supabase Schema<br/>schema.sql"]
D2["Supabase Client<br/>lib/supabase.js"]
end
A2 --> B2
A2 --> B1
A1 --> B3
C1 --> B4
C2 --> D1
B1 --> D1
B2 --> D1
B3 --> D1
B4 --> D1
B5 --> D1
B1 --> D2
B2 --> D2
B3 --> D2
B4 --> D2
B5 --> D2
```

**Diagram sources**
- [new.js](file://pages/admin/events/new.js)
- [id.js](file://pages/admin/events/[id].js)
- [index.js](file://pages/api/ticket-types/index.js)
- [index.js](file://pages/api/events/index.js)
- [id.js](file://pages/api/events/[id].js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [scan.js](file://pages/api/checkin/scan.js)
- [slug.js](file://pages/events/[slug].js)
- [token.js](file://pages/ticket/[token].js)
- [schema.sql](file://supabase/schema.sql)
- [supabase.js](file://lib/supabase.js)

**Section sources**
- [schema.sql](file://supabase/schema.sql)
- [index.js](file://pages/api/ticket-types/index.js)
- [new.js](file://pages/admin/events/new.js)
- [id.js](file://pages/admin/events/[id].js)
- [index.js](file://pages/api/events/index.js)
- [id.js](file://pages/api/events/[id].js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [scan.js](file://pages/api/checkin/scan.js)
- [token.js](file://pages/ticket/[token].js)
- [slug.js](file://pages/events/[slug].js)
- [supabase.js](file://lib/supabase.js)

## Core Components
- Data Model:
  - Events table stores event metadata including capacity and status.
  - Ticket Types table defines per-event ticket tiers with price, quantity_available, quantity_sold, and color.
  - Tickets table records individual tickets linked to a ticket type and event, with QR token and check-in state.
  - Payments and check_ins tables record transactions and entry events.
- Admin APIs:
  - Ticket Types API supports POST (create), PUT (update), DELETE (remove) with role checks.
  - Events APIs support listing published events with ticket types and fetching an event by ID with nested ticket types.
- Admin UI:
  - New Event wizard allows adding multiple ticket types with name, price, quantity, and color; validates at least one complete ticket type before submission.
  - Event detail view shows ticket type cards with sold counts, revenue, and progress bars.
- Purchase Flow:
  - Validates ticket type existence and remaining capacity, applies promo discounts, creates Stripe checkout or immediate tickets depending on payment method, and increments quantity_sold.
- Check-in Flow:
  - Validates ticket token, prevents double-check-in, updates ticket status to used, and logs a check-in record.

**Section sources**
- [schema.sql](file://supabase/schema.sql)
- [index.js](file://pages/api/ticket-types/index.js)
- [new.js](file://pages/admin/events/new.js)
- [id.js](file://pages/admin/events/[id].js)
- [index.js](file://pages/api/events/index.js)
- [id.js](file://pages/api/events/[id].js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [scan.js](file://pages/api/checkin/scan.js)

## Architecture Overview
The ticket type management architecture integrates admin workflows, public purchase flows, and gate operations through serverless API routes backed by Supabase.

```mermaid
sequenceDiagram
participant AdminUI as "Admin UI<br/>new.js / [id].js"
participant EventsAPI as "Events API<br/>events/index.js / [id].js"
participant TicketTypesAPI as "Ticket Types API<br/>ticket-types/index.js"
participant PurchaseAPI as "Purchase API<br/>tickets/purchase.js"
participant CheckinAPI as "Check-in API<br/>checkin/scan.js"
participant DB as "Supabase<br/>schema.sql"
AdminUI->>EventsAPI : Create event (POST)
EventsAPI-->>DB : Insert event
AdminUI->>TicketTypesAPI : Create ticket types (POST)
TicketTypesAPI-->>DB : Insert ticket_types
AdminUI->>EventsAPI : Fetch event by ID (GET)
EventsAPI-->>DB : Select event + ticket_types
AdminUI-->>AdminUI : Render overview & tickets tab
participant PublicUI as "Public UI<br/>events/[slug].js"
PublicUI->>PurchaseAPI : Purchase tickets (POST)
PurchaseAPI-->>DB : Validate ticket type & availability
PurchaseAPI-->>DB : Create tickets & increment quantity_sold
PurchaseAPI-->>PublicUI : Return checkout URL or tokens
participant GateUI as "Gate UI<br/>checkin/[eventId].js"
GateUI->>CheckinAPI : Scan ticket (POST)
CheckinAPI-->>DB : Validate ticket, update status, log check-in
CheckinAPI-->>GateUI : Result (success/error)
```

**Diagram sources**
- [new.js](file://pages/admin/events/new.js)
- [id.js](file://pages/admin/events/[id].js)
- [index.js](file://pages/api/events/index.js)
- [id.js](file://pages/api/events/[id].js)
- [index.js](file://pages/api/ticket-types/index.js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [scan.js](file://pages/api/checkin/scan.js)
- [slug.js](file://pages/events/[slug].js)
- [schema.sql](file://supabase/schema.sql)

## Detailed Component Analysis

### Data Model: Ticket Types and Related Entities
- Events:
  - Fields include id, organiser_id, event_name, slug, date, time, venue, description, poster_image, performer_images, theme_color, capacity, status, created_at.
- Ticket Types:
  - Fields include id, event_id (FK to events), name, price, quantity_available, quantity_sold, color, created_at.
- Tickets:
  - Fields include id, event_id (FK to events), ticket_type_id (FK to ticket_types), buyer_name, buyer_email, buyer_phone, qr_code_token (unique), is_checked_in, checked_in_at, checked_in_by, purchase_date, status.
- Payments:
  - Fields include id, ticket_id (FK to tickets), amount, currency, payment_method, transaction_ref, status, paid_at.
- Check-ins:
  - Fields include id, ticket_id (FK to tickets), event_id (FK to events), staff_id (FK to users), scanned_at, method, device_info.

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
TICKET_TYPES ||--o{ TICKETS : "referenced by"
TICKETS ||--o{ PAYMENTS : "has many"
TICKETS ||--o{ CHECK_INS : "has many"
```

**Diagram sources**
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [schema.sql](file://supabase/schema.sql)

### Admin API: Ticket Types CRUD
- POST /api/ticket-types:
  - Requires role super_admin or organiser.
  - Validates required fields: event_id, name, price, quantity_available.
  - Inserts ticket_type with default quantity_sold=0 and optional color.
- PUT /api/ticket-types:
  - Requires role super_admin or organiser.
  - Updates ticket_type by id and returns updated record.
- DELETE /api/ticket-types:
  - Requires role super_admin or organiser.
  - Deletes ticket_type by id.

```mermaid
flowchart TD
Start(["Request Received"]) --> Method{"Method?"}
Method --> |POST| ValidatePost["Validate required fields<br/>event_id, name, price, quantity_available"]
ValidatePost --> ValidPost{"Valid?"}
ValidPost --> |No| Error400["Return 400 Missing fields"]
ValidPost --> |Yes| InsertTT["Insert ticket_types row<br/>set quantity_sold=0, color default"]
InsertTT --> PostSuccess["Return 201 with ticketType"]
Method --> |PUT| ValidatePut["Validate id present"]
ValidatePut --> ValidPut{"Valid?"}
ValidPut --> |No| Error400B["Return 400 Missing id"]
ValidPut --> |Yes| UpdateTT["Update ticket_types by id"]
UpdateTT --> PutSuccess["Return 200 with updated ticketType"]
Method --> |DELETE| ValidateDel["Validate id present"]
ValidateDel --> ValidDel{"Valid?"}
ValidDel --> |No| Error400C["Return 400 Missing id"]
ValidDel --> |Yes| DeleteTT["Delete ticket_types by id"]
DeleteTT --> DelSuccess["Return 200 success"]
Method --> |Other| MethodNotAllowed["Return 405"]
```

**Diagram sources**
- [index.js](file://pages/api/ticket-types/index.js)

**Section sources**
- [index.js](file://pages/api/ticket-types/index.js)

### Admin UI: Creating and Managing Ticket Types
- New Event Wizard:
  - Step 2 (Tickets) allows adding multiple ticket types with name, price, quantity, and color.
  - Validation ensures at least one complete ticket type (name, price >= 0, quantity > 0).
  - On submit, creates event first, then posts each valid ticket type to /api/ticket-types.
- Event Detail:
  - Displays ticket types with sold counts, revenue, and progress bars.
  - Provides link to edit event where ticket types can be managed.

```mermaid
sequenceDiagram
participant Admin as "Admin UI<br/>new.js"
participant EventsAPI as "Events API<br/>events/index.js"
participant TicketTypesAPI as "Ticket Types API<br/>ticket-types/index.js"
participant DB as "Supabase"
Admin->>Admin : Validate step (at least one complete ticket type)
Admin->>EventsAPI : POST create event
EventsAPI-->>DB : Insert event
EventsAPI-->>Admin : Return event.id
loop For each ticket type
Admin->>TicketTypesAPI : POST create ticket type
TicketTypesAPI-->>DB : Insert ticket_types
TicketTypesAPI-->>Admin : Return ticketType
end
Admin-->>Admin : Redirect to event detail
```

**Diagram sources**
- [new.js](file://pages/admin/events/new.js)
- [index.js](file://pages/api/events/index.js)
- [index.js](file://pages/api/ticket-types/index.js)

**Section sources**
- [new.js](file://pages/admin/events/new.js)
- [id.js](file://pages/admin/events/[id].js)

### Public Event Page: Selecting and Purchasing Ticket Types
- Event page displays available ticket types with prices and remaining quantities.
- User selects a ticket type, sets quantity, optionally applies promo code, and proceeds to purchase.
- Purchase flow validates availability, calculates discounted price, and either redirects to Stripe checkout or creates tickets immediately for other payment methods.

```mermaid
sequenceDiagram
participant Public as "Public UI<br/>events/[slug].js"
participant PurchaseAPI as "Purchase API<br/>tickets/purchase.js"
participant DB as "Supabase"
Public->>PurchaseAPI : POST purchase (eventId, ticketTypeId, quantity, buyer info, paymentMethod, promoCode)
PurchaseAPI->>DB : Select ticket_type by id and event_id
PurchaseAPI->>PurchaseAPI : Compute remaining = quantity_available - quantity_sold
alt Remaining < quantity
PurchaseAPI-->>Public : 400 error insufficient stock
else Promo code provided
PurchaseAPI->>DB : Validate promo code (active, not expired, max_uses)
PurchaseAPI->>DB : Increment times_used if valid
end
alt Payment method is stripe
PurchaseAPI->>PurchaseAPI : Create Stripe Checkout session with line items
PurchaseAPI-->>Public : Return checkoutUrl
else Other payment methods
PurchaseAPI->>DB : Insert tickets (one per quantity)
PurchaseAPI->>DB : Update ticket_types.quantity_sold += quantity
PurchaseAPI->>DB : Insert payment record
PurchaseAPI-->>Public : Return success with tokens
end
```

**Diagram sources**
- [slug.js](file://pages/events/[slug].js)
- [purchase.js](file://pages/api/tickets/purchase.js)

**Section sources**
- [slug.js](file://pages/events/[slug].js)
- [purchase.js](file://pages/api/tickets/purchase.js)

### Check-in Process: Validating and Marking Tickets Used
- Gate UI scans or searches for tickets and calls check-in API.
- Check-in API validates ticket token, ensures it belongs to the event, checks status (not cancelled/refunded), and prevents duplicate check-ins.
- On success, updates ticket status to used, records checked_in_at and staff, and inserts a check-in record.

```mermaid
sequenceDiagram
participant Gate as "Gate UI<br/>checkin/[eventId].js"
participant CheckinAPI as "Check-in API<br/>checkin/scan.js"
participant DB as "Supabase"
Gate->>CheckinAPI : POST scan (token, eventId, method, deviceInfo)
CheckinAPI->>DB : Select ticket by qr_code_token and event_id
alt Ticket not found
CheckinAPI-->>Gate : INVALID
else Status cancelled/refunded
CheckinAPI-->>Gate : CANCELLED/REFUNDED
else Already checked in
CheckinAPI-->>Gate : ALREADY_USED with last check-in time
else Valid
CheckinAPI->>DB : Update ticket (is_checked_in=true, status='used', checked_in_at, checked_in_by)
CheckinAPI->>DB : Insert check_ins record
CheckinAPI-->>Gate : SUCCESS with ticket details
end
```

**Diagram sources**
- [scan.js](file://pages/api/checkin/scan.js)

**Section sources**
- [scan.js](file://pages/api/checkin/scan.js)

### Ticket View: Displaying Ticket Details
- Ticket page loads ticket by token, fetches associated event and ticket type details, and renders QR code, barcode-like lines, and ticket information.
- Shows status (active/used), price, and actions like copy link, print, and share.

```mermaid
sequenceDiagram
participant Browser as "Browser<br/>ticket/[token].js"
participant Server as "Server Props<br/>getServerSideProps"
participant DB as "Supabase"
Browser->>Server : Request ticket page with token
Server->>DB : Select ticket by qr_code_token
Server->>DB : Select event by event_id
Server->>DB : Select ticket_type by ticket_type_id
Server-->>Browser : Props {ticket, event, ticketType}
Browser-->>Browser : Render ticket card with QR and details
```

**Diagram sources**
- [token.js](file://pages/ticket/[token].js)

**Section sources**
- [token.js](file://pages/ticket/[token].js)

## Dependency Analysis
- Role-based access control:
  - Ticket Types API requires super_admin or organiser roles for mutations.
  - Check-in API requires super_admin, organiser, or gate_staff roles.
- Data integrity:
  - Foreign keys enforce relationships between events, ticket_types, tickets, payments, and check-ins.
  - Unique constraints on qr_code_token prevent duplicate tickets.
- Availability enforcement:
  - Purchase API checks remaining capacity per ticket type before issuing tickets.
- Visibility:
  - Row-level security policies allow public read of published events and their ticket types.

```mermaid
graph LR
Admin["Admin Roles<br/>super_admin, organiser"] --> TT_API["Ticket Types API"]
Gate["Gate Staff<br/>gate_staff"] --> CheckinAPI["Check-in API"]
TT_API --> DB["Supabase Tables"]
CheckinAPI --> DB
PurchaseAPI["Purchase API"] --> DB
EventsAPI["Events API"] --> DB
Public["Public Read Policy"] --> DB
```

**Diagram sources**
- [index.js](file://pages/api/ticket-types/index.js)
- [scan.js](file://pages/api/checkin/scan.js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [index.js](file://pages/api/events/index.js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [index.js](file://pages/api/ticket-types/index.js)
- [scan.js](file://pages/api/checkin/scan.js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [index.js](file://pages/api/events/index.js)
- [schema.sql](file://supabase/schema.sql)

## Performance Considerations
- Use service role client for server-side operations to bypass RLS and ensure consistent writes.
- Batch insert tickets when possible to reduce round trips during purchase.
- Indexes on frequently queried columns (qr_code_token, event_id, buyer_email) improve lookup performance.
- Avoid excessive client-side re-renders in admin dashboards by debouncing search and limiting result sets.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Missing required fields:
  - Ensure event_id, name, price, and quantity_available are provided when creating ticket types.
- Insufficient stock:
  - Verify quantity_available vs quantity_sold; purchase will fail if remaining < requested quantity.
- Duplicate check-in:
  - If a ticket is already marked used, the check-in API returns ALREADY_USED with last check-in time.
- Invalid ticket token:
  - Confirm the token matches a ticket for the specified event; otherwise INVALID is returned.
- Promo code issues:
  - Validate that promo codes are active, not expired, and have remaining uses.

**Section sources**
- [index.js](file://pages/api/ticket-types/index.js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [scan.js](file://pages/api/checkin/scan.js)

## Conclusion
Ticket type management in this system is built around a clear data model, robust API endpoints with role-based access, and intuitive admin and public interfaces. Availability is enforced at purchase time, sales tracking is maintained via quantity_sold, and check-in processes ensure accurate entry logging. By following the documented flows and validations, organizers can configure tiered pricing, manage limited availability, and operate efficient gate check-ins.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Common Scenarios and Best Practices
- Tiered Pricing:
  - Define multiple ticket types per event (e.g., Early Bird, General Admission, VIP) with distinct prices and colors for visual differentiation.
- Limited Availability:
  - Set quantity_available per ticket type; the system enforces remaining stock during purchase.
- Sale Periods:
  - While explicit sale start/end dates are not modeled in ticket_types, you can control visibility by event status (draft/published/sold_out) and use promo codes to limit discount usage.
- Revenue Tracking:
  - Revenue per ticket type is computed as quantity_sold * price; displayed in admin event detail.
- Check-in Operations:
  - Use the gate UI to scan or search tickets; ensure staff roles are configured for scanning access.

**Section sources**
- [new.js](file://pages/admin/events/new.js)
- [id.js](file://pages/admin/events/[id].js)
- [purchase.js](file://pages/api/tickets/purchase.js)
- [scan.js](file://pages/api/checkin/scan.js)