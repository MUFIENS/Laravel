# KOPDIG — Database & Domain Foundation Implementation

**Product:** KOPDIG  
**Descriptor:** Ruang Niaga Warga Sekolah  
**Brand Essence:** Tempat Karya Menjadi Transaksi  
**Document Version:** 1.0.0 (Phase 4 Delivery)  
**Status:** Implemented, Seeded, and Validated on MySQL 8.0.30  

---

## 1. Executive Summary

Phase 4 established the complete business-data architecture and domain persistence layer for KOPDIG. Grounded strictly in the specifications of [docs/database-structure.md](file:///c:/Users/asepm/Downloads/Laravel/docs/database-structure.md) and [docs/System-design.md](file:///c:/Users/asepm/Downloads/Laravel/docs/System-design.md), the system models:
- User roles (Student vs. Cooperative operator)
- Product catalog and student consignment workflows
- Shopping carts and cart items with duplicate prevention
- Pickup sessions and atomic queue numbering
- Orders, immutable historical snapshots, and financial records
- Payment states and provider transactions
- Single-use physical pickup verification logs
- Audited inventory movements

All operations are verified against MySQL 8.0.30 via TCP port 3306.

---

## 2. Implemented Database Tables

Twelve core tables form the relational foundation of KOPDIG:

| Table Name | Primary Role | Key Foreign Keys & Cardinality | Deletion Strategy |
| :--- | :--- | :--- | :--- |
| `users` | Authenticated actors (students and cooperative) | Self-contained; extended from Fortify baseline | Retain account history |
| `categories` | Product classification taxonomy | None | `restrictOnDelete` on child products |
| `products` | Active & historical catalog goods | `category_id` → `categories`<br>`owner_id` (nullable) → `users` | Soft delete (`deleted_at`); `owner_id` nullOnDelete |
| `product_submissions` | Student consignment review workflow | `student_id` → `users`<br>`product_id` (nullable) → `products`<br>`category_id` → `categories`<br>`reviewed_by` (nullable) → `users` | Cascade on student delete; nullOnDelete on product/reviewer |
| `carts` | Student active shopping carts | `user_id` (unique) → `users` | Cascade on user delete |
| `cart_items` | Products contained within a cart | `cart_id` → `carts`<br>`product_id` → `products` | Cascade on cart/product delete |
| `pickup_sessions` | Time-scoped operational queue windows | Independent | NullOnDelete on scheduled orders |
| `orders` | Customer purchases and fulfillment state | `user_id` → `users`<br>`pickup_session_id` (nullable) → `pickup_sessions` | `restrictOnDelete` on user; preserve order history |
| `order_items` | Immutable snapshot of purchased items | `order_id` → `orders`<br>`product_id` (nullable) → `products`<br>`seller_id` (nullable) → `users` | Cascade on unfinalized order; nullOnDelete on product/seller |
| `payments` | Normalized payment transaction records | `order_id` → `orders` | Cascade on order delete |
| `pickup_logs` | Tamper-proof physical collection log | `order_id` (unique) → `orders`<br>`verified_by` → `users` | Cascade on order delete; `restrictOnDelete` on verifier |
| `inventory_movements` | Stock adjustment and audit history | `product_id` → `products`<br>`created_by` (nullable) → `users` | Cascade on product delete; nullOnDelete on creator |

---

## 3. Eloquent Model Inventory & Relationships

All models are located under [app/Models/](file:///c:/Users/asepm/Downloads/Laravel/app/Models/) and cast attributes to strongly typed PHP 8.1+ Enums or native primitives:

### `User` ([app/Models/User.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/User.php))
- **Role:** Central identity model.
- **Casts:** `role` => `UserRole::class`.
- **Relationships:**
  - `products()`: `HasMany<Product>` (Consignment products owned by this student).
  - `productSubmissions()`: `HasMany<ProductSubmission>` (Submissions authored by this student).
  - `cart()`: `HasOne<Cart>` (Active shopping cart).
  - `orders()`: `HasMany<Order>` (Orders placed as buyer).
  - `reviewedSubmissions()`: `HasMany<ProductSubmission>` (Submissions reviewed as cooperative operator).
  - `verifiedPickups()`: `HasMany<PickupLog>` (Pickups verified as cooperative operator).
  - `inventoryMovements()`: `HasMany<InventoryMovement>` (Movements logged by operator).
- **Methods:** `isCooperative(): bool`, `isStudent(): bool`.

### `Category` ([app/Models/Category.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/Category.php))
- **Relationships:** `products()`: `HasMany<Product>`, `productSubmissions()`: `HasMany<ProductSubmission>`.
- **Scopes:** `scopeActive($query)`.

### `Product` ([app/Models/Product.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/Product.php))
- **Traits:** `SoftDeletes`, `HasFactory`.
- **Casts:** `source_type` => `ProductSourceType::class`, `status` => `ProductStatus::class`, monetary values as integers.
- **Relationships:**
  - `category()`: `BelongsTo<Category>`.
  - `owner()`: `BelongsTo<User>` (Student owner for consignment).
  - `submissions()`: `HasMany<ProductSubmission>`.
  - `cartItems()`: `HasMany<CartItem>`.
  - `orderItems()`: `HasMany<OrderItem>`.
  - `inventoryMovements()`: `HasMany<InventoryMovement>`.
- **Methods & Scopes:** `isConsignment(): bool`, `isCooperative(): bool`, `isAvailable(): bool`, `scopeActive()`, `scopeFeatured()`, `scopeCooperative()`, `scopeConsignment()`.

### `ProductSubmission` ([app/Models/ProductSubmission.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/ProductSubmission.php))
- **Casts:** `status` => `ProductSubmissionStatus::class`, monetary values as integers.
- **Relationships:** `student()`: `BelongsTo<User>`, `product()`: `BelongsTo<Product>`, `category()`: `BelongsTo<Category>`, `reviewer()`: `BelongsTo<User>`.
- **Methods & Scopes:** `isApproved(): bool`, `isRejected(): bool`, `isPending(): bool`, `scopePending()`, `scopeApproved()`.

### `Cart` ([app/Models/Cart.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/Cart.php))
- **Relationships:** `user()`: `BelongsTo<User>`, `items()`: `HasMany<CartItem>`.
- **Methods:** `totalQuantity(): int`, `subtotal(): int` (evaluated dynamically against current selling prices).

### `CartItem` ([app/Models/CartItem.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/CartItem.php))
- **Relationships:** `cart()`: `BelongsTo<Cart>`, `product()`: `BelongsTo<Product>`.
- **Method:** `subtotal(): int` (`quantity * product.selling_price`).

### `PickupSession` ([app/Models/PickupSession.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/PickupSession.php))
- **Casts:** `pickup_date` => `date`, `status` => `PickupSessionStatus::class`.
- **Relationships:** `orders()`: `HasMany<Order>`.
- **Methods:** `getNextQueueNumber(): int`, `formatQueueCode(int $queueNumber): string`, `scopeActive()`.

### `Order` ([app/Models/Order.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/Order.php))
- **Casts:** `payment_status` => `PaymentStatus::class`, `order_status` => `OrderStatus::class`, timestamps, integers.
- **Relationships:**
  - `user()`: `BelongsTo<User>` (Buyer).
  - `pickupSession()`: `BelongsTo<PickupSession>`.
  - `items()`: `HasMany<OrderItem>`.
  - `payments()`: `HasMany<Payment>`.
  - `latestPayment()`: `HasOne<Payment>` (latestOfMany).
  - `pickupLog()`: `HasOne<PickupLog>`.
- **Methods & Scopes:** `isPaid(): bool`, `isReadyForPickup(): bool`, `isCompleted(): bool`, `isCancelled(): bool`, `canBePickedUp(): bool`, `scopePendingPayment()`, `scopeReadyForPickup()`, `scopeCompleted()`.

### `OrderItem` ([app/Models/OrderItem.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/OrderItem.php))
- **Role:** Immutable financial snapshot.
- **Relationships:** `order()`: `BelongsTo<Order>`, `product()`: `BelongsTo<Product>`, `seller()`: `BelongsTo<User>`.

### `Payment` ([app/Models/Payment.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/Payment.php))
- **Casts:** `status` => `PaymentStatus::class`.
- **Relationships:** `order()`: `BelongsTo<Order>`.
- **Methods:** `isPaid(): bool`, `isPending(): bool`, `isFailed(): bool`.

### `PickupLog` ([app/Models/PickupLog.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/PickupLog.php))
- **Casts:** `verified_at` => `datetime`, `metadata` => `array`.
- **Relationships:** `order()`: `BelongsTo<Order>`, `verifiedBy()`: `BelongsTo<User>`.

### `InventoryMovement` ([app/Models/InventoryMovement.php](file:///c:/Users/asepm/Downloads/Laravel/app/Models/InventoryMovement.php))
- **Casts:** `type` => `InventoryMovementType::class`, `quantity` => `integer`.
- **Relationships:** `product()`: `BelongsTo<Product>`, `creator()`: `BelongsTo<User>`.

---

## 4. Key Database Constraints & Integrity Rules

The schema enforces critical business rules at the database engine level:

1. **Duplicate Cart Item Prevention:**
   - Constraint: `UNIQUE(cart_id, product_id)` on `cart_items`.
   - Result: Prevents duplicate rows for the same product in a single student's cart. Incrementing quantity is required instead of inserting new rows.
2. **Session-Scoped Queue Number Uniqueness:**
   - Constraint: `UNIQUE(pickup_session_id, queue_number)` on `orders`.
   - Result: Prevents duplicate queue tickets within the same pickup window. Multiple sessions may reuse sequence numbers (e.g. Istirahat 1 queue #1 vs Istirahat 2 queue #1) without collision.
3. **Single Physical Pickup Enforcement:**
   - Constraint: `UNIQUE(order_id)` on `pickup_logs`.
   - Result: Prevents double-scanning or duplicate collection logs for a single order. Second scan attempts trigger a database constraint violation.
4. **Historical Order Preservation:**
   - Foreign Key on `orders.user_id`: `restrictOnDelete()`.
   - Result: Student accounts cannot be deleted if historical completed orders exist.
5. **Product Archival Preservation:**
   - Foreign Key on `order_items.product_id`: `nullOnDelete()`.
   - Result: Deleting or soft-deleting a catalog item retains the historical order line items, preserving historical accounting records intact.

---

## 5. Indexes Created

Strategic indexes ensure low-latency lookups across active queries without over-indexing:

- `users.role` (Filtering cooperative operators vs. students)
- `users.student_identifier` (Unique student identity lookup)
- `products.category_id` (Category-based browsing)
- `products.owner_id` (Student consignment inventory tracking)
- `products.source_type` (Distinguishing cooperative goods from student items)
- `products.status` (Active marketplace filtering)
- `products.slug` (Unique product route lookup)
- `product_submissions.status` (Operator pending review queue)
- `orders.order_number` (Unique order identification)
- `orders.order_status` (Order fulfillment status filtering)
- `orders.payment_status` (Payment verification polling)
- `orders.pickup_session_id` (Pickup session queue filtering)
- `payments.provider_transaction_id` (Unique payment gateway reference)
- `pickup_logs.order_id` (Unique pickup lookups)
- `inventory_movements.product_id` and composite `[reference_type, reference_id]` (Stock audit trail)

---

## 6. State Definitions & Enums

State machines are represented by backed string enums under [app/Enums/](file:///c:/Users/asepm/Downloads/Laravel/app/Enums/):

| Enum Class | Backed Values | Semantic Role |
| :--- | :--- | :--- |
| `UserRole` | `student`, `cooperative` | Authorization boundary. |
| `ProductSourceType` | `cooperative`, `student` | Origin identity ("Koperasi" vs "Dititipkan oleh [Nama]"). |
| `ProductStatus` | `draft`, `active`, `inactive`, `archived` | Visibility in marketplace. |
| `ProductSubmissionStatus` | `submitted`, `under_review`, `approved`, `rejected` | Consignment review workflow. |
| `OrderStatus` | `pending_payment`, `payment_failed`, `paid`, `processing`, `ready_for_pickup`, `completed`, `cancelled` | Fulfillment lifecycle. |
| `PaymentStatus` | `pending`, `paid`, `failed`, `cancelled`, `expired` | Financial settlement lifecycle. |
| `PickupSessionStatus` | `scheduled`, `active`, `closed` | Operational pickup window. |
| `InventoryMovementType` | `restock`, `sale`, `restore`, `adjustment` | Stock balance change audit. |

---

## 7. Financial Data & Historical Snapshot Strategy

1. **Integer Rupiah Standard:**
   - All monetary fields (`base_price`, `cooperative_margin`, `selling_price`, `subtotal`, `total`, `gross_amount`) are stored as `BIGINT UNSIGNED`.
   - Floating-point numbers are prohibited to eliminate rounding drift.
2. **Consignment Margin Equation:**
   - Server-enforced: `selling_price = base_price + cooperative_margin`.
   - Cooperative goods have `cooperative_margin = 0`.
3. **Immutable Snapshot on Purchase:**
   - When an order is placed, `order_items` captures:
     - `product_name`
     - `unit_price` (at purchase time)
     - `base_price` (at purchase time)
     - `cooperative_margin` (at purchase time)
     - `quantity`
     - `subtotal`
   - Future updates to a product's price, margin, or name do not alter existing order items.

---

## 8. Development Seed Data

Executing `php artisan db:seed` provisions realistic, deterministic test data:

- **Users:**
  - Operator: `koperasi@kopdig.id` (role: `cooperative`)
  - Students: `budi@kopdig.id`, `siti@kopdig.id`, `fajar@kopdig.id` (role: `student`)
- **Categories:**
  - `Jajanan`, `Minuman`, `ATK & Buku`, `Atribut Sekolah`, `Karya Siswa`
- **Products:**
  - Cooperative products: Pulpen Standard Gel 0.5mm, Buku Tulis Bintang Obor, Dasi OSIS SMA Bordir Resmi, Teh Kotak Sosro.
  - Student consignment products: Risol Mayo Keju Lumer (Siti), Cookies Cokelat Crispy (Budi), Gantungan Kunci Rajut Bunga (Siti), Keripik Singkong Balado (Fajar - out of stock demo).
- **Submissions:**
  - `submitted`: Keripik Pisang Cokelat Lumer.
  - `under_review`: Paket Stiker Hologram Jurusan DKV.
  - `approved`: Risol Mayo Keju Lumer Homemade.
  - `rejected`: Minuman Sirup Melon Rumahan (with feedback reason).
- **Sessions & Orders:**
  - `Istirahat 1 (09:45 - 10:15)`: Active session.
  - Order 1: `KD-YYYYMMDD-0001` (Budi, Queue #1, `A-001`, `ready_for_pickup`, paid).
  - Order 2: `KD-YYYYMMDD-0002` (Budi, Queue #2, `A-002`, `completed`, verified by cooperative with `PickupLog`).
  - Active Cart: Budi has 2 Risol Mayo and 1 Pulpen in cart.

---

## 9. Validation Performed

1. **MySQL 8.0.30 Connectivity:** Tested via TCP `127.0.0.1:3306`.
2. **Migration & Rollback Verification:**
   - `php artisan migrate:fresh --seed`: Executed with zero errors in 3.1 seconds.
   - `php artisan migrate:rollback --step=12`: Verified clean reversal of all tables.
3. **Database Integrity Test Suite:**
   - Created [tests/Feature/DatabaseIntegrityTest.php](file:///c:/Users/asepm/Downloads/Laravel/tests/Feature/DatabaseIntegrityTest.php) with 8 focused tests and 32 assertions covering:
     - Duplicate cart product constraint rejection.
     - Pickup session-scoped queue number uniqueness.
     - Single pickup log constraint enforcement.
     - Historical item snapshot stability after product modification or deletion.
     - Product source and ownership distinctions.
     - Consignment approval workflow transitions.
     - Payment-to-order linkage.
     - Cart quantity and subtotal calculations.
4. **Static Analysis & Formatting:**
   - Laravel Pint (`composer lint`): 0 warnings.
   - PHPStan Level 5: 0 errors across all models, factories, and seeders.
   - Pest test suite: 48 tests passed (170 assertions).
5. **Phase 3 UI Regression Check:**
   - `npm run check`, `npm run types:check`, `npm run build`: 100% clean build.

---

## 10. Known Limitations & Next Steps

- **Midtrans Integration:** Payment tables are schema-ready; the actual HTTP client, Snap token generation, and webhook notification verification will be built in the Payment integration phase.
- **QR Pickup Scanner:** Physical QR token hashes and verification logs exist at the database level; the camera/scanner interface will be implemented in the Pickup flow phase.
- **Cart Session Bridge:** The Cart model supports authenticated students; guest/session cart migration to database cart upon login will be handled when building the Cart controller.
