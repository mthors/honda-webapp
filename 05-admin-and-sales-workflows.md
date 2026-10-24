# Admin CMS and Sales Workflows

## 1. Roles and permissions

V1 can use a single protected `admin` role to keep operations simple.

| Capability | Admin |
|---|---:|
| Manage categories, models, variants, colors and images | Yes |
| Manage local OTR prices | Yes |
| Manage banners and promotions | Yes |
| Manage dealership settings | Yes |
| View inquiry records | Yes |
| Download inquiry Excel workbook | Yes |
| Manage staff accounts | Optional; only if needed |
| Credit simulation configuration | Not in V1 |
| Lead assignment/status/notes pipeline | Not in V1 |

Enforce permissions server-side. Downloaded spreadsheets contain personal data and must be handled securely.

## 2. Catalog publishing workflow

1.  Content manager creates a model in `draft`.
2.  Adds category, verified specifications, model images and SEO
    metadata.
3.  Adds variants and valid variant/color combinations.
4.  Adds price entries with location and effective date.
5.  Preview the public detail page.
6.  Confirm asset rights, price source and accuracy.
7.  Publish.
8.  Verify the public page and price card.
9.  Update or archive when discontinued; do not hard-delete records
    referenced by leads.

## 3. Price update workflow

1.  Open the price management screen.
2.  Select model, variant, location and price type.
3.  Enter amount, valid-from date and optional end date.
4.  Record an internal source/update note.
5.  Validate no conflicting effective period exists.
6.  Preview public display and disclaimer.
7.  Publish; record actor and timestamp.
8.  Confirm price list and product page.
9.  If an error is discovered, add a corrected effective-dated entry and
    audit the correction.

## 4. Banner/promotion workflow

1.  Upload optimized desktop/mobile imagery and useful alt text.
2.  Enter title, summary, CTA, destination and schedule.
3.  Select eligible models for a promotion.
4.  Confirm legal/offer terms with the owner.
5.  Preview on mobile and desktop.
6.  Publish and verify active date logic.
7.  Ensure scheduled/expired content is not shown publicly.

## 5. Inquiry handling workflow (V1)
1. Visitor submits the inquiry form.
2. Server validates the fields and saves the inquiry.
3. Inquiry appears in a protected admin list.
4. Authorized admin downloads the inquiry list as an Excel (`.xlsx`) file.
5. Staff follows up outside the system using the exported data and the dealership's normal process.

V1 intentionally does not include assignment, status changes, internal notes, follow-up reminders, or sales conversion tracking. Add these only if the owner requests them after reviewing the first release.

## 6. Basic admin dashboard

Recommended cards: - New leads today / last 7 days. - Leads awaiting
first contact. - Leads by status. - Most requested models. - Leads by
city/regency. - Active promotions and promotions ending soon. - Catalog
items missing valid prices.

Avoid vanity metrics that cannot be calculated reliably. Do not equate
WhatsApp link clicks with successful conversations or sales.

## 7. Notification behavior

-   Save the lead first; notification delivery is a separate step.
-   If email notification fails, the lead remains saved and visible.
-   Log notification outcome without duplicating personal details.
-   Do not send automated WhatsApp messages in V1 unless a compliant
    official integration is deliberately implemented.
-   Staff should not rely solely on email notifications; admin inbox is
    the source of truth.

## 8. Content governance

-   Assign a person responsible for price accuracy.
-   Assign a person responsible for promotion terms and expiry dates.
-   Use explicit publish/preview controls.
-   Credit simulation is disabled; do not publish installment estimates or financing assumptions.
-   Periodically audit missing images, expired prices, expired
    promotions and leads without follow-up.
