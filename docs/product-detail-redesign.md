# KOPDIG — Product Detail Experience Redesign

## 1. Executive Summary & Design Direction

The product detail page (`/products/{product}`) is a critical transactional touchpoint in KOPDIG. Rather than adopting a generic, utilitarian CRUD or boilerplate ecommerce template, the page has been completely redesigned into an **editorial, product-focused, and confident storytelling experience** that seamlessly inherits the visual language of the **KOPDIG Landing Page**, the **Marketplace**, and the **Mobile Reference Architecture**.

The page balances **editorial merchandising** with **instant transactional usability**, ensuring students can easily inspect products, understand provenance (cooperative vs. student consignment), check authoritative pricing and stock, configure quantities, and add items to their persistent cart.

---

## 2. Design Foundation & Synthesis of Three Sources

### Source 1: KOPDIG Landing Page
- **Canvas & Atmosphere**: Pitch dark background (`#0A0A0A`) with subtle warm cream typography (`#F5F2EB`), terracotta orange accents (`#E34A27`), hairline dark borders (`#262626`), and soft terracotta ambient radial lighting (`bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(227,74,39,0.14),transparent)]`).
- **Architectural Grid Texture**: Subtle 40px grid lines (`bg-[linear-gradient(to_right,#26262612_1px,transparent_1px),linear-gradient(to_bottom,#26262612_1px,transparent_1px)]`).
- **Signature Branding**: Geometric KOPDIG rotated mark in the sticky glass header.

### Source 2: KOPDIG Marketplace (`/explore`)
- **Commerce Usability**: Authoritative pricing without deceptive fake strikes or discounts.
- **Stock Badging**: Real-time stock status (Tersedia with live pulsing dot, Stok Terbatas with amber warning, and Stok Habis with rose alert).
- **Persistent Cart Integration**: Header cart badge reflecting live `cartCount` with instant increment on addition.
- **Related Products Rail**: Clean 4-column discovery grid of active products from the same category with quick add-to-cart capability.

### Source 3: Mobile Reference Architecture & Editorial Composition
- **Visual Dominance**: The product image is elevated onto a large dark pedestal stage rather than boxed in generic cards.
- **Thumb-Zone Accessibility**: Sticky bottom mobile purchase dock ensuring the quantity stepper and "Tambah ke Keranjang" CTA remain reachable on small screens.
- **No AI-Slop / Zero Emoji**: Strictly Lucide React icons (`ShoppingBag`, `Store`, `UserCheck`, `Minus`, `Plus`, `ShieldCheck`, `Clock`, `ArrowLeft`, `ArrowRight`).

---

## 3. Information Architecture & Page Narrative

The page guides the user through an intentional 7-stage narrative:

```
1. SEE THE PRODUCT (Dominant, uncluttered studio image stage with zoom-on-hover)
   ↓
2. UNDERSTAND WHO PROVIDES IT (Explicit source badge: "Koperasi" vs. "Titipan: [Nama]")
   ↓
3. UNDERSTAND THE PRODUCT (Typographic title hierarchy & readable description)
   ↓
4. CHECK PRICE + STOCK (Prominent authoritative price & server-side stock badge)
   ↓
5. CHOOSE QUANTITY (Tactile stepper bounded by real stock limits)
   ↓
6. ADD TO CART (High-contrast terracotta CTA with loading & toast feedback)
   ↓
7. DISCOVER RELATED PRODUCTS (Seamless continuation of browsing)
```

---

## 4. Key Architectural & Interaction Features

### 4.1 Dominant Image Staging
- **Pedestal Frame**: Custom dark studio container (`#141414` surface, `#262626` border, `aspect-square` on mobile / `aspect-[4/3]` on desktop).
- **Graceful Fallbacks**: Handles missing images and image load failures using category-specific fallback icons.
- **Hover Motion**: Smooth 700ms scale transition (`group-hover:scale-105`) providing subtle tactile depth.

