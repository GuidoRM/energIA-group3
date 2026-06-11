---
name: Austral Energy Optimizer
colors:
  surface: '#fff8f6'
  surface-dim: '#f2d4cb'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2da'
  surface-container-highest: '#fbdcd3'
  on-surface: '#281813'
  on-surface-variant: '#5c4038'
  inverse-surface: '#3e2c27'
  inverse-on-surface: '#ffede8'
  outline: '#907066'
  outline-variant: '#e5beb3'
  surface-tint: '#ae3200'
  primary: '#aa3000'
  on-primary: '#ffffff'
  primary-container: '#d53f00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59e'
  secondary: '#a13f1f'
  on-secondary: '#ffffff'
  secondary-container: '#fc845e'
  on-secondary-container: '#711d00'
  tertiary: '#005f9f'
  on-tertiary: '#ffffff'
  tertiary-container: '#0078c7'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59e'
  on-primary-fixed: '#3a0a00'
  on-primary-fixed-variant: '#852400'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59e'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#812809'
  tertiary-fixed: '#d1e4ff'
  tertiary-fixed-dim: '#9ecaff'
  on-tertiary-fixed: '#001d36'
  on-tertiary-fixed-variant: '#00497c'
  background: '#fff8f6'
  on-background: '#281813'
  surface-variant: '#fbdcd3'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  card-padding: 24px
---

## Brand & Style
This design system is built for SME owners in high-latitude industrial environments, balancing the reliability of an engineering tool with the accessibility of a modern digital assistant. The aesthetic is rooted in **Corporate Modernism** with a heavy influence from Material Design 3, emphasizing data clarity, hierarchical structure, and a "Google-style" clean finish. 

The personality is authoritative and precise, yet warm enough to feel like a supportive partner in resource management. The UI utilizes a **Bento Grid** layout to organize complex energy metrics into digestible, high-contrast modules. Visual interest is generated through purposeful use of "Vermilion" for critical data points and active states, set against a "Cod Gray" foundation that ensures legibility in various lighting conditions typical of industrial workshops and offices in Tierra del Fuego.

## Colors
The palette leverages a high-energy "Vermilion" to signal activity and optimization. 
- **Primary:** Use `#fd5212` for the main action buttons, active toggles, and primary brand moments. 
- **Containers:** Use `#ffe7d4` for card backgrounds that house primary alerts or high-priority energy stats.
- **Surface & Text:** While the core surface is light for maximum readability, `#1a1a1a` (Cod Gray) is used for text and structural headers to provide a grounded, professional feel.
- **Functional States:** Use Vermilion for "Danger" or "Critical Efficiency" alerts, as its natural warmth doubles as a high-visibility warning color in industrial contexts.

## Typography
Inter was selected for its exceptional legibility and systematic performance in data-heavy interfaces.
- **Headlines:** Use Bold and Semi-Bold weights to create a strong hierarchy in Bento-style grids.
- **Data Display:** Numerical energy values should use `headline-md` or `headline-lg` to ensure they are glanceable from a distance.
- **Labels:** Use `label-lg` for all button text and uppercase `label-sm` for category tags or small metadata.
- **Context:** In industrial settings, slightly tighter letter-spacing on headlines improves readability on high-resolution monitors.

## Layout & Spacing
The design system employs a **Fluid Bento Grid** model.
- **Desktop:** A 12-column grid with 24px gutters. Elements should be grouped into cards that span 3, 4, 6, or 12 columns.
- **Mobile:** A 4-column grid with 16px margins. Bento cards reflow vertically into a single column.
- **Rhythm:** All spacing (padding, margins, gaps) must be a multiple of 8px. Use 24px as the standard internal padding for cards to provide "breathing room" for dense data visualizations.

## Elevation & Depth
This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sense of organized hierarchy:
- **Level 0 (Background):** Solid `#ffffff` or a very faint grey.
- **Level 1 (Cards):** Use a subtle shadow (Blur: 8px, Y: 2px, Opacity: 4% Black) and a 1px outline of `#eeeeee`.
- **Level 2 (Active/Hover):** Increase shadow spread (Blur: 16px, Y: 4px, Opacity: 8% Black) to indicate interactivity.
- **Level 3 (Modals/Popovers):** Focused shadows with 24px blur to lift the element clearly above the data grid.
Do not use heavy borders; depth should feel organic and light, mimicking a modern web-based dashboard.

## Shapes
Following Material Design 3 principles, the shape language is **Rounded**.
- **Standard Cards:** Use `rounded-lg` (16px / 1rem) to soften the industrial data and make the interface feel approachable.
- **Buttons:** Use fully rounded (pill-shaped) ends for primary actions to distinguish them from the rectangular bento containers.
- **Inputs:** Use `rounded-md` (8px / 0.5rem) to maintain a professional, structured look for data entry.

## Components
- **Bento Cards:** The core container. Must include a `label-sm` header, a `headline-md` value, and a 24px padding.
- **Buttons:** 
  - *Primary:* Vermilion background with White text. Pill-shaped.
  - *Secondary:* Vermilion 1px outline with Vermilion text.
- **Chips:** Used for filtering energy sources (Gas, Electric, Wind). Use `primary-container` (`#ffe7d4`) for the active state.
- **Input Fields:** Outlined style with Cod Gray (`#1a1a1a`) labels. Focused state uses a 2px Vermilion border.
- **Data Visualizations:** Use Vermilion for the primary data line/bar. Use Neutral variants for historical or baseline comparisons.
- **Status Indicators:** Use a small circular dot icon. Green for "Optimized", Vermilion for "High Usage", and Cod Gray for "Inactive".
- **Icons:** Use Material Symbols (Rounded) with a 2px stroke weight to match the Inter typography.