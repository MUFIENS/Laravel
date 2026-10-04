# KOPDIG — Checkout & Cash Payment Verification Implementation

## 1. Overview & Context

KOPDIG previously relied on Midtrans Snap for digital payment processing. However, operating within a school cooperative environment requires a localized, direct, and zero-transaction-fee payment model: **Cash Payment at the Cooperative ("Bayar Tunai di Koperasi") verified via an authenticated Cash Payment QR code**.

This document outlines the architecture, security guarantees, UX design, and fulfillment integration implemented to retire Midtrans and transition entirely to cooperative cash verification.

---

## 2. Old Midtrans Flow vs. New Cash Flow

### Previous Architecture (Midtrans)
1. Student clicks "Bayar Sekarang" on checkout.
2. Frontend calls `/orders/{order}/payment` to invoke `MidtransService`.
3. Server calls Midtrans API to generate a Snap token.
4. Frontend loads external Midtrans Snap JS modal.
5. Student completes sandbox/production payment through gateway.
6. Midtrans sends an asynchronous webhook to `/webhooks/midtrans` (`MidtransWebhookController`).
7. Webhook validates signature and transitions order/payment status.
8. System invokes `PreparePaidOrderForPickup` to allocate queue and deduce stock.

### New Architecture (Cash Payment at Cooperative)
```
Student:
Cart -> Checkout -> Select Pickup Session -> Review Order -> "Konfirmasi Pesanan"
  ↓
Order Created (status: pending_payment, payment_status: pending)
  ↓
One-Time Cash Payment Verification Token & QR generated
  ↓
Student visits School Cooperative with physical cash
  ↓
Cooperative Staff scans Payment QR on /cooperative/payments ("Kasir QR")
  ↓
Server verifies token & previews order, items, and stock availability
  ↓
Cooperative Operator receives physical cash & clicks "Konfirmasi Uang Diterima"
  ↓
Atomic Transaction:
  1. Lock Order & Payment rows
  2. Mark Payment as Paid (cash_received_at = now, verified_by = staff_id)
  3. Invalidate/consume payment token (payment_token_hash = null)
  4. Authoritative Phase 10 Fulfillment (PreparePaidOrderForPickup):
     - Decrement product stock with row locks
     - Create InventoryMovement audit record (Sale)
     - Allocate Queue Number for pickup session
     - Generate Pickup Credential & Pickup QR token
     - Transition Order to ready_for_pickup
  ↓
Cooperative sees success screen with queue number (#001)
  ↓
Student refreshes order page:
  - Cash Payment QR is replaced with Phase 10 Pickup Ticket & Pickup QR
```

---

## 3. Midtrans Deprecation & Retirement

To completely remove Midtrans without leaving dead code or security holes while preserving historical records:

- **Deleted Unused Backend Classes**:
  - `app/Services/MidtransService.php` (deleted)
  - `app/Http/Controllers/PaymentController.php` (deleted)
  - `app/Http/Controllers/MidtransWebhookController.php` (deleted)
  - `tests/Feature/MidtransPaymentTest.php` (deleted)
- **Routes Removed**:
  - Removed `POST /orders/{order}/payment`
  - Removed `POST /webhooks/midtrans`
- **Config & Environment**:
  - `config/services.php` retains historical keys if needed, but no active controller reads them.
  - Active checkout flow requires zero Midtrans environment variables.
- **Frontend Cleanup**:
  - Removed Snap JS script injection in `resources/js/pages/orders/show.tsx`.
  - Removed Snap payment modal triggers and client key props in `OrderController`.
- **Database Schema Integrity**:
  - Existing `payments` table columns (`snap_token`, `payment_type`, `transaction_id`) are preserved in the schema for historical orders.
  - New cash verification columns added via non-destructive migration `2026_10_04_100000_add_cash_verification_columns_to_payments_table.php`:
    - `payment_token_hash` (`string|nullable`)
    - `verified_by` (`foreignId|nullable` references `users.id`)
    - `cash_received_at` (`timestamp|nullable`)

