# Honda Satrya Dealer Group Digital Showroom — Documentation Pack

**Status:** Proposed V1 baseline — clarified by dealership owner\
**Product type:** Group-wide public motorcycle catalog + CMS + sales inquiry management\
**Business identity:** **Honda Satrya Dealer Group** (a group operating multiple Honda motorcycle dealerships)\
**Reference:** https://www.astra-honda.com/\
**Important:** Use the reference for layout inspiration and interaction
patterns. Do not copy Astra Honda's source code, exact assets, text,
trademarks beyond authorized dealer use, or imply this is the official
Astra Honda corporate website.

## Confirmed business decisions
- Dealer identity: **Honda Satrya Dealer Group** (group operating multiple Honda motorcycle dealerships).
- Showcase concept: Group-wide digital motorcycle showroom; does not display individual dealership details or a dealership directory in V1.
- Pricing: Applicable area / city-based local OTR prices; do not imply national pricing. No dealership-specific pricing ownership in V1.
- Credit simulation: disabled/out of scope for V1; display verified OTR prices only.
- Inquiry workflow: Customer submits an inquiry including their location (city/regency). The sales administrator reviews inquiries in the protected admin portal, exports to Excel (`.xlsx`), and manually forwards each inquiry to the appropriate nearby dealership. No automated lead routing or CRM sales pipeline in V1.
- Explicit V1 exclusions: No public dealership directory or branch detail pages, no dealership-specific admin roles or branch CRUD, no automated lead routing/notifications.

## Documents

1.  `01-product-requirements.md` — product scope, personas, requirements, acceptance criteria.
2.  `02-technical-architecture.md` — recommended stack, application structure, integrations.
3.  `03-database-schema.md` — proposed PostgreSQL schema, relationships, indexes and RLS.
4.  `04-ux-and-content-spec.md` — routes, page layouts, inquiry and credit simulation behavior.
5.  `05-admin-and-sales-workflows.md` — CMS operations, lead workflow, roles and manual forwarding.
6.  `06-security-privacy-and-operations.md` — security, privacy, backups, deployment and operations.
7.  `07-milestones-and-agent-workflow.md` — phased delivery, gates and AI-agent workflow.
8.  `08-test-and-release-plan.md` — quality strategy, test matrix and release checklist.
9.  `09-agent-project-instructions.md` — starting instructions for an AI coding agent.

## Decisions to validate with the dealership owner

-   Official group contact information, logo assets, group operating hours, and authorized sales WhatsApp/email.
-   Which Honda models and variants the group is authorized/able to sell.
-   Authoritative local on-the-road (OTR) price tables and applicable city coverage.
-   Who owns and updates promotion terms across the group.
-   Which financing partners (if any) can be named, and whether their rates/terms may be published in a future release.
-   Domain, hosting budget, and data retention policy.
-   Consent text and privacy notice reviewed by the business owner/legal adviser.

## Recommended V1 principle

Keep the first release focused on **group catalog → local OTR price → inquiry with location → Excel export → manual dealership forwarding**. Do not build credit simulation, branch management CRUD, or a CRM pipeline in V1.
