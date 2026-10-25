# UX, Routes and Content Specification

## 1. Design direction

Use `DESIGN.md` as the project's visual authority. Aim for a premium,
clean, product-first Honda motorcycle experience for **Honda Satrya Dealer Group**
inspired by Astra Honda's navigation, generous whitespace, large motorcycle photography,
category browsing and prominent price/CTA patterns.

Do not reproduce Astra Honda's exact page source, full layouts
pixel-for-pixel, copy, image assets, or claim the site is
operated by AHM. Use authorized dealer group assets and a distinct
Honda Satrya Dealer Group identity.

## 2. Public navigation

Suggested header: - Logo/group identity - Motor - Daftar Harga -
Promo - Tentang & Kontak - Primary CTA:
WhatsApp / Tanya Sales

No article, discussion, comment, chat or community navigation.

## 3. Homepage sections

1.  Header and primary navigation.
2.  Scrollable hero carousel (desktop/mobile image support, dots/arrows,
    touch swipe, pause/reduced-motion support).
3.  Featured/new motorcycles.
4.  Browse by category.
5.  Current promotions.
6.  Why buy from Honda Satrya Dealer Group (only verified benefits; group-wide showcase).
7.  Applicable area coverage if supplied by owner (no public dealership directory or branch detail pages in V1).
8.  Contact/WhatsApp CTA.
9.  Footer with group contact info, hours, privacy policy and social links.

Admin should control banner order, status, active date window and CTA.
If no banner is active, show a designed fallback rather than an empty
section.

## 4. Catalog page

-   Search by model name.
-   Filter by category and optionally price range.
-   Sort by featured, newest, name or price.
-   Card content: image, model name, starting/current local price,
    optional badge, CTA.
-   Do not display a price if no valid current price is available; show
    "Hubungi untuk harga terbaru."
-   Filters should work on mobile and preserve query state where useful.

## 5. Model detail page

-   Breadcrumb and model title.
-   Image gallery with meaningful alt text.
-   Available variants and color swatches tied to actual available
    combinations.
-   Specs table using verified data.
-   Local price per variant or "mulai dari" where supported by data.
-   Active promotion related to the model.
-   Credit simulator (disabled for V1) panel or link.
-   Sticky/mobile-friendly "Tanya via WhatsApp" and "Ajukan Pertanyaan"
    CTAs.
-   Price disclaimer and availability note.
-   Related models only if curated/available.

## 6. Price list

-   Show category/model/variant/price and location context.
-   Provide city selector only if the dealership genuinely maintains
    different city-specific prices.
-   Display "Harga dapat berubah sewaktu-waktu. Konfirmasi harga dan
    ketersediaan kepada dealer."
-   Provide inquiry CTA per row/card.
-   Make effective dates and last-updated timestamp available to admins;
    optionally show a customer-friendly update label.

## 7. Promotion page

-   Show only published promotions inside their start/end window.
-   Each promotion has title, image, short summary, terms, date window
    and eligible models.
-   Expired promotions must not appear as active; optionally display a
    separate expired archive only if owner requests it.
-   Terms should be provided and approved by the dealership, not
    invented by developers.

## 8. Inquiry form

### Fields

-   Full name (required).
-   WhatsApp number (required).
-   Email (optional unless the business specifically needs it).
-   City/regency (required; Indonesian place names such as Sidoarjo). Used by the sales administrator to determine the appropriate nearby dealership.
-   District/subdistrict (optional).
-   Motorcycle model (prefilled when submitted from a product page).
-   Variant/type (filtered by selected model).
-   Preferred color (filtered by selected variant).
-   Optional message.
-   Privacy notice/consent acknowledgement (required).
-   Hidden attribution fields: source page and campaign,
    validated/sanitized server-side.

### Behavior

-   Keep entered values if validation fails.
-   Validate on client for usability and on server for security.
-   Prevent duplicate submission on repeated clicks where possible.
-   After success, show a lead reference and clear next steps.
-   If opening WhatsApp, create a prefilled message using the saved
    reference; do not put email/phone beyond what is necessary into URL
    analytics.
-   Do not expose lead details to other visitors.

### Example WhatsApp message

"Hi, saya baru mengirim pertanyaan melalui website Honda Satrya Dealer Group.
Referensi: \[LEAD-REFERENCE\]. Saya tertarik dengan \[MODEL\] varian
\[VARIANT\], warna \[COLOR\]. Mohon informasi lebih lanjut." Use a
group-configured number; URL-encode the message.

## 9. Credit simulation (out of scope for V1)

Do not display a simulator, monthly installment estimate, finance-rate input, tenor selector or financing CTA. The public site displays verified local OTR prices only. A future simulator requires explicit owner approval and verified finance terms.

## 10. Admin UX

-   Separate admin shell with sidebar, page title, breadcrumbs, table
    filters and clear status badges.
-   Align color, typography, borders and identity with the public brand,
    while keeping admin forms and tables dense and operationally
    efficient.
-   Include empty, loading, success, validation and error states.
-   Use confirmation dialogs for archive/delete/publish actions.
-   Prefer archive/unpublish over destructive deletion for models with
    historical leads/prices.
-   Support preview before publishing banners, prices and promotions.

## 11. Indonesian copy conventions

The actual website UI and admin panel must be written in natural Bahasa Indonesia. Keep code identifiers and technical implementation naming in English. This includes validation errors, loading/empty states, buttons, accessibility labels and privacy consent text.


-   Language: Bahasa Indonesia.
-   Currency: `Rp 19.500.000` style; consistently format with
    `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`.
-   Dates: Indonesian locale and clear timezone behavior.
-   Use "harga OTR" only when the dealership has verified the applicable
    location and meaning.
-   Do not promise stock, delivery dates, discount amounts, financing
    eligibility or warranty terms unless verified.
