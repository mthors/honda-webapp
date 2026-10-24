# Honda Dealership Digital Showroom --- Documentation Pack

**Status:** Proposed V1 baseline — clarified by dealership owner\
**Product type:** Public motorcycle catalog + CMS + sales-lead
management\
**Reference:** https://www.astra-honda.com/\
**Important:** Use the reference for layout inspiration and interaction
patterns. Do not copy Astra Honda's source code, exact assets, text,
trademarks beyond authorized dealer use, or imply this is the official
Astra Honda corporate website.

## Confirmed business decisions
- Dealer identity: **Honda Mega Persada Mandiri**.
- Pricing: dealership-specific local OTR prices; do not imply national pricing.
- Credit simulation: disabled/out of scope for V1; display OTR prices only.
- Lead handling: collect inquiries and provide a simple Excel (.xlsx) export in admin. No full sales CRM pipeline in V1.

## Documents

1.  `01-product-requirements.md` --- product scope, personas,
    requirements, acceptance criteria.
2.  `02-technical-architecture.md` --- recommended stack, application
    structure, integrations.
3.  `03-database-schema.md` --- proposed PostgreSQL schema,
    relationships, indexes and RLS.
4.  `04-ux-and-content-spec.md` --- routes, page layouts, inquiry and
    credit simulation behavior.
5.  `05-admin-and-sales-workflows.md` --- CMS operations, lead pipeline,
    roles and statuses.
6.  `06-security-privacy-and-operations.md` --- security, privacy,
    backups, deployment and operations.
7.  `07-milestones-and-agent-workflow.md` --- phased delivery, gates and
    AI-agent workflow.
8.  `08-test-and-release-plan.md` --- quality strategy, test matrix and
    release checklist.
9.  `09-agent-project-instructions.md` --- starting instructions for an
    AI coding agent.

## Decisions to validate with the dealership owner

-   Dealer business name, logo, address, opening hours, official sales
    WhatsApp and email.
-   Which Honda models and variants the dealership is authorized/able to
    sell.
-   Who supplies authoritative local on-the-road (OTR) prices, and how
    frequently they change.
-   Whether prices differ by city, district, or dealer outlet.
-   Who owns and updates promotion and financing terms.
-   Which financing partners (if any) can be named, and whether their
    rates/terms may be published.
-   Lead owner(s), staff roles, and whether staff need separate
    accounts.
-   Domain, hosting budget, and data retention policy.
-   Consent text and privacy notice reviewed by the business owner/legal
    adviser.

## Recommended V1 principle

Keep the first release focused on **catalog → local OTR price → inquiry → Excel export**. Do not build credit simulation or a full lead-management CRM in V1. Keep the database structured so the owner can request enhancements later.
