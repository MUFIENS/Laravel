# KOPDIG Phase 10 — Paid Order Fulfillment, Queue Allocation & QR Pickup Implementation

## 1. Executive Summary

Phase 10 establishes the operational fulfillment lifecycle for verified paid orders in the KOPDIG ("Ruang Niaga Warga Sekolah") platform. It transitions orders from `payment_status = paid` into pickup readiness, generates unguessable pickup credentials and high-contrast QR codes for students, and provides a protected mobile-first verification console for school cooperative operators to execute physical handovers and record audit logs.

### Core Order Lifecycle
1. `PAID`: Midtrans webhook confirms settlement/capture authoritatively on server.
2. `QUEUE ASSIGNED`: Queue number and session-prefixed queue code allocated atomically.
3. `READY_FOR_PICKUP`: Stock finalized, inventory sale movements recorded, credential hash stored.
4. `PICKED UP`: Cooperative scans student QR or inputs credential, verifies order details.
5. `COMPLETED`: Handover confirmed, unique pickup log recorded, order marked completed.

---

## 2. Paid-Order Fulfillment Flow

### 2.1 Trigger & Payment Gate
Fulfillment is strictly triggered by server-side payment confirmation. Client-side return callbacks and browser redirects are treated as unverified navigation.

When Midtrans sends a verified notification (`settlement` or `capture` with `fraud_status = accept`), `MidtransWebhookController` updates the payment state and invokes the domain action:

```php
app(PreparePaidOrderForPickup::class)->execute($order);
```

### 2.2 Domain Service: `PreparePaidOrderForPickup`
Located at `app/Actions/PreparePaidOrderForPickup.php`, this action coordinates the fulfillment transition within an atomic database transaction.

Key responsibilities:
- Locks the `Order` record using `lockForUpdate()`.
- Validates the payment gate: `order.payment_status === PaymentStatus::Paid`. If unpaid, throws `DomainException`.
- Idempotency guard: If `order_status` is already `ready_for_pickup` or `completed`, returns the existing order immediately without duplicate processing.
- Locks the associated `PickupSession` record using `lockForUpdate()`.
- Locks all associated products ordered by `id ASC` to prevent deadlocks.
- Validates sufficient physical stock for every order item. If stock is depleted, rolls back the transaction and throws `InsufficientStockException`.
- Allocates the next queue number within the pickup session using `PickupSession::getNextQueueNumber()`.
- Generates the session-prefixed queue code using `PickupSession::formatQueueCode($queueNumber)`.
- Decrements product stock and records an immutable `InventoryMovement` of type `sale`.
- Computes the unguessable raw pickup credential and stores its SHA-256 hash (`orders.pickup_token_hash`).
- Updates `order_status` to `ready_for_pickup` and records `ready_at = now()`.

---

## 3. Queue Allocation Architecture

### 3.1 Scoped Session Queuing
Queue numbers are strictly scoped to a specific `PickupSession`. The database enforces:
```sql
UNIQUE(pickup_session_id, queue_number)
```

In pickup session A (prefix "A"), orders receive queue numbers `1`, `2`, `3`, formatted as `A-001`, `A-002`, `A-003`.
In pickup session B (prefix "B"), queue numbering starts fresh at `1` (`B-001`).

### 3.2 Concurrency-Safe Generation
`PickupSession::getNextQueueNumber()` is executed while holding a row-level lock on the `pickup_sessions` row:
```php
$session = PickupSession::where('id', $order->pickup_session_id)->lockForUpdate()->firstOrFail();
$queueNumber = $session->getNextQueueNumber();
$queueCode = $session->formatQueueCode($queueNumber);
```
This guarantees that two concurrent fulfillment requests cannot observe the same queue counter or produce duplicate key violations.

---

## 4. Stock Finalization & Inventory Movements

### 4.1 Row-Level Stock Locking & Deadlock Elimination
To prevent race conditions where multiple paid orders compete for the last item in stock:
1. Product IDs for all items in the order are collected and sorted in ascending order.
2. Product rows are selected with `lockForUpdate()`:
```php
$productIds = $order->items->pluck('product_id')->unique()->sort()->values()->all();
$products = Product::whereIn('id', $productIds)->orderBy('id', 'asc')->lockForUpdate()->get()->keyBy('id');
```
Sorting by `id ASC` enforces global lock acquisition order across all concurrent processes, eliminating database deadlocks.

### 4.2 Atomicity & Failure Handling
If any item lacks sufficient stock (`product.stock < item.quantity`):
- Transaction rolls back completely.
- Stock is not decremented.
- No inventory movement is logged.
- No queue number or pickup credential is created.
- `InsufficientStockException` is raised.

