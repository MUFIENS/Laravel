# KOPDIG — System Design

## 1. Purpose

This document defines how the KOPDIG system behaves as a product and how its major modules interact conceptually.

It complements `prd.md` and `database-structure.md`.

`prd.md` defines what the product is.

`System-design.md` defines how the product behaves.

`database-structure.md` defines how the information is persisted.

`architecture.md` defines how the software is implemented technically.

---

## 2. Main System Areas

KOPDIG is divided into these functional areas:

1. identity and access;
2. marketplace discovery;
3. cart;
4. checkout;
5. payment;
6. order fulfillment;
7. queue management;
8. QR pickup;
9. student consignment;
10. inventory;
11. cooperative operations;
12. reporting and visibility.

---

## 3. Role Model

| Capability | Student | Cooperative |
|---|---:|---:|
| Browse marketplace | Yes | Optional |
| Search products | Yes | Optional |
| Add to cart | Yes | No |
| Checkout | Yes | No |
| Pay sandbox transaction | Yes | No |
| View own orders | Yes | No |
| Submit consignment | Yes | No |
| Manage own submitted products | Yes, limited to own submissions | Yes |
| Create cooperative products | No | Yes |
| Approve/reject consignments | No | Yes |
| Manage inventory | No | Yes |
| Process orders | No | Yes |
| Assign/manage queue | No | Yes |
| Verify QR pickup | No | Yes |
| View cooperative sales | No | Yes |

The same student account can buy products and submit products for consignment.

---

## 4. Authentication Flow

### Student registration

1. Student opens registration.
2. Student submits required identity fields.
3. Laravel validates the input.
4. Account is created with role `student`.
5. Student can log in.

The registration form should collect only data needed for the application. Do not introduce unnecessary school records in the MVP.

### Cooperative login

Cooperative operators use a cooperative-role account.

The cooperative role must not be assignable by a public registration form.

Role assignment must be controlled by trusted application data or a controlled administrative setup process.

---

## 5. Marketplace Discovery Flow

### Home

The home experience presents:

- user greeting;
- search;
- categories;
- active order if relevant;
- featured/selected products;
- product grid.

### Explore

Explore is the broader discovery area.

It supports:

- search;
- category filtering;
- product listing;
- sorting if needed later.

Search should match sensible product fields such as name and description. Do not implement complex fuzzy-search infrastructure in the MVP.

### Product detail

A product detail view shows:

- product image;
- product name;
- price;
- source/owner information;
- stock;
- description;
- quantity;
- add-to-cart action.

The page must not expose internal cooperative margin calculations to ordinary buyers.

---

## 6. Cart Flow

A cart belongs to one authenticated student.

When a product is added:

1. verify that the product is active and purchasable;
2. read its current selling price;
3. create or update the cart item;
4. validate requested quantity against the allowed stock rule.

At checkout, the backend must re-read product prices and stock.

The frontend's calculated total is for display only.

The backend calculates the final authoritative total.

---

## 7. Checkout Flow

Checkout begins from a non-empty cart.

Backend responsibilities:

1. verify the user is authenticated;
2. load cart contents;
3. verify all products are active;
4. verify required stock;
5. calculate authoritative prices and totals;
6. determine applicable cooperative margin amounts;
7. create the order and order items within a transaction;
8. initiate payment using the resulting trusted amount;
9. return payment information required by the frontend.

The frontend must never send a trusted final amount and expect the backend to accept it without recalculation.

---

## 8. Payment Flow

The payment state machine is separate from the physical order state machine.

Possible payment states include:

- pending;
- paid/settled according to provider semantics;
- failed;
- cancelled;
- expired where the provider exposes it.

The exact provider-to-application mapping must be documented in code.

### Payment creation

1. Laravel creates an order.
2. Laravel sends trusted order amount and identifiers to the sandbox provider.
3. Provider returns the required payment token or checkout information.
4. React opens/displays the provider payment UI.

### Payment completion

1. Student completes the sandbox payment.
2. Provider sends notification to the Laravel webhook.
3. Laravel verifies the notification.
4. Laravel updates the payment record.
5. Laravel updates the order according to the verified business rule.
6. Student refreshes or is redirected to the authoritative order state.

