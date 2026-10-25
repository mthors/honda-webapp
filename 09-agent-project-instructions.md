# AI Coding Agent --- Project Instructions

## Mission

Build the Honda Satrya Dealer Group Honda motorcycle digital showroom inspired by
the information architecture and visual quality of
https://www.astra-honda.com/, using this repository's `design.md` as the
visual authority. Include a public catalog, local price list,
promotions, inquiry capture, local OTR price display, and a
protected CMS/admin lead dashboard.

## Before coding

1.  Inspect the repository and read `design.md` and all documents in
    `docs/`.
2.  Report the existing stack, repository structure, current status and
    any conflicts with the documents.
3.  Produce a milestone-specific plan with files likely to change,
    schema changes, risks and tests.
4.  Do not begin implementation until the plan is approved.
5.  Ask only essential questions. If a business decision is unresolved,
    implement a safe disabled/placeholder state rather than inventing
    factual prices, promotions, financing rates, dealership details or
    legal terms.

## Language and naming conventions
- **All public-facing website UI must be in Bahasa Indonesia**, because the target customers are local Indonesian motorcycle buyers. This includes navigation, buttons, headings, product labels, price disclaimers, form labels/placeholders, validation errors, success/error states, promotions, footer, privacy notice, and accessibility labels.
- **Keep code and technical identifiers in English**: variable/function/component names, filenames, route segments, TypeScript types/interfaces, database tables/columns, enum values, API fields, test names, and code comments.
- Keep admin UI in Bahasa Indonesia too, unless the owner explicitly requests otherwise. Technical documentation and developer-facing logs should remain in English.
- Use natural, customer-friendly Indonesian, not literal machine translation. Use Indonesian locale and currency formatting (`id-ID`, `IDR`) for prices and dates.
- Do not hardcode customer-facing strings throughout components. Centralize repeated labels/messages in an English-named copy module (for example `src/lib/i18n/id.ts` or `src/content/copy/id.ts`) while the actual displayed values remain Bahasa Indonesia.
- Use English URL slugs and code identifiers where practical, even when page titles are Indonesian (e.g. `/motor`, `/harga`, `/promo`, `/hubungi` are acceptable Indonesian route words; maintain consistent conventions and do not mix styles randomly).
- Ensure form validation and accessibility announcements are also in Bahasa Indonesia.

## Non-negotiable rules

-   Work one milestone at a time.
-   Keep TypeScript strict; use validated types and server-side Zod
    schemas.
-   Use committed Supabase migrations for schema changes.
-   Never expose service-role keys or secrets to client bundles or Git.
-   Enforce authentication/authorization inside every protected server
    action and route handler.
-   Enable and test RLS for exposed tables; never expose leads, notes,
    status history or audit logs publicly.
-   Treat inquiry submission as an abuse-prone public endpoint:
    validate, rate-limit, constrain field lengths and reject invalid
    model/variant/color combinations.
-   Keep money as integer Rupiah or a deliberate decimal representation;
    do not use floating point for currency.
-   Never fabricate current prices, stock availability, promotion terms,
    financing rates, or approval outcomes.
-   Do not build articles, discussion, comments, public chat, checkout
    or payment processing in V1.
-   Do not copy Astra Honda source code, exact proprietary assets or
    text. Use approved assets and a distinct dealership identity.
-   Preserve existing working features; inspect diffs before editing and
    avoid unrelated refactors.
-   Do not commit or push without explicit owner approval.
-   Automated tests passing is not the same as manual acceptance
    testing.

## Implementation workflow

For each milestone: 1. Inspect relevant files and current tests. 2.
Summarize the scope and propose a plan. 3. Implement the smallest
coherent slice. 4. Add/adjust unit, integration and E2E tests. 5. Run
format, lint, typecheck, tests and production build. 6. Report exact
commands and results, including failures or skipped checks. 7. List
manual verification steps the owner must perform. 8. Review
`git diff --check` and `git diff`; confirm no secrets, unrelated changes
or unsafe policies. 9. Update documentation and wait for owner approval
before commit/push.

## Definition of complete

A milestone is complete only when its documented acceptance criteria are
met, tests/build pass, relevant manual checks are recorded, security
implications are reviewed, and limitations are explicitly reported.

## First task

Perform discovery only. Read `design.md`, inspect the repository and
compare it with the proposed documents. Return: - current project
state, - gaps and conflicts, - recommended first milestone, - questions
that block implementation, - exact files you propose to create/change.
Do not implement code in this first task.
