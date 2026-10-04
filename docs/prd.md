# KOPDIG — Product Requirements Document

## 1. Product Identity

**Product name:** KOPDIG

**Meaning:** Koperasi Digital

**Brand descriptor:** Ruang Niaga Warga Sekolah

**Primary tagline:** Tempat Karya Menjadi Transaksi.

KOPDIG is a mobile-first digital commerce platform for a school cooperative. The product digitizes the cooperative's daily buying and selling activity while adding a controlled consignment channel through which students can submit their own products for sale through the cooperative.

KOPDIG is not intended to be a general-purpose marketplace. The cooperative remains the trusted operational center for product approval, inventory, payment reconciliation, order preparation, queue management, and pickup verification.

The product should feel like a premium commerce application that happens to operate inside a school environment, not like a conventional school administration system.

---

## 2. Problem Statement

The physical cooperative serves students by selling snacks, drinks, stationery, school attributes, and other everyday school needs. A physical-only workflow creates several recurring problems:

- students need to queue when break time starts;
- students cannot easily know which products are available before reaching the cooperative;
- order preparation is difficult when many buyers arrive simultaneously;
- product availability is not visible digitally;
- students who have products to sell do not have a structured way to submit them to the cooperative;
- cooperative staff have limited visibility into order status, queue progression, sales, and consignment performance.

KOPDIG addresses these problems by turning the cooperative into a small, controlled digital commerce ecosystem.

---

## 3. Product Vision

KOPDIG should make the school cooperative feel like a modern retail experience without removing the human role of the cooperative.

The core idea is:

> A student can discover a product, order it, pay for it, receive a queue number, and collect it during break without spending unnecessary time in the physical queue. A student can also become a small seller by submitting a product for cooperative-managed consignment.

---

## 4. Product Principles

### 4.1 Cooperative-first

The cooperative is the operational center of KOPDIG. Student sellers do not bypass the cooperative.

### 4.2 Mobile-first

The primary student experience is designed for a phone screen. Desktop and tablet layouts extend the mobile system rather than replacing it.

### 4.3 Simple transaction flow

The shortest reasonable path should be used for browsing, cart, checkout, payment, and pickup.

### 4.4 Controlled commerce

Products submitted by students must be reviewed before becoming publicly available.

### 4.5 Transactional clarity

Every important state should be visible: payment status, order status, stock availability, queue number, and pickup readiness.

### 4.6 Premium but practical

KOPDIG should feel polished and distinctive, while avoiding unnecessary animation, decorative noise, or visual complexity that makes the product slower or harder to use.

---

## 5. Target Users

### Student buyer

A student who wants to purchase products from the cooperative or from approved student consignments.

Primary needs:
- discover products quickly;
- know whether an item is available;
- order before break;
- complete payment;
- know the queue number;
- present a QR code when collecting the order.

### Student seller / consignor

A student who has a product that they want the cooperative to sell on their behalf.

Primary needs:
- submit a product;
- know whether it is approved or rejected;
- understand rejection reasons;
- see the approved selling price and cooperative margin;
- monitor sales of their products.

A user does not need a separate account type for selling. The same `student` role can buy products and submit products for consignment.

### Cooperative operator

The cooperative staff member who manages the operational side of the marketplace.

Primary needs:
- manage products and categories;
- review student submissions;
- manage inventory;
- process orders;
- prepare orders;
- manage queue numbers;
- verify QR pickups;
- monitor sales and margins.

---

## 6. MVP Scope

### Authentication and identity

- registration for students;
- login and logout;
- authenticated student and cooperative sessions;
- role-based access control;
- profile information.

### Marketplace

- product catalog;
- category browsing;
- product search;
- product detail;
- stock visibility;
- product source label: cooperative or student consignor.

### Cart

- add product;
- update quantity;
- remove item;
- calculate subtotal;
- validate stock before checkout.

### Checkout

- review order items;
- choose supported payment method through sandbox payment flow;
- choose or receive a pickup session based on cooperative configuration;
- create order;
- transition order into payment flow.

### Payment

- sandbox payment gateway integration;
- backend-generated payment transaction/token;
- payment status persistence;
- webhook/notification handling;
- payment verification on the backend.

### Consignment

- student product submission;
- submission review by cooperative;
- approve or reject;
- rejection reason;
- cooperative margin configuration;
- publish approved product;
- sales visibility for student owner.

### Order fulfillment

- order state tracking;
- queue number assignment;
- preparation status;
- ready-for-pickup state;
- QR pickup token;
- QR verification;
- pickup completion log.

### Cooperative operations

- product CRUD;
- category CRUD;
- consignment review;
- inventory overview;
- order management;
- pickup verification;
- simple sales and margin overview.

---

## 7. Explicitly Out of Scope for MVP

The following features should not be added unless they are separately requested:

- chat between students and sellers;
- product reviews and ratings;
- coupons and vouchers;
- loyalty points;
- delivery to classrooms;
- multi-branch support;
- seller-to-buyer direct payment;
- student wallet or stored balance;
- automatic split payouts to students;
- advanced recommendation systems;
- social feed;
- live shopping;
- complicated promotion engines;
- external courier integration;
- AI-generated product descriptions.

