# Check-in Tracking System

<cite>
**Referenced Files in This Document**
- [schema.sql](file://supabase/schema.sql)
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)
- [index.js](file://pages/checkin/index.js)
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)
- [admin_stats.js](file://pages/api/admin/stats.js)
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
This document explains the Check-in Tracking System for TiketFlow, focusing on how check-in records are created and stored, timestamp tracking, staff attribution, device information logging, data model relationships, audit trail functionality, and reporting capabilities. It also covers data consistency, transaction management, concurrent access handling, real-time updates, and performance optimization strategies for high-volume scanning scenarios.

## Project Structure
The check-in feature spans API routes, a Next.js client page, authentication utilities, Supabase client configuration, and the database schema:

- API endpoints:
  - Check-in scan: pages/api/checkin/scan.js
  - Check-in stats: pages/api/checkin/stats.js
  - Admin attendee search: pages/api/admin/attendees.js
  - Admin aggregate stats: pages/api/admin/stats.js
- Client pages:
  - Gate staff event selection: pages/checkin/index.js
  - Event-specific check-in UI with live stats: pages/checkin/[eventId].js
- Utilities:
  - Authentication helpers: lib/auth.js
  - Supabase client (service role): lib/supabase.js
- Database schema: supabase/schema.sql

```mermaid
graph TB
subgraph "Client"
A["Check-in Home<br/>pages/checkin/index.js"]
B["Event Check-in Page<br/>pages/checkin/[eventId].js"]
end
subgraph "API Routes"
C["Scan Ticket<br/>pages/api/checkin/scan.js"]
D["Check-in Stats<br/>pages/api/checkin/stats.js"]
E["Attendee Search<br/>pages/api/admin/attendees.js"]
F["Admin Aggregate Stats<br/>pages/api/admin/stats.js"]
end
subgraph "Services"
G["Auth Helpers<br/>lib/auth.js"]
H["Supabase Service Client<br/>lib/supabase.js"]
end
subgraph "Database"
I["Schema & Policies<br/>supabase/schema.sql"]
end
A --> B
B --> C
B --> D
B --> E
C --> H
D --> H
E --> H
F --> H
C --> I
D --> I
E --> I
F --> I
C --> G
D --> G
E --> G
F --> G
```

**Diagram sources**
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)
- [index.js](file://pages/checkin/index.js)
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)
- [schema.sql](file://supabase/schema.sql)

**Section sources**
- [schema.sql](file://supabase/schema.sql)
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)
- [index.js](file://pages/checkin/index.js)
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)
- [admin_stats.js](file://pages/api/admin/stats.js)

## Core Components
- Check-in Scan API: Validates ticket ownership, prevents duplicate use, marks tickets as used, and records an audit entry with staff and device info.
- Check-in Stats API: Aggregates total tickets, checked-in count, capacity, and recent scans for real-time dashboards.
- Attendee Search API: Supports searching by name, email, phone, or token to enable manual check-ins.
- Check-in UI: Polls stats every 10 seconds, processes QR/manual input, shows immediate feedback, and displays recent scans.
- Auth: Role-based middleware ensures only authorized staff can perform check-ins and view stats.
- Supabase Client: Uses service role key for server-side operations bypassing RLS policies where appropriate.

**Section sources**
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)

## Architecture Overview
The system follows a clear separation between client, API, and database layers. The check-in flow is designed for speed and reliability at gate scanners.

```mermaid
sequenceDiagram
participant Staff as "Gate Staff Device"
participant UI as "Check-in Page<br/>pages/checkin/[eventId].js"
participant API as "Scan API<br/>pages/api/checkin/scan.js"
participant DB as "Supabase<br/>tickets + check_ins"
participant Auth as "Auth Helper<br/>lib/auth.js"
Staff->>UI : Enter token / paste QR code
UI->>API : POST { token, eventId }
API->>Auth : requireRole(super_admin|organiser|gate_staff)
Auth-->>API : user context
API->>DB : Lookup ticket by qr_code_token + event_id
DB-->>API : ticket details
API->>API : Validate status (active, not cancelled/refunded, not already used)
API->>DB : Update ticket (is_checked_in=true, checked_in_at, checked_in_by, status='used')
API->>DB : Insert check_ins record (staff_id, scanned_at, method, device_info)
DB-->>API : success
API-->>UI : { valid : true, reason : 'SUCCESS', ticket info }
UI->>API : GET /api/checkin/stats?eventId=...
API-->>UI : { total, checkedIn, capacity, recent }
```

**Diagram sources**
- [eventId.js](file://pages/checkin/[eventId].js)
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)
- [auth.js](file://lib/auth.js)
- [schema.sql](file://supabase/schema.sql)

## Detailed Component Analysis

### Data Model and Schema Relationships
The core entities involved in check-ins are events, tickets, users (staff), and check_ins. Payments are related but separate from check-in logic.

```mermaid
erDiagram
EVENTS {
uuid id PK
text event_name
date date
text venue
int capacity
text status
}
TICKET_TYPES {
uuid id PK
uuid event_id FK
text name
decimal price
int quantity_available
int quantity_sold
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
USERS {
uuid id PK
text email
text full_name
text role
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
EVENTS ||--o{ TICKET_TYPES : "has"
EVENTS ||--o{ TICKETS : "has"
TICKET_TYPES ||--o{ TICKETS : "defines"
USERS ||--o{ CHECK_INS : "performs"
TICKETS ||--o{ CHECK_INS : "produces"
TICKETS ||--o{ PAYMENTS : "linked"
```

**Diagram sources**
- [schema.sql](file://supabase/schema.sql)

Key attributes and constraints:
- tickets.qr_code_token is unique; indexed for fast lookup.
- tickets.is_checked_in and tickets.checked_in_at track usage state and time.
- check_ins.scanned_at captures exact timestamp; method indicates source (qr_scan vs manual_search); device_info logs device metadata when provided.
- Foreign keys enforce referential integrity across events, tickets, users, and payments.

**Section sources**
- [schema.sql](file://supabase/schema.sql)

### Check-in Creation Flow and Audit Trail
The scan endpoint performs validation, updates ticket state, and inserts an audit record.

```mermaid
flowchart TD
Start(["POST /api/checkin/scan"]) --> Auth["requireRole()"]
Auth --> Parse["Parse { token, eventId, method, deviceInfo }"]
Parse --> Lookup["Find ticket by qr_code_token + event_id"]
Lookup --> Exists{"Ticket found?"}
Exists -- No --> Invalid["Return INVALID"]
Exists -- Yes --> StatusCheck{"Status active and not cancelled/refunded?"}
StatusCheck -- No --> Reject["Return CANCELLED/REFUNDED"]
StatusCheck -- Yes --> AlreadyUsed{"is_checked_in == true?"}
AlreadyUsed -- Yes --> Used["Return ALREADY_USED with last check-in time"]
AlreadyUsed -- No --> Update["Update ticket: set is_checked_in=true,<br/>checked_in_at=now, checked_in_by=staffId,<br/>status='used'"]
Update --> Record["Insert check_ins: ticket_id, event_id,<br/>staff_id, scanned_at=now, method, device_info"]
Record --> Success["Return SUCCESS with ticket summary"]
Invalid --> End(["End"])
Reject --> End
Used --> End
Success --> End
```

**Diagram sources**
- [scan.js](file://pages/api/checkin/scan.js)

Operational notes:
- Timestamps: checked_in_at and scanned_at are set to current ISO time.
- Staff attribution: checked_in_by and staff_id capture the operator’s user ID.
- Device info: optional field device_info is persisted if provided by the client.
- Audit trail: each successful check-in creates a row in check_ins, enabling historical tracking and reporting.

**Section sources**
- [scan.js](file://pages/api/checkin/scan.js)

### Real-time Updates and Reporting
The check-in page polls the stats endpoint every 10 seconds to refresh metrics and recent scans.

```mermaid
sequenceDiagram
participant UI as "Check-in Page<br/>pages/checkin/[eventId].js"
participant StatsAPI as "Stats API<br/>pages/api/checkin/stats.js"
participant DB as "Supabase"
UI->>StatsAPI : GET /api/checkin/stats?eventId=...
StatsAPI->>DB : Count active tickets for event
StatsAPI->>DB : Count checked-in tickets for event
StatsAPI->>DB : Fetch recent check_ins (limit 20, order by scanned_at desc)
StatsAPI-->>UI : { total, checkedIn, capacity, eventName, recent }
UI->>UI : Render dashboard and timeline
```

**Diagram sources**
- [eventId.js](file://pages/checkin/[eventId].js)
- [stats.js](file://pages/api/checkin/stats.js)

Reporting capabilities:
- Total tickets: sum of active tickets plus those already checked in.
- Checked-in count: number of tickets marked used.
- Capacity: event capacity for occupancy calculations.
- Recent scans: last 20 entries with buyer and ticket type details.

**Section sources**
- [eventId.js](file://pages/checkin/[eventId].js)
- [stats.js](file://pages/api/checkin/stats.js)

### Manual Search and Check-in
Staff can search attendees by name, email, phone, or token and trigger check-in directly from results.

```mermaid
sequenceDiagram
participant UI as "Check-in Page<br/>Manual Tab"
participant SearchAPI as "Attendee Search<br/>pages/api/admin/attendees.js"
participant ScanAPI as "Scan API<br/>pages/api/checkin/scan.js"
UI->>SearchAPI : GET /api/admin/attendees?eventId=...&search=...
SearchAPI-->>UI : List of matching tickets with types
UI->>ScanAPI : POST { token, eventId } for selected ticket
ScanAPI-->>UI : Result (SUCCESS/ALREADY_USED/INVALID)
```

**Diagram sources**
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)
- [scan.js](file://pages/api/checkin/scan.js)

**Section sources**
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)

### Relationship Between Tickets, Check-ins, and Attendance Records
- Tickets represent purchased admission rights with unique tokens and status.
- Check-ins are immutable audit records linking a ticket to an event, staff member, timestamp, and device info.
- Attendance records are effectively derived from tickets.status='used' and corresponding check_ins rows. There is no separate attendance table; attendance is inferred from these two tables.

Data consistency implications:
- A ticket becomes “used” exactly when a check_ins row is inserted.
- Historical analysis uses both tickets.checked_in_at and check_ins.scanned_at for reconciliation.

**Section sources**
- [schema.sql](file://supabase/schema.sql)
- [scan.js](file://pages/api/checkin/scan.js)

### Data Consistency, Transaction Management, and Concurrent Access Handling
Current implementation observations:
- The scan endpoint performs two writes: updating the ticket and inserting a check_ins record. These are executed sequentially without explicit database transactions.
- Duplicate prevention relies on checking tickets.is_checked_in before update. However, under concurrent requests, there is a potential race condition where two requests could read the same ticket state before either sets it to used.
- Supabase Row Level Security is enabled, but the service role client bypasses RLS policies for server-side operations.

Recommendations for robustness:
- Wrap the ticket update and check_ins insert in a single database transaction to ensure atomicity.
- Use a conditional update or optimistic locking pattern (e.g., update only if is_checked_in=false) to prevent double-check-ins under concurrency.
- Add application-level retry and idempotency checks keyed by token+event_id to handle retries safely.
- Consider adding a unique constraint on (ticket_id, scanned_at) or using a queue to serialize check-ins per ticket.

[No sources needed since this section provides general guidance]

### Performance Optimization Strategies for High-Volume Scanning
- Indexes: Ensure indexes exist on tickets(qr_code_token), tickets(event_id), tickets(is_checked_in), and check_ins(event_id). The schema includes several indexes that support fast lookups and aggregations.
- Query minimization: The stats endpoint uses head queries for counts and limits recent scans to reduce payload size.
- Caching: Introduce short-lived caching for event metadata and capacity to reduce repeated reads during peak scanning.
- Concurrency control: Use database transactions and conditional updates to avoid contention and ensure correctness under load.
- Batch operations: For bulk administrative tasks, batch updates instead of row-by-row operations.
- Connection pooling: Ensure Supabase client connection pooling is configured appropriately for serverless environments.

**Section sources**
- [schema.sql](file://supabase/schema.sql)
- [stats.js](file://pages/api/checkin/stats.js)

## Dependency Analysis
The check-in system depends on authentication, Supabase client configuration, and database schema definitions.

```mermaid
graph LR
Auth["lib/auth.js"] --> Scan["pages/api/checkin/scan.js"]
Auth --> Stats["pages/api/checkin/stats.js"]
Auth --> Attendees["pages/api/admin/attendees.js"]
Supabase["lib/supabase.js"] --> Scan
Supabase --> Stats
Supabase --> Attendees
Schema["supabase/schema.sql"] --> Scan
Schema --> Stats
Schema --> Attendees
UI["pages/checkin/[eventId].js"] --> Scan
UI --> Stats
UI --> Attendees
```

**Diagram sources**
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)
- [schema.sql](file://supabase/schema.sql)
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)

**Section sources**
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)
- [schema.sql](file://supabase/schema.sql)
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)
- [attendees.js](file://pages/api/admin/attendees.js)
- [eventId.js](file://pages/checkin/[eventId].js)

## Performance Considerations
- Polling interval: The UI polls stats every 10 seconds, balancing freshness with server load. Adjust based on expected throughput.
- Payload size: Recent scans limited to 20 entries; consider pagination for large events.
- Database load: Use head queries for counts and selective fields to minimize bandwidth.
- Serverless scaling: Ensure environment variables for Supabase service role key are set to avoid placeholder clients.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Authentication failures: Ensure session cookies are present and roles include super_admin, organiser, or gate_staff.
- Invalid token or wrong event: Verify token belongs to the specified event; confirm ticket status is active.
- Already used: If a ticket was previously checked in, the response includes last check-in time; re-scan should be prevented.
- Network errors: Handle timeouts and retries gracefully in the UI; show clear error messages.
- Missing environment variables: Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.

**Section sources**
- [auth.js](file://lib/auth.js)
- [supabase.js](file://lib/supabase.js)
- [scan.js](file://pages/api/checkin/scan.js)
- [stats.js](file://pages/api/checkin/stats.js)

## Conclusion
The Check-in Tracking System provides a robust foundation for scanning tickets, recording audit trails, and displaying real-time statistics. While the current implementation lacks explicit transactional guarantees and concurrency controls, adopting database transactions and conditional updates will significantly improve reliability under high-volume conditions. The schema and APIs are well-structured to support further enhancements such as advanced reporting, device fingerprinting, and scalable polling mechanisms.