### 4.3 Immutable Audit Trail (`inventory_movements`)
For each order item, physical stock is decremented and an audit ledger entry is inserted:
- `product_id`: Product being sold.
- `user_id`: Buyer ID (or verifying system actor).
- `order_id`: Associated order reference.
- `type`: `InventoryMovementType::Sale` (`sale`).
- `quantity`: Signed negative quantity (`-$item->quantity`).
- `notes`: `"Penjualan pesanan {$order->order_number}"`.

Because fulfillment is idempotent, repeated execution never logs duplicate `sale` movements.

---

## 5. Pickup Credential Strategy & QR Security

### 5.1 Hash-Only Database Persistence
To preserve security without storing plaintext secrets in the database:
- The database schema only contains `orders.pickup_token_hash`.
- Raw pickup secrets are **never** persisted in any table or column.

### 5.2 Server-Derived Unguessable Credential
The credential is deterministically derived using HMAC-SHA256 keyed with the application secret key (`config('app.key')`):
```php
$data = "{$order->id}:{$order->order_number}:{$order->user_id}:{$order->pickup_session_id}";
$rawHash = hash_hmac('sha256', $data, config('app.key'));
$token = strtoupper(substr($rawHash, 0, 16));
$formattedToken = implode('-', str_split($token, 4)); // ABCD-EFGH-IJKL-MNOP
```

Properties:
- **Unguessable**: Entropy is derived from the master secret and order context. An attacker knowing the order number or user ID cannot compute the token without `app.key`.
- **Reproducible for Authorized Buyer**: When an authorized student views their order, `OrderController::show` securely computes the raw token on-the-fly and passes it to the frontend.
- **Timing-Safe Verification**: When cooperative staff submit a token, `PickupCredentialService::verifyCredential` hashes the input with SHA-256 and compares it against `order.pickup_token_hash` using `hash_equals()`.

### 5.3 Minimal QR Payload
The QR code encodes a minimal, privacy-safe JSON payload:
```json
{
  "v": 1,
  "o": "ORD-20261004-9B2F",
  "t": "ABCD-EFGH-IJKL-MNOP"
}
```
Excluded data:
- No student emails, NIS, or personal accounts.
- No product prices, margins, or financial subtotals.
- No passwords or internal keys.

---

## 6. Student Pickup Experience

### 6.1 High-Contrast Mobile Interface (`orders/show.tsx`)
Designed for rapid presentation at the school cooperative counter:
- **Queue Badge**: Prominent emerald queue code (e.g., `A-001`) with sequence indicator.
- **Crisp QR Code**: 200px SVG rendered via `qrcode.react` (`QRCodeSVG`) with high-contrast foreground and error correction level `M`.
- **Manual Credential Snippet**: One-touch copyable `XXXX-XXXX-XXXX-XXXX` token for manual counter input.
- **Pickup Session Info**: Date, time window (e.g., `10:00 - 10:30 WIB`), and session title.
- **Handover Checklist**: Step-by-step guidance for student presentation and cooperative item verification.
- **Completed Order State**: Displays timestamped handover receipt and verifying staff details once completed.

---

## 7. Cooperative Pickup Verification Console

### 7.1 Operator Interface (`cooperative/pickup/index.tsx`)
Located at route `/cooperative/pickup`, accessible only by users with the `cooperative` role:
- **Live QR Scanner**: Uses `html5-qrcode` to decode camera feeds directly in modern mobile/desktop browsers.
- **Manual Input Fallback**: Unified text input accepting either scanned QR JSON payloads, raw credentials (`ABCD-EFGH-IJKL-MNOP`), or combined `ORDER_NUMBER:TOKEN` strings.
- **Operational Order Preview**:
  - Queue code and order number.
  - Student display name (personal email and sensitive data excluded).
  - Itemized packing checklist with quantities and unit prices.
  - Pickup session details and total amount.
- **Handover Confirmation Button**: Action to finalize the pickup.
- **Audit Table**: Real-time listing of today's completed pickups with queue codes, order numbers, student names, and timestamps.

### 7.2 Verification Endpoints
- `POST /cooperative/pickup/verify`: Validates credential without altering order state. Returns 422 if invalid, unpaid, cancelled, or already picked up.
- `POST /cooperative/pickup/complete`: Atomically commits the handover:
  1. Re-validates credential under row lock.
  2. Creates immutable `PickupLog`.
  3. Sets `orders.order_status = 'completed'` and `orders.completed_at = now()`.

---

## 8. Pickup Log & Double-Pickup Prevention

### 8.1 Schema Enforcement
The `pickup_logs` table enforces uniqueness per order:
```sql
UNIQUE(order_id)
```
Attributes recorded:
- `order_id`: Target order.
- `pickup_session_id`: Session during which pickup took place.
- `verified_by_user_id`: Staff member who authenticated and confirmed handover.
- `picked_up_at`: Exact timestamp of physical handover.
- `notes`: Optional operational notes.

