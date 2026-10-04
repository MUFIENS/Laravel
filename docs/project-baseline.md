# KOPDIG — Technical Baseline & Architecture Validation Report

## 1. Current Repository State

The repository is currently in a clean, pre-scaffolding state:

- **Repository Root:** `c:/Users/asepm/Downloads/Laravel`
- **Git VCS:** Initialized on branch `master` with zero commits. The `docs/` directory is untracked.
- **Source Code Status:** No application source code, controllers, models, migrations, routes, or frontend assets have been created.
- **Documentation Status:** Seven comprehensive specification files exist in `docs/`:
  - `AGENT.md` (Engineering protocol & rules)
  - `prd.md` (Product requirements & MVP boundaries)
  - `architecture.md` (Monolithic technical architecture)
  - `System-design.md` (Workflows, permissions & state machines)
  - `database-structure.md` (Relational schema & historical integrity)
  - `design.md` (Design system & brand visual tokens)
  - `design-reference-analysis.md` (Mobile reference analysis & UX translation)

---

## 2. Actual Technology Versions

Direct host inspection confirms all required runtime prerequisites are met:

| Environment Component | Installed Host Version | Target Documentation Version | Status |
|---|---|---|---|
| **PHP** | 8.5.0 (cli) (Zend OPcache v8.5.0) | PHP >= 8.3 | Satisfied |
| **Composer** | 2.8.12 | Composer 2.x | Satisfied |
| **Node.js** | v24.19.0 | Node LTS (v20+ / v22+) | Satisfied |
| **npm** | 11.17.0 | npm 10+ | Satisfied |
| **Python** | 3.14.7 | Python 3.x (for design tooling) | Satisfied |
| **Framework** | None (Pre-scaffolding) | Laravel 13 | Pending Phase 1 Scaffolding |
| **Frontend Bridge** | None (Pre-scaffolding) | Inertia.js 3 | Pending Phase 1 Scaffolding |
| **UI Library** | None (Pre-scaffolding) | React 19.x + TypeScript | Pending Phase 1 Scaffolding |
| **CSS Framework** | None (Pre-scaffolding) | Tailwind CSS 4 | Pending Phase 1 Scaffolding |
| **Asset Bundler** | None (Pre-scaffolding) | Vite | Pending Phase 1 Scaffolding |

---

## 3. Current Architecture

### Documented Pattern
A unified **Laravel monolith** utilizing **Inertia.js** as the server-driven presentation bridge to a **React 19** mobile-first frontend.

### Component Layering
1. **HTTP Layer:** Thin controllers in `app/Http/Controllers/` that orchestrate request lifecycle and return Inertia responses.
2. **Validation Layer:** Dedicated Laravel FormRequests in `app/Http/Requests/` protecting all mutation endpoints.
3. **Authorization Layer:** Server-side Policies in `app/Policies/` strictly enforcing role boundaries between `student` and `cooperative`.
4. **Domain / Action Layer:** Isolated single-responsibility action classes in `app/Actions/` and `app/Services/` handling transactional logic (`CreateOrder`, `AssignQueueNumber`, `ApproveConsignment`, `VerifyPickupQr`, `CompletePickup`).
5. **Persistence Layer:** Eloquent models with explicit relationships, scopes, and casts in `app/Models/`.
6. **Frontend Presentation:** Mobile-first React components in `resources/js/` composed with Tailwind CSS 4 design tokens and Lucide icons.

---

## 4. Documentation Alignment

All project specifications are mutually consistent:
- `docs/prd.md` establishes that students and consignors share the single `student` account role; this is mirrored in `docs/database-structure.md` (no separate consignor table) and `docs/System-design.md`.
- `docs/architecture.md` mandates that all monetary values use integer IDR (Rupiah); this is enforced across all tables in `docs/database-structure.md`.
- `docs/System-design.md` decouples payment state transitions from order fulfillment; `docs/database-structure.md` models separate `payment_status` and `order_status` fields.
- `docs/design.md` defines the brand palette (Forest Green `#183C32`, Warm Canvas `#F7F6F1`, Gold `#D5A84C`), typography (Satoshi, General Sans), and radius matrix; `docs/design-reference-analysis.md` explicitly defers to these tokens while extracting only layout, grid, and UX patterns from the visual reference.

---

## 5. Installed Skill Inventory

A systematic audit of installed skills identified key tools for KOPDIG development:

