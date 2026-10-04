# KOPDIG Phase 9 — Midtrans Sandbox Payment Integration Report

## 1. Overview & Scope Boundaries

Phase 9 integrates the Midtrans Sandbox payment gateway into the KOPDIG school cooperative platform. The implementation enables students to initiate digital payments (QRIS, virtual accounts, e-wallets) for their pending orders through Midtrans Snap, while strictly maintaining authoritative backend payment verification via secure HTTP webhooks.

### Explicit Scope Boundaries
- **Environment:** Strictly **Midtrans Sandbox**. Real financial transactions and production mode activation are strictly prohibited in this educational demo environment.
- **Queue Allocation & QR Generation:** Excluded from Phase 9. When payment is verified (`payment_status = paid`, `order_status = paid`), `queue_number`, `queue_code`, and `pickup_token_hash` intentionally remain `null`. Queue scheduling and QR verification belong strictly to Phase 10.
- **Physical Stock Decrement & Inventory Finalization:** Excluded from Phase 9; physical stock mutation and cooperative fulfillment workflows will be executed alongside order pickup in Phase 10.
- **Cooperative Dashboard:** Order records and payment states are accessible through domain models, but cooperative UI is deferred to fulfillment phases.

---

## 2. Sandbox Configuration & Environment Variables

Credentials and configuration parameters are loaded strictly from environment variables and exposed via Laravel configuration (`config/services.php`). The Server Key is never hardcoded and never exposed to client-side code.

### Environment Keys
```env
# Midtrans Payment Gateway (SANDBOX ONLY for demo)
MIDTRANS_SERVER_KEY=SB-Mid-server-sandbox-test
MIDTRANS_CLIENT_KEY=SB-Mid-client-sandbox-test
MIDTRANS_MERCHANT_ID=
MIDTRANS_IS_PRODUCTION=false
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-sandbox-test
```

### Configuration Structure (`config/services.php`)
```php
'midtrans' => [
    'server_key' => env('MIDTRANS_SERVER_KEY'),
    'client_key' => env('MIDTRANS_CLIENT_KEY'),
    'merchant_id' => env('MIDTRANS_MERCHANT_ID'),
    'is_production' => (bool) env('MIDTRANS_IS_PRODUCTION', false),
    'snap_url' => env('MIDTRANS_SNAP_URL', 'https://app.sandbox.midtrans.com/snap/v1/transactions'),
    'snap_js_url' => env('MIDTRANS_SNAP_JS_URL', 'https://app.sandbox.midtrans.com/snap/snap.js'),
],
```

### Production Mode Guard
`App\Services\MidtransService` performs an unconditional runtime check. If `is_production` is set to `true`, the service throws a `RuntimeException` to prevent any accidental production usage.

---

## 3. Payment Initialization Architecture

Payment initialization occurs via `POST /orders/{order}/payment` handled by `App\Http\Controllers\PaymentController::store`:

1. **Authentication & Authorization:** The student must be authenticated (`role:student`). The order must belong to the authenticated user (`$user->id === $order->user_id`). Any unauthorized attempt returns an immediate HTTP 403 Forbidden.
2. **Order Eligibility Verification:**
   - Order must have `order_status = pending_payment`.
   - Order cannot be `paid`, `completed`, or `cancelled`. If already paid or cancelled, an HTTP 422 Unprocessable Entity response is returned.
3. **Token Reuse Safeguard:** If an active pending `Payment` record with a valid token already exists for the order, the existing Snap token is returned immediately without creating redundant Midtrans sessions.
4. **Deterministic Transaction Identity:** The primary transaction order ID equals `$order->order_number` (e.g., `KD-20261003-AB12CD`). For retries after an expired or failed attempt, an indexed retry identifier is generated (e.g., `KD-20261003-AB12CD-R2`).
5. **Server-Side Financial Authority:** The gross amount sent to Midtrans is taken directly from the database record `$order->total`. Any client-submitted amount is strictly ignored.
6. **Snap Request:** `MidtransService::createSnapTransaction` dispatches an HTTP POST request to `https://app.sandbox.midtrans.com/snap/v1/transactions` with HTTP Basic Authentication (`base64(serverKey . ':')`), transmitting `transaction_details`, immutable `item_details`, and `customer_details`.
7. **Database Persistence:** A record in the `payments` table is created with `status = pending`, `provider = 'midtrans'`, `gross_amount = $order->total`, and `payment_token`.
8. **Frontend Safe Response:** Returns JSON containing `snap_token`, `redirect_url`, `client_key`, and `snap_js_url`. The Server Key is never returned.

