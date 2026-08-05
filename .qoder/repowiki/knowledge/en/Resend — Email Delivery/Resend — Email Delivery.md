---
kind: external_dependency
name: Resend — Email Delivery
slug: resend
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

### Resend
- Role in this repo: email delivery service declared as a dependency; intended for transactional emails (ticket confirmations, admin notifications) though not yet wired into any API route in the current codebase.
- Integration point: listed in `package.json` dependencies under `resend`; no import or usage found in the source tree yet.
- This is a declared but currently unused vendor dependency — wiring would follow the standard Resend SDK pattern.