# KOPDIG Phase 8 — Checkout & Order Creation Implementation Report

## 1. Overview & Executive Summary

Phase 8 implements the checkout and order creation subsystem for KOPDIG ("Ruang Niaga Warga Sekolah"). This phase establishes the transition from a mutable shopping cart into an immutable commercial order record.

### Key Lifecycle Shift
- **Shopping Cart (Temporary & Mutable):** Prices, item names, and available stock are referenced dynamically against current database state.
- **Order & Order Items (Historical & Immutable):** Upon order placement, financial amounts, unit prices, cooperative margins, base prices, quantities, and product names are captured into permanent snapshots that will never be altered by future product edits.

### Scope Boundaries Enforced
- **Payment Gateway (Midtrans):** Excluded from Phase 8; strictly deferred to Phase 9.
- **Physical Stock Decrement:** Unpaid orders (`order_status = pending_payment`, `payment_status = pending`) do not decrement physical inventory or create fake sale movements. Stock availability is strictly validated prior to order creation, leaving physical mutation to verified payment in Phase 9.
- **Queue Number & QR Code:** Excluded from Phase 8; strictly deferred to Phase 10.
- **Cooperative Fulfillment Dashboard:** Excluded from Phase 8; order records remain structurally accessible through the domain model for cooperative staff in future phases.

---

## 2. Checkout Flow Architecture

The user journey is strictly linear, mobile-first, and server-authoritative:

1. **Cart Review (`/cart`):** Student inspects their cart items. The checkout action navigates to `/checkout` if and only if all cart items are valid and purchasable.
2. **Checkout Review (`/checkout` — `CheckoutController::index`):**
   - Resolves authenticated student server-side (`$request->user()`).
   - Re-queries the cart and every product from MySQL inside a single query with eager loading.
   - Verifies item existence, active product status (`ProductStatus::Active`), non-archived status, and stock availability (`$item->quantity <= $product->stock`).
   - If any item is unavailable or out-of-stock, gracefully redirects back to `/cart` with an actionable flash message.
   - Loads eligible pickup sessions from the database (`status IN ('active', 'scheduled')`).
   - Computes authoritative line subtotals and order total in integer Rupiah.
   - Renders `checkout/index` via Inertia.
3. **Session Selection & Confirmation:**
   - Student selects one of the eligible pickup sessions presented as custom card options (not browser select elements).
   - Order summary and financial breakdown (subtotal, Rp 0 service fee, final total) are displayed without exposing internal margins or base prices.
4. **Order Placement (`POST /checkout` — `CheckoutController::store`):**
   - Validates that `pickup_session_id` exists and is eligible (`status IN ('active', 'scheduled')`).
   - Acquires a cache lock on the student's ID (`checkout_user_{id}`) for 5 seconds to prevent concurrent submissions.
   - In case of a duplicate tap where the cart is already emptied, detects any order placed in the preceding 10 seconds and gracefully redirects to it.
   - Delegates atomic transaction execution to `App\Actions\CreateOrder`.
5. **Order Confirmation (`/orders/{order}` — `OrderController::show`):**
   - Enforces ownership authorization via `OrderPolicy::view`.
   - Displays the assigned order number (`KD-YYYYMMDD-XXXXXX`), `Menunggu Pembayaran` status badge, pickup session details, immutable snapshot items, and total amount.

---

## 3. Pickup Session Selection

Pickup sessions are loaded dynamically from the `pickup_sessions` database table. Hardcoded session values (such as "Istirahat 1" or "Istirahat 2") are strictly prohibited.

- **Query Criteria:**
  ```php
  PickupSession::query()
      ->whereIn('status', [PickupSessionStatus::Active, PickupSessionStatus::Scheduled])
      ->orderBy('pickup_date')
      ->orderBy('starts_at')
      ->get();
  ```
- **Session Attributes Projected to UI:**
  - `id`: Unique identifier
  - `name`: Human-readable label (e.g., "Istirahat 1 (Pagi)")
  - `formatted_time`: Human-readable window (e.g., "09:30 - 10:00 WIB")
  - `formatted_date`: Localized date (e.g., "Senin, 03 Oktober 2026")
  - `status_label`: Availability status ("Aktif" or "Terjadwal")
- **Storage:** The chosen `pickup_session_id` is persisted directly on the `orders` record. Queue number allocation (`queue_number`, `queue_code`) remains `null` at this stage and will be assigned upon confirmed payment in Phase 10.

