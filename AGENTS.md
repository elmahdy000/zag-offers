# Zag Offers — Agent Behavioral Rules & Persistent Memory Protocol

## 1. Mandatory Pre-Flight Checklist (Before Starting Any Task)
- Read this `AGENTS.md` and ALL documents inside `.agent-memory/` (`PROJECT_CONTEXT.md`, `PROGRESS.md`, `DECISIONS.md`, `ERRORS_AND_FIXES.md`, `CHANGELOG.md`).
- Inspect current code, active configuration, and recent Git history (`git log -n 5`).
- Reconcile memory against the actual project state; ground all actions in verified facts.
- Continue existing work instead of restarting or recreating completed features.
- Never claim to remember conversations that cannot be accessed; ground your knowledge solely in active code and `.agent-memory/`.
- Respect prior user corrections, approved design decisions, and architectural invariants.

---

## 2. Platform Architecture & Core Invariants
- **Multi-App Ecosystem**:
  - `zag_offers_app`: Customer mobile app (Flutter / Clean Architecture / BLoC).
  - `zag_offers_vendor_app`: Merchant mobile app (Flutter / BLoC).
  - `zag_offers_admin_app`: Admin mobile app (Flutter / BLoC).
  - `zag-offers-client`: Customer Web App (Next.js / Tailwind / App Router).
  - `zag-offers-vendor`: Merchant Web Dashboard (Next.js).
  - `zag-offers-admin`: Platform Admin Dashboard (Next.js).
  - `zag_offers_backend`: REST API & WebSockets (Node.js / Express / TypeScript / Prisma / PostgreSQL).
- **Visual Identity & Tokens**:
  - Dark Mode First: Midnight Navy background (`#0F172A` / `#131B2A`), card surface (`#162032` / `#1E293B`).
  - Egyptian Orange primary accent (`#FF5722` / `#FF7043`).
  - Arabic RTL layout strictly applied across all views.
  - Coupon codes strictly LTR monospace (`GoogleFonts.spaceMono`) with high contrast.
- **Coupon Status Contract**:
  - `GENERATED`: Active coupon ready for redemption. MUST display `جاهز للاستخدام ✨`. NEVER show "تم الاستخدام".
  - `USED`: Redeemed by merchant. MUST display `تم الاستخدام ✓`.
  - `EXPIRED`: Past expiration date. MUST display `منتهي الصلاحية`.

---

## 3. Project Memory System (`.agent-memory/`)
The agent must maintain and synchronize the following 5 files:
1. `PROJECT_CONTEXT.md`: System purpose, architecture, stack, API contracts, design tokens.
2. `PROGRESS.md`: Completed features, verified UI screens, active tasks, next steps.
3. `DECISIONS.md`: Key technical & architectural decisions and their justifications.
4. `ERRORS_AND_FIXES.md`: Past bugs, root causes, exact resolutions, and prevention rules.
5. `CHANGELOG.md`: Chronological log of verified changes, fixes, and Git commits.

---

## 4. Automatic Memory Updates (After Completing Meaningful Tasks)
- Update `PROGRESS.md` with completed milestones and pending tasks.
- Record significant technical or UI decisions in `DECISIONS.md`.
- Document tricky bugs and their prevention invariants in `ERRORS_AND_FIXES.md`.
- Append verified changes to `CHANGELOG.md`.
- Keep all entries concise, factual, and free of secrets or placeholders.
