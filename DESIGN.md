---
version: alpha
name: Astra-honda
description: |
  The Honda design system embodies energetic modernism with a focus on precision
  and accessibility. The palette is anchored by a vibrant brand red (#E61B33)
  that commands attention across CTAs and interactive moments, while a carefully
  curated neutral scale (#282828, #4F4F4F) provides calm, readable surfaces.
  Typography is geometric and clean, relying on Manrope's friendly weight
  distribution to balance technical product information with approachable
  marketing copy. Depth emerges through colour blocking rather than
  shadows—alternating light and dark bands create visual rhythm without visual
  noise. The overall effect is confident, contemporary, and built for rapid
  scanning on both desktop and mobile.
source:
  url: "https://www.astra-honda.com/"
  pagesAnalyzed: 1
  extractedAt: 2026-10-24
  tokensMeasured: true
colors:
  primary: "#E61B33"
  canvas: "#FFFFFF"
  surface-alt: "#282828"
  on-primary: "#FFFFFF"
  ink: "#282828"
  body: "#4F4F4F"
  muted: "#727272"
  hairline: "#DBDBDB"
  neutral-1: "#000000"
  neutral-2: "#EFEFEF"
  neutral-3: "#3C3C3C"
typography:
  heading-xl:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
  heading-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
  heading-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
  heading-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0px
  heading-xs:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
  heading-xs-capitalize:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0px
    textTransform: capitalize
  body-md:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: 0px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
  body-sm-loose:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 2
    letterSpacing: 0px
  body-sm-capitalize:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0px
    textTransform: capitalize
  body-sm-strong:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: 0px
  body-xs:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: 0px
  button:
    fontFamily: sans-serif
    fontSize: 14px
    fontWeight: 400
    letterSpacing: 0px
  label:
    fontFamily: arial
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0px
  caption-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.6
    letterSpacing: 0px
  caption-xs:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: 0px
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 10px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 28px
  xxxl: 32px
  section: 36px
  band: 40px
borderWidths:
  thin: 1px
elevationStrategy: color-blocking
themes:
  derived: dark   # the other theme is the site's measured palette
  light:
    bg: "#FFFFFF"
    surface: "#282828"
    surfaceRaised: "#282828"
    text: "#282828"
    textMuted: "#4F4F4F"
    border: "#DBDBDB"
    accent: "#E61B33"
    accentFg: "#FFFFFF"
    focusRing: "#E61B33"
    elevation: shadow
  dark:
    bg: "#140A0C"
    surface: "#22191B"
    surfaceRaised: "#2E2527"
    text: "#FEF6F7"
    textMuted: "#A59C9E"
    border: "#3A3133"
    accent: "#E82D43"
    accentFg: "#0B0B0C"
    focusRing: "#E61B33"
    elevation: "border+surface"
  contrastFailures:
    - "light: text on surface = 1:1 (needs 4.5:1)"
components:
  button-primary:
    textColor: "{colors.on-primary}"
    padding: "12px 25px 12px 25px"
    fontSize: 14px
    boxShadow: "rgba(0, 0, 0, 0.3) 0px 2px 3px 0px"
    fontFamily: Manrope
    fontWeight: 500
    lineHeight: 1.6
    rounded: "{rounded.md}"
    backgroundColor: "{colors.primary}"
  button-secondary:
    typography: "{typography.body-sm-strong}"
    textColor: "{colors.on-primary}"
    height: 42.3906px
    padding: "10px 20px 10px 20px"
    rounded: "{rounded.md}"
    backgroundColor: "{colors.surface-alt}"
  button-icon:
    textColor: "{colors.on-primary}"
    height: 28px
    fontSize: 14px
    fontFamily: system
    fontWeight: 400
    lineHeight: 1
    rounded: "50%"
    backgroundColor: "rgba(40, 40, 40, 0.3)"
  button-icon-sm:
    typography: "{typography.button}"
    textColor: "{colors.neutral-1}"
    height: 10px
    padding: "10px 5px 10px 5px"
    rounded: "100%"
    backgroundColor: "{colors.primary}"
  button-outline:
    typography: "{typography.body-sm-strong}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    height: 38px
    padding: "2px 15px 2px 15px"
    rounded: "{rounded.md}"
  card:
    typography: "{typography.body-sm}"
    textColor: "{colors.muted}"
    padding: "20px 20px 20px 20px"
    backgroundColor: "rgb(250, 250, 250)"
  card-lg:
    typography: "{typography.body-sm}"
    textColor: "{colors.muted}"
  link:
    typography: "{typography.body-sm}"
    textColor: "{colors.primary}"
  link-2:
    textColor: "{colors.on-primary}"
    fontSize: 15px
    fontFamily: Manrope
    fontWeight: 700
    lineHeight: 1.6
states:
  other-focus:
    target: other
    state: focus
    outline: none
    boxShadow: none
    borderColor: "transparent transparent transparent currentcolor"
    borderWidth: "1px 1px 1px medium"
  nav-hover:
    target: nav
    state: hover
    textColor: "{colors.primary}"
  link-hover:
    target: link
    state: hover
    textColor: "{colors.primary}"
  other-hover:
    target: other
    state: hover
    filter: "invert(0) sepia(1) saturate(83) hue-rotate(25deg)"
  button-hover:
    target: button
    state: hover
    textColor: "{colors.on-primary}"
    backgroundColor: "{colors.primary}"
  link-focus:
    target: link
    state: focus
    outline: "dotted thin"
    outlineWidth: thin
  button-focus:
    target: button
    state: focus
    outline: "lightblue solid 1px"
    outlineColor: lightblue
    outlineWidth: 1px
  other-active:
    target: other
    state: active
    outline: none
breakpoints:
  - width: 375
    containerWidth: 345
    gridColumns: 5
    navLinksVisible: 6
    menuToggleVisible: false
    headingPx: 28
    bodyPx: 14
    sectionPaddingX: 15
  - width: 768
    containerWidth: 708
    gridColumns: 6
    navLinksVisible: 6
    menuToggleVisible: false
    headingPx: 32
    bodyPx: 14
    sectionPaddingX: 30
  - width: 1024
    containerWidth: 964
    gridColumns: 6
    navLinksVisible: 6
    menuToggleVisible: false
    headingPx: 32
    bodyPx: 14
    sectionPaddingX: 30
  - width: 1280
    containerWidth: 1120
    gridColumns: 6
    navLinksVisible: 6
    menuToggleVisible: false
    headingPx: 32
    bodyPx: 14
    sectionPaddingX: 80
  - width: 1440
    containerWidth: 1400
    gridColumns: 6
    navLinksVisible: 6
    menuToggleVisible: false
    headingPx: 32
    bodyPx: 14
    sectionPaddingX: 80
coverage:
  statesFound: 33
  gradientsFound: 0
  rolesUnassigned: 3
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: false
---

# Design System Inspired by Honda

## 1. Visual Theme & Atmosphere

The Honda design system embodies energetic modernism with a focus on precision and accessibility. The palette is anchored by a vibrant brand red (`{colors.primary}` — `#E61B33`) that commands attention across CTAs and interactive moments, while a carefully curated neutral scale (`{colors.surface-alt}` — `#282828`, `{colors.body}` — `#4F4F4F`) provides calm, readable surfaces. Typography is geometric and clean, relying on Manrope's friendly weight distribution to balance technical product information with approachable marketing copy. Depth emerges through colour blocking rather than shadows—alternating light and dark bands create visual rhythm without visual noise. The overall effect is confident, contemporary, and built for rapid scanning on both desktop and mobile.

**Key Characteristics**

- Vibrant brand red as the sole accent, deployed strategically for conversion and micro-interactions
- Generous whitespace and neutral grounds to reduce cognitive load
- Sharp corners (0px radius) on cards and surfaces; pill-shaped buttons for friendly CTAs
- Colour-blocking elevation strategy — depth through surface change, not shadow
- Type-forward hierarchy using weight shifts within a single typeface family
- Touch-friendly interactive targets with visible hover and focus states
- Mobile-first responsive structure that collapses gracefully from 1280px down to 375px

---

## 2. Color Palette & Roles

### Primary

- **Brand / Primary CTA** (`{colors.primary}` — `#E61B33`): Primary buttons, active navigation highlights, brand accent, primary links, and high-priority CTAs. Drives all conversion moments. Hover state intensifies slightly to `#E72233`.

### Interactive

- **Link Default** (`{colors.primary}` — `#E61B33`): All standard hyperlinks render in brand red with underline on hover.

### Neutral Scale

- **Canvas / On Primary** (`{colors.canvas}` — `#FFFFFF`): Default page background, card backgrounds, and text/icon colour on brand-red surfaces (buttons, hero bands).
- **Surface Alt / Ink** (`{colors.surface-alt}` — `#282828`): Alternating section bands, primary headings, heavy text emphasis, and dark-mode UI elements.
- **Body** (`{colors.body}` — `#4F4F4F`): Default body copy, list items, and standard paragraph text.
- **Muted** (`{colors.muted}` — `#727272`): Captions, secondary metadata, helper text, and de-emphasized copy.
- **Hairline** (`{colors.hairline}` — `#DBDBDB`): 1px borders, dividers, and input field outlines.

### Surface & Borders

- **Neutral Decorative 1** (`{colors.neutral-1}` — `#000000`): Pure black; used in select icon or graphic overlays (no measured UI role).
- **Neutral Decorative 2** (`{colors.neutral-2}` — `#EFEFEF`): Light grey; subtle background tints and disabled states (no measured UI role).
- **Neutral Decorative 3** (`{colors.neutral-3}` — `#3C3C3C`): Dark charcoal; secondary dark surfaces and button variants (no measured UI role).

---

## 3. Typography Rules

### Font Family

**Primary:** Manrope (sans-serif)  
Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Secondary (inputs, labels):** Arial (sans-serif)  
Fallback: `sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display XL | Manrope | 32px | 600 | 1.2 | 0px | H1; primary page title |
| Display LG | Manrope | 28px | 600 | 1.2 | 0px | H2; major section header |
| Display MD | Manrope | 24px | 600 | 1.2 | 0px | H3; secondary section header |
| Heading SM | Manrope | 20px | 700 | 1.2 | 0px | H6; tertiary callouts |
| Heading XS | Manrope | 16px | 600 | 1.2 | 0px | H5; card titles, form labels |
| Heading XS Capitalize | Manrope | 16px | 600 | 1.2 | 0px | H4; title-case labels (text-transform: capitalize) |
| Body MD | Manrope | 15px | 600 | 1.6 | 0px | Emphasis text, strong callouts |
| Body SM Strong | Manrope | 14px | 700 | 1.6 | 0px | Bold body emphasis, sub-headings |
| Body SM | Manrope | 14px | 400 | 1.6 | 0px | Standard body copy, list items |
| Body SM Capitalize | Manrope | 14px | 400 | 1.6 | 0px | Capitalize role links and UI text (text-transform: capitalize) |
| Body SM Loose | Manrope | 14px | 400 | 2.0 | 0px | Relaxed body copy with increased line spacing |
| Body XS | Manrope | 12px | 600 | 1.6 | 0px | Small emphasis, metadata |
| Caption SM | Manrope | 12px | 300 | 1.6 | 0px | Fine print, credits, timestamps |
| Caption XS | Manrope | 10px | 500 | 1.6 | 0px | Micro copy, badges, footnotes |
| Button | sans-serif | 14px | 400 | – | 0px | Interactive button text |
| Label | Arial | 16px | 400 | 1.4 | 0px | Form input labels |

### Principles

- **Single typeface philosophy:** Manrope carries all text hierarchy; weight and size do the heavy lifting, not font switching.
- **High line-height for body:** 1.6 and 2.0 line heights ensure comfortable reading at 14–15px sizes on small screens.
- **Capitalization as semantic signal:** `text-transform: capitalize` variants signal UI chrome (links, form controls) vs. editorial content.
- **No negative tracking:** All letter-spacing is 0px; the geometric proportions of Manrope render clearly at all sizes without compression.
- **Accessible contrast:** All text colours meet WCAG AA on their assigned backgrounds (brand red on white, dark grey on white, etc.).

---

## 4. Component Stylings

### Buttons

#### Primary

- **Font:** Manrope, 14px, weight 500
- **Text Color:** `#FFFFFF`
- **Background:** `{colors.primary}` — `#E61B33`
- **Padding:** `{spacing.sm}` (12px) vertical, `{spacing.lg}` (20px) horizontal → `12px 25px`
- **Border Radius:** `{rounded.md}` — `10px`
- **Border:** None
- **Box Shadow:** `0px 2px 3px 0px rgba(0, 0, 0, 0.3)`
- **Hover State:** Background shifts to `#E72233`, text remains white, slight downward shift `translateY(2px)`

#### Secondary

- **Font:** Manrope, 14px, weight 700
- **Text Color:** `#FFFFFF`
- **Background:** `{colors.surface-alt}` — `#282828`
- **Padding:** `10px 20px`
- **Border Radius:** `{rounded.md}` — `10px`
- **Border:** None
- **Box Shadow:** None
- **Hover State:** Background brightens to `#282828` (no visible change; secondary is stable)

#### Outline

- **Font:** Manrope, 14px, weight 700
- **Text Color:** `{colors.surface-alt}` — `#282828`
- **Background:** Transparent (`rgba(0, 0, 0, 0)`)
- **Padding:** `2px 15px`
- **Border Radius:** `{rounded.md}` — `10px`
- **Border:** `1px solid {colors.hairline}` — `1px solid #DBDBDB`
- **Box Shadow:** None
- **Hover State:** Background becomes white with shadow `0px 4px 25px rgba(0, 0, 0, 0.1)`, border remains `1px solid #DBDBDB`, text shifts to brand red

#### Icon

- **Font:** system, 14px, weight 400
- **Text Color:** `#FFFFFF`
- **Background:** `rgba(40, 40, 40, 0.3)` — semi-transparent dark grey
- **Width/Height:** `28px × 28px`
- **Padding:** `0px`
- **Border Radius:** `{rounded.full}` — `50%`
- **Border:** None
- **Box Shadow:** None

#### Icon Small

- **Font:** sans-serif, 14px, weight 400
- **Text Color:** `#000000`
- **Background:** `{colors.primary}` — `#E61B33`
- **Width/Height:** `10px × 10px`
- **Padding:** `10px 5px`
- **Border Radius:** `{rounded.full}` — `100%`
- **Border:** None
- **Box Shadow:** None

### Cards & Containers

#### Default Card

- **Font:** Manrope, 14px, weight 400
- **Text Color:** `{colors.muted}` — `#727272`
- **Background:** `#FAFAFA` (off-white, very light neutral)
- **Padding:** `{spacing.md}` — `20px`
- **Border Radius:** `{rounded.none}` — `0px`
- **Border:** None
- **Box Shadow:** None
- **Width:** Typically 256px; constrained by grid

#### Default Card Large

- **Font:** Manrope, 14px, weight 400
- **Text Color:** `{colors.muted}` — `#727272`
- **Background:** Transparent (`rgba(0, 0, 0, 0)`)
- **Padding:** `0px`
- **Border Radius:** `{rounded.none}` — `0px`
- **Border:** None
- **Box Shadow:** None
- **Width:** ~830px (hero / full-width container)
- **Notes:** Used for large editorial or product showcase zones

### Inputs & Forms

#### Text Input

- **Font:** Arial, 16px, weight 400
- **Text Color:** Inherits from input value
- **Background:** `{colors.canvas}` — `#FFFFFF`
- **Padding:** Standard form spacing (typically `10px`)
- **Border Radius:** `{rounded.none}` — `0px`
- **Border:** `1px solid {colors.hairline}` — `1px solid #DBDBDB`
- **Focus State:** Outline `1px solid lightblue`, no box shadow (lightblue provides focus affordance)
- **Notes:** Sharp corners; line-height 1.4 ensures readable label text

### Navigation

#### Default Navigation

- **Font:** Manrope, 14px, weight 400
- **Text Color:** `{colors.muted}` — `#727272`
- **Background:** Transparent
- **Padding:** `0px`
- **Border Radius:** `{rounded.none}` — `0px`
- **Hover State:** Text shifts to `{colors.primary}` — `#E61B33`; background shifts to `{colors.surface-alt}` — `#282828`

### Links

#### Default Link

- **Font:** Manrope, 14px, weight 400
- **Text Color:** `{colors.primary}` — `#E61B33`
- **Background:** Transparent
- **Padding:** `0px`
- **Border Radius:** `{rounded.none}` — `0px`
- **Hover State:** Text colour remains red; text-decoration: none; outline removed
- **Focus State:** `outline: dotted thin` appears, then clears on hover

#### Default Link (Inverse / On Dark)

- **Font:** Manrope, 15px, weight 700
- **Text Color:** `{colors.canvas}` — `#FFFFFF`
- **Background:** Transparent
- **Padding:** `0px`
- **Border Radius:** `{rounded.none}` — `0px`
- **Hover State:** Text colour shifts to `{colors.surface-alt}` — `#282828`

---

## 5. Layout Principles

### Spacing System

Base unit: `{spacing.xs}` — `8px`

Full scale (multiples of 8px):
- `{spacing.xxs}` — `4px` (micro spacing between inline elements)
- `{spacing.xs}` — `8px` (tight padding, small gaps)
- `{spacing.sm}` — `12px` (compact sections)
- `{spacing.md}` — `16px` (standard padding, component internals)
- `{spacing.lg}` — `20px` (comfortable button padding, card padding)
- `{spacing.xl}` — `24px` (section separation)
- `{spacing.xxl}` — `28px` (large block spacing)
- `{spacing.xxxl}` — `32px` (major vertical spacing)
- `{spacing.section}` — `36px` (between major sections)
- `{spacing.band}` — `40px` (full-width band padding)

**Usage Context:**
- Button internal padding: `{spacing.sm}` (12px) vertical, `{spacing.lg}` (20px) horizontal
- Card padding: `{spacing.lg}` (20px)
- Form field padding: `{spacing.md}` (16px)
- Section margins (vertical): `{spacing.band}` (40px)
- Horizontal padding (mobile): `{spacing.md}` (16px)
- Horizontal padding (desktop): `{spacing.band}` (40px) to `80px` at 1280px+

### Grid & Container

- **Max Content Width:** Measured at 1440px viewport = 1400px content column
- **Columns:** 6-column grid at all breakpoints (no mobile-to-desktop column count shift)
- **Gutter:** Consistent spacing maintained via percentage-based padding
- **Container Padding:**
  - 375px (mobile): `{spacing.md}` (16px) sides → 345px content width
  - 768px (tablet): `{spacing.md}` × 2 (30px) sides → 708px content width
  - 1024px (laptop): `{spacing.md}` × 2 (30px) sides → 964px content width
  - 1280px+: `80px` sides → ~1120–1400px content width

### Whitespace Philosophy

Spacing is abundant and deliberate. Section bands (40px padding) separate editorial zones; internal card padding (16–20px) ensures breathing room around copy. Negative space is treated as a design element, not wasted real estate. Vertical rhythm follows the spacing scale; no arbitrary gaps break the 8px baseline.

### Border Radius Scale

- `{rounded.none}` — `0px`: Cards, containers, images, overlays, inputs (sharp modernism)
- `{rounded.xs}` — `2px`: Badges, micro UI elements (barely perceptible softness)
- `{rounded.sm}` — `4px`: Secondary UI components (subtle rounding)
- `{rounded.md}` — `10px`: Buttons, major interactive elements (friendly, approachable)
- `{rounded.full}` — `9999px`: Icon buttons, circular avatars, pills (soft, organic)

### Border Widths

- **Thin** — `1px`: Input fields, outline buttons, dividers, hairline borders

---

## 6. Depth & Elevation

The Honda design system uses **colour blocking** rather than traditional shadow layering. Depth emerges from background colour shifts—alternating light (`#FFFFFF`, `#FAFAFA`) and dark (`#282828`) bands—rather than stacked shadow values.

| Level | Treatment | Use |
|-------|-----------|-----|
| Base (Flat) | No shadow; flat background colour | Body text, standard cards, default UI |
| Raised | `0px 2px 3px 0px rgba(0, 0, 0, 0.3)` | Primary buttons; subtle lift for CTAs |
| Hover Lift | `0px 4px 25px rgba(0, 0, 0, 0.1)` | Outline buttons on hover; modest depth increase |

**Shadow Philosophy:**

Shadows are minimal and restrained. The primary button carries a subtle `2px 3px` drop shadow to signal interactivity; hover states on outlined buttons introduce a larger, softer shadow to indicate depth. All other surfaces—cards, sections, text layers—rely on colour blocking. This approach keeps the interface graphically clean and prioritizes readability over dimensional illusion.

### Opacity Levels

- **50%** — `0.50`: Semi-transparent overlays, muted icon backgrounds (`rgba(40, 40, 40, 0.3)`)
- **70%** — `0.70`: Slightly stronger transparency for secondary UI layers

### Z-index / Layering

- **Base** — `z-index: 1`: Standard document flow (body, cards, sections)
- **Dropdown** — `z-index: 10`: Dropdown menus, tooltips above base content
- **Sticky** — `z-index: 100`: Sticky navigation headers, floating action areas
- **Sticky (High)** — `z-index: 900`: Persistent header, hamburger menu (modal-like)
- **Modal** — `z-index: 9999`: Dialogs, modals, full-screen overlays above all

---

## 7. Do's and Don'ts

### Do

- **Use the brand red strategically.** Deploy `{colors.primary}` — `#E61B33` on primary CTAs, active states, and key brand moments to maintain focus and drive conversions.
- **Maintain 8px spacing alignment.** All padding, margins, and gaps should be multiples of `{spacing.xs}` (8px) for optical consistency and grid-based layouts.
- **Employ weight shifts for hierarchy.** Vary Manrope weight (300, 400, 600, 700) and size together; avoid mixing typefaces to establish reading order.
- **Favour colour blocking for depth.** Layer backgrounds (white, off-white, dark grey) instead of stacking shadows to keep the interface graphic and readable.
- **Keep buttons pill-shaped with `{rounded.md}` (10px).** Round corners signal friendliness and CTAs; maintain consistency across primary, secondary, and outline variants.
- **Provide clear focus states.** Links and inputs must show a distinct focus outline (dotted or solid) for keyboard navigation and accessibility.
- **Scale type responsively.** Use the measured breakpoints; do not shrink body copy below 14px on mobile or expand headlines beyond 32px on desktop without reason.
- **Use opacity (`0.5` and `0.7`) for layering.** Semi-transparent backgrounds and overlays create visual hierarchy without adding shadow complexity.

### Don't

- **Do not invent new colours.** The 9-colour palette is complete; resist adding brand variations, gradients, or intermediate hues.
- **Do not use rounded corners on cards or containers.** Sharp corners (`{rounded.none}` — `0px`) are intentional; they ground the design in modernism and contrast friendly button shapes.
- **Do not exceed the shadow scale.** Never stack multiple shadows or create blur effects beyond the defined Raised and Hover Lift values.
- **Do not violate the spacing scale.** Arbitrary gaps (e.g., 13px, 18px, 37px) break rhythm; always step by `{spacing.xs}` (8px) multiples.
- **Do not mix font families for hierarchy.** Manrope handles all text roles; switch only to Arial for form labels if absolutely necessary.
- **Do not disable buttons invisibly.** Disabled states must shift to `{colors.neutral-2}` — `#EFEFEF` with desaturated text; provide clear visual feedback.
- **Do not hide focus indicators.** Removing outline on :focus violates WCAG; always render a visible focus state (lightblue outline is acceptable).
- **Do not collapse the 6-column grid on mobile.** The grid remains 6 columns from 375px to 1440px; adjust component width and spacing instead of changing grid structure.

---

## 8. Responsive Behavior

### Breakpoints

| Viewport | Content Width | Grid Cols | Nav Links Visible | Menu Toggle | Largest Heading | Body Text | Section Padding X |
|----------|---------------|-----------|-------------------|-------------|-----------------|-----------|-------------------|
| 375px | 345px | 6 | 6 | No | 28px | 14px | `{spacing.md}` (16px) |
| 768px | 708px | 6 | 6 | No | 32px | 14px | `{spacing.md}` (30px) |
| 1024px | 964px | 6 | 6 | No | 32px | 14px | `{spacing.md}` (30px) |
| 1280px | 1120px | 6 | 6 | No | 32px | 14px | `{spacing.band}` (80px) |
| 1440px | 1400px | 6 | 6 | No | 32px | 14px | `{spacing.band}` (80px) |

**Key Changes:**
- **375px to 768px:** Section padding expands from 16px to 30px (proportional scaling).
- **Heading XL:** Stabilizes at 32px above 768px; stays 28px on mobile (375px).
- **Body Copy:** Remains 14px across all breakpoints (no down-scaling below 14px).
- **Grid:** Fixed 6 columns; no collapse to fewer columns on mobile.
- **Navigation:** All 6 nav links remain visible; no hamburger menu observed.

### Touch Targets

- **Minimum height:** `44px` for interactive elements (buttons, links, form controls) to meet WCAG AAA.
- **Minimum width:** Buttons 80–120px minimum to avoid mis-taps; icon buttons 28px × 28px minimum.
- **Spacing between targets:** At least `{spacing.md}` (16px) between adjacent interactive zones on mobile to reduce accidental activation.

### Collapsing Strategy

- **Horizontal padding:** Reduces proportionally from `{spacing.band}` (80px) at 1280px+ to `{spacing.md}` (16px) at 375px, calculated as a percentage of viewport width.
- **Heading scale:** `{typography.heading-xl}` (32px) on desktop reduces to 28px on mobile (375px); `{typography.heading-lg}` remains stable.
- **Card layout:** Grid remains 6 columns; cards span 1–2 columns depending on component role. On narrow viewports, product cards may stack to single-column.
- **Image scaling:** Hero images and product photos scale proportionally; aspect ratio maintained, no cropping.
- **Navigation:** Fixed horizontal layout; no sidebar or drawer observed in data. All nav links remain visible and horizontal across breakpoints.

---

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA / Brand:** Brand Red (`{colors.primary}` — `#E61B33`) — use on buttons, active states, primary links
- **Background / Canvas:** White (`{colors.canvas}` — `#FFFFFF`) — default page and card backgrounds
- **Dark Surface / Accent Band:** Surface Alt (`{colors.surface-alt}` — `#282828`) — alternating sections, dark text, secondary button fill
- **Body Text:** Body (`{colors.body}` — `#4F4F4F`) — standard paragraph copy
- **Secondary Text:** Muted (`{colors.muted}` — `#727272`) — captions, metadata, helper text
- **Borders / Hairlines:** Hairline (`{colors.hairline}` — `#DBDBDB`) — input outlines, dividers, light borders

### Iteration Guide

1. **Start with the 8px baseline.** All spacing, padding, and gaps are multiples of `{spacing.xs}` (8px). Use `{spacing.md}` (16px) for card padding, `{spacing.lg}` (20px) for button internals, `{spacing.band}` (40px) for section separation.

2. **Deploy brand red strategically.** Primary buttons, hover states, active navigation links, and key conversion moments use `{colors.primary}` — `#E61B33`. Never dilute red with secondary states; use neutrals for secondary actions.

3. **Maintain colour-block depth.** Layer light, off-white, and dark backgrounds for visual hierarchy. Avoid stacking multiple shadows; limit to `0px 2px 3px rgba(0, 0, 0, 0.3)` on raised elements and `0px 4px 25px rgba(0, 0, 0, 0.1)` on hover.

4. **Typography via weight and size, not font switching.** Use Manrope for all text roles. Shift weight (300, 400, 600, 700) and size (10–32px) to establish hierarchy. Form labels in Arial (16px, weight 400) are the only exception.

5. **Button styling: primary is `{rounded.md}` pill, secondary is dark grey.** Primary buttons: `#E61B33` fill, 12px 25px padding, 10px radius, white text. Secondary: `#282828` fill, 10px 20px padding. Outline: transparent, 1px `#DBDBDB` border, dark text.

6. **Cards and containers remain sharp (`{rounded.none}` — 0px).** No border-radius on cards; reserve pill-shaped rounding for interactive buttons. Sharp corners ground the modern aesthetic.

7. **Focus states visible on all interactive elements.** Links and inputs require `outline: 1px solid lightblue` on :focus. Do not remove; keyboard navigation depends on it.

8. **Responsive grid: 6 columns, always.** Maintain column count across 375px–1440px. Adjust content width and side padding proportionally; never collapse to fewer columns.

9. **Line-height increases body readability.** Body copy: `line-height: 1.6`; relaxed copy: `line-height: 2.0`. Headings: `line-height: 1.2`. These ratios ensure comfortable reading on all screen sizes.

10. **Hover states consistent across interactive types.** Buttons darken or shift to white with border; links change to red; navigation items invert to dark background. All hover transforms include `translateY(2px)` for tactile feedback.

---

## 10. Known Gaps

- **Interaction states only partially extracted.** The stylesheet provided hover and focus data for buttons, links, and navigation; however, disabled states, active states on form controls, and error/success validation states are not measured. Implement disabled with greyed background (`{colors.neutral-2}` — `#EFEFEF`) and muted text (`{colors.muted}` — `#727272`); error and success states are not declared by the design system and should not be invented.

- **No semantic status colour ramp.** The site does not expose error (red), success (green), warning (yellow), or info (blue) colours in its measured styles. No validation palette exists; do not create one.

- **Gradients and decorative effects absent.** No linear or radial gradients were detected in the extracted tokens. All surfaces are flat, solid colours.

- **Three neutral decorative colours with no measured role.** `{colors.neutral-1}` (`#000000`), `{colors.neutral-2}` (`#EFEFEF`), and `{colors.neutral-3}` (`#3C3C3C`) appear in the extraction but have no explicit semantic job assigned. They may serve as fallback tints, disabled states, or graphic overlays; use them only if a specific role is established in the site's stylesheets.

- **Dark mode / derived theme not measured.** Only one theme (light) was analysed from the live site. The `themes` block in the token data marks the alternate as `derived`, meaning it was calculated mathematically, not read from a shipped dark-mode stylesheet. Do not present derived colours as a design-system-approved dark mode.

- **Surfaces behind authentication not visited.** Only the public homepage and hero zone were analysed. Account, dashboard, or paywall content may have distinct styling not covered here.

- **Breakpoint collapse point unclear for hamburger menu.** The extraction shows "Menu toggle: No" across all measured widths (375px–1440px), indicating the navigation never condenses to a hamburger menu in the measured data. If mobile navigation exists, it was not captured; assume horizontal nav is sticky and persistent.

- **Component states (checked, disabled, loading) not extracted.** Checkbox, radio, and toggle states are not present in the measured stylesheets. Implement these roles conservatively using the primary red for active states and `{colors.neutral-2}` — `#EFEFEF` for disabled.

- **Transition durations and animation curves not measured.** Hover transforms (e.g., `translateY(2px)`) are listed without timing functions or durations. Assume a standard 200ms cubic-bezier(0.4, 0, 0.2, 1) for all interactive animations unless overridden.