# Technical Architecture

## 1. Recommended stack

-   **Framework:** Next.js App Router + React + TypeScript.
-   **Styling:** Tailwind CSS; reusable accessible UI primitives
    (e.g. shadcn/ui if desired).
-   **Database:** Supabase PostgreSQL.
-   **Authentication:** Supabase Auth for staff/admin accounts only.
-   **Media:** Supabase Storage for model images, banners and promotion
    artwork.
-   **Validation:** Zod shared schemas, with authoritative validation on
    the server.
-   **Forms:** React Hook Form + Zod for complex client-side forms, or
    native server actions where simpler.
-   **Testing:** Vitest for unit tests; Playwright for end-to-end smoke
    tests.
-   **Code quality:** ESLint, Prettier, TypeScript strict mode.
-   **Version control/CI:** GitHub + GitHub Actions.
-   **Hosting:** Vercel for the Next.js app; Supabase for
    DB/Auth/Storage. Confirm pricing, limits, and business ownership
    before production.
-   **Notifications V1:** Admin dashboard plus email notification to a
    configured dealership inbox if desired. WhatsApp handoff is a link
    opened by the user; automated WhatsApp API is future scope.

Supabase's official Next.js guide covers cookie-based auth, PostgreSQL
setup and RLS; its security docs emphasize enabling and correctly
configuring RLS on exposed tables. See links at the end.

## 2. Why this stack

-   Similar to the user's existing Next.js/TypeScript portfolio work and
    Supabase-backed catalog experience.
-   A single codebase can serve public pages, server-side mutations, and
    admin screens.
-   PostgreSQL relational modeling fits models, variants, colors, local
    prices, promotions and leads.
-   Supabase provides managed database, auth and media storage without
    building separate services.
-   Vercel deployment and GitHub CI keep release workflows
    straightforward.

## 3. High-level architecture

``` text
Browser
  ├── Public showroom (SSR/SEO pages)
  ├── Inquiry form
  └── /admin (staff-only UI)
          │
          ▼
Next.js server actions / route handlers
  ├── Validate input (Zod)
  ├── Verify session + role
  ├── Apply business rules
  └── Read/write through server-side data access layer
          │
          ▼
Supabase
  ├── PostgreSQL: catalog, prices, promotions, leads, settings
  ├── Auth: staff identities
  └── Storage: public catalog images / protected admin uploads
```

## 4. Application boundaries

-   Public read access is limited to published catalog content,
    currently active promotions, visible prices and public site
    settings.
-   Public write access is limited to the inquiry submission path. Do
    not allow anonymous clients unrestricted table inserts.
-   Admin writes go through authenticated server-side code and/or
    narrowly scoped database policies.
-   Do not expose Supabase service-role credentials to the browser.
-   Never rely only on hiding admin links or client-side route guards.
    Verify the session and role for every protected mutation and
    sensitive read.
-   Centralize data access and authorization helpers.

## 5. Suggested route map

``` text
/
 /motor
 /motor/[slug]
 /kategori/[slug]
 /harga
 /promo
 /promo/[slug]
 /simulasi-kredit
 /hubungi
 /kebijakan-privasi
 /admin/login
 /admin
 /admin/motor
 /admin/kategori
 /admin/banner
 /admin/promo
 /admin/harga

 /admin/leads
 /admin/leads/[id]
 /admin/pengaturan
```

Use redirects if route names change; avoid creating
article/discussion/chat routes.

## 6. Suggested repository layout

``` text
src/
  app/
    (public)/
    admin/
    actions/
    api/
  components/
    public/
    admin/
    forms/
    ui/
  features/
    catalog/
    pricing/
    promotions/
    inquiries/
    
    settings/
  lib/
    auth/
    db/
    validation/
    formatting/
    security/
  types/
  test/
supabase/
  migrations/
  seed.sql
public/
  images/
docs/
  README.md
  01-product-requirements.md
  ...
```

Adapt to the actual repository conventions instead of blindly moving
files after bootstrapping.

## 7. Price model

Store price values as integer Rupiah (`BIGINT` or safe integer). Never
use floating-point arithmetic for money. Keep prices in a dedicated
table with effective dates and optional city/branch scope. The public
page should show the currently effective price for the selected
location, and show "Hubungi dealer untuk konfirmasi" when no valid price
exists.

## 8. Credit simulation (out of scope for V1)
Do not implement a simulator or display installment estimates in V1. Show only verified local OTR prices. Revisit financing only after explicit owner approval and verified terms.


For a conventional monthly-rate amortizing estimate: -
`principal = max(0, otr_price - down_payment)` - If monthly rate
`r > 0`: `installment = principal * r / (1 - (1 + r)^(-n))` - If
`r = 0`: `installment = principal / n` - Apply only configured
fees/insurance/taxes if the dealership's financing partner has supplied
the correct rules. - Round for display according to agreed policy,
e.g. nearest Rupiah or nearest thousand. - This is not suitable for
every finance product. Some Indonesian financing plans use flat rates,
fees, insurance and other conventions. The owner must approve the
formula and assumptions before public release.


## 9. Integrations

### WhatsApp

V1: build a wa.me link with an encoded message after saving the inquiry.
Use a dealership-owned number configured in settings. Clicking WhatsApp
is not proof of successful contact. Future: WhatsApp Business Platform
integration requires business setup, approved templates/policies where
applicable, secure token storage and webhook handling.

### Email

Optional notification to dealership staff on new lead. Use a
transactional email provider from server-side code; protect credentials
in deployment secrets. Email failure must not discard the saved inquiry.

### Analytics

Use privacy-conscious aggregate analytics if needed. Do not send
phone/email or other personal information to analytics events.

## 10. Reference links

-   Astra Honda: https://www.astra-honda.com/
-   Supabase + Next.js:
    https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
-   Supabase RLS:
    https://supabase.com/docs/guides/database/postgres/row-level-security
-   Supabase Storage access control:
    https://supabase.com/docs/guides/storage/security/access-control
-   Next.js authentication guide:
    https://nextjs.org/docs/app/guides/authentication
