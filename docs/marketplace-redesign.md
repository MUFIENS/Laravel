# KOPDIG Marketplace Experience Rebuild (`/explore`)
## Tokopedia-Like Commerce UX + KOPDIG Modern Visual Language

**Author:** Antigravity Senior Ecommerce Product Designer & Creative Frontend Team  
**Date:** 2026-10-04  
**Route:** `GET /explore` (`route('explore')`)  
**Component:** `resources/js/pages/explore.tsx`  
**Controller:** `app/Http/Controllers/MarketplaceController.php`

---

## 1. Executive Summary & Design Mission

The objective was to completely rebuild the authenticated KOPDIG marketplace catalog (`/explore`) into a high-density, commerce-first discovery platform. The experience takes the information architecture, search discipline, and usability principles of an enterprise marketplace (such as Tokopedia), while expressing KOPDIG's proprietary dark-mode visual identity—avoiding visual cloning, generic AI slop, and fabricated product metrics.

### Key Pillars:
1. **Commerce-First Usability**: Strong omnibox search, category browsing, multi-facet filtering (source and stock status), and rapid quick-add to cart.
2. **Server-Authoritative Pricing & Stock**: 100% real prices (`selling_price`), real stock (`in_stock`, `low_stock`, `out_of_stock`), real categories, and authentic product ownership (`cooperative` vs. `student`).
3. **KOPDIG Visual Identity**: `#0A0A0A` dark canvas, `#141414` surface cards, `#262626` borders, vibrant vermilion `#E34A27` accents, Satoshi/General Sans typography, and Lucide React iconography.
4. **Merchandising Rhythm**: Sectional hierarchy (Omnibox Search → Horizontal Category Rail → Curated Featured Rail → Discovery Grid with Facet Filters → Student Consignment Spotlight).

---

## 2. Tokopedia-Inspired UX Architecture

| Tokopedia Commerce Principle | How KOPDIG Reinterprets the Pattern | Anti-Cloning Distinction |
| :--- | :--- | :--- |
| **Omnipresent Search** | Sticky header with prominent search input, clear button, keyboard shortcuts, and live query indicators | Styled with dark translucent glass (`backdrop-blur-md`), mono metadata counters, and `#E34A27` focus rings. |
| **Category Quick Rails** | Horizontal scrollable category pills with icon + label + item counters | Minimal pill geometry, monospaced category counts, and high-contrast active states. |
| **Merchandising Density** | Multi-tiered sections: Featured curation followed by comprehensive catalog grid | Avoids cluttered banners or aggressive popups; uses clean editorial card framing. |
| **Faceted Filtering** | Dynamic source (`Semua`, `Koperasi`, `Titipan Siswa`) and availability toggles | Segmented pill controls rather than multi-layered accordion sidebars that overpower mobile screens. |
| **Instant Cart Feedback** | Quick-add button right on the card with microinteraction, cart count sync, and toast notification | Subtle sonner toast and animated checkmark state instead of full-screen drawer interruptions. |

---

## 3. Product Card Anatomy & Information Hierarchy

Each product card is engineered with a strict 5-layer hierarchy:

```
+-----------------------------------------------------------+
| [IMAGE FRAME] (Aspect 4:3 or 1:1, hover scale 1.03)        |
| - Fallback icon graphic for missing/null image_path       |
| - Subtle Stock Badge (e.g. "Stok Terbatas", "Habis")      |
| - Quick Add Button (desktop hover or mobile tap)          |
+-----------------------------------------------------------+
| [SOURCE & CATEGORY ROW]                                   |
| - Koperasi (Store icon) OR Titipan [Nama Siswa]           |
| - Category Tag (e.g. "Jajanan", "ATK & Buku")             |
+-----------------------------------------------------------+
| [PRODUCT TITLE]                                           |
| - 2-line clamp, high legibility, font-medium              |
+-----------------------------------------------------------+
| [PRICE ROW]                                               |
| - Authoritative server price formatted in Rupiah (id-ID)  |
| - Monospaced numbers, vermilion accent                    |
+-----------------------------------------------------------+
| [ACTION ROW]                                              |
| - Quick Add to Cart button (POST /cart/items)             |
| - Real stock counter (e.g. "Tersisa 10 pcs")              |
+-----------------------------------------------------------+
```

