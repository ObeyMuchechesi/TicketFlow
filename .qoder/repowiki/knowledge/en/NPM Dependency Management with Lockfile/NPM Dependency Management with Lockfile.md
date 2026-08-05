---
kind: dependency_management
name: NPM Dependency Management with Lockfile
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - next.config.js
    - vercel.json
---

This Next.js application uses npm as its package manager for dependency management, with dependencies declared in `package.json` and a deterministic lockfile (`package-lock.json`) to ensure reproducible installs.

**System and tools:**
- Package manager: npm (via `node_modules` and `package-lock.json`)
- No vendoring strategy — dependencies are installed into `node_modules/`
- No private registry configuration found; all packages resolve from the public npm registry
- No dependency update automation (e.g., Dependabot, Renovate) detected in the repository

**Key files:**
- `package.json` — declares runtime dependencies using caret ranges (e.g., `^15.0.0`, `^6.8.0`), allowing minor/patch updates within the specified major version
- `package-lock.json` — lockfileVersion 3, pins exact resolved versions and integrity hashes for every transitive dependency
- `next.config.js` — Next.js build configuration that may influence how dependencies are bundled
- `vercel.json` — deployment configuration for Vercel, which uses the same npm-based install process

**Architecture and conventions:**
- All third-party libraries are listed under the single `dependencies` field; no separate `devDependencies` section is present, meaning development tooling (like Next.js itself) is treated as runtime dependencies
- Dependencies follow semantic versioning with caret (`^`) ranges, prioritizing flexibility over strict pinning at the manifest level while relying on the lockfile for determinism
- The project is marked `"private": true`, indicating it is not intended to be published to the npm registry

**Conventions and constraints:**
- Version ranges use the `^` prefix, so `npm install` will resolve to the latest compatible minor/patch version within the specified major version
- Deterministic builds are enforced through `package-lock.json`, which must be committed alongside source code
- Node engine requirements are inherited from individual packages (e.g., Supabase packages require `node >= 22.0.0`); there is no explicit `engines` field in `package.json` to constrain the project-wide Node version
- No peer dependency declarations exist beyond what upstream packages specify (e.g., `@stripe/react-stripe-js` declares React and ReactDOM as peer dependencies)