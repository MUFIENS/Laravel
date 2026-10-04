# KOPDIG — Design Reference Analysis & Architectural Translation

## 1. Reference Overview

The provided design reference (`docs/references/kopdig-mobile-reference.png`) depicts a three-screen mobile commerce application presented on a stylized presentation canvas:

1. **Left Screen (Cart & Checkout Stage):**
   A dedicated shopping cart interface displaying individual items, inline item removal confirmation, a promo code input group, an order summary breakdown (subtotal, fees, delivery options, total), a prominent primary checkout button, and a floating bottom navigation dock with an active cart state.
2. **Center Screen (Product Detail Stage):**
   A focused product detail view featuring a top bar with back and favorite actions, a horizontal category/tab pill list, an edge-to-edge rounded hero image container with status pill badges, a clean product metadata sheet, color swatch selectors, size selector chips, customer review previews, and a sticky bottom price/action bar.
3. **Right Screen (Discovery & Catalog Stage):**
   A retail home interface showing a centered brand mark, user avatar, horizontally scrolling category chips, a two-column product catalog grid, distinct card states (standard product with price CTA vs. "In cart" status), and a floating bottom navigation dock with an active home state.

This reference represents a modern mobile-first consumer retail application. It prioritizes clarity of transaction, high-contrast touch targets, visual softness through controlled border radii, and uncluttered browsing. It serves as an architectural benchmark for composition, hierarchy, and interaction rhythm, rather than a visual template to be directly copied.

---

## 2. Visual Language Analysis

### Visual Mood & Personality
The reference projects a confident, youthful, and contemporary atmosphere. It combines the tactile friendliness of consumer electronics design with the speed and utility of modern mobile commerce. The interface does not feel corporate, bureaucratic, or academic; it feels like an energetic, curated digital storefront.

### Perceived Product Quality
High product quality is communicated not through ornamentation, but through restraint. The design avoids heavy skeumorphism, gratuitous 3D elements, or dense decorative illustrations. Instead, quality emerges from generous touch spacing, consistent alignment, deliberate typographic scale, and crisp product photography set against clean, neutral surfaces.

### Visual Softness vs. Structural Rigidity
The interface achieves softness by using continuous curvature on containers (estimated 20px–24px on major cards and sheets) paired with full pill radii (9999px) on interactive controls (chips, action buttons, tags). However, this softness does not degrade into a formless or cartoonish aesthetic because internal contents (typography, prices, icons) remain strictly anchored to a structured linear grid.

### Content Density & Whitespace
Visual density is deliberately controlled:
- **Card interiors** are compact and efficient, grouping title, attribute, and price within close proximity.
- **Section boundaries** maintain comfortable breathing room, preventing the cognitive exhaustion typical of data-heavy utility dashboards.
- Whitespace is active rather than passive; it isolates interactive clusters so the thumb immediately identifies actionable zones.

### Contrast & Surface Hierarchy
The design employs a three-tier elevation hierarchy:
1. **Backdrop Canvas:** A soft tinted background providing general framing.
2. **Container Surfaces:** Crisp white cards and sheets that elevate content blocks above the backdrop.
3. **Focal Interactive Elements:** Saturated high-contrast accent fills (buttons, active chips, badges) that instantly draw the eye to transaction paths.

---

## 3. Layout System

### Viewport Composition & Margins
The layout is optimized for single-handed mobile navigation (standard 375px–430px physical viewports):
- **Horizontal Screen Padding:** Consistent gutter spacing (approximately 16px to 20px) aligns headers, cards, and input groups.
- **Top Safe Area:** Compact headers (centered brand or title with flanking icon actions) preserve vertical real estate for catalog browsing.
- **Bottom Clearance:** A dedicated buffer at the bottom of scrollable views accommodates the floating navigation dock without occluding content.

