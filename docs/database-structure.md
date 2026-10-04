# KOPDIG — Database Structure

## 1. Database Purpose

The KOPDIG database must support:

- students and cooperative operators;
- product catalog;
- student consignment;
- cart and cart items;
- orders and order items;
- sandbox payment transactions;
- pickup sessions and queue numbers;
- QR pickup verification;
- inventory movement history.

The schema should favor explicit, understandable relationships and strong database constraints over abstract complexity.

---

## 2. Database Technology

Recommended relational database:

- MySQL 8+ or a compatible MariaDB version supported by the selected Laravel environment.

Laravel Eloquent is the application ORM.

Money is stored as integer IDR values.

Timestamps use Laravel's normal timestamp handling.

Use foreign keys and indexes deliberately.

---

## 3. Entity Overview

Core tables:

1. `users`
2. `categories`
3. `products`
4. `product_submissions`
5. `carts`
6. `cart_items`
7. `orders`
8. `order_items`
9. `payments`
10. `pickup_sessions`
11. `pickup_logs`
12. `inventory_movements`

The MVP intentionally avoids a large collection of secondary tables.

---

## 4. Table: users

### Purpose

Stores authenticated application users.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `name` | VARCHAR(255) | Required |
| `email` | VARCHAR(255) | Required, unique |
| `password` | VARCHAR(255) | Required, hashed |
| `role` | VARCHAR/ENUM | `student` or `cooperative` |
| `student_identifier` | VARCHAR(100) | Nullable, unique if used |
| `avatar_path` | VARCHAR(255) | Nullable |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

### Rules

- public registration always creates `student` accounts;
- cooperative accounts are controlled and must not be self-assigned through public registration;
- email must be unique;
- password is never stored in plaintext.

A future system may replace the simple role field with a dedicated permission package, but the MVP does not require that complexity.

---

## 5. Table: categories

### Purpose

Groups marketplace products.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `name` | VARCHAR(100) | Required |
| `slug` | VARCHAR(120) | Required, unique |
| `description` | TEXT | Nullable |
| `image_path` | VARCHAR(255) | Nullable |
| `is_active` | BOOLEAN | Default true |
| `display_order` | INT | Default 0 |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

Possible categories:

- Jajanan
- Minuman
- ATK
- Atribut Sekolah
- Produk Siswa
- Lainnya

These are examples, not hard-coded database requirements.

---

## 6. Table: products

### Purpose

Stores active and historical marketplace products.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `category_id` | BIGINT UNSIGNED | Foreign key to categories |
| `owner_id` | BIGINT UNSIGNED | Nullable; student owner for consignment |
| `name` | VARCHAR(255) | Required |
| `slug` | VARCHAR(255) | Unique |
| `description` | TEXT | Required or constrained by validation |
| `image_path` | VARCHAR(255) | Nullable/required according to product rules |
| `source_type` | VARCHAR/ENUM | `cooperative` or `student` |
| `base_price` | BIGINT UNSIGNED | Rupiah integer |
| `cooperative_margin` | BIGINT UNSIGNED | Rupiah integer |
| `selling_price` | BIGINT UNSIGNED | Rupiah integer |
| `stock` | INT UNSIGNED | Current stock |
| `status` | VARCHAR/ENUM | Draft/active/inactive/archived as needed |
| `is_featured` | BOOLEAN | Default false |
| `published_at` | TIMESTAMP | Nullable |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |
| `deleted_at` | TIMESTAMP | Soft delete recommended |

### Ownership rules

For `source_type = cooperative`:

- `owner_id` is null or points to an internal cooperative account only if the implementation explicitly needs ownership tracking.

For `source_type = student`:

- `owner_id` must reference the student who owns the consigned product.

### Price rules

For cooperative products, margin may be zero unless the business model defines otherwise.

For student consignment:

`selling_price = base_price + cooperative_margin`

The final value is calculated and verified on the server.

---

## 7. Table: product_submissions

### Purpose

Stores the workflow of a student's product before it becomes a public marketplace product.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `student_id` | BIGINT UNSIGNED | FK to users |
| `product_id` | BIGINT UNSIGNED | Nullable; set when submission becomes a product |
| `name` | VARCHAR(255) | Required |
| `category_id` | BIGINT UNSIGNED | Required |
| `description` | TEXT | Required |
| `image_path` | VARCHAR(255) | Required or validated |
| `base_price` | BIGINT UNSIGNED | Required |
| `proposed_stock` | INT UNSIGNED | Required |
| `cooperative_margin` | BIGINT UNSIGNED | Nullable until reviewed |
| `proposed_selling_price` | BIGINT UNSIGNED | Nullable |
| `status` | VARCHAR/ENUM | `submitted`, `under_review`, `approved`, `rejected` |
| `rejection_reason` | TEXT | Nullable |
| `reviewed_by` | BIGINT UNSIGNED | Nullable; FK to users |
| `reviewed_at` | TIMESTAMP | Nullable |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

The submission contains its own snapshot fields because a submitted product is a review record, not merely a pointer to the current product row.

---

## 8. Table: carts

### Purpose