---

## 4. Frontend Snap Integration & User Experience

The payment interaction is embedded within `resources/js/pages/orders/show.tsx`:

- **Dynamic Sandbox Script Injection:** When an order is pending, the Midtrans Snap script (`https://app.sandbox.midtrans.com/snap/snap.js`) is dynamically loaded in the browser with `data-client-key`.
- **Payment CTA:** The order detail page renders a "Bayar Sekarang (Midtrans)" button with loading indicators (`isPaying`) and a clear Sandbox badge explaining that virtual money is used.
- **Modal Execution:** The user triggers `window.snap.pay(token, callbacks)`.
- **Client-Side Callback Handling:**
  - `onSuccess`: Displays feedback and invokes `router.reload()` to retrieve authoritative backend state.
  - `onPending`: Advises the student that the transaction is awaiting payment.
  - `onError`: Alerts the student to retry.
  - `onClose`: Informs the student that the payment window was closed without completing checkout.
- **CRITICAL SECURITY RULE:** The application never marks an order as paid based on client-side Snap callbacks. Authoritative status transitions occur exclusively via verified server-side HTTP webhooks.

---

## 5. Webhook Implementation & Signature Verification

Midtrans HTTP notifications are received at `POST /webhooks/midtrans` handled by `App\Http\Controllers\Webhooks\MidtransWebhookController`:

### CSRF Exemption
The route is exempted from CSRF token validation in `bootstrap/app.php`:
```php
$middleware->validateCsrfTokens(except: [
    'webhooks/midtrans',
]);
```

### Signature Verification Algorithm
Midtrans signs every notification using SHA512:
$$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$

The webhook controller recalculates this hash using `hash_equals` to protect against timing attacks:
```php
$input = $orderId . $statusCode . $grossAmount . $this->serverKey;
$expectedSignature = hash('sha512', $input);
return hash_equals($expectedSignature, $signatureKey);
```
If the signature does not match, the request is rejected with HTTP 403 Forbidden.

### Order & Payment Resolution
1. The base KOPDIG order number is extracted by stripping any retry suffix (`explode('-R', $orderId)[0]`).
2. The order is located and locked using `Order::where('order_number', $baseOrderNumber)->lockForUpdate()->first()`.
3. The gross amount received in the payload is compared against `$order->total`. If there is a mismatch, the request is rejected with HTTP 400 Bad Request.

---

## 6. Payment Status Mapping

Midtrans transaction statuses are mapped to KOPDIG's `PaymentStatus` and `OrderStatus` enums:

| Midtrans `transaction_status` | Midtrans `fraud_status` | KOPDIG `payment_status` | KOPDIG `order_status` | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| `capture` | `accept` | `PaymentStatus::Paid` | `OrderStatus::Paid` | Sets `paid_at = now()`; payment confirmed |
| `capture` | `challenge` | `PaymentStatus::Pending` | `OrderStatus::PendingPayment` | Awaits manual fraud resolution |
| `settlement` | Any | `PaymentStatus::Paid` | `OrderStatus::Paid` | Sets `paid_at = now()`; payment confirmed |
| `pending` | Any | `PaymentStatus::Pending` | `OrderStatus::PendingPayment` | Transaction open; awaiting student transfer |
| `deny` | Any | `PaymentStatus::Cancelled` | `OrderStatus::Cancelled` | Sets `cancelled_at = now()` |
| `cancel` | Any | `PaymentStatus::Cancelled` | `OrderStatus::Cancelled` | Sets `cancelled_at = now()` |
| `expire` | Any | `PaymentStatus::Expired` | `OrderStatus::Cancelled` | Sets `cancelled_at = now()` |

---

## 7. Idempotency & Transaction Atomicity

Webhook notifications can be retried by Midtrans multiple times:

1. **Idempotency Guard:** If `$order->isPaid()` and a duplicate `settlement` or `capture` notification arrives, the controller returns HTTP 200 with `status: 'already_processed'` without performing redundant updates or corrupting timestamps.
2. **Atomic State Mutation:** Updating `Payment` (status, provider transaction ID, payment type, reference) and `Order` (status, `paid_at`) is wrapped in an atomic `DB::transaction` with row-level locks (`lockForUpdate`). Either both records update together or neither does.

---

## 8. Retry Strategy

When an unpaid transaction expires or is denied in Midtrans Sandbox:
- The existing order record remains intact.
- The student can re-attempt payment directly from `/orders/{order}`.
- A new payment attempt is recorded with an incremented provider reference (`KD-YYYYMMDD-XXXXXX-R2`), allowing Midtrans Sandbox to open a fresh transaction without throwing duplicate `order_id` errors.

