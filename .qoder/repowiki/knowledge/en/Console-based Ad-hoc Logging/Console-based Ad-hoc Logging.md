---
kind: logging_system
name: Console-based Ad-hoc Logging
category: logging_system
scope:
    - '**'
source_files:
    - lib/supabase.js
    - pages/api/auth/login.js
    - pages/api/tickets/purchase.js
    - pages/api/tickets/stripe-success.js
---

The TicketFlow application does not implement a dedicated logging framework or structured logging system. Instead, it uses plain `console` calls scattered across API route handlers and utility modules for error reporting and configuration warnings.

**What is used**: The only logging mechanism is the built-in Node.js `console` object with `console.error()` for exception handling and `console.warn()` for environment misconfiguration. No logger library (winston, pino, bunyan, morgan, etc.) is imported anywhere in the codebase.

**Where it appears**:
- `lib/supabase.js`: Warns when Supabase environment variables are missing (`console.warn('Supabase environment variables are not set...')`).
- `pages/api/auth/login.js`: Catches and logs exceptions during login (`console.error(err)`).
- `pages/api/tickets/purchase.js`: Logs purchase failures (`console.error('Purchase error:', err)`).
- `pages/api/tickets/stripe-success.js`: Logs Stripe webhook processing errors (`console.error('Stripe success error:', err)`).

**Architecture and conventions**: There is no centralized logging module, no log-level strategy, no structured log fields, and no log routing or sinks. Each handler independently decides when to call `console.error`, typically inside try/catch blocks around external service calls (Supabase, Stripe). Messages are unstructured strings concatenated with the error object.

**Constraints observed**: Because there is no logging abstraction, adding new log points requires manually inserting `console` calls at each site. There is no way to toggle log levels, filter output, or aggregate logs across endpoints. All console output goes to the standard Node.js process stdout/stderr.