Stores the current shopping cart for a student.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `user_id` | BIGINT UNSIGNED | Required, unique for active cart |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

Recommended rule:

- one active cart per student.

A cart may be reused after checkout or emptied depending on implementation.

---

## 9. Table: cart_items

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `cart_id` | BIGINT UNSIGNED | FK to carts |
| `product_id` | BIGINT UNSIGNED | FK to products |
| `quantity` | INT UNSIGNED | Must be greater than zero |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

Recommended unique constraint:

`UNIQUE(cart_id, product_id)`

This avoids duplicate rows for the same product in the same cart.

---

## 10. Table: orders

### Purpose

Stores the customer transaction and fulfillment state.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `user_id` | BIGINT UNSIGNED | Buyer |
| `pickup_session_id` | BIGINT UNSIGNED | FK, nullable until assigned |
| `order_number` | VARCHAR(50) | Unique public identifier |
| `queue_number` | INT UNSIGNED | Nullable until assigned |
| `queue_code` | VARCHAR(20) | Nullable, human-friendly label |
| `subtotal` | BIGINT UNSIGNED | Rupiah integer |
| `cooperative_margin_total` | BIGINT UNSIGNED | Internal accounting snapshot |
| `total` | BIGINT UNSIGNED | Customer payable total |
| `payment_status` | VARCHAR/ENUM | Independent payment state |
| `order_status` | VARCHAR/ENUM | Independent fulfillment state |
| `pickup_token_hash` | VARCHAR(255) | Preferred over raw token storage |
| `paid_at` | TIMESTAMP | Nullable |
| `ready_at` | TIMESTAMP | Nullable |
| `completed_at` | TIMESTAMP | Nullable |
| `cancelled_at` | TIMESTAMP | Nullable |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

### Important rule

The frontend must never define the final order total as an authoritative value.

The backend calculates `subtotal`, `cooperative_margin_total`, and `total`.

---

## 11. Queue Number Constraints

If queue numbers reset per pickup session, use a unique constraint similar to:

`UNIQUE(pickup_session_id, queue_number)`

This ensures the database prevents accidental duplicates.

The displayed `queue_code` can be generated from the session prefix and queue number, for example:

`A-0182`

The exact prefix format is implementation-specific.

---

## 12. Table: order_items

### Purpose

Stores an immutable snapshot of what was bought.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `order_id` | BIGINT UNSIGNED | FK to orders |
| `product_id` | BIGINT UNSIGNED | FK to products, nullable if historical deletion strategy requires it |
| `seller_id` | BIGINT UNSIGNED | Nullable; student owner for consignment items |
| `product_name` | VARCHAR(255) | Snapshot |
| `unit_price` | BIGINT UNSIGNED | Snapshot |
| `base_price` | BIGINT UNSIGNED | Snapshot |
| `cooperative_margin` | BIGINT UNSIGNED | Snapshot |
| `quantity` | INT UNSIGNED | Required |
| `subtotal` | BIGINT UNSIGNED | Snapshot |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

The historical snapshot fields are essential. Changing today's product price must not change yesterday's order record.

---

## 13. Table: payments

### Purpose

Stores payment provider information and normalized application payment state.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `order_id` | BIGINT UNSIGNED | FK to orders |
| `provider` | VARCHAR(50) | Example: `midtrans` |
| `provider_transaction_id` | VARCHAR(255) | Nullable/unique where available |
| `provider_order_id` | VARCHAR(255) | Nullable |
| `payment_token` | TEXT | Nullable; protect appropriately |
| `status` | VARCHAR(50) | Normalized application status |
| `gross_amount` | BIGINT UNSIGNED | Snapshot |
| `payment_type` | VARCHAR(100) | Nullable |
| `raw_notification_reference` | VARCHAR(255) | Optional audit/reference field |
| `paid_at` | TIMESTAMP | Nullable |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

Do not store provider secrets in this table.

---

## 14. Table: pickup_sessions

### Purpose

Defines a logical pickup period and queue scope.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `name` | VARCHAR(100) | Example: `Istirahat 1` |
| `pickup_date` | DATE | Required |
| `starts_at` | TIME | Required |
| `ends_at` | TIME | Required |
| `queue_prefix` | VARCHAR(10) | Default such as `A` |
| `status` | VARCHAR/ENUM | `scheduled`, `active`, `closed` |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

The MVP can have one active pickup session for a school period at a time.

---

## 15. Table: pickup_logs

### Purpose

Creates a durable record that an order was physically collected.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `order_id` | BIGINT UNSIGNED | FK to orders, ideally unique if one successful pickup per order |
| `verified_by` | BIGINT UNSIGNED | FK to cooperative user |
| `verified_at` | TIMESTAMP | Required |
| `method` | VARCHAR(50) | Example: `qr` |
| `metadata` | JSON | Optional for non-sensitive audit data |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

Recommended rule:

`UNIQUE(order_id)` for the successful pickup record.

---

## 16. Table: inventory_movements

### Purpose

Tracks why product stock changed.