| Skill Identifier | Physical Location | Primary Purpose |
|---|---|---|
| `ui-ux-pro-max` | `C:\Users\asepm\.agents\skills\ui-ux-pro-max` | Mobile UX standards, touch targets (>= 44x44px), input modes, accessibility criteria. |
| `tailwind-design-system` | `C:\Users\asepm\.agents\skills\tailwind-design-system` | Design token architecture, responsive primitives, component variants. |
| `laravel-expert` | `C:\Users\asepm\.agents\skills\laravel-expert` | Idiomatic Laravel patterns, thin controllers, FormRequests, query scopes. |
| `database-design` | `C:\Users\asepm\.agents\skills\database-design` | Relational schema integrity, foreign keys, compound indexes, normalization. |
| `laravel-security-audit` | `C:\Users\asepm\.agents\skills\laravel-security-audit` | OWASP security auditing, IDOR checks, webhook verification integrity. |
| `ui-a11y` | `C:\Users\asepm\.agents\skills\ui-a11y` | WCAG 2.2 AA audits for color contrast, semantic form labels, and focus rings. |
| `react-best-practices` | `C:\Users\asepm\.agents\skills\react-best-practices` | Vercel performance optimization for React 19 (waterfall elimination, bundle optimization). |
| `code-review-checklist` | `C:\Users\asepm\.agents\skills\code-review-checklist` | Systematic verification of edge cases and error handling before completion. |
| `modern-web-guidance` | `C:\Users\asepm\.gemini\config\plugins\modern-web-guidance-plugin\skills\modern-web-guidance` | Standards for modern web APIs, container queries, and client-side best practices. |

---

## 6. Verified Skill Workflows

### UI/UX Pro Max
- **Script Location:** `C:\Users\asepm\.agents\skills\ui-ux-pro-max\scripts\search.py`
- **Execution Environment:** Verified using Python 3.14.7 with `$env:PYTHONIOENCODING="utf-8"`.
- **Verified Invocations:**
  - Design system query: `python "C:\Users\asepm\.agents\skills\ui-ux-pro-max\scripts\search.py" "<query>" --design-system -p "<ProjectName>"`
  - Domain search: `python "C:\Users\asepm\.agents\skills\ui-ux-pro-max\scripts\search.py" "<query>" --domain <ux|style|typography>`
- **Governance:** Informs mobile touch UX, accessibility ratios, and form guidelines. Generic color palette suggestions (`#3B82F6` blue) are explicitly overridden by `docs/design.md`.

### Database Design
- **Script Location:** `C:\Users\asepm\.agents\skills\database-design\scripts\schema_validator.py`
- **Execution Environment:** Verified running under Python 3.14.7.
- **Workflow:** Validates schema structure, relationship constraints, and migration consistency.

---

## 7. Database Readiness Assessment

The relational schema in `docs/database-structure.md` encompasses **12 core tables**:
1. `users` (Authentication, roles: `student`, `cooperative`)
2. `categories` (Marketplace categories with display ordering)
3. `products` (Catalog items with source tracking: `cooperative` vs. `student`)
4. `product_submissions` (Consignment review workflow with rejection reasons)
5. `carts` (Active student carts)
6. `cart_items` (Items with `UNIQUE(cart_id, product_id)` constraint)
7. `orders` (Transactions with session-scoped queue numbers)
8. `order_items` (Immutable snapshots of product name, base price, margin, unit price, subtotal)
9. `payments` (Midtrans transaction records and normalized statuses)
10. `pickup_sessions` (School break time schedules with queue prefixes)
11. `pickup_logs` (Physical pickup verification audits with `UNIQUE(order_id)` constraint)
12. `inventory_movements` (Stock movement audit trail)

### Schema Integrity Highlights:
- **Historical Immutability:** `order_items` snapshots historical price and margin values. Modifying product pricing does not corrupt historical reports.
- **Duplicate Prevention:** Strict database constraints (`UNIQUE(pickup_session_id, queue_number)` and `UNIQUE(order_id)` on pickup logs) prevent duplicate queue numbers and double pickups at the engine level.
- **Monetary Safety:** Currency is stored strictly as unsigned 64-bit integers (`BIGINT UNSIGNED`), avoiding floating-point rounding issues.

---

## 8. UI & Design Readiness