---

## 4. Student Checkout UX Redesign

The checkout page (`resources/js/pages/checkout/index.tsx`) was rebuilt to match the dark visual language established by KOPDIG (`#0A0A0A`, `#141414`, `#E34A27`, Lucide React icons, zero emoji):

### Visual & Functional Components
1. **Header**: Clear back navigation and title "Checkout".
2. **Order Items Snapshot**:
   - Product thumbnail with fallback placeholder.
   - Title, variant badge, quantity, unit price, and subtotal.
3. **Pickup Session Selection**:
   - Radio cards displaying active sessions loaded authoritatively from the database.
   - Highlights session name, pickup time range (`HH:mm - HH:mm`), and max order capacity note.
4. **Single Transparent Payment Method**:
   - Explicit "Bayar Tunai di Koperasi" card with Banknote icon.
   - Guidance note: *"Bayar tunai saat datang ke koperasi. Setelah pesanan dibuat, tunjukkan QR pembayaran kepada petugas koperasi dan serahkan uang sesuai total pesanan."*
   - Avoids false payment gateway selection or dropdown confusion.
5. **Sticky Order Summary**:
   - Total items count.
   - Authoritative subtotal and grand total formatted in Indonesian Rupiah (`Rp XX.XXX`).
   - Zero fabricated taxes, service fees, or discounts.
   - Primary CTA: **"Konfirmasi Pesanan"** (explicitly avoids "Bayar Sekarang").
   - Double-submit protection with loading spinner.

---

## 5. Cash Payment QR Architecture & Token Security

### Security Model
- **Token Generation**: Generated using deterministic HMAC-SHA256 bound to `config('app.key')`, order UUID, creation timestamp, and random high-entropy bytes.
- **Storage**: Raw tokens are **never stored** in the database. The database only stores `hash('sha256', $rawToken)`.
- **Verification**: When scanned or entered, the input token is hashed with SHA-256 and matched against `payment_token_hash` using constant-time comparison (`hash_equals`).
- **One-Time Consumption**: Upon successful confirmation, `payment_token_hash` is set to `null` inside the database transaction. Once consumed, the token can never be verified again.
- **Minimal QR Payload**:
  ```json
  {
    "v": 1,
    "o": "KD-20261004-ABCD",
    "t": "9f8a7c2b3e4d5a6b..."
  }
  ```
  *Zero student private data, zero email/passwords, zero item listings, zero server secrets.*

---

## 6. Cooperative Cash Verification Workspace

Located at `/cooperative/payments` and integrated into the cooperative navigation sidebar as **"Kasir QR"** with a `Banknote` icon.

### Operator Workflow
1. **Camera QR Scanning & Manual Input**:
   - Camera scanner powered by `html5-qrcode` library for high-speed barcode detection.
   - Manual token input fallback for situations with low lighting or camera issues.
2. **Order Preview / Verification (`POST /cooperative/payments/verify`)**:
   - Validates the token and fetches order details.
   - Shows Order number, student name, NISN/student ID, pickup session, and item breakdown.
   - Checks live stock availability for every order item and displays a stock health badge (`Semua item tersedia` or deficit warnings).
3. **Cash Confirmation (`POST /cooperative/payments/confirm`)**:
   - Operator collects physical cash from student.
   - Operator clicks **"Konfirmasi Uang Diterima"**.
   - Server runs the atomic fulfillment transaction.
   - Displays confirmation screen with allocated Queue Number (e.g. `#001`) and direct link to fulfillment console.

---

## 7. Atomic Fulfillment Integration (Phase 10 authoritativeness)

The cash verification action `App\Actions\ConfirmCashPayment` directly invokes the authoritative Phase 10 fulfillment service `App\Actions\PreparePaidOrderForPickup`.