### Vertical Rhythm & Section Spacing
Vertical rhythm follows strict hierarchical spacing steps:
- Tight coupling (4px–8px) between mutually dependent metadata (e.g., label to value, title to subtitle).
- Medium separation (12px–16px) between independent UI controls within a card.
- Generous separation (20px–28px) between major architectural sections (e.g., product hero to option selectors, cart items to summary block).

### Grid Behavior & Grouping
The discovery screen utilizes a symmetric **two-column product grid**:
- Equal column widths with a uniform central gap (approximately 12px–16px).
- Vertical alignment ensures product images establish a clean horizontal baseline across both columns, while card content adapts gracefully to title lengths without breaking column symmetry.

### Navigation Placement
Navigation is anchored strictly to thumb-accessible zones:
- Primary browsing state transitions are housed in a floating bottom navigation dock.
- Contextual back actions and profile access reside at the top corners.
- Primary commercial actions (e.g., "Add to Cart", "Apply Code", "Proceed to Checkout") occupy full-width or large sticky zones at the bottom of the screen.

---

## 4. Surface System

### Card Geometry & Corner Radii
Surfaces feature a dual-radius architectural philosophy:
- **Major Surfaces (Cards, Modals, Sheet Containers):** 20px to 24px corner radius, imparting a modern, tactile silhouette.
- **Controls & Micro-surfaces (Buttons, Chips, Badges, Dropdowns):** 9999px (full pill curvature), signaling instant tappability.
- **Nested Inner Surfaces (Thumbnail Containers):** Modest radius (12px to 16px), harmonizing mathematically with their parent card boundaries.

### Elevation, Borders & Shadows
The visual separation relies primarily on **surface contrast and subtle outlines**, rather than deep drop shadows:
- Cards utilize bright white surfaces set against a soft off-white canvas.
- Crisp hairline borders (1px) define interactive inputs, secondary buttons, and option chips.
- Elevation shadows are extremely diffuse, low-opacity, and subtle, serving only to detach floating bars and modals from underlying scroll layers.
- The interface avoids heavy, dark, or multi-layered drop shadows that create visual mud.

---

## 5. Typography

### Typographic Hierarchy
The typographic system is anchored in a clean, geometric sans-serif with distinct weight modulation:
- **Display & Screen Titles:** Medium-large, bold/semibold weight, compact line height.
- **Product Card Titles:** 14px–15px, medium/semibold, constrained to 1–2 lines with truncation to maintain grid stability.
- **Secondary Metadata (Variants, Categories, Subtitles):** 12px–13px, regular weight, muted gray tone.
- **Numerical Prices:** Semibold to bold, prominent sizing, paired with currency signs.

### Typographic Principles
1. **Numerical Weight Dominance:** Commercial figures (prices, quantities, discounts) always carry heavier visual weight than descriptive text.
2. **Concise Labeling:** Form labels and chips utilize succinct single-word or short-phrase terminology, avoiding explanatory clutter.
3. **Intentional Truncation:** Card titles never push pricing or buttons below the visible card fold; multi-line titles truncate gracefully with ellipses.

---

## 6. Product Card System

### Composition & Ratio
The product cards on the catalog screen represent a masterclass in mobile commerce efficiency:
- **Aspect Ratio:** The product image container occupies roughly 55%–60% of the total card height.
- **Image Staging:** Products are staged on clean, neutral, uncluttered backdrops with consistent perspective and lighting, allowing silhouettes to pop.
- **Action Grounding:** The bottom of each card is anchored by a full-width or prominent action button (e.g., Price pill CTA or "In cart" indicator).

### Card Elements Breakdown
1. **Top Utility Row:** Circular floating wishlist/favorite heart icon positioned at the top right of the image surface.
2. **Status Badges:** Small high-contrast pill tags (e.g., "Top item") floating at the top left of the card or nestled immediately above the title.
3. **Product Title:** Positioned immediately beneath the image container, left-aligned, ensuring instant legibility.
4. **Action / State Button:**
   - Default state: Outlined or solid pill button with cart icon and price.
   - Active/Added state: Clean secondary pill with clear textual state ("In cart"), preventing redundant duplicate taps.

---

