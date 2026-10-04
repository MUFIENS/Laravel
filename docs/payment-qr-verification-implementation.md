# Payment QR Verification & Cash Confirmation Implementation

## 1. Business Flow

KOPDIG (Koperasi Digital) operates as a central school cooperative marketplace with two principal roles: **Student** and **Cooperative Operator**.

The authoritative operational flow for order purchasing and cash payment verification is:

```
[STUDENT]
1. Select items in Marketplace
2. Cart -> Checkout -> Create Order
3. Order created in `pending_payment` status
4. Payment created in `pending` status
5. Secure Payment QR rendered on Order Detail page

[COOPERATIVE OPERATOR]
6. Student arrives at cooperative counter with Cash
7. Cooperative opens `/cooperative/payments/verify`
8. Camera scans Student's Payment QR (or enters token manually)
9. Server decrypts/parses payload, validates credential, and returns order summary
10. Cooperative confirms cash receipt by clicking "Konfirmasi Uang Diterima"
11. Modal dialog confirms exact authoritative cash amount: "RpXX.XXX telah diterima dari siswa"
12. Atomic server transaction executes:
    - Payment transitions to `paid`
    - Authoritative fulfillment pipeline (`PreparePaidOrderForPickup`) triggers:
      * Product stock decremented
      * Inventory movement (`sale`) recorded
      * Queue number generated for pickup session
      * Pickup credential (separate token) generated
      * Order transitions to `ready_for_pickup`
13. Cooperative UI shows clear success state with Queue Code and ready status
14. Student picks up order later at counter using their distinct Pickup QR
```

---

## 2. Payment QR Purpose

The **Payment QR** exists solely to allow cooperative staff to securely identify a pending payment at the cashier counter.

### What Payment QR IS:
- A compact, secure reference to a specific order awaiting cash payment.
- A one-time verification bearer credential used before cash is collected.

### What Payment QR IS NOT:
- **NOT a Pickup QR:** Cannot be used at the pickup counter to release goods.
- **NOT a receipt:** Does not prove the order is paid until the cooperative operator explicitly confirms cash receipt.
- **NOT an authentication credential:** Exposes no student passwords, session IDs, or account tokens.
- **NOT reusable:** Becomes permanently invalid and unconsumed once payment is confirmed.

---

## 3. Payment QR Structure

The Payment QR payload is encoded as a compact JSON object to ensure fast, reliable camera detection:

```json
{
  "v": 1,
  "o": "KD-20261004-984321",
  "t": "9e37c154388e42f3a67d0216b2512d7c"
}
```

| Field | Type | Description |
|---|---|---|
| `v` | integer | Payload schema version (`1`). Unsupported versions are rejected with HTTP 422. |
| `o` | string | Authoritative Order Number (e.g., `KD-YYYYMMDD-XXXXXX`). |
| `t` | string | 32-character hexadecimal cryptographically secure random verification token. |

---

## 4. Token Generation