### Important columns

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key |
| `product_id` | BIGINT UNSIGNED | FK to products |
| `type` | VARCHAR/ENUM | Example: `restock`, `sale`, `restore`, `adjustment` |
| `quantity` | INT | Signed quantity or separate direction strategy |
| `reference_type` | VARCHAR(100) | Nullable |
| `reference_id` | BIGINT UNSIGNED | Nullable |
| `reason` | VARCHAR(255) | Nullable |
| `created_by` | BIGINT UNSIGNED | Nullable, FK to users |
| `created_at` | TIMESTAMP | Laravel |
| `updated_at` | TIMESTAMP | Laravel |

Choose one consistent quantity convention and document it in code. A signed quantity is acceptable if consistently implemented.

---

## 17. Relationships

### User relationships

- user has many carts historically if the implementation allows recreated carts, but normally one active cart;
- user has many orders as buyer;
- user has many product submissions as student;
- user may own many student-consignment products;
- cooperative user can review submissions;
- cooperative user can complete pickup logs.

### Category relationships

- category has many products;
- category has many product submissions.

### Product relationships

- product belongs to category;
- product optionally belongs to student owner;
- product has many cart items;
- product has many order items;
- product has many inventory movements.

### Order relationships

- order belongs to buyer;
- order belongs to pickup session optionally;
- order has many order items;
- order has payment records as implemented, normally one active payment record per transaction attempt or one primary payment record depending on design;
- order can have one pickup log for the successful physical pickup.

---

## 18. Recommended Foreign Key Behavior

Use foreign keys wherever historical and operational correctness requires them.

Suggested behavior:

- category → products: restrict or controlled archive rather than uncontrolled cascading deletion;
- user → orders: preserve order history;
- product → order_items: do not cascade-delete historical order items;
- order → order_items: cascading delete is acceptable only before the order becomes a finalized historical record, otherwise prefer preservation;
- order → pickup_log: one successful pickup record;
- product → inventory_movements: preserve history.

Because this is a school project, the agent may choose a simpler migration strategy, but it must never make historical orders disappear accidentally when a product is deleted.

---

## 19. Indexing

At minimum consider indexes on:

- `users.email` unique;
- `users.role`;
- `products.category_id`;
- `products.owner_id`;
- `products.source_type`;
- `products.status`;
- `products.slug` unique;
- `product_submissions.student_id`;
- `product_submissions.status`;
- `orders.user_id`;
- `orders.order_number` unique;
- `orders.order_status`;
- `orders.payment_status`;
- `orders.pickup_session_id`;
- `orders.queue_number` within queue scope;
- `payments.order_id`;
- `payments.provider_transaction_id` when available;
- `inventory_movements.product_id`.

Do not create dozens of indexes without a query need.

---

## 20. Status Values

Use consistent application status values.

### Product

Suggested:

- `draft`
- `active`
- `inactive`
- `archived`

### Product submission

- `submitted`
- `under_review`
- `approved`
- `rejected`

### Order

- `pending_payment`
- `payment_failed`
- `paid`
- `processing`
- `ready_for_pickup`
- `completed`
- `cancelled`

### Pickup session

- `scheduled`
- `active`
- `closed`

### Payment

Application-normalized states may include:

- `pending`
- `paid`
- `failed`
- `cancelled`
- `expired`

The exact provider mapping must be handled in a dedicated translation layer rather than leaking provider-specific strings throughout the application.

---

## 21. Historical Data Rule

Orders and order items are historical financial records.

Therefore:

- never recalculate historical order totals from current products;
- never change historical item prices because the product price was edited;
- preserve enough snapshot fields for reports;
- archive products rather than destroying information needed for old orders.

---

## 22. QR Token Storage Rule

Prefer storing a hash of the pickup token rather than a reusable plaintext token.

When the student view needs to render the QR code, the application can derive a signed or temporary token according to the chosen implementation.

The QR should not directly encode:

- student password;
- payment secrets;
- personal information that is not required for pickup;
- raw database IDs when a safer opaque token can be used.

---

## 23. Database Transaction Boundaries

The following operations should normally use database transactions:

### Checkout

- validate stock;
- create order;
- create order items;
- update stock according to the chosen strategy;
- create payment record.

### Queue assignment

- reserve next queue number;
- assign queue data to order.

### Pickup

- validate order state;
- create pickup log;
- mark order completed.

### Consignment approval

- update submission;
- create/publish product;
- preserve owner and pricing information.

---

## 24. Seed Data Strategy

The project should have seeders for development/demo data.

Minimum seed data:

- one cooperative account;
- several student accounts;
- categories;
- several cooperative products;
- several student consignment products in different statuses;
- sample pickup session;
- optionally a sample completed order for dashboard development.

Seeders must use clearly fake/demo identities and should not contain real student personal data.

---

## 25. Database Completion Criteria

The schema is ready for implementation when the agent can answer all of these without guessing:

- who owns a product;
- how a student submission becomes a product;
- how cart items relate to products;
- how order prices are preserved historically;
- how payment state relates to order state;
- how queue numbers are scoped and kept unique;
- how QR pickup becomes a completed order;
- how student consignment margin is stored;
- how inventory changes are audited.