## 7. Product Detail Experience

### Information Architecture & Funnel
The product detail screen guides the buyer through a structured decision funnel:
1. **Orientation (Top):** Minimal navigation (Back arrow, centered "Details", Favorite toggle).
2. **Tabbed Categories:** Horizontal pill tabs allowing quick jumps between specifications, reviews, and Q&A without cluttering the main viewport.
3. **Visual Hook (Hero Image):** Large, rounded lifestyle image container with pagination indicators and status badges.
4. **Product Definition:** Bold title followed by a concise 2-sentence description highlighting primary value.
5. **Configuration (Variants):**
   - Color selection presented as visual thumbnail cards with active border highlighting.
   - Size selection presented as horizontal numerical pill chips with solid active fill.
6. **Social Proof:** Compact review snippet displaying user avatar, star rating (5/5), and concise quote.
7. **Commercial Anchor (Bottom):** Fixed dual-pill container at the base of the viewport featuring original/discounted price and a high-contrast primary cart button.

---

## 8. Cart Experience

### Cognitive Load Reduction
The shopping cart screen eliminates distractions and clarifies cost:
1. **Discrete Item Containers:** Each cart item sits in its own rounded white surface card, clearly separating distinct products.
2. **Item Geometry:**
   - Square rounded thumbnail on the left.
   - Title, selected variant attributes, and price in the center.
   - Stepper/dropdown quantity selector and contextual delete icon on the right.
3. **Inline Confirmation Pattern:** Deleting an item triggers an inline confirmation card directly in context ("Remove Item" with "No" / "Yes" options) rather than an abrupt full-screen modal or disruptive alert.
4. **Voucher / Promo Code Group:** Compact pill input with an embedded right-aligned action button ("Apply Code").
5. **Financial Breakdown:** Structured summary separating total from subtotal, fees, and fulfillment options, providing complete transparent accounting before commitment.
6. **Unmistakable Checkout CTA:** A single, prominent full-width pill button featuring the cart icon and bold total payable amount.

---

## 9. Navigation

### Floating Dock Architecture
The bottom navigation bar uses a detached, floating capsule structure:
- **Geometry:** Elevated white pill dock with generous rounded ends (continuous pill or 26px radius), floating above the screen bottom with uniform margin.
- **Item Distribution:** 4 evenly spaced destination nodes.
- **Active State Transition:** The active destination expands into a solid colored pill containing both the icon and text label (e.g., filled capsule with home icon and "Home" text; or filled capsule with cart icon and "Cart" text).
- **Inactive State Treatment:** Inactive items display as subtle, clean line-art icons without text labels, keeping the dock uncluttered.
- **State Badging:** The cart icon features an overlapping counter badge (e.g., "4") alerting the user to pending items across all browsing contexts.

---

## 10. Interaction Language

### State Signatures
- **Default State:** Crisp white surfaces, hairline borders, muted secondary typography.
- **Hover / Touch Press:** Darkening or subtle scale feedback on pills; visible focus ring on inputs.
- **Selected / Active State:** Full solid color fill with inverted white text/iconography for chips and buttons; high-contrast border for image thumbnails.
- **Completed / In-Cart State:** Transition from solid primary button to secondary ghost/outline button with explicit confirmation label ("In cart").
- **Quantity Controls:** Compact inline dropdowns or stepped controls that do not require navigation away from the cart summary.

---

## 11. Responsive Thinking

### Intentional Mobile-First Decisions
The reference contains specific patterns that are distinctly native to mobile viewports:
- **Thumb-Zone Placement:** High-frequency actions (category chips, checkout buttons, navigation dock) reside within the natural bottom arc of thumb reach.
- **Horizontal Swiping:** Category lists, variant chips, and detail tabs scroll horizontally, saving critical vertical height.
- **Stacked Card Cart:** Avoids wide tabular columns in favor of self-contained vertical product cards.
- **Sticky Viewport Footers:** Guarantees that the transaction total and primary CTA remain accessible regardless of catalog or cart scroll depth.

