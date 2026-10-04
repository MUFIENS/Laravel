# KOPDIG — Student Account Hub Experience Redesign

## 1. Executive Summary

This document details the architectural design, user experience system, and implementation of the authenticated student's **Account Hub (`My KOPDIG`)**, accessible via `/settings/profile` and `/account`.

KOPDIG diverges fundamentally from traditional e-commerce platforms. In this school cooperative ecosystem, a student embodies two distinct identities:
1. **The Buyer ("Ini akun belanjaku")**: Exploring products, placing orders, picking up items at the physical cooperative counter via queue numbers/verification vouchers, and accessing past receipts.
2. **The Student Creator ("Ini ruang untuk karya yang kutitipkan")**: Crafting authentic handmade products, snacks, or stationery, and submitting them for cooperative curation and consignment without transferring ownership.

The redesigned Account Hub unifies these dual identities into an editorial, high-performance, mobile-first personal workspace that seamlessly extends the design DNA of the KOPDIG landing page, marketplace, product detail, cart, and checkout experiences.

---

## 2. Information Architecture & Page Hierarchy

The page structure follows a focused, non-dashboard visual hierarchy tailored for clarity, trust, and ease of access:

```
[ TOP TRANSACTIONAL HEADER (KOPDIG Mark, Back to Explore, Cart, Quick Logout) ]
                                    ↓
[ SECTION 01: PROFILE OVERVIEW & DUAL IDENTITY HERO (Avatar, NISN, Verified Email, Concept Manifesto) ]
                                    ↓
[ SECTION 02: SIGNATURE EDITORIAL ACTION: "TITIPKAN KARYAMU KE KOPERASI" (Pillars, Direct CTA) ]
                                    ↓
┌────────────────────────────────────────┬────────────────────────────────────────┐
│ SECTION 03: PESANAN BELANJA TERBARU    │ SECTION 04: TITIPAN PRODUK SAYA        │
│ (Order Number, Separate Status Badges, │ (Product Name, Category, Modal Price,  │
│  Queue Codes, Total IDR, Detail Link)  │  Status Badges, Rejection Notes, Link) │
└────────────────────────────────────────┴────────────────────────────────────────┘
                                    ↓
┌────────────────────────────────────────┬────────────────────────────────────────┐
│ SECTION 05: PENGATURAN PROFIL          │ SECTION 06: KEAMANAN & KATA SANDI      │
│ (Name, Email, Read-Only NISN, Save)    │ (Current Password, New Password, Save) │
└────────────────────────────────────────┴────────────────────────────────────────┘
                                    ↓
[ SECTION 07: SESI AKUN & LOGOUT (Deliberate Logout, Safety Warnings, Account Deletion Modal) ]
```

---

## 3. Detailed Component & Section Specifications

### 3.1. Profile Overview & Dual Identity Manifesto
- **Identity Fields**:
  - Displays authenticated user's real name, email with verified status dot, and assigned school identifier (`NISN`).
  - Account role badge: `[ SISWA / ANGGOTA KOPERASI ]` (or `[ PENGURUS KOPERASI ]` for operators).
  - No synthetic gamification, membership tiers, credit points, or arbitrary rankings.
- **Dual Manifesto Card**:
  - Visually anchors the dual nature of student membership:
    - *"Ini Akun Belanjaku"*: Order tracking, counter queue management, and transaction slips.
    - *"Ini Ruang untuk Karyaku"*: Student creation, cooperative quality curation, and consigned sales.
- **Quick Jump Bar**:
  - Semantic anchor links (`#pesanan`, `#titipan`, `#pengaturan`, `#keamanan`) with real-time counter pills allowing instant navigation on all viewports.

### 3.2. Signature Editorial Action: "Titipkan Karyamu"
- **Purpose**: The most prominent feature distinguishing KOPDIG from standard web stores.
- **Visual Design**: Dark stone card (`#141414`), hairline vermilion accent borders, subtle radial gradient, and three value pillars:
  1. *Kurasi Mutu oleh Pengurus Koperasi*
  2. *Transaksi Kasir & QR Koperasi Terkelola*
  3. *Hak Kepemilikan Tetap Milik Siswa*
- **Call-to-Action**: Leads directly to the existing consignment creation route (`route('student.consignments.create')`). No duplicate submission system.

### 3.3. Recent Orders Panel (Buyer Identity)
- **Data Source**: Real Eloquent orders belonging to the authenticated student (`$user->orders()->with(['items', 'pickupSession'])->latest()->take(3)`).
- **Status Separation**:
  - **Payment Status**: Clearly distinguishes `Menunggu Pembayaran` (amber) from `Dibayar` (emerald).
  - **Fulfillment / Order Status**: Clearly distinguishes `Menunggu Pembayaran`, `Diproses` (sky), `Siap Diambil` (indigo/purple), and `Selesai` (emerald).
- **Details**: Displays item summary, total in Indonesian Rupiah (`formatRupiah`), queue code badge (`e.g. A-012`), and direct link to `/orders/{id}`.
- **Empty State**: Editorial container with `ShoppingBag` icon and direct CTA to `/explore`.

