# Security, Privacy and Operations

## 1. Data classification

### Public

Published catalog fields, public model images, active prices, active
promotions, public contact details and privacy notice.

### Internal

Draft content, internal price source notes, financing configuration
before publication, staff accounts, audit logs and lead notes.

### Personal/customer data

Name, WhatsApp number, email, city, selected product, messages, lead
history and financing simulation details. Restrict to authorized staff; in V1, inquiry records and Excel exports are available only to authorized admin users.

## 2. Security requirements

-   No public admin registration. Create staff accounts through an
    admin-controlled process.
-   Verify authentication and role for every protected server action,
    route handler and sensitive read.
-   Never expose service-role keys or email provider secrets to browser
    code.
-   Enable RLS on all exposed Supabase tables; review grants and
    policies table-by-table.
-   Public visitors must not be able to query the lead table or internal
    notes/history.
-   Prefer server-side lead submission with schema validation,
    throttling, anti-spam controls and generic failure responses.
-   Add honeypot and/or CAPTCHA only after weighing usability and
    privacy.
-   Validate and normalize every submitted field on the server.
-   Restrict upload MIME types, file size, dimensions and storage paths.
    Do not trust user-supplied filenames.
-   Use HTTPS in production and secure session/cookie configuration from
    the chosen auth integration.
-   Protect against XSS by avoiding unsafe HTML rendering; sanitize any
    rich content if it is introduced.
-   Avoid logging secrets, authentication tokens, full customer forms or
    complete WhatsApp/email values.
-   Use dependency updates and GitHub secret scanning where available.

## 3. Privacy checklist

-   Publish a privacy notice identifying the dealership/business,
    collected fields, purpose, access, retention/contact method and
    relevant rights/process.
-   Ask for acknowledgement before collecting a lead; store the consent
    timestamp and notice version if practical.
-   Collect only data necessary to respond to the inquiry.
-   Explain that WhatsApp contact may be handled by an external service.
-   Do not send personal information to analytics providers.
-   Define a retention period for leads and a deletion/anonymization
    process.
-   Restrict exports and record who exported data if exports are
    supported.
-   Have the business owner obtain appropriate Indonesian privacy/legal
    review, including applicable Personal Data Protection Law
    requirements. This document is an engineering checklist, not legal
    advice.

## 4. Anti-abuse

-   Rate-limit lead submissions by a combination of IP/session signals
    and time window, without retaining more data than necessary.
-   Add duplicate-submission protection and server-generated reference
    IDs.
-   Enforce sensible maximum lengths for every field.
-   Reject unexpected fields and invalid model/variant/color
    relationships.
-   Never accept arbitrary prices or credit rates from the browser as
    trusted values; recompute from server-approved configuration.
-   Monitor repeated failures and abnormal request volume.

## 5. Backup and recovery

-   Confirm database backup/PITR capabilities for the chosen Supabase
    plan before production.
-   Export and securely retain periodic database backups according to
    budget and retention requirements.
-   Keep schema migrations and seed data in Git; never treat a
    developer's local database as the only source of truth.
-   Test restore steps before relying on backups.
-   Store source images and content assets in controlled storage;
    document recovery of Storage assets as well as PostgreSQL.

## 6. Deployment environments

-   Local development: `.env.local`, local/test data, no production
    secrets.
-   Preview/staging: separate environment and preferably separate
    Supabase project; use synthetic lead data.
-   Production: production domain, HTTPS, approved privacy text, real
    staff accounts, restricted secrets, backups and monitoring.
-   Document environment variables in `.env.example` without real
    values.
-   Avoid running destructive migrations directly against production
    without review and a recovery plan.

## 7. Operations checklist

-   Named owner for prices and promotions.
-   Named owner for incoming leads.
-   Staff account offboarding process.
-   Regular dependency updates and review of admin access.
-   Check expired banners/promotions and missing local OTR prices weekly.
-   Confirm lead notifications and database backups periodically.
-   Have a contact path for reporting incorrect prices or privacy
    issues.