The frontend callback is never treated as stronger evidence than a verified backend notification/status lookup.

---

## 9. Order State Machine

| State | Meaning | Customer can cancel? | Pickup allowed? |
|---|---|---:|---:|
| `PENDING_PAYMENT` | Order exists but payment is not verified | Depends on expiration rule | No |
| `PAYMENT_FAILED` | Payment attempt failed | Usually no; may recreate | No |
| `PAID` | Payment verified | Only if cancellation policy allows | No |
| `PROCESSING` | Cooperative is preparing order | Usually no | No |
| `READY_FOR_PICKUP` | Order can be collected | No | Yes |
| `COMPLETED` | Order was successfully collected | No | Already completed |
| `CANCELLED` | Order has been cancelled | No | No |

The MVP can use only the transitions required for the demonstrated workflow. Do not create automatic cancellation/expiration systems until they are actually implemented and tested.

---

## 10. Queue Assignment Flow

Queue assignment should happen only after the application has enough confidence that the order belongs in the fulfillment queue.

Recommended rule:

- assign queue number after verified payment and before the cooperative begins processing the order.

Process:

1. payment becomes verified;
2. order transitions to `PAID`;
3. system identifies the active pickup session;
4. system reserves the next queue number atomically;
5. queue number is saved on the order;
6. order can move to `PROCESSING`.

The queue number must be unique for its configured queue scope.

---

## 11. Preparation Flow

Cooperative operator sees paid orders.

Operator selects an order and prepares its items.

When preparation is complete:

- verify all expected items are present;
- mark the order `READY_FOR_PICKUP`;
- make the QR pickup view available.

The system should not expose a QR pickup action to the student before the order is actually ready unless a future workflow explicitly allows pre-generated pickup tokens.

---

## 12. QR Pickup Flow

Student opens the order and sees the pickup screen when the order is ready.

The QR contains an opaque pickup reference/token.

Cooperative operator scans the code.

Backend verifies:

1. token validity;
2. associated order existence;
3. payment state;
4. order status;
5. whether the order is already completed;
6. whether the order satisfies pickup-session rules.

If valid:

1. record pickup event;
2. record the cooperative operator;
3. set completion timestamp;
4. move order to `COMPLETED`.

If invalid:

- do not alter order state;
- return a clear error message.

---

## 13. Duplicate Pickup Protection

A completed order cannot be completed again.

The pickup operation should be protected by a database transaction and an appropriate row/state check so that two simultaneous scans cannot both successfully complete the same order.

---

## 14. Consignment Submission Flow

Student opens the consignment area.

Student submits:

- product name;
- category;
- image;
- description;
- base price;
- stock.

The submission becomes `SUBMITTED` or `UNDER_REVIEW` according to the chosen implementation.

Cooperative reviews the submission.

### Approval

1. cooperative verifies the product information;
2. cooperative determines/approves margin according to business rules;
3. selling price is determined;
4. submission becomes approved;
5. a marketplace product is created or published;
6. product becomes visible when status is active.

### Rejection

1. cooperative rejects submission;
2. rejection reason is required;
3. student sees the rejection reason;
4. student may create a corrected submission later according to the implementation.

A rejected product must not remain visible as an active marketplace product.

---

## 15. Margin Logic

For student consignment products:

`selling_price = base_price + cooperative_margin`

The application must not allow the frontend to define the final price without server verification.

The order item stores a historical snapshot of the values needed for accounting.

Example:

- base price = 8,000;
- cooperative margin = 1,000;
- selling price = 9,000.

The cooperative dashboard can later summarize:

- gross sales;
- total cooperative margin;
- student-owned portion of consignment sales.

These figures are calculated from order history, not current product prices.

---

## 16. Product Ownership Rules

Each product is associated with one source model:

### Cooperative product

- source type = cooperative;
- no student owner required.

### Student consignment

- source type = student;
- student owner required;
- approved through the consignment review process.

A student cannot turn a product into a public active product simply by changing a frontend field.

---

## 17. Inventory Rules

Inventory is shared with the physical cooperative and must be treated as operationally meaningful.

Rules:

- product cannot be ordered beyond available stock;
- backend rechecks stock at checkout;
- stock changes should happen consistently inside explicit state transitions;
- inventory movement history should explain why stock changed;
- deactivated products cannot be newly purchased;
- historical order items remain visible after a product is archived.

The implementation should make a deliberate decision about reservation timing and document it in code.

---

## 18. Product Availability Rules

A product is purchasable only when all required conditions are satisfied:

- product is approved;
- product is active/published;
- product is within any configured selling window, if such a rule is later implemented;
- stock is greater than zero;
- product is not otherwise blocked by an operational rule.

MVP should not invent complex schedule logic unless required.

---

## 19. Order Ownership and Privacy

Students may see only their own orders.

Cooperative operators may see operational orders needed to fulfill the cooperative workload.

A student must not be able to access another student's:

- order details;
- payment details;
- pickup token;
- consignment sales data;
- profile information beyond what the UI intentionally exposes as product-owner context.

---

## 20. Notifications

The MVP can use in-app state rather than a full notification platform.

The UI should surface meaningful events such as:

- payment confirmed;
- order being prepared;
- order ready for pickup;
- consignment approved;
- consignment rejected.

Email, push notifications, or chat integrations are optional future features.

---

## 21. Cooperative Dashboard Structure

The cooperative interface should prioritize active operational work.

Suggested sections:

### Overview

- orders awaiting action;
- ready-for-pickup count;
- today's sales;
- today's cooperative margin;
- pending consignment reviews.

### Orders

- filter by status;
- open order detail;
- change processing state;
- inspect queue number;
- mark ready for pickup.

### Pickup

- scan QR;
- verify order;
- complete pickup;
- see recent pickup events.

### Products

- product CRUD;
- stock management;
- active/inactive status;
- source type.

### Consignment

- pending submissions;
- approval;
- rejection reason;
- margin/selling-price review.

### Reports

- sales summary;
- product performance;
- consignment summary;
- cooperative margin summary.

The MVP can keep reports simple.

---

## 22. System-Level Design States

Every major screen should intentionally handle:

- default;
- loading;
- empty;
- success;
- validation error;
- permission error;
- not found;
- business-rule conflict;
- external service failure.

The agent must not implement only the happy path.

---

## 23. Design System Relationship

KOPDIG's design system has two related but distinct surfaces.

### Student commerce surface

Optimized for:

- speed;
- visual product discovery;
- touch interaction;
- compact information;
- clear purchase actions.

### Cooperative operations surface

Optimized for:

- accuracy;
- scanning;
- queues;
- tables;
- filtering;
- status management;
- high information density.

Both use the same color, typography, iconography, spacing, radius, and state language defined in `design.md`.

The two surfaces should not be forced into identical layouts.

---

## 24. Responsive System Behavior

Mobile is the primary student experience.

Desktop should expand the same information architecture.

The cooperative desktop interface may become more table-oriented because operational tasks benefit from greater horizontal space.

Responsive behavior must be tested at minimum on:

- 320px;
- 375px;
- 390px;
- 430px;
- 768px;
- 1024px;
- 1280px and above.

---

## 25. Failure and Recovery Principles

When an operation fails:

- do not silently change state;
- explain what failed;
- preserve valid prior state;
- allow safe retry where possible;
- avoid duplicate financial or inventory effects.

Examples:

### Payment webhook repeated

Process safely without creating duplicate payment records or order transitions.

### QR scanned twice

First scan completes the order. Second scan returns a completed/already-used message without altering the order.

### Stock changed during checkout

Reject or adjust the affected item according to the chosen checkout rule and ask the student to review the cart.

### Consignment rejected

Persist the rejection reason so the student understands what happened.

---

## 26. System Design Completion Criteria

The system design is considered sufficiently specified when the agent can implement these scenarios without inventing missing business rules:

1. student registration/login;
2. browse and search products;
3. cart operations;
4. checkout;
5. sandbox payment;
6. verified payment update;
7. queue assignment;
8. cooperative preparation;
9. QR pickup;
10. duplicate pickup prevention;
11. student consignment submission;
12. cooperative approval/rejection;
13. margin calculation;
14. inventory update;
15. student order-history privacy.
