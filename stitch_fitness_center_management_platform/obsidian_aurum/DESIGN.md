---
name: Obsidian Aurum
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393841'
  surface-container-lowest: '#0d0d15'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#303038'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#ffc461'
  on-tertiary: '#432c00'
  tertiary-container: '#e4a83b'
  on-tertiary-container: '#5d3f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdead'
  tertiary-fixed-dim: '#fabc4d'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
  surface-base: '#0D0D11'
  surface-card: '#16161E'
  surface-overlay: '#1E1E2A'
  surface-glass: rgba(22, 22, 30, 0.72)
  text-primary: '#F8FAFC'
  text-muted: '#94A3B8'
  border-subtle: rgba(212, 175, 55, 0.18)
  border-glow: rgba(212, 175, 55, 0.45)
  status-success: '#10B981'
  status-danger: '#EF4444'
  status-warning: '#F59E0B'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses high-performance discipline, exclusive luxury, and precision engineering for premium athletic clubs and personal training institutions. It speaks to affluent professionals, dedicated athletes, and executive gym operators who regard physical conditioning as an elite pursuit.

The visual aesthetic combines minimalist dark architecture with athletic precision and subtle glassmorphic refinement:
- **Atmospheric Palette:** Deep obsidian blacks and deep cold slate foundations eliminate visual noise, immersing users in a calm, focused environment reminiscent of an exclusive private training suite.
- **Metallic Illumination:** Precision warm gold and amber accents represent physical achievement, prestige membership tiers, and energetic focal points.
- **Glassmorphism & Depth:** Frosted glass panels with subtle border glows mimic architectural smoked glass and polished gym equipment finishes.
- **High Contrast Typography:** Razor-sharp typography balances condensed athletic impact with modern editorial legibility.

## Colors

The chromatic architecture uses deep charcoal and obsidian foundations paired with metallic gold highlights.

- **Primary (`#D4AF37`):** Classic metallic gold used for primary call-to-actions, active navigation markers, key performance metrics, and tier-1 membership tags.
- **Secondary (`#F59E0B`):** Warm amber used for dynamic energy, session countdowns, trainer availability alerts, and accent highlights.
- **Tertiary (`#E5A93C`):** Polished brass gradient partner for subtle metallic shimmer, active radio rings, and secondary interaction indicators.
- **Neutral (`#16161E`):** Obsidian slate defining elevated cards, modal sheets, and structural surfaces over the `#0D0D11` root canvas.

### Color Rules & Accessibility
- **Canvas vs. Container:** Canvas renders at `#0D0D11`. Primary containers rest at `#16161E` with subtle 1px translucent gold or slate borders (`rgba(212, 175, 55, 0.18)`).
- **Text Contrast:** Primary headlines and essential workout telemetry use clean white/silver (`#F8FAFC`), giving a contrast ratio well above 12:1 against background layers. Secondary and meta descriptions use cool slate (`#94A3B8`).
- **Interactive State Hierarchy:** Active elements radiate with warm gold glows; hover states step upward in background lightness and glow intensity, never washing out to pure white.

## Typography

The typographic hierarchy communicates athletic discipline alongside refined prestige:

- **Headlines (Outfit):** Modern, geometric, clean. Conveys contemporary luxury with balanced geometric shapes in uppercase and title cases.
- **Body Text (Plus Jakarta Sans):** Highly legible, open apertures, warm and inviting. Ensures flawless readability for session notes, membership contract clauses, and workout descriptions.
- **Data & Telemetry Labels (Space Grotesk):** Engineered, monospace-leaning aesthetic used for numeric counters, time slot chips, pricing values, role identifiers (`ADMIN`, `TRAINER`, `MEMBER`), and schedule tags.

## Layout & Spacing

The layout is built on a responsive 12-column fluid grid system on desktop and tablet, collapsing to a 4-column structured layout on mobile devices.

- **Desktop (1200px+):** 12 columns, 24px (`1.5rem`) gutters, 40px (`2.5rem`) outer margin. Dashboard widgets conform to 3, 4, 6, or 12-column spans.
- **Tablet (768px - 1199px):** 8 columns, 20px gutters, 24px outer margin. Cards reflow dynamically into twin-column configurations.
- **Mobile (320px - 767px):** 4 columns, 16px (`1rem`) gutters, 20px (`1.25rem`) outer margin. Data lists, trainer slots, and summary cards stack vertically.