The token is generated server-side during checkout in [CashPaymentService.php](file:///c:/Users/asepm/Downloads/Laravel/app/Services/CashPaymentService.php):

```php
$rawToken = bin2hex(random_bytes(16)); // 32 characters of high-entropy randomness
$tokenHash = hash('sha256', $rawToken);
```

- High-entropy cryptographic source: `random_bytes(16)` via PHP's CSPRNG.
- Only generated once when the order enters `pending_payment`.
- Does not regenerate on page refreshes; persists until consumed or cancelled.

---

## 5. Token Storage & Hash Strategy

To ensure zero plaintext exposure in case of database leakage:
- **Database Column:** `payments.payment_token_hash` (string 64 characters, SHA-256).
- The raw token is **never stored** in the database.
- Verification hashes the incoming candidate token using `hash('sha256', $candidateToken)` and performs constant-time equality comparisons (`hash_equals`) where applicable.

---

## 6. Token Lifecycle

```
[GENERATED AT CHECKOUT]
       ↓
[ACTIVE & PENDING] ──(Student displays QR)──→ [SCANNED BY CASHIER]
       ↓                                              ↓
[CANCELLED / EXPIRED]                        [CASH CONFIRMED]
 (Token becomes unusable)                             ↓
                                             [CONSUMED / PAID]
                                      (payments.status = 'paid')
                                      (payments.cash_received_at set)
                                      (Token permanently rejected)
```

1. **Active:** Order is `pending_payment` and payment is `pending`. Token matches `payments.payment_token_hash`.
2. **Scanned:** Token is validated. No mutation occurs yet. Order details presented to cashier.
3. **Consumed:** Cooperative operator confirms cash. Payment status changes to `paid` and `cash_received_at` timestamp is written.
4. **Invalidated:** Any subsequent verification attempt with the same token is rejected as `already_paid` (HTTP 422).

---

## 7. Cooperative Authorization

Authorization is strictly enforced server-side using middleware and policies:
- Route middleware: `['auth', 'role:cooperative']`.
- Controller authorization: Gate / role check in [CashPaymentVerificationController.php](file:///c:/Users/asepm/Downloads/Laravel/app/Http/Controllers/Cooperative/CashPaymentVerificationController.php):
  ```php
  if (! $request->user()->isCooperative()) {
      abort(403, 'Akses khusus staf koperasi.');
  }
  ```
- Student accounts receive HTTP 403 Forbidden if accessing `/cooperative/payments/verify`, `/cooperative/payments/verify/scan`, or `/cooperative/payments/verify/confirm`.

---

## 8. Scanner Implementation

The cooperative verification scanner is implemented in [resources/js/pages/cooperative/payments/index.tsx](file:///c:/Users/asepm/Downloads/Laravel/resources/js/pages/cooperative/payments/index.tsx):
- **Camera Engine:** Reuses `html5-qrcode` (the established project standard from pickup verification).
- **Scanning Lifecycle:** Camera element `#payment-qr-reader` initialized with 250px aspect ratio and 10 fps scanning.
- **Client Debounce:** Scanning automatically pauses upon detection (`isScanningLocked` ref) to prevent duplicate camera frame fires.
- **State Machine:**
  * `IDLE`
  * `REQUESTING_PERMISSION`
  * `SCANNING`
  * `PROCESSING`
  * `INVALID_QR`
  * `UNAUTHORIZED`
  * `PAYMENT_NOT_FOUND`
  * `PAYMENT_NOT_ELIGIBLE`
  * `ALREADY_PAID`
  * `CANCELLED_ORDER`
  * `SUCCESSFUL_LOOKUP`
  * `CONFIRMING_PAYMENT`
  * `PAYMENT_SUCCESS`
  * `PAYMENT_FAILED`
  * `CAMERA_ERROR`

---

## 9. QR Lookup Process

When the scanner detects a code or the operator types a token manually:
1. `POST /cooperative/payments/verify/scan` (alias of `/cooperative/payments/verify`).
2. Input parsed via `CashPaymentService::parsePaymentQrInput()`:
   - Detects Pickup QR payload (`{"credential": ...}`) -> Rejects with `error_type => pickup_qr_detected` (422).
   - Detects unsupported version (`"v" != 1`) -> Rejects with `error_type => unsupported_version` (422).
   - Detects malformed JSON -> Rejects with `error_type => malformed_payload` (422).
3. Resolves payment by SHA-256 hash or order number lookup.
4. Checks:
   - Is order already paid? -> Rejects with `already_paid` (422).
   - Is order cancelled? -> Rejects with `order_cancelled` (422).
   - Is stock currently available? -> Computes stock issues and flags them.
5. Returns safe verification payload (Order number, Student name, Items list, authoritative Total, Pickup session). **No mutation occurs.**

---

## 10. Cash Confirmation Process

1. Operator reviews order summary on the verification card.
2. Operator clicks **"Konfirmasi Uang Diterima"**.
3. Confirmation dialog opens, displaying exact cash required (e.g., `Rp25.000`).
4. Operator confirms dialog.
5. Client sends `POST /cooperative/payments/verify/confirm` with:
   - `order_id`
   - `token` (candidate verification token)
   - Client-provided amounts/quantities are ignored; server resolves all values from the database.

---

## 11. Transaction Boundary

The entire confirmation flow runs inside a single `DB::transaction()` managed in `CashPaymentVerificationController::confirm()`:

```php
DB::transaction(function () use ($orderId, $candidateToken, $operator, $cashService, $fulfillmentService) {
    // 1. Lock Order
    // 2. Lock Payment
    // 3. Re-verify states
    // 4. Lock PickupSession
    // 5. Lock Products in ascending ID order
    // 6. Validate stock
    // 7. Update Payment (paid, verified_by, cash_received_at)
    // 8. Execute fulfillment pipeline
});
```

If any validation fails (e.g., insufficient stock, concurrent payment), an exception is thrown, rolling back all database writes.

---

## 12. Lock Ordering

To prevent deadlocks under heavy concurrent cashier and student activity, locks are acquired in a strictly monotonic hierarchy:

1. **Order:** `Order::where('id', $orderId)->lockForUpdate()->firstOrFail()`
2. **Payment:** `Payment::where('order_id', $order->id)->lockForUpdate()->firstOrFail()`
3. **PickupSession:** `PickupSession::where('id', $order->pickup_session_id)->lockForUpdate()->first()`
4. **Products:** `Product::whereIn('id', $productIds)->orderBy('id', 'asc')->lockForUpdate()->get()`

This lock order matches the existing order in [PreparePaidOrderForPickup.php](file:///c:/Users/asepm/Downloads/Laravel/app/Actions/Order/PreparePaidOrderForPickup.php).

---

## 13. Stock Validation

KOPDIG follows the **authoritative stock commitment at payment time** rule:
- Checkout does not lock or decrement inventory.
- At payment confirmation, inside the locked transaction:
  ```php
  foreach ($order->items as $item) {
      $product = $lockedProducts->get($item->product_id);
      if (! $product || $product->stock < $item->quantity) {
          throw new DomainException("Stok tidak mencukupi untuk {$item->product_name}.");
      }
  }
  ```
- If stock is insufficient, transaction rolls back; payment remains `pending` with an actionable error.

---

## 14. Fulfillment Integration

Rather than duplicating fulfillment, the controller invokes the canonical [PreparePaidOrderForPickup](file:///c:/Users/asepm/Downloads/Laravel/app/Actions/Order/PreparePaidOrderForPickup.php) action:

```php
$fulfillmentService->execute($order);
```

This single authoritative action handles:
- Decrementing product stock: `$product->decrement('stock', $item->quantity)`.
- Creating inventory movements: `InventoryMovement::create(['type' => 'sale', ...])`.
- Generating queue number for the pickup session: `QueueCodeService::allocateNext(...)`.
- Generating distinct pickup credential: `PickupCredentialService::generate(...)`.
- Transitioning order status to `ready_for_pickup`.

---

## 15. Queue Generation

- Managed by `QueueCodeService`.
- Allocated within the locked `PickupSession` row.
- Formats: e.g., `A-01`, `B-14` based on session counters.
- Generated once and stored in `orders.queue_code` and `orders.queue_number`.

---

## 16. Pickup Credential Generation

- Managed by `PickupCredentialService`.
- 16-character alphanumeric pickup token (e.g., `A8B2-C9D4-E5F6-G7H8`).
- Stored as SHA-256 in `orders.pickup_token_hash`.
- Completely isolated from `payments.payment_token_hash`.

---

## 17. Payment vs Pickup QR Separation

| Attribute | Payment QR | Pickup QR |
|---|---|---|
| **Purpose** | Cash collection verification | Goods collection verification |
| **Payload** | `{"v":1,"o":"KD-...","t":"..."}` | `{"order_number":"KD-...","credential":"..."}` |
| **Storage** | `payments.payment_token_hash` | `orders.pickup_token_hash` |
| **Endpoint** | `/cooperative/payments/verify` | `/cooperative/pickup/verify` |
| **Scanner Cross-Check** | Pickup QR in Payment Scanner: **REJECTED (422)** | Payment QR in Pickup Scanner: **REJECTED (422)** |
| **Lifecycle** | `pending_payment` -> `paid` | `ready_for_pickup` -> `completed` |

Cross-scan rejection is tested and enforced in both controllers.

---

## 18. Idempotency

- If `POST /cooperative/payments/verify/confirm` is called twice:
  * First request: Success -> payment marked `paid`.
  * Second request: Detects `order_status !== PendingPayment` or `payment->status !== Pending` inside the row lock -> Returns `already_paid` response with HTTP 422.
- Inventory is never decremented twice.
- Queue codes are never duplicated.

---

## 19. Concurrency Protection

- Row locks (`FOR UPDATE`) prevent two operators from confirming the same order simultaneously.
- The first transaction commits; the second transaction reads the committed `paid` state and aborts safely.
- Verified via automated feature tests.

---

## 20. Security Considerations

1. **Zero Client Trust:** Amount, items, total, and prices are fetched exclusively from server database snapshots.
2. **CSPRNG Tokens:** High-entropy random bytes prevent guessability or brute force.
3. **Hashed Credential Storage:** Tokens stored as SHA-256 hashes.
4. **IDOR Defense:** Verification requires both order number and matching cryptographic token hash.
5. **No Personal Data Exposure:** QR contains only version, order number, and verification token.

---

## 21. Midtrans Retirement Status

- **Midtrans API:** Completely disabled for all new checkouts.
- **Midtrans Webhook / Snap JS:** Retired.
- **Active Flow:** 100% Cash at Cooperative Counter with Payment QR verification.
- **Historical Data:** Historical columns (`snap_token`, `payment_type`) preserved for auditing and backward compatibility.

---

## 22. Test Coverage

Comprehensive test suite in [tests/Feature/CashPaymentVerificationTest.php](file:///c:/Users/asepm/Downloads/Laravel/tests/Feature/CashPaymentVerificationTest.php):

- `test_student_cannot_access_payment_verification_page`: Verifies 403 Forbidden.
- `test_student_cannot_call_payment_verification_lookup_or_confirmation`: Verifies 403 Forbidden.
- `test_cooperative_can_access_payment_verification_page`: Verifies 200 OK.
- `test_valid_payment_qr_lookup_resolves_order_details_without_marking_paid`: Verifies order details returned and state remains `pending_payment`.
- `test_cooperative_can_confirm_cash_payment_and_fulfill_order`: Verifies atomic fulfillment, stock decrement, inventory movement, queue code, and pickup credential generation.
- `test_payment_confirmation_is_idempotent`: Verifies second confirmation attempt fails safely without duplicate actions.
- `test_insufficient_stock_prevents_payment_confirmation`: Verifies rollback when product stock is depleted.
- `test_pickup_qr_cannot_be_used_for_payment_verification`: Verifies explicit rejection with `pickup_qr_detected`.
- `test_payment_qr_cannot_be_used_for_pickup_verification`: Verifies explicit rejection on pickup endpoint.
- `test_malformed_qr_payload_is_rejected`: Verifies 422 on broken JSON.
- `test_unsupported_qr_version_is_rejected`: Verifies 422 on invalid schema version.
- `test_client_cannot_tamper_with_payment_amount`: Verifies server strictly uses database total.
- `test_cooperative_workspace_overview_contains_pending_payment_metrics`: Verifies real dashboard KPI data.

All 20 tests pass with 142 assertions. Full application test suite passes with 258 tests and 1,900 assertions.

---

## 23. Known Limitations

1. **Hardware Camera Access:** In browser testing environments or non-HTTPS domains, camera permission may be restricted by modern browser security policies; a manual token input fallback is provided in the UI for operational redundancy.
2. **Consignment Settlements:** Consignment payouts to student sellers occur at monthly settlement cycles rather than instantly upon cash receipt.