---

## 12. Extracted Design Principles

From this reference study, 12 fundamental design principles are extracted:

1. **Surface Separation Over Shadow Weight:** Differentiate containers using contrast between warm canvas backgrounds and crisp white cards, supported by subtle borders, rather than heavy drop shadows.
2. **Continuous Tactile Curvature:** Employ a consistent hierarchy of radii (20px–24px for major cards, 12px–16px for media containers, 9999px for interactive chips and buttons) to create a soft, inviting touch environment.
3. **Dedicated Commercial Baselines:** Always ground product cards with a dedicated action/pricing zone that maintains consistent visual rhythm regardless of title variation.
4. **Explicit State Feedback:** Never leave the user guessing whether an item was added; immediately transform purchase triggers into explicit state indicators (e.g., "In cart").
5. **Inline Decision Contexts:** Handle item removals and micro-confirmations directly within the existing card space rather than ejecting the user into disruptive global dialogs.
6. **Thumb-First Commercial Anchoring:** Place final checkout triggers, category filters, and primary navigation in bottom-reachable viewport zones.
7. **Numerical Visual Prominence:** Render prices and quantities in distinct semibold/bold typography, ensuring monetary clarity precedes descriptive reading.
8. **Restrained Photographic Canvas:** Stage catalog items against clean, uncluttered, light-toned backdrops to maximize silhouette clarity on small mobile displays.
9. **Single-Action Dock Navigation:** Keep bottom navigation simple and focused (3–4 primary destinations); highlight the active item with an expanded capsule containing both icon and label.
10. **Horizontal Option Pacing:** Use compact horizontal pill carousels for variants, categories, and tags to conserve vertical scroll length.
11. **Transparent Accounting Summaries:** Clearly separate subtotal, fees, and final payable amount in a dedicated financial summary card prior to transaction submission.
12. **Content-to-Chrome Restraint:** Ensure product media and transactional data dominate the screen; minimize decorative chrome, unnecessary divider lines, and arbitrary graphics.

---

## 13. What Should Be Adapted to KOPDIG

These structural and UX patterns directly solve KOPDIG's operational and user experience needs:

1. **Two-Column Mobile Product Grid:** Highly effective for browsing cooperative inventory (snacks, drinks, stationery) and student consignment items on phone screens.
2. **Source Badging on Cards:** Adapting the "Top item" badge pattern to display KOPDIG's critical source identity: `"Koperasi"` vs. `"Dititipkan oleh [Nama]"`.
3. **Cart Item Structure & Inline Removal:** Perfectly suited for fast break-time ordering where students quickly review and adjust snack/stationery quantities.
4. **Bottom Floating Navigation Dock:** Adapted to KOPDIG's four primary student sections: **Home**, **Explore**, **Orders**, and **Cart**.
5. **Horizontal Category Chips:** Enables instantaneous filtering between *Jajanan*, *Minuman*, *ATK*, *Atribut Sekolah*, and *Produk Siswa*.
6. **Sticky Action Footer on Detail Pages:** Keeps the "Tambah ke Keranjang" action instantly accessible while students review product details.
7. **Structured Financial Breakdown:** Directly fulfills KOPDIG's requirement to show clean order totals without exposing internal cooperative margins to the buyer.

---

## 14. What Must NOT Be Copied

The following aspects of the reference must be strictly rejected or replaced to preserve KOPDIG's unique identity and documented rules:

1. **Brand Identity & Logo:** Do not copy "MLC" or any unrelated retail branding; KOPDIG is *Ruang Niaga Warga Sekolah*.
2. **Color Palette:** The reference's purple/lavender/blue palette (`#5B42F3` / `#7B61FF`) must **NOT** be used. KOPDIG uses its documented identity:
   - Primary: Deep Forest Green (`#183C32`)
   - Accent: Warm Gold (`#D5A84C`)
   - Canvas: Warm Neutral (`#F7F6F1`)
   - Surface: Pure White (`#FFFFFF`)
   - Ink: Deep Charcoal (`#171A18`)