---

## 4. Price Calculation & Server Authority

The client browser is never trusted for financial calculations.

- Subtotals, unit prices, margins, and totals submitted in HTTP requests are ignored.
- The server computes all financial amounts using strict integer Rupiah:
  ```php
  $unitPrice = (int) $product->selling_price;
  $basePrice = (int) $product->base_price;
  $cooperativeMargin = (int) $product->cooperative_margin;
  $itemSubtotal = $unitPrice * $item->quantity;

  $subtotal += $itemSubtotal;
  $cooperativeMarginTotal += ($cooperativeMargin * $item->quantity);
  $total = $subtotal;
  ```
- No floating-point operations are used anywhere in the calculation chain.

---

## 5. Order Number Generation

Order numbers are generated on the server using a guaranteed unique, uniform scheme:

- **Format:** `KD-YYYYMMDD-XXXXXX`
  - `KD`: Prefix for KOPDIG
  - `YYYYMMDD`: Current calendar date in UTC/local school time
  - `XXXXXX`: 6-character uppercase alphanumeric random token
- **Uniqueness Guarantee:** Generated inside a `do-while` loop checking existence against the `orders` table:
  ```php
  do {
      $candidate = sprintf('KD-%s-%s', date('Ymd'), strtoupper(Str::random(6)));
  } while (Order::where('order_number', $candidate)->exists());
  ```

---

## 6. Immutable Order Item Snapshots

When an order is created, the system stores a complete historical financial snapshot in `order_items`:

| Field in `order_items` | Snapshot Source | Immutability Principle |
| :--- | :--- | :--- |
| `order_id` | `$order->id` | Linked to parent order |
| `product_id` | `$product->id` | Referenced for catalog linkage, but nullable on product deletion |
| `seller_id` | `$product->owner_id` | Seller/consignment owner ID at time of sale |
| `product_name` | `$product->name` | Historical product name; unchanged if product is later renamed |
| `unit_price` | `$product->selling_price` | Frozen selling price; immune to future catalog price changes |
| `base_price` | `$product->base_price` | Frozen seller base price |
| `cooperative_margin` | `$product->cooperative_margin` | Frozen cooperative margin |
| `quantity` | `$item->quantity` | Frozen quantity purchased |
| `subtotal` | `unit_price * quantity` | Frozen line subtotal |

### Privacy Projection
Internal financial metrics (`base_price`, `cooperative_margin`, `cooperative_margin_total`) are stored in the database for future cooperative accounting and consignment payout settlements, but are omitted from student-facing Inertia props. Students only see `product_name`, `unit_price`, `quantity`, and `subtotal`.

---

## 7. Database Integrity & Atomic Transactions

The entire checkout operation is encapsulated within `Illuminate\Support\Facades\DB::transaction`:

1. **Row-Level Lock:** The student's cart is locked using `Cart::where('user_id', $user->id)->lockForUpdate()->first()`.
2. **Revalidation:** Every cart item is loaded with fresh product state and validated against:
   - Null product (deleted product)
   - Status non-active (`$product->status !== ProductStatus::Active`)
   - Stock exhaustion (`$product->stock <= 0`)
   - Invalid quantity (`$item->quantity < 1`)
   - Insufficient stock (`$item->quantity > $product->stock`)
3. **Order Insertion:** Creates `Order` record with `OrderStatus::PendingPayment` and `PaymentStatus::Pending`.
4. **Order Items Insertion:** Creates historical snapshot rows.
5. **Cart Clearing:** Deletes all items from `$cart->items()`.
6. **Atomicity Guarantee:** If any step fails or an unhandled exception occurs, the transaction automatically rolls back. The cart items remain completely intact, and no partial order is committed.

---

## 8. Double Submission Protection

Concurrent or duplicate submissions (caused by double tapping, slow connections, or retries) are protected at three levels:

1. **Atomic Cache Lock:** A cache lock (`Cache::lock("checkout_user_{$user->id}", 5)`) prevents multiple processes from executing checkout simultaneously for the same student.
2. **Recent Order Deduplication:** If a student retries checkout while their cart was just emptied by a successful order within the previous 10 seconds, the controller locates the recently created order and redirects the student to `/orders/{id}` with a friendly message instead of throwing an empty-cart error.
3. **Database Row Lock (`lockForUpdate`):** Ensures serialized access to the cart record during transaction execution.

