# Test and Release Plan

## 1. Test layers

-   Unit: price formatting, slug generation, credit calculations,
    validation and status transitions.
-   Integration: repository/data access, server actions, RLS and role
    checks.
-   E2E: public catalog → model detail → inquiry → admin lead handling.
-   Manual: visual review, touch carousel, mobile forms, actual
    email/WhatsApp handoff and CMS workflow.
-   Security: anonymous access, direct action invocation, role
    escalation attempts, upload validation and abuse throttling.

## 2. Critical acceptance test matrix

  -----------------------------------------------------------------------
  ID                      Scenario                Expected result
  ----------------------- ----------------------- -----------------------
  T01                     Open homepage with      Correct banner order
                          active banners          and CTA; carousel works
                                                  on mobile

  T02                     No active banners       Designed fallback
                                                  appears

  T03                     Browse catalog and      Only matching published
                          filter category         models appear

  T04                     Open draft/archived     Not publicly exposed;
                          model URL               appropriate not-found
                                                  behavior

  T05                     Model has no valid      No stale/expired price
                          current price           displayed

  T06                     Choose variant then     Only valid color
                          color                   choices are selectable

  T07                     Submit valid inquiry    Lead saved once;
                                                  reference displayed;
                                                  admin sees it

  T08                     Submit malformed        Server rejects with
                          email/phone or missing  clear validation
                          required fields         feedback

  T09                     Alter                   Server rejects
                          model/variant/color IDs inconsistent
                          in request              combination

  T10                     Anonymous user attempts Denied; no customer
                          to query leads          data returned

  T11                     Sales user attempts to  Denied
                          manage staff or         
                          financing config        

  T12                     Content manager         Banner appears only
                          publishes a banner      within configured date
                                                  window

  T13                     Promotion end time      Promotion no longer
                          passes                  appears active

  T14                     Credit DP below zero or Input rejected
                          above price             

  T15                     Credit tenor not in     Request rejected
                          approved list           

  T16                     Credit configuration is Estimate hidden or
                          missing/expired         safely disabled

  T17                     Email notification      Lead still saved;
                          provider fails          failure logged safely

  T18                     Upload unsupported file Upload rejected
                          type/oversized file     

  T19                     Narrow viewport and     Core navigation/form
                          keyboard-only           controls remain usable
                          navigation              

  T20                     Production build and CI Lint, typecheck, tests
                                                  and build pass
  -----------------------------------------------------------------------

## 3. Example unit cases for simulator

Use fixed, owner-approved assumptions in tests. Include: - Principal
zero. - DP equals price. - DP is negative. - DP exceeds price. - Zero
interest. - Positive monthly rate and tenor. - Unsupported tenor. -
Missing/expired configuration. - Fee inclusion/exclusion. - Rounding
behavior. - Large Rupiah values without floating-point currency errors.

The expected installment values must be calculated independently and
reviewed. Do not use invented real finance-company rates as test
defaults.

## 4. Pre-release checklist

### Product/content

-   [ ] Dealer name/logo/contact details approved.
-   [ ] All motorcycle names, variants, colors and specifications
    verified.
-   [ ] All visible prices have a source, location scope and effective
    date.
-   [ ] Promotion terms and active dates approved.
-   [ ] Images have appropriate usage rights and alt text.
-   [ ] Credit assumptions and disclaimer approved, or simulator
    disabled.
-   [ ] Privacy notice approved.

### Engineering

-   [ ] Environment variables configured outside Git.
-   [ ] Production RLS/policies reviewed.
-   [ ] Admin and sales permissions tested by role.
-   [ ] Rate limiting and validation active for inquiry endpoint.
-   [ ] CI green: lint, typecheck, tests, build.
-   [ ] No critical browser console/network errors.
-   [ ] SEO title, descriptions, sitemap and robots policy verified.
-   [ ] Backup and restore procedure documented.
-   [ ] Error monitoring and contact for incidents established.

### Operations

-   [ ] Staff accounts created securely.
-   [ ] Staff trained to access and handle inquiry Excel exports securely.
-   [ ] Email notifications verified if enabled.
-   [ ] WhatsApp handoff tested on a real mobile device.
-   [ ] Owner knows how to change price/banner/promotion.
-   [ ] Rollback/redeployment process tested.

## 5. Release approach

1.  Deploy staging from a reviewed commit.
2.  Load synthetic test content and test inquiries.
3.  Run automated suite and manual UAT.
4.  Fix issues and repeat regression.
5.  Confirm production environment and migration order.
6.  Deploy production.
7.  Run a short smoke test without generating unnecessary real customer
    data.
8.  Monitor lead creation and errors after launch.
