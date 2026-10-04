# KOPDIG Phase 11A — Cooperative Workspace & Application Shell Implementation

## 1. Executive Summary

Phase 11A establishes the dedicated KOPDIG Cooperative Workspace ("Ruang Kerja Pengurus Koperasi"). Following the completion of the student commerce lifecycle (marketplace, cart, checkout, Midtrans payments, queue allocation, QR pickup, and physical verification), this phase provides a tailored, operations-first application shell and operational navigation system for school cooperative staff.

In accordance with strict phase scoping:
- No full analytics dashboard or fake metric counters were created.
- No new business logic (product CRUD, stock movements, reporting engines) was introduced.
- Existing operational routes (`cooperative.consignments.*` and `cooperative.pickup.*`) were preserved and seamlessly integrated into the unified workspace shell.
- Navigation placeholders were established for modules scheduled in subsequent phases.

---

## 2. Cooperative Shell Architecture

### 2.1 Operations-First Visual Foundation
The cooperative workspace is designed as an authentic operational tool for school cooperative staff, consciously avoiding generic SaaS admin dashboard templates, meaningless charts, excessive statistic cards, decorative gradients, or artificial glassmorphism.

The visual identity preserves KOPDIG's established design tokens:
- **Brand Anchor:** Deep Forest Green (`--color-primary: #183C32`, `--color-primary-soft: #E7EFEB`)
- **Canvas Backdrop:** Warm neutral canvas (`--color-canvas: #F7F6F1`)
- **Surfaces:** Clean white surfaces (`--color-surface: #FFFFFF`) with subtle borders (`--color-border-subtle: #E4E4DC`)
- **Accents:** Muted Gold (`--color-accent: #D5A84C`)
- **Typography:** `Satoshi` for brand headers and section titles; `General Sans` for metadata, navigation, and tabular figures.

### 2.2 Shell Component Composition
The cooperative application shell is structured as a modular component hierarchy in `resources/js/components/cooperative/`:

1. **`CooperativeShell`**: The root layout wrapper managing responsive layout adaptation, mobile drawer states, top header, and page container mounting.
2. **`CooperativeSidebar` & `CooperativeSidebarContent`**: The persistent desktop sidebar and drawer content containing brand identity, operational navigation menu, external link to the student catalog, and the authenticated cooperative staff profile with direct logout.
3. **`CooperativeHeader`**: A compact, responsive top bar providing a mobile hamburger trigger, breadcrumb navigation, role badge ("Petugas Koperasi"), user avatar initials, and quick logout.
4. **`CooperativeMobileNav`**: An accessible slide-over drawer for mobile viewports (< 768px) with focus trap, ESC key listener, and backdrop dismissal.
5. **`CooperativePageContainer`**: Standardized content container providing page title, contextual subtitle, action button slots, and consistent responsive padding across operational pages.

---

## 3. Route Structure & Role Boundaries

### 3.1 Route Registrations
All cooperative workspace routes are registered in `routes/web.php` under the `cooperative` prefix with `['auth', 'role:cooperative']` middleware:

| Route URI | Name | Controller Action | Purpose |
|---|---|---|---|
| `GET /cooperative` | `cooperative.index` | `CooperativeWorkspaceController@index` | Cooperative workspace entry point & overview |
| `GET /cooperative/orders` | `cooperative.orders.index` | `CooperativeWorkspaceController@orders` | Operational order queue placeholder |
| `GET /cooperative/consignments` | `cooperative.consignments.index` | `ConsignmentReviewController@index` | Existing consignment review module |
| `GET /cooperative/consignments/{id}` | `cooperative.consignments.show` | `ConsignmentReviewController@show` | Existing consignment inspection & approval |
| `GET /cooperative/products` | `cooperative.products.index` | `CooperativeWorkspaceController@products` | Cooperative product catalog placeholder |
| `GET /cooperative/inventory` | `cooperative.inventory.index` | `CooperativeWorkspaceController@inventory` | Cooperative inventory & stock placeholder |
| `GET /cooperative/pickup` | `cooperative.pickup.index` | `PickupVerificationController@index` | Existing loket pickup verification & QR scanner |
| `GET /cooperative/reports` | `cooperative.reports.index` | `CooperativeWorkspaceController@reports` | Cooperative reports & ledger placeholder |

### 3.2 Role Redirection Boundary
The authenticated dashboard redirector (`DashboardController`) routes users authoritatively based on verified role:
- **Cooperative Role:** Redirects to `route('cooperative.index')` (`/cooperative`).
- **Student Role:** Redirects to `route('home')` (`/`).
- **Guest:** Redirects to `route('login')`.

Attempts by students to directly navigate to `/cooperative` or any cooperative sub-route are rejected with HTTP 403 Forbidden by the server-side `EnsureUserHasRole` middleware.

---

## 4. Navigation Structure & Hierarchy

The cooperative workspace navigation implements the prioritized operational hierarchy:

1. **Overview** (`/cooperative`): Active workspace overview, quick operational jump cards, module roadmap, and staff operating guidelines.
2. **Pesanan** (`/cooperative/orders`): Upcoming operational queue management and order fulfillment monitoring.
3. **Titipan Siswa** (`/cooperative/consignments`): Active consignment curation, margin configuration, and product approval workflow.
4. **Produk** (`/cooperative/products`): Upcoming cooperative product inventory and catalog management.
5. **Stok** (`/cooperative/inventory`): Upcoming inventory movements, physical stock adjustments, and stocktake logs.
6. **Pickup** (`/cooperative/pickup`): Active loket pickup verification console with in-browser QR scanning and manual token input.
7. **Laporan** (`/cooperative/reports`): Upcoming financial summaries, student profit share distribution, and cooperative bookkeeping.