3. **Generic Fashion / Apparel Context:** KOPDIG sells school cooperative items, food/drinks, stationery, and student-made craft/culinary products, not high-end designer sneakers or boxing gloves.
4. **Arbitrary Delivery Options:** The reference shows "Standard Delivery (Free)". KOPDIG uses physical school pickup sessions (e.g., *Istirahat 1*, *Istirahat 2*) with QR codes and queue numbers.
5. **Excessive Floating Backdrops:** The diagonal dotted grid and floating ambient glow of the presentation mockup must not be embedded into the actual application interface.
6. **Dollar ($) Currency Conventions:** KOPDIG transactions are in Indonesian Rupiah (IDR), formatted as integer values (e.g., `Rp 8.000`), never decimal dollars.

---

## 15. KOPDIG-Specific Design Translation

Guided by `docs/design.md` and this reference study, the KOPDIG design translation is formally defined:

### Visual Personality
**Curated, Trustworthy, Entrepreneurial, Warm, and Focused.**  
A modern school commerce experience where student craftsmanship meets cooperative reliability.

### Design Tokens & Palette Implementation
- **Page Canvas:** `#F7F6F1` (warm off-white, preventing sterile clinical feel).
- **Surface Cards:** `#FFFFFF` with 1px `#E4E4DC` subtle border and diffuse micro-shadow.
- **Primary Action (Brand):** Deep Forest Green (`#183C32`) with hover state `#245746`.
- **Soft Accent / Selection:** `#E7EFEB` (light green tint) for selected states and subtle chip backgrounds.
- **Prestige Accent:** Refined Warm Gold (`#D5A84C`) reserved for consignment recognition, queue badges, and featured highlights.
- **Typography:**
  - Display / Titles: **Satoshi** (geometric, confident, premium retail character).
  - Body / Form Inputs: **General Sans** (clean, highly legible at small sizes).

### Component Philosophy
1. **ProductCard (`resources/js/components/commerce/ProductCard.tsx`):**
   - 20px rounded white surface with hairline border.
   - Clean product image on `#FBFBF9` background.
   - Source tag: Gold badge for student consignment (`Dititipkan oleh Nabila`), soft green tag for cooperative items (`Koperasi`).
   - Title truncated at 2 lines in Satoshi Semibold.
   - Clear integer Rupiah price (`Rp 12.000`) paired with an accessible touch action.
2. **AppBottomNav (`resources/js/components/ui/AppBottomNav.tsx`):**
   - Floating pill dock with 24px radius and soft backdrop blur.
   - 4 destinations: **Home** (Beranda), **Explore** (Jelajah), **Orders** (Pesanan), **Cart** (Keranjang).
   - Active destination expands into a `#183C32` green pill with white text and Lucide icon.
   - Badge counter on Keranjang indicator.
3. **Checkout & Pickup Cards:**
   - Dedicated **QueueNumberCard** featuring large high-contrast display (`A-0182`) and session timing (`Istirahat 1: 09.30 - 10.00`).
   - High-contrast **QRPickupCard** providing clean, scannable QR display without decorative interference.

---

## 16. Relationship to docs/design.md

This analysis completely aligns with and reinforces `docs/design.md`:
- **Section 4 (Color System):** Enforces Forest Green `#183C32` and Warm Canvas `#F7F6F1` over generic tech blues or purples.
- **Section 5 (Typography):** Implements Satoshi and General Sans hierarchy.
- **Section 7 (Radius System):** Upholds the 24px/20px/14px/pill radius matrix observed in the reference.
- **Section 11–14 (Mobile Layout & Product Cards):** Directly validates the two-column grid, compact header, and source-attributed card layout.
- **Section 27 (Anti-Generic Rules):** Explicitly guards against copying the reference's purple gradients, SaaS tropes, or irrelevant delivery assumptions.

The reference provides the structural rhythm; `docs/design.md` provides KOPDIG's soul and operational truth.
