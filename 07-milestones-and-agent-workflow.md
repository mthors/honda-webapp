# Milestone Plan and AI-Agent Workflow

## Working rules

-   One milestone per branch or clearly isolated commit sequence.
-   Start each milestone with a plan; review scope and risks before
    implementation.
-   Do not ask an agent to build the entire application in one prompt.
-   Use small, reviewable changes and explicit acceptance criteria.
-   Run format/lint, typecheck, tests and build before declaring a
    milestone complete.
-   Automated tests do not replace manual testing of the real user
    workflow.
-   Do not commit secrets, production customer data or copied
    proprietary assets.
-   Do not commit/push until the owner has reviewed the diff and
    approved the milestone.

## M0 --- Discovery and project setup

**Deliverables:** approved PRD, design.md reviewed, route map, schema
proposal, stack, repo skeleton, env example, CI basics. **Tasks:**
inspect `design.md`; identify authorized brand assets and content;
confirm dealer details, price ownership and scope. **Gate:** owner
approves scope and visual direction; build/lint/test baseline works.

## M1 --- Foundation and design system

**Deliverables:** Next.js TypeScript app, shared layout,
fonts/colors/spacing, header/footer, responsive shell, reusable UI
primitives. **Tests:** lint/typecheck/unit baseline; visual check on
mobile/desktop. **Gate:** public shell follows `design.md`; no fake
production content presented as verified.

## M2 --- Database, auth and security foundation

**Deliverables:** Supabase project configuration, migrations, seed data,
Auth, staff profiles/roles, initial RLS policies, server-side auth
helpers. **Tests:** anonymous/staff role policy tests; unauthorized
direct mutation test; migration reset test. **Gate:** public cannot
access leads or internal tables; admin operations are server-authorized.

## M3 --- Catalog and product detail

**Deliverables:** categories, model/variant/color data, image gallery,
catalog filters, detail pages, SEO metadata. **Tests:** category
filtering, variant/color relationships, draft/archived visibility,
missing image/price states. **Gate:** a staff-managed product can be
published and appears correctly in the public catalog.

## M4 --- Prices and promotions

**Deliverables:** effective-dated local prices, price list, banner
management, promotion CRUD/scheduling and public sections. **Tests:**
start/end windows, expired content hidden, conflicting price periods
rejected, disclaimer shown. **Gate:** authorized staff can update
prices/promos without code changes.

## M5 — Inquiry capture

**Deliverables:** public inquiry form, server validation, privacy acknowledgement, lead reference, protected inquiry list, and one-click Excel (`.xlsx`) export.

**Tests:** valid/invalid submission, repeated submission, invalid variant/color pair, privacy/permission tests, Excel columns and Unicode text.

**Gate:** an inquiry submitted from a phone appears in admin and downloads as a valid Excel workbook. No CRM pipeline or sales assignment workflow.

## M6 — Reserved / no simulator

Credit simulation is disabled and not implemented in V1. Display verified local OTR prices only. This milestone can be skipped; do not create a simulator route or financing UI.

## M7 --- CMS completeness and operational polish

**Deliverables:** settings, image upload rules, dashboard summaries,
audit logs, lead filters, optional email notification, empty/error
states. **Tests:** role permissions, upload validation, notification
failure behavior, export permission. **Gate:** content manager and sales
staff can complete their workflows without developer intervention.

## M8 --- QA, accessibility, performance and SEO

**Deliverables:** Playwright smoke suite, unit/integration coverage,
responsive review, accessibility review, metadata/sitemap/robots, image
optimization. **Tests:** full critical-path regression; Lighthouse or
equivalent checks; no console errors in critical flows. **Gate:**
acceptance criteria in PRD met; no unresolved critical security or
data-loss issue.

## M9 --- Staging and owner acceptance

**Deliverables:** staging deployment, synthetic seed data, UAT
checklist, price/content review, staff training notes. **Manual tests:**
owner edits a price, publishes a banner, submits an inquiry on a phone,
follows lead in admin, tests WhatsApp handoff, checks expired promo and
simulator disclaimer. **Gate:** owner signs off; all issues are recorded
and resolved or explicitly deferred.

## M10 --- Production launch

**Deliverables:** production environment/domain, backups, monitoring,
approved content/privacy notice, staff accounts, rollback instructions.
**Gate:** verify domain/HTTPS, lead delivery, database access, backups,
analytics privacy, and a rollback path.

## M11 --- Post-launch improvements

Potential items: official WhatsApp Business integration, multi-branch
pricing, CSV import/export, source attribution, scheduled follow-up
reminders, richer sales reporting. Do not pull these into V1 unless
business value and owner are clear.

## Definition of Done for every milestone

-   Acceptance criteria satisfied.
-   Formatting, lint, typecheck, tests and production build pass.
-   Security implications reviewed, especially RLS and server mutations.
-   Manual test steps documented and executed for user-facing flows.
-   Diff reviewed; no unrelated refactors or secrets.
-   Documentation updated.
-   Owner approves before commit/push/release.
