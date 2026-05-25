# Adrine Hospital Module Demo Instructions

## Project Snapshot

This repository is a frontend-first hospital SaaS demo built with Vite, React, TypeScript, Tailwind CSS, and shadcn-ui. The app is organized by hospital role and module, with mock/local state today and a longer backend roadmap documented in [PRODUCTION_PLAN.md](../PRODUCTION_PLAN.md).

## Before Making Changes

- Read [README.md](../README.md) for the quick project overview.
- Read [PRODUCTION_PLAN.md](../PRODUCTION_PLAN.md) when work touches product direction, tenant customization, or backend migration plans.
- Prefer existing pages, layouts, contexts, and config files over creating new patterns.

## Repository Conventions

- Use `@/` path aliases for imports. Avoid deep relative import chains.
- Keep UI built on shadcn-ui and Radix primitives. Do not introduce a second component system.
- Treat role-based navigation as configuration-driven. Keep [src/config/navigation.ts](../src/config/navigation.ts), [src/config/roleNavigation.ts](../src/config/roleNavigation.ts), and [src/types/roles.ts](../src/types/roles.ts) aligned.
- Respect tenant customization flow in [src/contexts/TenantSettingsContext.tsx](../src/contexts/TenantSettingsContext.tsx) and [src/config/tenantSettings.ts](../src/config/tenantSettings.ts).
- Preserve the mock-first state model unless a task explicitly asks to replace it with backend integration.
- Keep layouts consistent with [src/components/AppLayout.tsx](../src/components/AppLayout.tsx), [src/components/DashboardLayout.tsx](../src/components/DashboardLayout.tsx), and the page modules under [src/pages/](../src/pages/).

## Common Pitfalls

- Navigation changes often require updates in more than one place. Check the role tabs, base paths, and role permissions together.
- Auth is currently localStorage-based in [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx). Do not assume server sessions exist yet.
- Many screens are placeholder-driven. Reuse the existing placeholder components instead of inventing new empty states.
- The tenant settings UI can hide or rename tabs. Verify any new module works when feature flags are off.

## Validation

- Use `npm run lint` for code-quality checks.
- Use `npm run test` for behavior changes with tests.
- Use `npm run build` before shipping broader changes or when touching routing, config, or shared utilities.

## Documentation Principle

Link to the relevant source file or existing docs instead of duplicating large explanations in new instructions. Keep this file short, current, and action-oriented.