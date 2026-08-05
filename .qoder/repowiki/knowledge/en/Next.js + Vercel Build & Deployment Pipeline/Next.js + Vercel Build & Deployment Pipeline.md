---
kind: build_system
name: Next.js + Vercel Build & Deployment Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.js
    - vercel.json
---

This repository uses the standard Next.js build system with npm scripts and is deployed to Vercel. There are no custom Makefiles, Dockerfiles, or CI pipeline definitions in the repository.

**Build System Components:**
- **Package Manager**: npm (package-lock.json present) manages dependencies
- **Framework**: Next.js 15.x with React 19.x
- **Build Command**: `next build` (defined in package.json scripts)
- **Development**: `next dev` for local development
- **Production Start**: `next start` for running built output

**Vercel Deployment Configuration:**
The `vercel.json` file configures deployment with:
- Framework detection set to "nextjs"
- Custom build command: `next build`
- Install command: `npm install`
- Dev command: `next dev`
- Region targeting: iad1 (US East)
- Security headers applied to all API routes (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

**Next.js Configuration:**
The `next.config.js` enables React Strict Mode and configures remote image domains for Unsplash and Supabase storage.

**No Additional Build Tools:**
- No webpack configuration overrides
- No TypeScript compilation steps
- No custom bundling or optimization scripts
- No Docker containerization
- No Makefile or shell-based build automation
- No CI/CD pipeline files (.github/workflows, .gitlab-ci.yml, etc.)

The build process is minimal and relies entirely on Next.js's built-in compilation, optimization, and static generation capabilities.