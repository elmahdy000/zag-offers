---
name: Kinetic Premium
colors:
  surface: '#1d100a'
  surface-dim: '#1d100a'
  surface-bright: '#46362e'
  surface-container-lowest: '#170b06'
  surface-container-low: '#261812'
  surface-container: '#2b1c16'
  surface-container-high: '#362720'
  surface-container-highest: '#41312a'
  on-surface: '#f8ddd2'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#f8ddd2'
  inverse-on-surface: '#3d2d26'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb693'
  primary: '#ffb693'
  on-primary: '#561f00'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#a04100'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#3ce36a'
  on-tertiary: '#003912'
  tertiary-container: '#00b149'
  on-tertiary-container: '#003a13'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#69ff87'
  tertiary-fixed-dim: '#3ce36a'
  on-tertiary-fixed: '#002108'
  on-tertiary-fixed-variant: '#00531e'
  background: '#1d100a'
  on-background: '#f8ddd2'
  surface-variant: '#41312a'
typography:
  h1:
    fontFamily: Cairo
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Cairo
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  h3:
    fontFamily: Cairo
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Almarai
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Almarai
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Almarai
    fontSize: 13px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  price-display:
    fontFamily: Cairo
    fontSize: 28px
    fontWeight: '800'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

The design system is built to evoke a sense of urgency, exclusivity, and local relevance. It targets a modern, tech-savvy demographic that values efficiency and high-end aesthetics. The brand personality is **Energetic yet Sophisticated**, bridging the gap between a high-energy discount marketplace and a premium lifestyle concierge.

The visual style utilizes **Refined Minimalism with Kinetic Accents**. It features expansive dark surfaces, high-contrast primary triggers, and a sophisticated layering system that creates a sense of physical depth. The interface prioritizes high-quality imagery—specifically lifestyle and product photography—to ensure the value of the "offer" is felt emotionally, not just numerically. 

Key attributes include:
- **Premium Utility:** A clean, organized structure that makes browsing thousands of deals feel effortless.
- **RTL-First Logic:** Natural right-to-left flow for Arabic speakers, ensuring that visual weight and scanning patterns are culturally optimized.
- **Micro-Interactions:** Subtle haptic-inspired transitions that reinforce the "snappy" nature of a "Zag" (a sharp, quick movement).

## Colors

This design system employs a **Dark Mode Primary** strategy to enhance the vibrancy of the brand colors and create a premium "theatrical" environment for offer imagery.

- **Vibrant Orange (#FF6B00):** The primary engine of the UI. Used for critical CTAs, active price points, and brand signifiers. It represents energy and the "flash" of a deal.
- **Deep Charcoal (#1A1A1A):** The core structural color. It provides a sophisticated alternative to pure black, allowing for subtle shadows and depth.
- **Success Green (#00C853):** Used strictly for confirmed savings, active redemptions, and positive growth indicators.
- **Status Badging:** A dedicated palette for administrative states—**Amber** for pending verification, **Soft Red** for rejected entries, and a **Muted Grey** for expired offers to clear visual cognitive load.

## Typography

The typography system is optimized for **Bilingual RTL readability**. 

- **Cairo** is utilized for headlines and primary brand statements. Its geometric nature and varying weights provide a modern, architectural feel that anchors the page.
- **Almarai** serves as the workhorse for body text and labels. Its clean, open apertures ensure high legibility on mobile screens, even at small sizes or low contrast.

Text hierarchy is strictly enforced: prices are always the heaviest weight, followed by merchant names. Secondary information like expiration dates or terms should use the `label-sm` style with reduced opacity to maintain a clean visual field.

## Layout & Spacing

This design system uses a **mobile-first 8pt grid system**. For the mobile experience, a 4-column fluid grid is standard, transitioning to a 12-column centered grid for desktop views.

**Key Layout Principles:**
- **RTL Alignment:** All margins, padding, and directional icons (arrows, back buttons) must be mirrored.
- **Breathability:** Generous vertical spacing (`stack-lg`) between different offer categories to prevent the "cluttered marketplace" look.
- **Safe Areas:** Adherence to mobile safe areas is mandatory for bottom-bar navigation and floating action buttons.

## Elevation & Depth

To maintain a premium feel, the design system avoids heavy, muddy shadows. Instead, it uses **Tonal Layering and Glassmorphism**:

1.  **Base Layer:** Deepest Charcoal (#0D0D0D).
2.  **Surface Layer:** Primary container color (#1A1A1A).
3.  **Elevated Layer:** For cards or modals, a slightly lighter grey (#262626) with a very soft, high-spread 15% opacity black shadow.
4.  **Glass Effect:** For sticky headers and bottom navigation, use a 20px backdrop blur with a 70% opacity fill of the surface color. This keeps the user grounded in their scroll position while maintaining a sleek, modern depth.
5.  **Accent Glow:** For high-value offers, a subtle "Primary Orange" outer glow (5-10% opacity) may be applied to the card border.

## Shapes

The shape language is **Rounded and Intentional**. 

- **Cards & Primary Containers:** Use a 16px (`rounded-lg`) corner radius to soften the high-contrast dark theme and make the UI feel approachable.
- **Buttons & Chips:** Use a 12px radius for standard buttons, while "Category Chips" utilize a full pill-shape (32px+) to distinguish them as tappable filter elements.
- **Media:** Images within cards should inherit the container's radius on the top corners, but remain sharp where they meet internal dividers to preserve structural integrity.

## Components

### Offer Cards
The centerpiece of the design system. 
- **Structure:** Top-heavy with a 16:9 aspect ratio image. 
- **Hierarchy:** Price (Vibrant Orange) and Discount Percentage (Badge) must be immediately visible. 
- **Details:** Merchant logo (circular, 32px), Merchant Name, and "Distance" or "Time Left" indicator in secondary text.

### Buttons
- **Primary:** Solid #FF6B00 with white text. High-gloss finish optional for "Premium" offers.
- **Secondary:** Ghost style with #FF6B00 border and text.
- **Tertiary:** Pure text with an icon, used for "See All" or "Terms."

### Status Badges
Small, high-caps labels with subtle background tints.
- **Pending:** Amber background (15% opacity) with solid Amber text.
- **Active:** Success Green background (15% opacity) with solid Green text.
- **Expired:** Muted Grey background (15% opacity) with light grey text.

### Inputs
Dark-themed inputs with a 1px border (#333333). On focus, the border transitions to #FF6B00 with a subtle outer glow. Labels must be right-aligned for RTL.

### Floating Action Button (FAB)
A circular #FF6B00 button used for "Redeem" or "Scan QR" actions, situated in the bottom-center or bottom-left (RTL context) of the screen.