---

## 9. Security Audit

- **Zero Credential Leaks:** The Midtrans Server Key is never sent in Inertia page props, JavaScript bundles, or logged in application logs.
- **Signed Notifications Only:** Any webhook without a valid SHA512 signature is discarded before database query execution.
- **Tamper Protection:** Client-submitted amounts during token initialization or in fake webhook payloads are rejected. The order total is calculated exclusively by the database.
- **IDOR Protection:** Only the student who owns the order can initiate payments or view payment details.

---

## 10. Local vs. Hosted Webhook Considerations

- **Automated Tests:** Run fully self-contained using Laravel's `Http::fake()`, requiring no live network connection.
- **Local Manual Testing:** Midtrans cannot deliver webhooks to `http://localhost`. Testing webhook delivery locally requires exposing the endpoint via an HTTPS tunnel (such as ngrok, Cloudflare Tunnel, or Localtunnel) and setting the notification URL in the Midtrans Sandbox Dashboard to `https://<tunnel-domain>/webhooks/midtrans`.
- **Hosted Demo Environment:** Set the webhook notification URL in the Midtrans Merchant Portal to `https://<demo-domain>/webhooks/midtrans`.

---

## 11. Automated Test Suite

A comprehensive test suite was implemented in `tests/Feature/MidtransPaymentTest.php` covering all 19 required scenarios:

1. `test_1_student_can_initialize_payment_for_own_pending_order`: Successfully requests Snap token and records payment.
2. `test_2_student_cannot_initialize_payment_for_another_students_order`: Forbidden (HTTP 403) and no payment created.
3. `test_3_paid_order_cannot_be_paid_again`: Rejects payment initiation for already paid order (HTTP 422).
4. `test_4_cancelled_order_cannot_be_paid`: Rejects payment initiation for cancelled order (HTTP 422).
5. `test_5_server_side_order_total_is_used`: Verifies gross amount matches `$order->total`.
6. `test_6_client_submitted_amount_is_ignored`: Rejects tampered amounts from client request payload.
7. `test_7_server_key_is_never_exposed_to_frontend_props`: Asserts Server Key is completely absent from HTML and Inertia props.
8. `test_8_snap_token_is_returned_when_initialization_succeeds`: Validates token and client key delivery in JSON response.
9. `test_9_webhook_can_mark_valid_payment_as_paid`: Valid settlement notification transitions order and payment to `paid`.
10. `test_10_invalid_webhook_cannot_mark_payment_as_paid`: Rejects invalid SHA512 signature with HTTP 403.
11. `test_11_wrong_order_identity_is_rejected`: Rejects non-existent order numbers with HTTP 404.
12. `test_12_wrong_amount_is_rejected`: Rejects payload gross amount mismatch with HTTP 400.
13. `test_13_duplicate_webhook_is_idempotent`: Handles repeated delivery gracefully with HTTP 200 `already_processed`.
14. `test_14_repeated_success_notification_does_not_duplicate_state_changes`: Preserves initial `paid_at` timestamp and row counts.
15. `test_15_failed_payment_maps_to_correct_kopdig_state`: Expire notification transitions payment to `expired` and order to `cancelled`.
16. `test_16_pending_payment_remains_pending`: Pending notification preserves pending status.
17. `test_17_payment_update_and_order_update_are_atomic`: Confirms synchronized update within `DB::transaction`.
18. `test_18_successful_payment_does_not_yet_allocate_queue`: Confirms queue number and code remain `null` (Phase 10 boundary).
19. `test_19_successful_payment_does_not_yet_generate_qr`: Confirms `pickup_token_hash` remains `null` (Phase 10 boundary).

---

## 12. Quality Verification Results

| Verification Check | Tool / Command | Result |
| :--- | :--- | :--- |
| **PHP Coding Standards** | Laravel Pint (`composer run lint:check`) | **PASSED** (0 issues) |
| **PHP Static Analysis** | PHPStan Level 8 (`composer run types:check`) | **PASSED** (0 errors) |
| **Complete Test Suite** | Pest PHP (`composer test`) | **PASSED** (144 tests, 755 assertions, 0 failures) |
| **Frontend Linting & Style** | Biome (`npm run check`) | **PASSED** (94 files formatted, 0 warnings, 0 errors) |
| **TypeScript Compilation** | `tsc --noEmit` (`npm run types:check`) | **PASSED** (0 type errors) |
| **Production Bundle Build** | Vite (`npm run build`) | **PASSED** (Built in 12.91s) |