### Business Semantics Preserved:
- **Product Source**: Displays `"Koperasi"` for school-owned items and `"Dititipkan oleh [Nama]"` for student consignment goods. No third-party merchant accounts are fabricated.
- **Authoritative Price**: Uses `product.selling_price` from the database. Zero calculated discounts or fake strike-through pricing.
- **Stock States**: Reflects database `stock_status` (`in_stock`, `low_stock`, `out_of_stock`). Out-of-stock items disable the quick-add button and display `"Habis"`.

---

## 4. Search, Navigation & Facet Filtering

### 1. Server-Authoritative Search:
- Submitting search triggers Inertia router visits to `/explore?search=...` preserving query parameters.
- Search input provides instant clear (`X`) and visual focus states.
- Empty states display dedicated recovery UI with a `"Reset Pencarian"` action.

### 2. Category Rail:
- Pulls live categories from the database: `Jajanan`, `Minuman`, `ATK & Buku`, `Atribut Sekolah`, `Karya Siswa`.
- Displays active pill indicators with category icons (Lucide React).
- Mobile horizontal scrolling with touch overflow (`no-scrollbar`).

### 3. Source & Availability Filters:
- Source Filter: `Semua` | `Koperasi` | `Titipan Siswa`.
- Availability Filter: `Semua Stok` | `Hanya Tersedia`.
- Active filters chip display with count badge and one-click `"Reset Filter"` button.

---

## 5. Responsive Strategy

| Viewport | Layout Architecture | Navigation & Cards |
| :--- | :--- | :--- |
| **Mobile (<640px)** | Compact header, full-width search input, horizontal category rail, 2-column product grid | Floating mobile bottom navigation bar (`Beranda`, `Eksplor`, `Keranjang`, `Masuk`/`Akun`). |
| **Tablet (640px–1024px)**| 2-column or 3-column discovery grid, side-scrolling featured rail | Streamlined navigation with search bar and cart counter. |
| **Desktop (≥1024px)**| 4-column discovery grid, header with live cart badge, account menu | Hover cards with subtle scale transitions (`scale-[1.02]`), quick action reveals. |

---

## 6. Accessibility & Motion Design

1. **Accessibility (a11y)**:
   - Proper heading hierarchy (`h1`, `h2`, `h3`).
   - Accessible labels (`aria-label`) on all icon-only buttons (search, clear, cart, quick add).
   - High contrast ratios: Light neutral typography (`#F5F5F5` and `#A3A3A3`) against dark surfaces (`#141414` and `#0A0A0A`).
   - Keyboard accessible navigation across all interactive buttons, links, and search inputs.

2. **Motion Design**:
   - Subtle image scaling on card hover (`transition-transform duration-300 group-hover:scale-105`).
   - Action button surface transitions (`transition-colors duration-200`).
   - Smooth horizontal snap scrolling on featured product rails.
   - Non-disruptive feedback via Sonner toast notifications and icon check state.
   - Respects `prefers-reduced-motion` settings.

---

## 7. Quality Gates & Verification Results

All strict quality gates have been executed and passed without any relaxed rules:

| Quality Gate | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Laravel Pint** | `vendor/bin/pint --test` | **Passed** | Clean code formatting across all PHP files. |
| **PHPStan** | `vendor/bin/phpstan --configuration=phpstan.neon` | **Passed (0 errors)** | Full static type safety verified. |
| **Pest / PHPUnit** | `php artisan test` | **Passed (251/251 tests, 1738 assertions)** | All unit and feature tests green, including 10/10 `MarketplaceTest` tests. |
| **TypeScript** | `npm run types:check` | **Passed (0 errors)** | Clean TypeScript compilation across the entire project. |
| **Vite Lint / Check** | `npm run check` | **Passed (0 errors, 0 warnings)** | Checked 115 files formatted, 108 files linted cleanly. |
| **Vite Build** | `npm run build` | **Passed** | Built `explore-mIjV3HQf.js` (27.63 kB) and assets in 7.44s. |
| **Endpoint Check** | `curl -i http://127.0.0.1:8000/explore` | **HTTP 200 OK** | Inertia returns `explore` component with authentic database records. |