### 4.2 Provenance & Student Consignment Transparency
- **Student Consignment (`source_type === 'student'`)**:
  - Highlights `Titipan: [Nama Siswa]` with amber `UserCheck` badge.
  - Explains the student entrepreneurship model: KOPDIG acts as cooperative curator/operator while ownership and creative profits remain with the student.
  - Privacy guarantee: Only student name is displayed; NISN, email, and private IDs are never exposed.
- **Cooperative Procurement (`source_type === 'cooperative'`)**:
  - Displays `Koperasi Sekolah` with emerald `Store` badge denoting official school procurement.

### 4.3 Authoritative Pricing & Zero Deceptive Patterns
- Direct rendering of `selling_price` from the database formatted in Indonesian Rupiah (`Rp XX.XXX`).
- Absolute zero fake strikes, countdown timers, fake discounts, or artificial urgency badges.

### 4.4 Stock Availability & Quantity Stepper
- **In Stock**: Displays `Tersedia ({stock} Unit)` with an animated emerald pulse dot.
- **Low Stock (<= 5 units)**: Displays `Stok Terbatas (Sisa {stock} Unit)` in amber.
- **Out of Stock**: Displays `Stok Habis` in rose with a disabled purchase CTA.
- **Stepper Logic**:
  - Bounded between 1 and `min(stock, 10)`.
  - Disables decrease when quantity is 1; disables increase when reaching stock limits.
  - Real-time subtotal calculation (`quantity * selling_price`).

### 4.5 Add to Cart Flow & Microinteractions
- Clicking "Tambah ke Keranjang" invokes `POST /cart/items` with Inertia `preserveScroll: true`.
- CTA shows `Loader2` spinner during in-flight requests.
- Instant feedback delivered via Sonner toast notification (`toast.success`).
- Header cart counter updates automatically via Inertia shared props without page reload.

### 4.6 Product Story & Logistics Section
- Located below the fold:
  1. **Jaminan Mutu & Higienitas**: Highlights cooperative staff inspection and quality standards.
  2. **Jadwal Pengambilan Istirahat**: Clarifies physical collection at Loket Koperasi Lantai 1 during recess sessions.
  3. **Wirausaha Siswa Callout**: Contextual note celebrating student artisan work.

### 4.7 Related Products Discovery
- Queries up to 4 active products in the same category (`category_id`) excluding the current product.
- Rendered in a responsive 2/4-column grid with dark editorial card styling.
- Features inline "Tambah ke Keranjang" quick-add button.

### 4.8 Mobile Sticky Commercial Dock
- Elevated bottom bar anchored for one-handed thumb interaction (`fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 border-t border-[#262626] backdrop-blur-md`).
- Combines quantity stepper, subtotal preview, and full-width CTA.
- Accommodates iOS safe-area-inset-bottom and includes bottom padding on the main viewport to prevent content obstruction.

---

## 5. Responsive Breakpoints Tested

| Viewport | Layout Strategy |
|---|---|
| **390 x 844** (iPhone 12/13/14) | Single column linear narrative; square image; sticky bottom purchase dock. |
| **430 x 932** (iPhone 14/15 Pro Max) | Single column linear narrative with generous touch padding. |
| **768 x 1024** (iPad Mini / Tablet) | Stacked 12-column layout with 2-column related products rail. |
| **1280 x 800** (Small Laptop) | 2-column editorial split (7 cols image & story / 5 cols sticky purchase station). |
| **1440 x 900** (Standard Desktop) | Full 12-column layout with sticky right purchase station. |

---

## 6. Quality Gates & Verification

- **Linting & Code Formatting (`npm run check`)**:
  - `vp check`: **All 117 files formatted, 0 warnings, 0 errors**.
- **TypeScript Static Verification (`npm run types:check`)**:
  - `tsc --noEmit`: **0 errors**.
- **Production Asset Build (`npm run build`)**:
  - `vp build`: **Built cleanly in 13.04s**.
- **PHP Code Style (`vendor/bin/pint --test`)**:
  - `pint`: **Passed (0 issues)**.
- **PHP Static Analysis (`vendor/bin/phpstan`)**:
  - `phpstan`: **Passed (0 errors)**.
- **Pest / PHPUnit Test Suite (`php artisan test`)**:
  - **244 passed, 0 failed, 1766 assertions (100% pass rate)**.
