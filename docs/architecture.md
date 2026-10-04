# KOPDIG — Technical Architecture

## 1. Architectural Goal

KOPDIG should use a maintainable Laravel-centered monolith with a modern React interface.

The preferred architecture is:

- Laravel 13 as the application backend and server-side application layer;
- Inertia as the bridge between Laravel routes/controllers and React pages;
- React as the UI layer;
- Tailwind CSS for styling;
- Vite for frontend asset bundling;
- MySQL/MariaDB for relational persistence;
- Laravel Storage for managed product images;
- sandbox payment gateway integration for development;
- QR generation and scanning for physical pickup verification.

The application should not be split into a separate Laravel API project and a separate React SPA unless a later requirement explicitly demands it.

---

## 2. Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Application framework | Laravel 13 | Routing, backend logic, auth, validation, ORM, jobs, events |
| Runtime | PHP >= 8.3 | Laravel 13 runtime requirement |
| Frontend | React 19.x | Interactive UI |
| Frontend language | TypeScript recommended | Typed UI code and safer contracts |
| Full-stack bridge | Inertia 3 | Server-side routing + React page rendering |
| CSS | Tailwind CSS 4 | Utility-first styling and design tokens |
| Build tool | Vite | Dev server and asset compilation |
| UI primitives | shadcn/ui where appropriate | Accessible reusable primitives |
| Icons | Lucide React | Consistent iconography |
| Database | MySQL or MariaDB | Relational data |
| ORM | Eloquent | Database access and relationships |
| Authentication | Laravel starter/auth stack | Login, registration, sessions, password handling |
| Storage | Laravel Filesystem | Product images and uploads |
| Payment | Midtrans Sandbox or equivalent sandbox gateway | Demonstration payment flow |
| QR | Server-generated QR + browser/device scanner | Pickup verification |

Laravel's official React starter kit currently uses React 19, TypeScript, Inertia 3, Tailwind 4, and shadcn/ui. Laravel 13's official documentation also uses Vite as the normal asset bundling path. PHP 8.3 or newer is required by Laravel 13. These versions should be re-verified against the installed project before implementation because package versions can move independently. 

Official references used when preparing this document:
- Laravel 13 documentation and starter kits
- Laravel 13 Vite documentation
- React version documentation
- Tailwind CSS Laravel + Vite documentation
- Midtrans Snap documentation

---

## 3. Architectural Style

Use a Laravel monolith with an Inertia-driven React frontend.

This means:

- Laravel owns routing;
- Laravel controllers prepare page props;
- React renders page interfaces;
- Inertia handles page navigation without requiring a manually built REST API for normal page operations;
- Eloquent owns persistence;
- authorization remains on the server;
- payment webhooks are handled by Laravel endpoints.

This architecture is intentionally chosen to reduce infrastructure and integration complexity for a school project.

---

## 4. Why Not a Separate React SPA + REST API

A separate SPA/API architecture would add:

- CORS configuration;
- duplicated validation concerns;
- API authentication complexity;
- more frontend data-fetching boilerplate;
- more deployment coordination;
- an additional public API surface.

The project does not require those costs for its current scope.

Inertia provides the modern navigation and React interaction model while keeping Laravel's server-side routing and controller model.

---

## 5. Backend Architecture

Recommended Laravel layers:

### Routes

`routes/web.php` should contain web application routes grouped by authentication and role requirements.

Payment notification endpoints may use a dedicated route file only if the project structure warrants it; otherwise keep them explicit and isolated within the normal Laravel routing system.

### Controllers

Controllers should orchestrate HTTP requests and delegate meaningful business operations to services/actions where the operation has real domain complexity.

Controllers should not become giant business-logic files.

Examples:

- `ProductController`
- `CartController`
- `CheckoutController`
- `OrderController`
- `ConsignmentController`
- `CooperativeOrderController`
- `PaymentController`
- `PickupController`

### Form Requests

Use Laravel Form Request classes for validation of:

- product submission;
- product creation/update;
- checkout;
- profile changes;
- cooperative review actions.

### Models

Eloquent models represent domain entities and relationships.

Models should contain simple domain-level behavior when that behavior naturally belongs to the entity, but large transaction workflows should not be buried inside models.

### Policies

Authorization should be explicit.

Example policies:

- `OrderPolicy`
- `ProductPolicy`
- `ConsignmentPolicy`
- `CartPolicy` where needed.

A student must never be able to use a manipulated URL or form request to view another student's order.

### Services / Actions

Use focused classes when a process has multiple steps or external side effects.

Good candidates:

- `CreateOrder`
- `CalculateOrderTotals`
- `AssignQueueNumber`
- `ApproveConsignment`
- `RejectConsignment`
- `CreatePaymentTransaction`
- `HandlePaymentNotification`
- `VerifyPickupQr`
- `CompletePickup`

Do not create a service class for trivial CRUD merely to add files.

---

## 6. Frontend Architecture

The main React code should live under `resources/js`.

Recommended structure:

```text
resources/js/
  components/
    ui/
    commerce/
    orders/
    consignment/
    cooperative/
  layouts/
  pages/
    auth/
    student/
    cooperative/
  hooks/
  lib/
  types/
```

The exact folder structure may adapt to the starter kit already installed.

### Pages

Pages represent route-level screens, not generic visual components.

Examples:

- `pages/student/Home.tsx`
- `pages/student/Explore.tsx`
- `pages/student/Product/Show.tsx`
- `pages/student/Cart.tsx`
- `pages/student/Checkout.tsx`
- `pages/student/Orders/Index.tsx`
- `pages/student/Orders/Show.tsx`
- `pages/student/Consignment/Index.tsx`
- `pages/student/Consignment/Create.tsx`
- `pages/cooperative/Orders/Index.tsx`
- `pages/cooperative/Orders/Show.tsx`
- `pages/cooperative/Products/Index.tsx`
- `pages/cooperative/Consignments/Index.tsx`
- `pages/cooperative/Pickup/Scan.tsx`

### Components

Components should represent reusable interface units, not complete pages.

A `ProductCard` should be usable across home, search, category pages, and related product areas without copying its markup.

---

## 7. Data Flow Rules

For standard application operations:

1. React submits a request through Inertia.
2. Laravel authenticates and authorizes the request.
3. A Form Request validates user input when appropriate.
4. A controller delegates domain logic.
5. Eloquent reads or writes data.
6. Laravel returns an Inertia response or redirect.
7. React renders the new state.

For external payment events:

1. Payment transaction is created by Laravel.
2. The payment provider processes the transaction.
3. Provider sends notification/webhook to Laravel.
4. Laravel verifies authenticity and current payment state.
5. Laravel updates the payment record.
6. Laravel updates the order only according to verified business rules.
7. The next page/request reads the authoritative order state.

---

## 8. Authorization Model

MVP roles:

- `student`
- `cooperative`

Role is stored on the authenticated user record.

Use Laravel policies and server-side authorization checks for resource ownership and role-sensitive operations.

The UI may hide controls for a role, but hiding a button is never considered authorization.

---

## 9. Inventory Architecture

Product stock is a current value, but inventory changes should be traceable.

Use:

- `products.stock` for the current available quantity;
- `inventory_movements` for stock-changing events.

Examples of inventory movement reasons:

- initial stock;
- manual restock;
- order reservation;
- order cancellation/restock;
- pickup completion if physical stock accounting is modeled that way;
- manual correction.

The system should define exactly when stock decreases and avoid mixing inventory updates across multiple controllers without a common rule.

For the MVP, the safest operational rule is:

- stock is validated and reserved/consumed during order creation according to the implementation's transactional strategy;
- if payment fails or an order expires, the system restores stock only through an explicit state transition;
- inventory updates happen inside database transactions whenever multiple related records must change together.

The agent must not silently invent a second stock mechanism.

---

## 10. Financial Architecture

All IDR money values should be stored as integers representing rupiah, not floating-point numbers.

Example:

`8000` means IDR 8,000.

Store these values explicitly where historical accuracy matters:

- product base price;
- product selling price;
- cooperative margin amount;
- order subtotal;
- order total;
- order-item unit price;
- order-item subtotal;
- payment gross amount.

Do not recalculate historical order totals from the current product price.

---

## 11. Payment Architecture

Payment integration should remain backend-owned.

The backend creates the payment transaction using trusted totals derived from the database.

The frontend must never be the source of truth for:

- payable total;
- cooperative margin;
- product price;
- payment status.

For Midtrans Snap Sandbox, the implementation should follow the provider's current official integration pattern: backend requests a Snap transaction token, frontend presents the payment experience, and the backend handles payment status notifications. Midtrans documents HTTP(S) notifications/webhooks and recommends verifying notification authenticity; the current documentation describes signature verification using order ID, status code, gross amount, and the confidential server key. 

The notification handler must be idempotent so that receiving the same notification more than once does not duplicate effects.

---

## 12. QR Architecture

QR pickup should encode a non-sensitive pickup token or signed opaque identifier rather than raw personal data.

A valid pickup flow should:

1. locate the intended order;
2. verify the order belongs to the current pickup session or meets the pickup rules;
3. verify payment state;
4. verify order status is `READY_FOR_PICKUP`;
5. reject already-completed orders;
6. record the cooperative operator and timestamp;
7. transition the order to `COMPLETED`.