```php
DB::transaction(function () use ($order, $staffUser, $validatedToken) {
    // 1. Lock rows
    $order = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();
    $payment = Payment::where('order_id', $order->id)->lockForUpdate()->firstOrFail();

    // 2. Validate token and status
    // 3. Mark Payment Paid
    $payment->update([
        'status' => PaymentStatus::Paid,
        'cash_received_at' => now(),
        'verified_by' => $staffUser->id,
        'payment_token_hash' => null, // consumed
    ]);

    // 4. Update order status to paid
    $order->update([
        'payment_status' => PaymentStatus::Paid,
        'order_status' => OrderStatus::Paid,
    ]);

    // 5. Authoritative Phase 10 Fulfillment
    // Decrements stock with locks, writes sale inventory movement, allocates queue,
    // generates pickup credential and updates order to ready_for_pickup
    $fulfillmentAction->execute($order);
});
```

### Guarantees
- **No Stock Double-Deduction**: Stock is NOT decremented at checkout. It is decremented exactly once upon cash confirmation.
- **Stock Race Condition Protection**: If stock becomes insufficient between checkout and payment confirmation, `PreparePaidOrderForPickup` throws `InsufficientStockException`. The database transaction rolls back all changes (payment is NOT marked paid, queue is NOT allocated, zero partial state).
- **Idempotency**: Repeated scans of the same QR fail because `payment_token_hash` is consumed on the first verification. If an order is already paid, the endpoint rejects the request with HTTP 422 ("Pesanan ini sudah dibayar").
- **Clear Role Segregation**: Only authenticated users with `role = cooperative` can access or execute `/cooperative/payments/*`.

---

## 8. Student Order View: Dynamic Lifecycle Transitions

`resources/js/pages/orders/show.tsx` seamlessly differentiates between the two QR phases:

| Order State | QR Displayed | Actions & Instructions |
|---|---|---|
| `pending_payment` | **Cash Payment QR** | "Tunjukkan QR ini kepada petugas koperasi saat membayar tunai." Displays 4-step checklist, formatted total, and manual token copy. |
| `ready_for_pickup` | **Pickup Ticket & QR** | Phase 10 Pickup Ticket showing allocated queue number (`#001`), pickup time window, and Pickup Credential QR for collection. |
| `completed` | **Pickup Ticket (Archived)** | Shows completed order summary with timestamp. |

---

## 9. Test Suite & Verification Results

### Feature Test Suite: `tests/Feature/CashPaymentVerificationTest.php`
12 comprehensive test cases:
1. `student can create order with cash payment method` (verifies pending status, cash provider, no initial stock deduction, payment token hash generated).
2. `valid payment token resolves correct order for cooperative` (verifies verification preview).
3. `invalid payment token is rejected` (returns HTTP 422).
4. `student cannot access cooperative payment verification endpoints` (returns HTTP 403 Forbidden).
5. `cooperative can confirm cash payment and trigger fulfillment` (verifies payment status Paid, verified_by, cash_received_at, stock decrement, inventory movement, queue allocation, order ready_for_pickup).
6. `payment token is consumed after successful confirmation` (subsequent confirmation fails).
7. `insufficient stock prevents payment confirmation and rolls back transaction` (stock remains 0, payment remains pending, no queue allocated).
8. `cooperative cannot forge payment amount or order details` (server uses authoritative database total).
9. `repeated payment confirmation is idempotent and rejected` (HTTP 422).
10. `student order details displays cash payment qr when pending payment` (asserts Inertia props).
11. `student order details displays pickup ticket when ready for pickup` (asserts pickup credential & queue).
12. `historical midtrans payment records remain readable` (preserves historical schema).

### Quality Gates Verification
- **PHP Code Style**: `vendor/bin/pint --test` (Passed with 0 style issues).
- **Static Analysis**: `vendor/bin/phpstan --configuration=phpstan.neon` (Level 8 equivalent, Passed with 0 errors).
- **Full Test Suite**: `php artisan test` (244 passed, 0 failed, 1766 assertions).
- **TypeScript**: `npm run types:check` (Passed with 0 errors).
- **ESLint & Prettier**: `npm run check` (Passed with 0 errors, 0 warnings).
- **Vite Build**: `npm run build` (Clean production bundle build).