### 3.4. My Consignments Panel (Student Creator Identity)
- **Data Source**: Real `ProductSubmission` records belonging to the student (`$user->productSubmissions()->with(['category', 'product'])->latest()->take(4)`).
- **Semantic Status Badges**:
  - `Diajukan` (Submitted - Amber)
  - `Sedang Ditinjau` (Under Review - Sky Blue)
  - `Disetujui` (Approved - Emerald)
  - `Ditolak` (Rejected - Rose)
- **Rejection Transparency**: When a submission is rejected, the cooperative reviewer's reason is presented in a human-readable, non-technical alert box. Internal operator IDs and audit timestamps are strictly sanitized.
- **Approved Product Link**: If approved, an instant link to the public catalog product (`/products/{slug}`) is provided.
- **Empty State**: Encouraging callout with `Package` icon and direct CTA to `/student/consignments/create`.

### 3.5. Profile Settings & Security
- **Personal Info**:
  - Live Inertia `useForm` managing `name` and `email`.
  - Submits to `route('profile.update')` (`PATCH /settings/profile`).
  - Read-only NISN card explaining school registry synchronization.
- **Security & Password**:
  - Dedicated form managing `current_password`, `password`, and `password_confirmation`.
  - Submits to `route('user-password.update')` (`PUT /settings/password`) with server-side validation error handling.
  - Success feedback toast confirming encryption update.
- **Session & Logout**:
  - Dedicated `Keluar dari Akun KOPDIG` button executing a server-side `POST /logout` via Inertia.
  - Safe account deletion modal (`DeleteUser`) preserved with password confirmation.

---

## 4. Visual Language & Design Tokens

Carried over faithfully from the KOPDIG landing page and marketplace:

| Element | Specification | Purpose |
|---|---|---|
| **Canvas Background** | `#0A0A0A` | Deep, immersive obsidian dark surface |
| **Surface Cards** | `#141414` / `#181818` | Elevated content modules |
| **Primary Accent** | `#E34A27` | KOPDIG Vermilion / Terracotta action color |
| **Borders** | `#262626` | Hairline, crisp architectural boundary lines |
| **Typography** | Font-heading (bold/black) + Font-sans + Font-mono | Balanced editorial and technical typographic hierarchy |
| **Atmospheric Glow** | `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(227,74,39,0.15), transparent)` | Ambient warmth without visual clutter |
| **Grid Texture** | 40px linear grid at 4.5% opacity | Subtle tactile canvas texture |
| **Iconography** | Lucide React exclusively | ZERO emoji policy strictly enforced across all states |

---

## 5. Responsive Design Strategy

The Account Hub was engineered and verified across all required breakpoints:

1. **Mobile (`390px` - `430px`)**:
   - Single-column linear flow prioritizing identity, primary consignment CTA, recent orders, consignments, and settings.
   - All interactive touch targets are at least `44px` in height.
   - Zero horizontal overflow (`overflow-x-hidden`, responsive truncated headings, flexible price tags).
2. **Tablet (`768px` - `1024px`)**:
   - Balanced spacing with horizontal quick jump navigation.
3. **Desktop (`1280px` - `1440px`)**:
   - High information density without clutter.
   - Side-by-side 2-column layout for Activity (Orders vs Consignments) and Management (Profile vs Security).

---

## 6. Authorization & Data Privacy Integrity

The Account Hub enforces strict server-side authorization:
1. **Ownership Isolation**: In `ProfileController::edit`, queries are strictly bound to `$request->user()->orders()` and `$request->user()->productSubmissions()`. Students can never view another user's orders or submissions.
2. **Role Immutability**: Role cannot be modified or forged via `profile.update`. If a client sends `role => 'cooperative'`, server-side validation ignores it.
3. **Reviewer Privacy**: Internal reviewer IDs and cooperative metadata are completely excluded from the JSON payloads returned to the frontend.
4. **Layout Decoupling**: In `resources/js/app.tsx`, `settings/profile` is exempted from the legacy Breeze admin sidebar layout, providing full UI control while maintaining existing routing.

---

## 7. Quality Gate Results

All project quality gates were executed and passed cleanly:

1. **Pint Code Style**:
   ```
   vendor/bin/pint --test
   Result: PASSED (100% compliant)
   ```
2. **PHPStan Static Analysis**:
   ```
   vendor/bin/phpstan --configuration=phpstan.neon
   Result: PASSED (0 errors at project configuration level)
   ```
3. **Pest Feature & Authorization Tests**:
   ```
   php artisan test
   Result: PASSED (250 tests passed, 1862 assertions)
   ```
   - Includes 6 dedicated `AccountHubTest` scenarios verifying guest restrictions, data isolation, role immutability, reviewer data protection, and password updates.
4. **TypeScript Verification**:
   ```
   npm run types:check
   Result: PASSED (tsc --noEmit passed with 0 errors)
   ```
5. **Linter & Code Format (Oxcheck / Oxfmt)**:
   ```
   npm run check
   Result: PASSED (All 117 files correctly formatted, 0 warnings/errors in 110 files)
   ```
6. **Vite Production Asset Build**:
   ```
   npm run build
   Result: PASSED (built in 10.74s with full Wayfinder routing and code-splitting)
   ```