### 8.2 Double-Pickup Rejection
If an operator scans an already completed order:
- `Order::canBePickedUp()` evaluates to `false`.
- `PickupVerificationController` catches the condition and returns HTTP 422:
  `"Pesanan ini sudah diambil pada [date] oleh petugas [name]."`
- Database unique constraint prevents second log insertion even under concurrent race conditions.

---

## 9. Authorization Matrix

| Actor | Action | Allowed | Enforcement Mechanism |
|---|---|---|---|
| Student (Owner) | View own ready-for-pickup order & QR | Yes | `OrderPolicy::view` |
| Student (Other) | View another student's order & QR | No | `OrderPolicy::view` (HTTP 403) |
| Student | Verify pickup QR or credential | No | `OrderPolicy::verifyPickup` (HTTP 403) |
| Student | Mark order as completed | No | `OrderPolicy::completePickup` (HTTP 403) |
| Cooperative | View operational pickup console | Yes | Route middleware `role:cooperative` |
| Cooperative | Verify valid pickup credential | Yes | `OrderPolicy::verifyPickup` |
| Cooperative | Confirm pickup & complete order | Yes | `OrderPolicy::completePickup` |
| Unauthenticated | Access pickup endpoints | No | Middleware `auth` (Redirect to login) |

---

## 10. Concurrency Strategy & Idempotency Analysis

### 10.1 Locking Hierarchy
To prevent deadlocks and race conditions:
1. `Order` row locked (`Order::where('id', ...)->lockForUpdate()`).
2. `PickupSession` row locked (`PickupSession::where('id', ...)->lockForUpdate()`).
3. `Product` rows locked in sorted order (`Product::whereIn('id', ...)->orderBy('id', 'asc')->lockForUpdate()`).

### 10.2 Webhook & Retry Idempotency
If Midtrans delivers duplicate settlement webhooks or manual retries occur:
```php
if (in_array($order->order_status, [OrderStatus::ReadyForPickup, OrderStatus::Completed], true)) {
    return $order;
}
```
Stock is decremented once, one queue number is assigned, one inventory movement is recorded, and one pickup credential is generated.

---

## 11. Test Coverage & Verification Results

### 11.1 Dedicated Fulfillment Suite (`tests/Feature/OrderFulfillmentTest.php`)
All 25 required test scenarios implemented and passing 100%:
1. Unpaid order cannot receive queue.
2. Paid order can receive queue.
3. Queue number is unique within pickup session.
4. Queue numbering resets in a different pickup session.
5. Concurrent queue allocation is safe.
6. Stock is decremented exactly once.
7. Inventory sale movement is created exactly once.
8. Fulfillment is idempotent on retry.
9. Insufficient stock prevents invalid fulfillment.
10. Order becomes `ready_for_pickup` after successful fulfillment.
11. Queue code is correctly formatted with session prefix.
12. Pickup credential is generated.
13. Raw pickup secret is never persisted in plaintext.
14. Student can view own pickup QR.
15. Student cannot view another student's QR.
16. Cooperative can verify valid pickup.
17. Invalid pickup credential is rejected.
18. Unpaid order cannot be picked up.
19. Non-ready order cannot be picked up.
20. Duplicate pickup is rejected with clear error message.
21. Pickup log is created exactly once.
22. Order becomes `completed` after pickup.
23. Student cannot mark order completed directly.
24. Non-cooperative user cannot verify pickup.
25. Payment and fulfillment race conditions do not corrupt state.

### 11.2 Full Test Suite Results
- **PHPUnit / Pest Test Suite**: 169 tests passed, 841 assertions passed, 0 failures.
- **Laravel Pint**: 100% formatted, zero code style violations.
- **PHPStan (Static Analysis)**: Level 5 type analysis passed with 0 errors.
- **Biome Check**: 95 frontend files validated, 0 errors, 0 warnings.
- **TypeScript (`tsc --noEmit`)**: 0 type errors.
- **Vite Production Build**: Compiled successfully in 17.3s (`pickup-BRDZgp-z.js`, `app-D-t71buC.js`).

---

## 12. Skills Used
- `modern-web-guidance`: Modern HTML/CSS patterns, contrast standards, and responsive mobile scanning viewport architecture.
- `chrome-devtools`: Frontend layout validation and scanner lifecycle cleanup.

---

## 13. Known Limitations & Non-Goals
- **Camera Permissions in Non-HTTPS**: Camera-based QR scanning via `html5-qrcode` requires HTTPS or localhost in modern browsers. A full manual fallback is provided for non-camera environments.
- **Exclusions (per specification)**:
  - Reporting and analytics dashboards are deferred to subsequent phases.
  - Delivery, shipment tracking, or external couriers are out of scope (in-person school cooperative pickup only).
  - Refunds and cancellations beyond documented states are excluded.
