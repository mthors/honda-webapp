# Product Requirements Document (PRD)

## 1. Overview

Build a responsive **Honda Mega Persada Mandiri** motorcycle dealership website inspired by the information architecture and premium product presentation of Astra Honda's official site. This is a locally operated dealership showroom, not an official AHM corporate website.

Visitors browse motorcycles, view the dealership's local OTR prices and promotions, and submit inquiries. Staff manage catalog content through a protected admin panel and download inquiries as an Excel workbook.

## 2. Goals

- Present the dealership's motorcycle catalog and **local OTR prices** clearly.
- Convert visitors into actionable customer inquiries.
- Let authorized staff update catalog, prices, banners and promotions without developer involvement.
- Let authorized staff download inquiry records as an Excel (`.xlsx`) file.
- Keep V1 intentionally simple so the owner can request refinements after launch.

## 3. Non-goals for V1

- Articles, editorial/news pages, discussion, comments or public chat.
- Credit simulation, installment estimates, finance applications or finance approval.
- Checkout, online payment, stock reservation or binding online purchase.
- Automated WhatsApp messages/API integration.
- Full CRM features such as lead assignment, status pipeline, internal notes, reminders or conversion reporting.
- Customer accounts, loyalty features, service booking or spare-parts catalog.
- Automatic synchronization with AHM/dealer systems unless a supported feed is later confirmed.

## 4. Users and roles

### Public visitor
Browses catalog, local OTR prices and promotions; submits an inquiry.

### Administrator/content manager
Manages motorcycles, variants, colors, images, local OTR prices, banners, promotions, site settings, and authorized inquiry Excel exports.

V1 can use one administrator role if that fits the dealership's current size. Add separate sales/content roles only when the owner asks for them.

## 5. Primary journeys

1. Homepage → banner/category → motorcycle detail → choose variant/color → inquiry form → confirmation/WhatsApp handoff.
2. Homepage → promotion → eligible motorcycle → inquiry.
3. Catalog or price list → view local OTR price → inquiry.
4. Admin login → update motorcycle/price/banner/promotion → preview → publish.
5. Admin login → view inquiry list → download Excel workbook → follow up outside the system.

## 6. Functional requirements

### Public website

-   FR-PUB-01: Responsive layout for mobile, tablet, desktop.
-   FR-PUB-02: Homepage has a horizontally scrollable/rotating hero
    banner with image, headline, CTA, active dates, and ordering.
-   FR-PUB-03: Catalog supports category filters (e.g. Matic, Cub/Bebek,
    Sport, EV, Big Bike if applicable), search, and featured/new labels.
-   FR-PUB-04: Model detail page includes images, description, key
    specifications, available variants/colors, starting price or price
    by variant, and inquiry CTA.
-   FR-PUB-05: Price list shows current dealership price and an explicit
    "prices may change; confirm with sales" disclaimer.
-   FR-PUB-06: Promotion page/section displays active promotions, dates,
    terms, and eligible models.
-   FR-PUB-07: Inquiry form collects full name, WhatsApp number, email
    (optional or required according to owner decision), Indonesian
    city/regency (e.g. Sidoarjo), model, variant/type, preferred color,
    and optional message.
-   FR-PUB-08: Inquiry stores a snapshot of the submitted
    model/variant/color labels so later catalog edits do not erase what
    the customer asked about.
-   FR-PUB-09: Validate form fields on the server; normalize Indonesian
    phone numbers where feasible.
-   FR-PUB-10: Display clear submission confirmation and optionally open
    a prefilled WhatsApp message after saving the lead.
-   FR-PUB-11: SEO metadata, canonical URLs, sitemap, robots policy,
    Open Graph images, and readable slugs.
-   FR-PUB-12: No article/news/discussion/chat routes in V1.

### Credit simulation
Credit simulation is disabled and out of scope for V1. Do not display installment estimates, finance rates, tenors or a simulator UI. Show verified local OTR prices only. Revisit simulation only after explicit owner approval and verified financing terms.

### Admin/CMS

-   FR-ADM-01: Secure login; no public self-registration.
-   FR-ADM-02: Dashboard summaries: new leads, leads by status, recent
    inquiries, active promotions.
-   FR-ADM-03: CRUD for categories, models, variants, colors, image
    gallery, prices, banners, promotions, and financing configurations.
-   FR-ADM-04: Draft/published status and preview where practical.
-   FR-ADM-05: Lead inbox with search/filter by status, date, model,
    city, source, and assigned staff.
-   FR-ADM-06: Lead detail shows customer contact details, selected
    model/variant/color, source page, consent timestamp, notes,
    assignment, and status history.
-   FR-ADM-07: Staff can record notes and change status; destructive
    actions require confirmation.
-   FR-ADM-08: Settings for dealership name, address, city,
    phone/WhatsApp, email, social links, business hours, footer, and
    privacy notice.
-   FR-ADM-09: Audit trail for important admin actions and
    price/promotion changes.
-   FR-ADM-10: Export lead list only for authorized roles; protect
    exported personal data.

## 7. Inquiry handling in V1

Store inquiries in the database and provide a protected Excel (`.xlsx`) download. Keep V1 intentionally simple: no lead status pipeline, assignment, internal notes, reminders or conversion reporting. Add these only if the owner requests them after reviewing the first release.

## 8. Non-functional requirements

-   Performance: optimize image sizes and avoid loading every gallery
    image on initial page load.
-   Accessibility: keyboard navigation, visible focus, semantic forms,
    labels, contrast, useful error messages, alt text.
-   Reliability: server-side validation, safe failure messages, backups,
    basic error monitoring.
-   Security: least privilege, protected admin routes/actions, database
    row-level security where applicable, rate limiting and spam
    controls.
-   Maintainability: TypeScript strict mode, schema validation,
    migrations committed to Git, automated tests and CI.
-   Localization: Indonesian language and Rupiah formatting (`id-ID`,
    `IDR`) by default.
-   Privacy: collect only necessary customer data; provide notice and
    purpose; restrict staff access.

## 9. Success metrics

-   Number of submitted inquiries per week/month.
-   Inquiry completion rate (form submissions / form starts, if
    analytics are used).
-   Number of inquiries captured and exported.
-   Percentage of models with verified local OTR prices.
-   Percentage of catalog models with verified current prices and active
    images.
-   Number of outdated/expired promotions still visible (target: zero).

## 10. Acceptance criteria for V1

-   Visitor can browse/filter models and see a detail page with valid
    price disclaimers.
-   Variant and color selection updates the inquiry form correctly.
-   A valid inquiry is saved once, receives a reference ID, and appears
    in admin.
-   Invalid submissions are rejected server-side with understandable
    errors.
-   Admin can manage products, prices, banners, promotions and leads
    without changing code.
-   Expired/unpublished content is not shown publicly.
-   Admin-only operations reject unauthenticated/unauthorized direct
    requests.
-   Simulator calculations match documented test cases and display
    disclaimers.
-   CI passes lint, typecheck, unit/integration tests and production
    build.
-   Mobile layout and basic accessibility checks pass.