The MVP should prioritize correctness of the end-to-end buying, consignment, payment, queue, and pickup workflows.

---

## 8. Business Model

KOPDIG supports two product ownership models.

### Cooperative product

The cooperative owns and sells the product. The full product selling price contributes to cooperative sales, subject to any operational accounting rule that is added later.

### Student consignment

The student owns the underlying product. The cooperative manages the sale and receives a predefined margin.

Example business rule:

- student base price: IDR 8,000;
- cooperative margin: IDR 1,000;
- customer selling price: IDR 9,000.

The current MVP does not require automatic monetary payout to the student. It only needs to record the economic split accurately for reporting.

---

## 9. Core User Stories

### Student shopping

As a student, I want to browse school products on my phone so that I can order without waiting at the cooperative.

As a student, I want to search and filter products so that I can find what I need quickly.

As a student, I want to know whether a product belongs to the cooperative or to another student so that I understand the source of the product.

### Checkout and pickup

As a student, I want to pay through a sandbox payment flow so that the project can demonstrate a realistic digital transaction.

As a student, I want to receive a queue number and QR pickup code after successful payment so that I can collect the order efficiently.

As a cooperative operator, I want to scan a student's QR code and verify the order so that a paid order cannot be collected twice.

### Consignment

As a student, I want to submit my own product so that the cooperative can review and sell it.

As a cooperative operator, I want to approve or reject student product submissions so that only suitable products become visible.

As a student, I want to see why my product was rejected so that I know what needs to be fixed.

### Operations

As a cooperative operator, I want to see pending, processing, ready, and completed orders so that I can organize fulfillment.

As a cooperative operator, I want to see sales and margin information so that I can monitor the digital cooperative.

---

## 10. Core Order Lifecycle

The order lifecycle is:

`PENDING_PAYMENT` → `PAID` → `PROCESSING` → `READY_FOR_PICKUP` → `COMPLETED`

Possible exception states:

- `PAYMENT_FAILED`
- `CANCELLED`

Payment status and order status are separate concepts. A successful payment notification does not automatically mean the physical order is already completed. Backend business rules must update the order only after the relevant payment state is verified.

---

## 11. Consignment Lifecycle

A student-submitted product follows this lifecycle:

`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` → `PUBLISHED`

Rejection path:

`UNDER_REVIEW` → `REJECTED`

A rejected submission must include a human-readable rejection reason.

A product that is approved but not yet ready for sale must not appear as an active public marketplace item.

---

## 12. Success Criteria

The MVP is successful when a reviewer can demonstrate the complete journey without manual database edits:

1. A student registers and logs in.
2. The student browses products.
3. The student adds products to cart.
4. The student checks out.
5. The sandbox payment flow completes.
6. The backend verifies payment status.
7. The order receives a queue number.
8. The order becomes ready for pickup.
9. The student displays a QR pickup code.
10. The cooperative scans/verifies the QR code.
11. The order becomes completed.
12. A student can also submit a product for consignment.
13. The cooperative can approve or reject that submission.
14. Approved products become visible in the marketplace.
15. Historical order data remains accurate even if a product later changes or is archived.

---

## 13. Non-Functional Requirements

### Performance

- mobile pages should avoid unnecessary JavaScript and animation;
- product lists should be paginated or incrementally loaded when needed;
- images should be optimized and sized appropriately;
- database queries should avoid obvious N+1 patterns.

### Accessibility

- buttons must have clear labels;
- interactive targets must be comfortably tappable on mobile;
- color must not be the only way to communicate status;
- form errors must be visible and understandable;
- keyboard navigation should work on desktop.

### Security

- authorization must be enforced server-side;
- users must not be able to access another user's order data;
- payment notifications must be verified on the backend;
- QR pickup tokens must not expose unnecessary private information;
- secrets must remain in environment variables;
- mass assignment and request validation must be handled through Laravel's normal validation mechanisms.

### Maintainability

- business logic should remain server-owned;
- UI components should be reusable;
- database rules should be explicit;
- the codebase should remain understandable to a student developer.

---

## 14. Product Constraints

- The application is a school project.
- Payment is sandbox-only for development/demo purposes.
- The cooperative is the physical fulfillment point.
- Students collect orders in person.
- Student products are consigned through the cooperative rather than sold directly between students.
- The MVP does not need automatic student payout infrastructure.

---

## 15. Design Reference Interpretation

The supplied mobile commerce reference is an inspiration for the interaction model and composition:

- strong mobile-first cards;
- rounded surfaces;
- product imagery as a major visual element;
- compact category navigation;
- bottom navigation;
- clear purchase actions;
- highly focused product details.

The implementation must not copy the reference's brand, logo, colors, product content, or exact composition. KOPDIG needs its own design language described in `design.md`.

---

## 16. Source of Truth Hierarchy

When documents disagree, use this order:

1. `AGENT.md` for coding and agent behavior rules.
2. `prd.md` for product scope and business intent.
3. `System-design.md` for workflows and system behavior.
4. `database-structure.md` for data model rules.
5. `architecture.md` for technical structure.
6. `design.md` for visual and interaction direction.

If a requested change conflicts with a rule, the agent should ask before making a large architectural change.
