---
kind: error_handling
name: Error Handling in TicketFlow Next.js Application
category: error_handling
scope:
    - '**'
source_files:
    - lib/auth.js
    - pages/api/auth/login.js
    - pages/api/auth/me.js
    - components/ui/Toast.js
    - pages/_app.js
---

This repository implements a straightforward error handling approach across its Next.js application, combining server-side API error responses with client-side user feedback through a toast notification system.

**Server-Side Error Handling (API Routes)**

API routes follow a consistent pattern of returning JSON error objects with HTTP status codes. The `lib/auth.js` module defines the core authentication error convention by throwing plain objects with `status` and `message` properties (e.g., `{ status: 401, message: 'Not authenticated' }`, `{ status: 403, message: 'Insufficient permissions' }`). API route handlers typically use try-catch blocks to wrap database operations and return standardized error responses like `{ error: 'Invalid credentials' }` or `{ error: 'Email and password required' }`. When unexpected errors occur, they're caught and logged via `console.error()` before returning a generic 500 response.

**Client-Side Error Handling**

Frontend components handle errors through React state management. Pages maintain local `error` state variables that are set when API calls fail, displaying user-friendly messages in styled error containers. The application uses a centralized Toast system (`components/ui/Toast.js`) for persistent notifications, providing methods like `toast.error()`, `toast.success()`, `toast.warning()`, and `toast.info()` for different error types. The Toast component includes proper accessibility attributes with `role="alert"` for error variants.

**Authentication Flow Errors**

The authentication system has dedicated error handling: invalid sessions result in redirects to `/admin/login`, failed login attempts display inline error messages, and session validation failures return null values rather than throwing exceptions. The `parseSessionToken` function gracefully handles malformed tokens by catching parsing errors and returning null.

**Database and Network Errors**

Database operations are wrapped in try-catch blocks with fallback error states. Network failures are handled generically with messages like "Network error. Please try again." The Supabase client is used consistently throughout, with errors propagating up to be caught at the API layer.

**Constraints and Conventions**

- All API endpoints return JSON responses with either success data or error objects containing an `error` field
- Authentication middleware throws structured error objects with HTTP status codes
- Client-side errors are displayed both as inline messages and through the global toast system
- No custom error classes or sophisticated error propagation patterns are implemented
- Error logging uses basic `console.error()` without structured logging