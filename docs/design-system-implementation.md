# KOPDIG Design System & Mobile App Shell Implementation

**Product:** KOPDIG  
**Descriptor:** Ruang Niaga Warga Sekolah  
**Brand Essence:** Tempat Karya Menjadi Transaksi  
**Document Version:** 1.0.0 (Phase 3 Delivery)  
**Status:** Validated & Implemented  

---

## 1. Executive Summary

Phase 3 established the visual foundation and mobile application shell for KOPDIG. Guided strictly by [docs/design.md](file:///c:/Users/asepm/Downloads/Laravel/docs/design.md) and contextualized through interaction principles from [docs/design-reference-analysis.md](file:///c:/Users/asepm/Downloads/Laravel/docs/design-reference-analysis.md), the user interface delivers a modern, youthful, and entrepreneurial atmosphere while upholding commercial trust.

In accordance with strict phase scoping:
- No database business tables were migrated.
- No backend marketplace CRUD or transactional logic was introduced.
- All visual foundations, token bindings, layout primitives, and reusable UI components were constructed in TypeScript and React 19, styled using Tailwind CSS v4's native `@theme` engine.

---

## 2. Implemented Design Tokens

The design token system has been established as a single source of truth in [resources/css/app.css](file:///c:/Users/asepm/Downloads/Laravel/resources/css/app.css) using Tailwind CSS v4 `@theme` directives. These tokens map directly to the color palette specified in `docs/design.md`.

### Color Palette

| Token Name | Value | Purpose / Usage Context |
| :--- | :--- | :--- |
| `--color-canvas` | `#F7F6F1` | Warm canvas background; distinguishes KOPDIG from stark white SaaS templates. |
| `--color-surface` | `#FFFFFF` | Primary card, modal, and floating dock surface. |
| `--color-surface-subtle` | `#F2F1EA` | Secondary surface, search fields, disabled containers, and image backdrops. |
| `--color-primary` | `#183C32` | Deep Forest Green; brand anchor conveying cooperative integrity. |
| `--color-primary-hover` | `#245746` | Interactive hover and active state for primary elements. |
| `--color-primary-soft` | `#E7EFEB` | Subtle tinted background for source badges, active states, and light chips. |
| `--color-accent` | `#D5A84C` | Muted Gold accent for badges, stars, highlights, and verified statuses. |
| `--color-ink` | `#171A18` | Deep near-black for primary titles, numerical pricing, and prominent labels. |
| `--color-ink-muted` | `#707770` | Secondary metadata, descriptions, category labels, and inactive navigation items. |
| `--color-border-subtle` | `#E4E4DC` | Controlled dividing lines and card outlines, eliminating heavy shadows. |
| `--color-status-success` | `#1B7F5A` | Success messages, confirmed pickups, ready status. |
| `--color-status-warning` | `#B87A14` | In-progress processing, queue warnings, waiting states. |
| `--color-status-danger` | `#C23B38` | Cancellations, error banners, out of stock. |
| `--color-status-info` | `#226D8E` | Informational callouts and cooperative announcements. |

Generic blue/orange combinations were rejected to maintain KOPDIG's proprietary brand identity.

---

## 3. Typography Implementation

Typography balances the progressive editorial character of high-school entrepreneurship with transactional clarity. Fonts are loaded via Fontshare CDNs in [resources/views/app.blade.php](file:///c:/Users/asepm/Downloads/Laravel/resources/views/app.blade.php) and bound to Tailwind CSS variables:

### Font Families
- **Display & Headings:** `Satoshi` (`--font-display: 'Satoshi', sans-serif`)  
  Weight: Medium (500), Bold (700), Black (900).  
  Applied to brand headers, section titles, hero greeting, and product card titles.
- **Body & Numerical Interface:** `General Sans` (`--font-sans: 'General Sans', sans-serif`)  
  Weight: Regular (400), Medium (500), Semibold (600).  
  Applied to descriptive text, metadata, microcopy, form controls, and badge elements.

### Numerical Pricing Hierarchy
- Numerical currency values utilize `tabular-nums` via `font-variant-numeric: tabular-nums` to ensure exact column alignment in product grids, carts, and order summaries.
- Formatting uses Indonesian locale convention (`id-ID`): `Rp` prefix with dot thousand separators (e.g., `Rp 15.000`), avoiding fractional decimals.

---

## 4. Surface System & Elevation

To achieve a crisp, tactile, and premium aesthetic, surfaces rely primarily on surface color contrast and hairline borders (`#E4E4DC`) rather than dark drop shadows or heavy blur filters:

- **Canvas:** `#F7F6F1` creates an organic, warm backdrop behind cards and sheets.
- **Card Surface:** `#FFFFFF` with `border border-[#E4E4DC]` and `--shadow-subtle` (`0 1px 3px 0 rgba(23, 26, 24, 0.04), 0 1px 2px -1px rgba(23, 26, 24, 0.04)`).
- **Floating Dock:** `#FFFFFF` with `--shadow-float` (`0 10px 25px -5px rgba(23, 26, 24, 0.08), 0 8px 10px -6px rgba(23, 26, 24, 0.04)`) and `border border-[#E4E4DC]/80`.
- **Restraint:** Gratuitous glassmorphism and decorative gradients have been strictly avoided; transparency is limited to standard sticky header blur (`backdrop-blur-md bg-[#F7F6F1]/90`).

---

## 5. Spacing System

Layout rhythm conforms to a strict 4px grid:
- **Base Grid:** `4px` (`0.25rem`), `8px` (`0.5rem`), `12px` (`0.75rem`), `16px` (`1rem`), `20px` (`1.25rem`), `24px` (`1.5rem`), `32px` (`2rem`).
- **Touch Target Minimums:** All interactive controls (buttons, chips, icon toggles, navigation tabs) enforce a minimum touch target size of 44px by 44px (`min-h-[44px]`, `min-w-[44px]`).
- **Horizontal Container Padding:** Mobile viewports apply `px-4` (16px), adapting to `sm:px-6` (24px) on tablet and desktop screens.
- **Safe Area Insets:** Layouts account for device gesture bars with bottom padding buffers (`pb-28` to `pb-32` on scrollable containers).

---

## 6. Radius Hierarchy

To prevent arbitrary rounding, an intentional radius scale governs all components:

| Class / Token | Value | Target UI Elements |
| :--- | :--- | :--- |
| `rounded-3xl` | `24px` | Sheet containers, modal wrappers, featured hero cards. |
| `rounded-2xl` | `20px` | 2-column Product Cards, floating action surfaces. |
| `rounded-xl` | `16px` | Section cards, filter panels, search input containers. |
| `rounded-lg` | `14px` | Action buttons, form fields, small interactive tiles. |
| `rounded-full` | `9999px` | Category chips, source badges, status indicators, floating dock, avatar rings. |

---

## 7. Button & Interactive States

Interactive elements support distinct tactile states:
- **Primary Action (Solid):** Deep Forest Green background (`bg-[#183C32]`), white text (`text-white`), scaling slightly on press (`active:scale-[0.98]`), with clear ring outlines on keyboard focus (`focus-visible:ring-2 focus-visible:ring-[#183C32]`).
- **Secondary Action (Soft):** Forest Green Soft background (`bg-[#E7EFEB]`), Forest Green text (`text-[#183C32]`), hover state (`hover:bg-[#d6e4dc]`).
- **Icon / Secondary Controls:** Subtle outline or neutral fill with smooth color transitions (`transition-all duration-150`).
- **Disabled State:** Reduced opacity (`opacity-50 pointer-events-none`) with muted contrast.

---

## 8. Mobile Navigation Dock

The student-facing mobile shell implements a floating bottom navigation bar:
- **Destinations (4):**
  1. *Beranda* (Home discovery, curated school goods)
  2. *Jelajah* (Catalog categories, search, student stalls)
  3. *Pesanan* (Order queue, pickup tracking, transaction history)
  4. *Keranjang* (Cart items, summary, checkout bridge)
- **Active State Architecture:**  
  Active destination expands into a horizontal pill featuring Forest Green fill (`bg-[#183C32]`), white icon, and white text label. Inactive destinations display muted gray icons with subtle hover brightening.
- **Badge Integration:**  
  The Cart item supports numeric badge display (e.g., active cart counter) using an amber/gold counter ring (`bg-[#D5A84C] text-[#171A18]`).
- **Icon System:** Standardized on `lucide-react` icons (`Home`, `Compass`, `ReceiptText`, `ShoppingBag`, `Heart`, `Search`, `SlidersHorizontal`).

---

## 9. Reusable Component Inventory

The following component primitives were created under [resources/js/components/](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/):

1. **`AppShell`** ([resources/js/components/layout/AppShell.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/layout/AppShell.tsx))  
   Root layout container handling mobile-first centering, sticky mobile header, scrollable content region, and floating bottom navigation dock.
2. **`MobileHeader`** ([resources/js/components/layout/MobileHeader.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/layout/MobileHeader.tsx))  
   Compact top bar featuring the KOPDIG logo mark, contextual greeting, school descriptor badge, and user avatar button.
3. **`BottomNavigation`** ([resources/js/components/layout/BottomNavigation.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/layout/BottomNavigation.tsx))  
   Floating touch-optimized navigation dock with active destination pill transitions and badge counters.
4. **`PageContainer`** ([resources/js/components/layout/PageContainer.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/layout/PageContainer.tsx))  
   Semantic container enforcing maximum mobile width constraints (`max-w-md` mobile, `sm:max-w-2xl` tablet, `lg:max-w-5xl` desktop) and standardized horizontal gutter padding.
5. **`SectionHeader`** ([resources/js/components/ui/section-header.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/ui/section-header.tsx))  
   Standardized section title and subtitle with an optional right-aligned action trigger ("Lihat Semua").
6. **`CategoryChip`** ([resources/js/components/commerce/CategoryChip.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/commerce/CategoryChip.tsx))  
   Pill-shaped filter button with icon slot, active Forest Green state, and inactive soft surface styling.
7. **`ProductSourceBadge`** ([resources/js/components/commerce/ProductSourceBadge.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/commerce/ProductSourceBadge.tsx))  
   KOPDIG brand differentiator badge visually distinguishing official cooperative merchandise ("Koperasi") from student consignment ("Dititipkan oleh [Nama]").
8. **`PriceDisplay`** ([resources/js/components/commerce/PriceDisplay.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/commerce/PriceDisplay.tsx))  
   Formatted integer Rupiah display with strike-through original pricing support and tabular numeral alignment.
9. **`StatusBadge`** ([resources/js/components/ui/status-badge.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/ui/status-badge.tsx))  
   Color-coded semantic status indicator for orders, stock levels, and queue phases.
10. **`ProductCard`** ([resources/js/components/commerce/ProductCard.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/components/commerce/ProductCard.tsx))  
    Visual foundation of the 2-column mobile commerce grid. Includes 4:3 product image slot, consignment source badge, wishlist heart button, item title, price display, and thumb-friendly "Tambah" / "Di keranjang" toggle.

---

## 10. Responsive Adaptation Rules

- **Mobile Viewport (320px – 430px):**  
  Primary canvas. Displays 2-column product grid (`grid-cols-2 gap-3`), horizontal edge-to-edge category scrolling (`overflow-x-auto no-scrollbar`), and floating bottom navigation docked above safe area.
- **Tablet Viewport (640px – 768px):**  
  Container widens (`sm:max-w-2xl`), product grid expands to 3 columns (`sm:grid-cols-3 gap-4`).
- **Desktop Viewport (1024px+):**  
  Container widens to `max-w-5xl`, product grid transitions to 4 columns (`lg:grid-cols-4 gap-5`). The mobile navigation dock remains centered and accessible or can adapt to sidebar orientation in future administrative layouts.

---

## 11. Accessibility (a11y) Decisions

1. **Touch Targets:** All clickable areas maintain at least `44x44px` dimensioning via wrapper padding or explicit dimensions.
2. **Contrast Standards:** Primary text (`#171A18`) against Canvas (`#F7F6F1`) and Surface (`#FFFFFF`) satisfies WCAG AAA contrast ratio (> 12:1). Secondary muted text (`#707770`) maintains > 4.5:1 (WCAG AA). Primary button text (white on `#183C32`) exceeds 10:1.
3. **Screen Readers & Keyboard Navigation:**
   - Navigational bars are enclosed in semantic `<nav aria-label="Navigasi Utama">`.
   - Category filters define `role="region"` and `aria-label="Kategori Produk"`.
   - Toggle buttons implement `aria-pressed` and `aria-label` attributes.
   - Visible focus outlines (`focus-visible:ring-2 focus-visible:ring-[#183C32]`) accompany all interactive states.

---

## 12. Known Limitations & Future Phase Handoff

- **Data State:** Phase 3 uses mock product models for component demonstration in [resources/js/pages/welcome.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/pages/welcome.tsx). Database-driven models and Inertia server props will be introduced in subsequent phases.
- **Cart State Persistence:** The "Tambah" action demonstrates component-level interactive state toggling; real global cart management (session or database backed) will be wired in the Cart phase.
- **Fonts:** Fonts are served via Fontshare CDN with system sans-serif fallbacks (`system-ui, -apple-system, sans-serif`). Self-hosted font assets can be bundled in production optimization if offline capability is required.