The operation must be atomic so two operators cannot complete the same order concurrently.

---

## 13. Queue Architecture

Queue numbers are generated by the cooperative, not by the client.

A queue is associated with a pickup session/date so that numbers can restart according to the school's operational schedule without creating ambiguity.

The database must prevent duplicate queue numbers within the relevant scope.

The frontend displays the queue number as a human-friendly label such as:

`A-0182`

The exact prefix and reset rule should be configurable later but do not need a complex settings system for the MVP.

---

## 14. Storage Architecture

Product images belong to the application-managed storage system.

Requirements:

- validate MIME type and file size;
- generate safe filenames/paths;
- store only the path/reference in the database;
- do not store raw image binary data in relational columns;
- use responsive image sizing when practical.

Student submission images may initially use the same storage area with a predictable path convention.

---

## 15. Error Handling

The UI must distinguish:

- validation error;
- authorization error;
- resource not found;
- business rule conflict;
- payment failure;
- external provider failure;
- server error.

User-facing messages should be understandable without exposing stack traces, SQL, secrets, or raw provider payloads.

Logs should contain enough technical detail for debugging while avoiding unnecessary personal data.

---

## 16. Transactions and Concurrency

Database transactions should be used when one logical action updates multiple records and all changes must succeed or fail together.

Important examples:

- creating an order and its items;
- reserving stock and creating order items;
- assigning a queue number under a unique constraint;
- completing pickup and creating pickup log;
- applying a verified payment state transition.

A unique database constraint is preferred over a frontend-only check whenever duplicate data must be impossible.

---

## 17. Caching

Caching is not an MVP requirement for the whole application.

Only add caching where measurement or an obvious read-heavy path justifies it, such as stable product category data or other low-volatility reference data.

Do not introduce a cache layer just to make the architecture look advanced.

---

## 18. Jobs and Events

Queued jobs may be introduced later for:

- image processing;
- notification dispatch;
- asynchronous reporting;
- external payment reconciliation.

Do not make the core checkout flow depend on a queue unless there is a real requirement.

Laravel events may be used for decoupled side effects, but domain state transitions should remain easy to trace.

---

## 19. Testing Strategy

Minimum testing strategy:

### Feature tests

- authentication;
- student product browsing;
- student order creation;
- unauthorized order access;
- consignment submission;
- cooperative approval/rejection;
- payment notification handling;
- queue number uniqueness;
- QR pickup completion;
- repeated pickup rejection.

### Unit tests

- price/margin calculation;
- order total calculation;
- queue assignment logic where isolated;
- state transition rules where useful.

### UI testing

The project should at least include manual responsive verification of the main student flow and automated browser tests where the environment makes them practical.

---

## 20. Deployment Assumptions

The application can be deployed as one Laravel application rather than separate frontend/backend services.

Required production concerns:

- environment variables;
- application key;
- database configuration;
- storage configuration;
- HTTPS;
- queue worker only if queued jobs are introduced;
- scheduler only if scheduled tasks are introduced;
- publicly reachable payment webhook URL for sandbox testing.

Midtrans documentation notes that notification endpoints must be reachable from the public internet; local development may require a tunnel when testing webhook delivery.

---

## 21. Recommended Project Structure

A reasonable starting structure is:

```text
app/
  Actions/
  Http/
    Controllers/
    Requests/
    Middleware/
  Models/
  Policies/
  Services/
  Support/
config/
database/
  factories/
  migrations/
  seeders/
resources/
  css/
  js/
    components/
    hooks/
    layouts/
    lib/
    pages/
    types/
routes/
storage/
tests/
  Feature/
  Unit/
docs/
  prd.md
  design.md
  architecture.md
  System-design.md
  database-structure.md
  AGENT.md
```

The exact structure should follow the generated Laravel starter project's conventions when those conventions are already sensible.

---

## 22. Dependency Rule

Every new dependency should have a concrete reason.

Before installing a package, the agent should check:

- whether Laravel already provides the needed capability;
- whether the existing starter kit already contains the capability;
- whether an installed skill recommends a library;
- whether the package is actively maintained;
- whether the package works with the current Laravel/React/Tailwind versions.

Do not add multiple libraries that solve the same problem.

---

## 23. Official Documentation Rule

When implementing framework-specific behavior, prefer official documentation:

- Laravel 13 documentation;
- React documentation;
- Inertia documentation;
- Tailwind CSS documentation;
- Vite documentation;
- official payment provider documentation.

The AI agent should verify current API/CLI syntax from the installed project and official documentation rather than relying on memory.
