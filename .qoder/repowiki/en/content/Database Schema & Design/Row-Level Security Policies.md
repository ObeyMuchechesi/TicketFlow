# Row-Level Security Policies

<cite>
**Referenced Files in This Document**
- [schema.sql](file://supabase/schema.sql)
- [supabase.js](file://lib/supabase.js)
- [auth.js](file://lib/auth.js)
- [login.js](file://pages/api/auth/login.js)
- [events/index.js](file://pages/api/events/index.js)
- [tickets/purchase.js](file://pages/api/tickets/purchase.js)
- [promo/validate.js](file://pages/api/promo/validate.js)
- [checkin/scan.js](file://pages/api/checkin/scan.js)
- [admin/staff.js](file://pages/api/admin/staff.js)
- [admin/stats.js](file://pages/api/admin/stats.js)
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
This document explains how Supabase Row-Level Security (RLS) is implemented and used within TicketFlow to protect sensitive data and enforce access control across roles: super_admin, organiser, and gate_staff. It details the RLS policies defined for each table, including public read access for published events and ticket types, and clarifies how the service role policy enables API routes to perform privileged operations securely. It also outlines best practices for implementing secure database access and shows how authentication and authorization flows interact with RLS.

## Project Structure
TicketFlow’s security model spans three layers:
- Database layer: RLS policies are declared in the schema definition.
- API layer: Next.js API routes use a service-role client to perform privileged operations after enforcing application-level authorization.
- Client layer: Public endpoints expose only what RLS allows (e.g., published events).

```mermaid
graph TB
subgraph "Client"
FE["Next.js Pages"]
end
subgraph "API Routes"
A1["/api/auth/login"]
A2["/api/events/index"]
A3["/api/tickets/purchase"]
A4["/api/promo/validate"]
A5["/api/checkin/scan"]
A6["/api/admin/staff"]
A7["/api/admin/stats"]
end
subgraph "Supabase"
DB["PostgreSQL with RLS"]
end
FE --> A1
FE --> A2
FE --> A3
FE --> A4
FE --> A5
FE --> A6
FE --> A7
A1 --> DB
A2 --> DB
A3 --> DB
A4 --> DB
A5 --> DB
A6 --> DB
A7 --> DB
```

**Section sources**
- [schema.sql:120-143](file://supabase/schema.sql#L120-L143)
- [supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [events/index.js:1-42](file://pages/api/events/index.js#L1-L42)
- [tickets/purchase.js:1-123](file://pages/api/tickets/purchase.js#L1-L123)
- [promo/validate.js:1-27](file://pages/api/promo/validate.js#L1-L27)
- [checkin/scan.js:1-44](file://pages/api/checkin/scan.js#L1-L44)
- [admin/staff.js:1-28](file://pages/api/admin/staff.js#L1-L28)
- [admin/stats.js:1-41](file://pages/api/admin/stats.js#L1-L41)

## Core Components
- RLS policies enable row-level access control at the database level. They restrict visibility and mutations based on conditions evaluated per row.
- Service role client bypasses RLS for trusted server-side operations executed by API routes.
- Application-level authorization enforces role-based access before invoking database operations.

Key implementation points:
- RLS is enabled for all core tables in the schema.
- Public read policies allow unauthenticated clients to view published events and their ticket types.
- API routes authenticate users via cookies and validate roles using a helper function.
- All database interactions from API routes use the service-role client to ensure consistent behavior independent of RLS.

**Section sources**
- [schema.sql:120-143](file://supabase/schema.sql#L120-L143)
- [supabase.js:15-23](file://lib/supabase.js#L15-L23)
- [auth.js:30-46](file://lib/auth.js#L30-L46)

## Architecture Overview
The system combines application-level authorization with database-level RLS:
- Unauthenticated requests rely on RLS to limit exposure to public data.
- Authenticated requests are validated against required roles in API routes.
- Privileged operations use the service-role client, which bypasses RLS but remains protected by application-level checks.

```mermaid
sequenceDiagram
participant C as "Client"
participant API as "Next.js API Route"
participant AUTH as "Authorization Helper"
participant SB as "Supabase Service Client"
participant DB as "PostgreSQL (RLS)"
C->>API : HTTP Request
API->>AUTH : requireRole(req, allowedRoles)
alt Unauthorized
AUTH-->>API : throw {status : 401/403}
API-->>C : Error Response
else Authorized
API->>SB : Query/Mutation (service role)
SB->>DB : Execute SQL
DB-->>SB : Result (RLS bypassed by service role)
SB-->>API : Data
API-->>C : Success Response
end
```

**Diagram sources**
- [supabase.js:15-23](file://lib/supabase.js#L15-L23)
- [auth.js:38-46](file://lib/auth.js#L38-L46)

**Section sources**
- [supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [auth.js:1-46](file://lib/auth.js#L1-L46)

## Detailed Component Analysis

### RLS Policy Definitions
- RLS is enabled for all tables: users, events, ticket_types, tickets, check_ins, payments, promo_codes.
- Public read policy for events: SELECT allowed when status equals 'published'.
- Public read policy for ticket_types: SELECT allowed when the associated event is published.
- A comment indicates that a service role policy grants full access to all tables for API routes; this is enforced by using the service-role client rather than explicit RLS policies.

```mermaid
flowchart TD
Start(["Enable RLS"]) --> EnableUsers["Enable RLS on users"]
EnableUsers --> EnableEvents["Enable RLS on events"]
EnableEvents --> EnableTicketTypes["Enable RLS on ticket_types"]
EnableTicketTypes --> EnableTickets["Enable RLS on tickets"]
EnableTickets --> EnableCheckIns["Enable RLS on check_ins"]
EnableCheckIns --> EnablePayments["Enable RLS on payments"]
EnablePayments --> EnablePromoCodes["Enable RLS on promo_codes"]
EnablePromoCodes --> PublicEvents["Policy: Public read published events"]
PublicEvents --> PublicTicketTypes["Policy: Public read ticket types"]
PublicTicketTypes --> ServiceRoleNote["Note: Service role bypasses RLS via client"]
```

**Diagram sources**
- [schema.sql:120-143](file://supabase/schema.sql#L120-L143)

**Section sources**
- [schema.sql:120-143](file://supabase/schema.sql#L120-L143)

### Authentication and Authorization Flow
- Login endpoint validates credentials and issues a session cookie containing user id and role.
- Authorization helper extracts the session cookie, parses it, and enforces required roles.
- API routes call the authorization helper before performing any database operations.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Login as "/api/auth/login"
participant Auth as "auth.js"
participant SB as "Service Client"
participant DB as "PostgreSQL"
Client->>Login : POST {email, password}
Login->>SB : Select user by email and active flag
SB->>DB : Query users
DB-->>SB : User record
Login->>Auth : verifyPassword(password, hash)
alt Valid
Login->>Client : Set-Cookie tf_session={userId, role, exp}
Login-->>Client : {success, user}
else Invalid
Login-->>Client : {error : Invalid credentials}
end
```

**Diagram sources**
- [login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [auth.js:1-28](file://lib/auth.js#L1-L28)
- [supabase.js:15-23](file://lib/supabase.js#L15-L23)

**Section sources**
- [login.js:1-31](file://pages/api/auth/login.js#L1-L31)
- [auth.js:1-46](file://lib/auth.js#L1-L46)

### Public Read Access: Events and Ticket Types
- The events index route lists published events and includes related ticket types.
- RLS ensures that even if queries are broad, only rows satisfying the policy conditions are returned.
- For ticket types, the policy checks the parent event’s status to allow public reads.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "/api/events/index"
participant SB as "Service Client"
participant DB as "PostgreSQL (RLS)"
Client->>API : GET /api/events/index
API->>SB : Select events where status = 'published'
SB->>DB : Query events + join ticket_types
DB-->>SB : Rows filtered by RLS (published events only)
SB-->>API : Data
API-->>Client : {events}
```

**Diagram sources**
- [events/index.js:1-42](file://pages/api/events/index.js#L1-L42)
- [schema.sql:130-139](file://supabase/schema.sql#L130-L139)

**Section sources**
- [events/index.js:1-42](file://pages/api/events/index.js#L1-L42)
- [schema.sql:130-139](file://supabase/schema.sql#L130-L139)

### Ticket Purchase Flow and Sensitive Data Protection
- The purchase endpoint validates availability, applies promo codes, and creates tickets and payment records.
- Because it uses the service-role client, it bypasses RLS; however, business logic enforces constraints (availability, promo validity).
- Sensitive buyer information is stored in the tickets table and accessed only through authorized API routes.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Purchase as "/api/tickets/purchase"
participant SB as "Service Client"
participant DB as "PostgreSQL"
Client->>Purchase : POST {eventId, ticketTypeId, quantity, buyer info, paymentMethod, promoCode}
Purchase->>SB : Validate ticket type and availability
Purchase->>SB : Validate promo code
Purchase->>SB : Insert tickets and update quantities
Purchase->>SB : Record payment
SB-->>Purchase : Success
Purchase-->>Client : {success, tokens, orderId}
```

**Diagram sources**
- [tickets/purchase.js:1-123](file://pages/api/tickets/purchase.js#L1-L123)

**Section sources**
- [tickets/purchase.js:1-123](file://pages/api/tickets/purchase.js#L1-L123)

### Promo Code Validation
- The validation endpoint checks promo code existence, activity, usage limits, and expiration.
- No RLS policy is needed here because the route uses the service-role client and enforces business rules.

```mermaid
flowchart TD
Start(["Validate Promo"]) --> CheckParams["Check code and eventId"]
CheckParams --> QueryPromo["Query promo by event_id, code, active"]
QueryPromo --> Exists{"Promo exists?"}
Exists --> |No| ReturnInvalid["Return invalid"]
Exists --> |Yes| CheckLimits["Check max_uses and expires_at"]
CheckLimits --> Valid{"Within limits and not expired?"}
Valid --> |No| ReturnInvalid
Valid --> |Yes| ReturnValid["Return valid with discount"]
```

**Diagram sources**
- [promo/validate.js:1-27](file://pages/api/promo/validate.js#L1-L27)

**Section sources**
- [promo/validate.js:1-27](file://pages/api/promo/validate.js#L1-L27)

### Check-in Scanning and Gate Staff Role
- The scan endpoint requires one of super_admin, organiser, or gate_staff roles.
- It verifies ticket validity, prevents duplicate scans, updates ticket status, and records check-ins.
- Uses the service-role client to bypass RLS while relying on application-level authorization.

```mermaid
sequenceDiagram
participant Client as "Gate Device"
participant Scan as "/api/checkin/scan"
participant Auth as "requireRole"
participant SB as "Service Client"
participant DB as "PostgreSQL"
Client->>Scan : POST {token, eventId, method, deviceInfo}
Scan->>Auth : requireRole(['super_admin','organiser','gate_staff'])
Auth-->>Scan : User context
Scan->>SB : Find ticket by token and event_id
SB->>DB : Query tickets
DB-->>SB : Ticket
alt Invalid or already used
SB-->>Scan : Not found or used
Scan-->>Client : {valid : false, reason}
else Valid
Scan->>SB : Update ticket status and set checked_in_by
Scan->>SB : Insert check_ins record
SB-->>Scan : Success
Scan-->>Client : {valid : true, message, ticket}
end
```

**Diagram sources**
- [checkin/scan.js:1-44](file://pages/api/checkin/scan.js#L1-L44)

**Section sources**
- [checkin/scan.js:1-44](file://pages/api/checkin/scan.js#L1-L44)

### Admin Operations: Staff Management and Stats
- Staff management requires super_admin or organiser roles and performs CRUD on users with role gate_staff.
- Stats aggregation filters events by organiser_id for non-super admins and computes metrics across tickets and payments.
- Both endpoints use the service-role client and enforce authorization before querying.

```mermaid
sequenceDiagram
participant Admin as "Admin UI"
participant Staff as "/api/admin/staff"
participant Stats as "/api/admin/stats"
participant Auth as "requireRole"
participant SB as "Service Client"
participant DB as "PostgreSQL"
Admin->>Staff : GET/POST staff operations
Staff->>Auth : requireRole(['super_admin','organiser'])
Auth-->>Staff : User context
Staff->>SB : Query/Insert users (role=gate_staff)
SB-->>Staff : Data
Staff-->>Admin : Response
Admin->>Stats : GET stats
Stats->>Auth : requireRole(['super_admin','organiser'])
Auth-->>Stats : User context
Stats->>SB : Aggregate events, tickets, payments
SB-->>Stats : Metrics
Stats-->>Admin : Response
```

**Diagram sources**
- [admin/staff.js:1-28](file://pages/api/admin/staff.js#L1-L28)
- [admin/stats.js:1-41](file://pages/api/admin/stats.js#L1-L41)

**Section sources**
- [admin/staff.js:1-28](file://pages/api/admin/staff.js#L1-L28)
- [admin/stats.js:1-41](file://pages/api/admin/stats.js#L1-L41)

## Dependency Analysis
- API routes depend on:
  - supabase.js getServiceClient() for privileged DB access.
  - auth.js requireRole() for authorization enforcement.
- RLS policies in schema.sql define baseline access controls for public reads and implicitly protect sensitive data.
- The service-role client bypasses RLS; therefore, application-level authorization is critical to prevent unauthorized operations.

```mermaid
graph LR
A["/api/auth/login"] --> B["getServiceClient()"]
C["/api/events/index"] --> B
D["/api/tickets/purchase"] --> B
E["/api/promo/validate"] --> B
F["/api/checkin/scan"] --> B
G["/api/admin/staff"] --> B
H["/api/admin/stats"] --> B
I["auth.js requireRole()"] --> C
I --> D
I --> F
I --> G
I --> H
J["schema.sql RLS policies"] --> C
J --> D
J --> E
J --> F
J --> G
J --> H
```

**Diagram sources**
- [supabase.js:15-23](file://lib/supabase.js#L15-L23)
- [auth.js:38-46](file://lib/auth.js#L38-L46)
- [schema.sql:120-143](file://supabase/schema.sql#L120-L143)

**Section sources**
- [supabase.js:1-23](file://lib/supabase.js#L1-L23)
- [auth.js:1-46](file://lib/auth.js#L1-L46)
- [schema.sql:120-143](file://supabase/schema.sql#L120-L143)

## Performance Considerations
- RLS policies should be selective and indexed appropriately to avoid full-table scans.
- Use targeted queries in API routes to minimize data transfer and processing overhead.
- Avoid unnecessary joins; leverage Supabase’s query builder to fetch only required fields.
- Cache frequently accessed public data at the edge or CDN where appropriate.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing environment variables: Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are configured.
- Authentication failures: Verify cookie parsing and session token expiration handling.
- Authorization errors: Confirm required roles match the user’s role in the session token.
- RLS unexpected results: Review policy conditions and ensure queries align with expected filters.

**Section sources**
- [supabase.js:1-14](file://lib/supabase.js#L1-L14)
- [auth.js:20-28](file://lib/auth.js#L20-L28)
- [auth.js:38-46](file://lib/auth.js#L38-L46)
- [schema.sql:120-143](file://supabase/schema.sql#L120-L143)

## Conclusion
TicketFlow’s security model combines Supabase RLS with robust application-level authorization. Public read access is safely exposed through RLS policies, while sensitive operations are guarded by role checks and executed via the service-role client. Following the documented patterns and best practices ensures secure, maintainable database access aligned with user roles and business requirements.

[No sources needed since this section summarizes without analyzing specific files]