### 4.1 Future Module Placeholders
For modules scheduled in subsequent development phases (`orders`, `products`, `inventory`, `reports`):
- Navigation items display a neutral "Segera" badge.
- Clicking routes to `resources/js/pages/cooperative/placeholder.tsx`.
- The placeholder explains the module's planned functionality and provides immediate shortcuts back to currently active modules (`consignments` and `pickup`).
- Zero fake metrics, zero fake sales totals, and zero fabricated charts are rendered.

---

## 5. Responsive Behavior

The cooperative workspace adapts gracefully across all documented viewports:

| Viewport Category | Width Tested | Layout Presentation |
|---|---|---|
| Extra Small (Mobile) | 320px, 375px, 390px, 430px | Header with hamburger toggle; full slide-over drawer; single-column operational cards; touch targets $\ge 44\text{px}$. |
| Tablet (Compact) | 768px | Header with breadcrumbs; mobile drawer or compact workspace; grid adapts to 2 columns. |
| Laptop / Desktop | 1024px, 1280px, 1440px | Fixed 256px (`w-64`) persistent sidebar; top header with breadcrumb trail and user context; multi-column content layout. |

---

## 6. Integration of Existing Operational Modules

Existing operational interfaces created in Phase 5 and Phase 10 were refactored to consume the unified `CooperativeShell`:

1. **Review Titipan Siswa (`pages/cooperative/consignments/index.tsx`)**: Replaced ad-hoc header with `CooperativeShell activeNav="consignments"`, giving cooperative staff direct sidebar navigation and active module context while reviewing student submissions.
2. **Detail Tinjau Titipan (`pages/cooperative/consignments/show.tsx`)**: Integrated into `CooperativeShell` with dynamic breadcrumb trail (`Titipan Siswa / [Product Name]`).
3. **Loket Pickup & Scan QR (`pages/cooperative/pickup/index.tsx`)**: Integrated into `CooperativeShell activeNav="pickup"`, maintaining camera scanner controls, manual credential verification, and verified item confirmation.

---

## 7. Authenticated Cooperative User Context

The workspace displays the authenticated cooperative staff member via shared Inertia props (`auth.user`):
- Staff full name displayed prominently in the sidebar and header.
- Avatar circle displaying user initials in KOPDIG Forest Green.
- Role context badge: "Pengurus Koperasi" / "Petugas Koperasi".
- Direct, accessible logout action using Inertia POST to `/logout`.
- External navigation link to inspect the student-facing catalog (`/`).
- Private fields (passwords, tokens, internal IDs) are not exposed.

---

## 8. Accessibility Implementation

- **Semantic Navigation:** Uses `<nav aria-label="Navigasi Pengurus Koperasi">` and `<aside aria-label="Sidebar Koperasi">`.
- **Active State Identification:** Active navigation items use high-contrast styling (`border-l-4 border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold`) paired with screen-reader text (`<span className="sr-only">(halaman aktif)</span>`) and `aria-current="page"`, satisfying WCAG criteria that state is not conveyed by color alone.
- **Touch Targets:** All interactive buttons, navigation links, and drawer dismiss controls enforce a minimum touch target size of 44px by 44px (`min-h-[44px] min-w-[44px]`).
- **Focus & Keyboard Navigation:** Visible focus rings (`focus:ring-2 focus:ring-[var(--color-primary)]`), ESC key closing for mobile drawer, and body scroll locking while modal navigation is active.

---

## 9. Testing & Validation

### 9.1 Test Suite (`tests/Feature/CooperativeWorkspaceTest.php`)
Ten dedicated tests verifying all phase requirements:
1. `guest cannot access cooperative workspace`: Unauthenticated requests to `/cooperative` redirect to `/login`.
2. `student cannot access cooperative workspace`: Student role requests to `/cooperative` receive HTTP 403 Forbidden.
3. `cooperative can access cooperative workspace`: Cooperative users receive HTTP 200 and render `cooperative/index` with `activeNav = 'overview'`.
4. `cooperative navigation renders`: All module routes (`orders`, `products`, `inventory`, `reports`) render with proper module labels and active navigation state.
5. `cooperative user context renders`: Authenticated user name, ID, and cooperative role are asserted in Inertia props.
6. `existing cooperative consignment route remains accessible`: `GET /cooperative/consignments` renders `cooperative/consignments/index`.
7. `existing cooperative pickup route remains accessible`: `GET /cooperative/pickup` renders `cooperative/pickup/index`.
8. `student remains redirected to student experience`: `GET /dashboard` for students redirects to `route('home')`.
9. `cooperative dashboard route directs to cooperative workspace`: `GET /dashboard` for cooperative users redirects to `route('cooperative.index')`.
10. `logout still works from cooperative shell`: `POST /logout` invalidates session and redirects to `/`.

### 9.2 Complete Quality Gates
- **Pest / PHPUnit:** 179 tests passed, 948 assertions, 0 failures (`php artisan test`).
- **Laravel Pint:** 100% compliant, 0 linting errors.
- **PHPStan:** Level 5 static analysis passed with 0 errors (`composer types:check`).
- **Biome:** 104 frontend files formatted and checked with 0 errors and 0 warnings (`npm run check`).
- **TypeScript:** Strict typecheck passed with 0 errors (`npm run types:check`).
- **Vite Production Build:** Successfully compiled in 23.6s (`npm run build`).

---

## 10. Skills Used
- `modern-web-guidance`: Consulted `css-layout` guidelines for accessible flexbox/grid layout adaptation, non-color-only active navigation state indicators, and responsive drawer focus management.

---

## 11. Known Limitations & Deferred Work
- Full analytics dashboards, sales metric calculation, order queue processing, product CRUD, and inventory mutation tools are explicitly deferred to subsequent phases as per project specifications.
