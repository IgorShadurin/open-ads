# Open Ads Project Plan

- [x] Initialize Next.js TypeScript project structure with tooling and scripts
- [x] Configure testing stack first (unit/integration/UI) and write failing tests for core domain services
- [x] Design Prisma schema (SQLite) for users, apps, ads, assets, settings, and statistics
- [x] Implement authentication (email/password), roles (SUPER_ADMIN, USER), and registration toggle flow
- [x] Implement backend APIs for app registration, ad delivery, event tracking, and admin controls
- [x] Implement portal UI with modern design, icons, and role-based pages for admins/users
- [x] Implement ad decision/services logic (reward duration, fallback/offline payloads, filtering by bundle ID)
- [x] Implement Swift Package SDK for iOS 18+ with load/show/cancel/reward events and offline fallback
- [x] Add database migration/seed with default super admin and default settings
- [x] Add comprehensive tests for edge cases and regression paths
- [x] Run lint/typecheck/tests and fix issues
- [x] Manually verify key flows in browser via Chrome MCP and capture screenshots
- [x] Finalize README with setup, architecture, API docs, and Swift integration guide