Outer layout containers favor structured breathing room, preventing the luxury dark interface from feeling cramped or claustrophobic.

## Elevation & Depth

Visual hierarchy uses frosted glassmorphic layering and gold light emission:

- **Level 0 (Canvas):** Pure `#0D0D11` background, non-interactive, anchoring the scene.
- **Level 1 (Subsurface Cards & Tables):** `#16161E` with a hairline top border of `1px solid rgba(255, 255, 255, 0.06)` and drop shadow `0 8px 24px -4px rgba(0, 0, 0, 0.6)`.
- **Level 2 (Active/Hover Glass Panels):** `rgba(22, 22, 30, 0.72)` combined with `backdrop-filter: blur(16px)` and perimeter border `1px solid rgba(212, 175, 55, 0.25)`. Produces an elevated obsidian lens effect.
- **Level 3 (Modals, Session Booking Sheets & Overlays):** `#1E1E2A` floating with shadow `0 20px 40px -8px rgba(0, 0, 0, 0.8)` and a faint gold ambient rim `0 0 24px 0 rgba(212, 175, 55, 0.12)`.

## Shapes

The design system maintains a balanced roundedness (Level 2: `0.5rem` base, `1rem` for medium cards, `1.5rem` for large hero containers).

- **Standard Buttons & Inputs:** Rounded at `0.5rem` (8px) for an architectural, crisp feel.
- **Dashboard Cards & Glass Panels:** Rounded at `1rem` (16px) to maintain a refined, premium feel.
- **Status Pills & Role Badges:** Rounded at full pill shape (`9999px`) to create clear shape contrast against structural grid cards.

## Components

### Buttons
- **Primary CTA:** Background gradient from `#D4AF37` to `#E5A93C`, font color `#0D0D11` (Space Grotesk, bold, uppercase tracking), 8px border radius. Hover introduces a warm gold glow (`box-shadow: 0 0 20px rgba(212, 175, 55, 0.4)`).
- **Secondary CTA:** Frosted obsidian glass background (`rgba(22, 22, 30, 0.85)`), border `1px solid rgba(212, 175, 55, 0.4)`, text color `#F8FAFC`. Hover brings gold border opacity to 100% and text color to `#D4AF37`.
- **Ghost/Tertiary:** No background, borderless, text color `#94A3B8`, transitioning to `#F8FAFC` with an underline accent on hover.

### Form Inputs & Selects
- **Text & Number Inputs:** Background `#0D0D11`, border `1px solid rgba(148, 163, 184, 0.2)`, text `#F8FAFC`, placeholder `#64748B`. Focus state transitions border to `#D4AF37` with an ambient ring `0 0 0 2px rgba(212, 175, 55, 0.2)`.
- **Dropdowns:** Custom dark glass menu (`#16161E` with backdrop blur), active item highlighted with a 2px left border in `#D4AF37`.

### Cards & Panels
- **Membership Plan Card:** Dark charcoal backing with metallic trim. Tier label in Space Grotesk. Featured/VIP cards feature a luminous linear gradient top edge (`#D4AF37` to `#F59E0B`).
- **Trainer Profile & Booking Card:** Features trainer headshot, specialty badges, star rating in gold, and interactive calendar time-slot pills.

### Chips & Badges
- **Role Tags:** Monospace uppercase pill. Admin (`#EF4444` on `rgba(239, 68, 68, 0.12)`), Trainer (`#F59E0B` on `rgba(245, 158, 11, 0.12)`), Member (`#D4AF37` on `rgba(212, 175, 55, 0.12)`).
- **Slot Status Chips:** Active/Available (Emerald outline), Booked/Occupied (Slate muted filled), Conflicted/Selected (Amber filled).

### Checkboxes & Radios
- **Radio Buttons:** Circular obsidian base with a 1.5px border in slate. Checked state reveals a concentric `#D4AF37` core with a subtle gold ambient aura.
- **Checkboxes:** Squared with 4px corner radius; checkmark icon renders in `#0D0D11` over solid gold when checked.

### Lists & Telemetry Tables
- **Workout & Equipment Lists:** Zebra styling avoided; separated by subtle border dividers (`rgba(255, 255, 255, 0.05)`). Rows highlight with dark amber tint (`rgba(212, 175, 55, 0.04)`) on hover.