---

## 9. Authorization & Privacy Controls

- **Role Authorization:** Checkout is accessible only to authenticated users with the `student` role (`Route::middleware(['auth', 'role:student'])`).
- **Cart & Order Ownership:** Students can only checkout their own cart (`$request->user()->cart`).
- **IDOR Protection:** `OrderPolicy::view` enforces that a student can only view orders where `$user->id === $order->user_id`. Cooperative users are authorized to view orders for future cooperative administration. Attempting to view another student's order returns an immediate HTTP 403 Forbidden.

---

## 10. Automated Test Suite

A dedicated test suite `tests/Feature/CheckoutOrderTest.php` was created covering all 20 required scenarios:

1. `test_1_guest_cannot_checkout`: Guest redirected to login for both GET and POST `/checkout`.
2. `test_2_student_can_open_checkout_with_valid_cart`: Valid cart renders `checkout/index` with 200 OK.
3. `test_3_empty_cart_cannot_checkout`: Empty cart redirects on GET and returns validation error on POST.
4. `test_4_inactive_product_blocks_checkout`: Inactive product in cart blocks checkout and prevents order creation.
5. `test_5_archived_product_blocks_checkout`: Archived product blocks order creation.
6. `test_6_insufficient_stock_blocks_checkout`: Cart quantity exceeding product stock blocks order creation.
7. `test_7_invalid_pickup_session_blocks_checkout`: Non-existent or closed session ID rejected with validation error.
8. `test_8_server_recalculates_totals`: Server recalculates subtotal, margin total, and total from database.
9. `test_9_client_submitted_total_is_ignored`: Malicious client-submitted total is overridden by database prices.
10. `test_10_client_submitted_price_is_ignored`: Malicious client-submitted unit price is ignored.
11. `test_11_order_is_created_with_pending_payment_state`: Order initialized with `order_status = pending_payment`.
12. `test_12_payment_status_is_pending`: Order initialized with `payment_status = pending`.
13. `test_13_pickup_session_is_stored`: Selected session persisted in `pickup_session_id`.
14. `test_14_order_number_is_unique`: Order numbers start with `KD-` and are unique across orders.
15. `test_15_order_items_contain_immutable_snapshots`: Historical snapshot records created with full pricing details.
16. `test_16_historical_order_item_values_remain_unchanged_after_product_edits`: Product edits (price increase, rename, stock change) do not alter existing order items.
17. `test_17_cart_is_cleared_only_after_successful_order_creation`: Cart items emptied on success.
18. `test_18_cart_remains_intact_when_order_transaction_fails`: Cart preserved when order transaction fails.
19. `test_19_student_cannot_view_another_students_order`: IDOR attempt results in 403 Forbidden.
20. `test_20_duplicate_checkout_attempts_do_not_create_unintended_duplicate_orders`: Double submission gracefully redirects to existing order without creating duplicates.

---

## 11. Quality Verification Results

| Quality Gate | Tool / Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **PHP Linting** | Laravel Pint (`composer run lint:check`) | **PASSED** | 0 formatting issues |
| **PHP Static Analysis** | PHPStan Level 8 (`composer run types:check`) | **PASSED** | 0 errors |
| **Feature & Unit Tests** | Pest / PHPUnit (`composer test`) | **PASSED** | 125 tests passed, 681 assertions, 0 failures |
| **Frontend Linting & Format** | Biome (`npm run check`) | **PASSED** | 94 files formatted, 0 warnings, 0 errors |
| **TypeScript Type Checking** | TypeScript Compiler (`npm run types:check`) | **PASSED** | 0 type errors |
| **Production Build** | Vite + Rolldown (`npm run build`) | **PASSED** | Manifest and assets generated cleanly in 5.88s |

---

## 12. Known Limitations & Transition to Phase 9

1. **Midtrans Payment Integration:** Orders are created with `payment_status = pending`. Payment token generation and Snap redirect will be implemented in Phase 9.
2. **Physical Stock Mutation:** Stock is currently validated at checkout; physical inventory deduction and stock log creation will be finalized upon successful payment confirmation webhook in Phase 9.
3. **Queue Number & QR Code:** Order records have `queue_number = null` and `queue_code = null`. Queue allocation and QR pickup token generation will occur in Phase 10 after payment is settled.