The design architecture is fully reconciled between `docs/design.md` and `docs/design-reference-analysis.md`:
- **Canvas / Surface:** Warm Canvas `#F7F6F1` with White `#FFFFFF` card surfaces.
- **Primary Brand:** Deep Forest Green `#183C32` with hover state `#245746` and soft background `#E7EFEB`.
- **Accent:** Warm Gold `#D5A84C` for consignment recognition and featured badges.
- **Typography:** Satoshi (Headings, Display, Numeric Prices) and General Sans (Body, Form Labels).
- **Curvature:** 24px sheet containers, 20px product cards, 14px buttons, 9999px pill chips.
- **Layout Architecture:**
  - Student Interface: Mobile-first 2-column grid, compact header, horizontal category chips, floating 4-item bottom navigation dock (**Home**, **Explore**, **Orders**, **Cart**).
  - Cooperative Interface: Desktop/tablet operational tables, status filter chips, queue management board, QR camera scanner.

---

## 9. Missing Configuration & Environment Gaps

Before application development begins, the following baseline configuration must be established during scaffolding:
1. **Laravel Application Skeleton:** Scaffolding Laravel 13 into the root directory while preserving `docs/` and `.git`.
2. **Inertia & React Setup:** Configuring Inertia.js 3 root view, React 19 root component, and Vite entrypoint.
3. **Tailwind CSS 4 Tokens:** Defining KOPDIG's color palette, typography font families, and radii within `@theme`.
4. **Database Configuration:** Setting up `.env` with MySQL/MariaDB credentials (with SQLite fallback for isolated unit testing).
5. **Midtrans Sandbox Configuration:** Defining `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, and `MIDTRANS_IS_PRODUCTION=false` in `.env.example`.
6. **Public Storage Symlink:** Executing `php artisan storage:link` to support product image uploads.

---

## 10. Architecture Risks & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Starter Kit Style Pollution** | Default Laravel Breeze/starter kits introduce generic gray/blue styles or SaaS layouts. | Strip starter kit styles and implement KOPDIG's design tokens and layouts from `docs/design.md`. |
| **Race Conditions in Stock & Pickup** | Simultaneous checkout or duplicate QR scans could cause negative stock or double pickups. | Wrap checkout and pickup in `DB::transaction()` with row-level locking (`lockForUpdate()`) and rely on the database `UNIQUE(order_id)` constraint on `pickup_logs`. |
| **Webhook Delivery in Local Dev** | Midtrans sandbox callbacks require a publicly reachable URL. | Structure the webhook handler for external delivery and support local manual simulation endpoints for development testing. |
| **Client-Side Price Manipulation** | Malicious users submitting manipulated cart totals. | Recalculate all item prices, cooperative margins, and order totals strictly on the server during checkout. |

---

## 11. Recommended Implementation Sequence

```text
Step 1: Project Scaffolding
        Scaffold Laravel 13, Inertia 3, React 19, TypeScript, Tailwind 4, and Vite into workspace root.
        Configure environment variables, database connection, and storage links.

Step 2: Design System Foundation
        Configure Tailwind @theme with KOPDIG tokens (#183C32, #F7F6F1, #D5A84C, Satoshi, General Sans).
        Build base UI primitives (Button, Card, Input, Chip, Badge) using Lucide icons.

Step 3: Database Migrations, Models, & Seeders
        Implement all 12 relational migrations with strict constraints.
        Build Eloquent models, relationships, and demo seed data (cooperative & student accounts, catalog).

Step 4: Authentication & Layout Shells
        Configure authentication for students and cooperative staff.
        Build MobileAppShell with floating bottom navigation and CooperativeLayout.

Step 5: Student Catalog & Marketplace
        Implement Home screen (greeting, search, category chips, 2-column product grid).
        Implement Explore screen and Product Detail view with consignment owner attribution.

Step 6: Cart & Server-Side Checkout Engine
        Implement Cart interactions with inline item removal.
        Build transactional checkout action calculating authoritative totals on the backend.

Step 7: Student Consignment Flow
        Implement student product submission form.
        Build cooperative submission review panel (approve with margin / reject with reason).
        Implement student consignor sales visibility.

Step 8: Payment Sandbox & Order Lifecycle
        Integrate Midtrans Snap sandbox payment flow.
        Implement idempotent webhook notification handler transitioning order to PAID.

Step 9: Queue System & Preparation Workflow
        Implement atomic queue number assignment scoped to active pickup session.
        Build cooperative order preparation dashboard.

Step 10: QR Pickup & Verification Flow
         Generate secure opaque hashed QR tokens.
         Build student pickup view and cooperative camera scanner with atomic pickup logging.

Step 11: Cooperative Management Dashboard
         Build order management board, product CRUD, inventory movement logs, and sales summaries.

Step 12: Testing, Security Audit & Polish
         Run PHP unit/feature tests, perform laravel-security-audit, run ui-a11y checks, and verify responsiveness across 320px–1280px viewports.
```
