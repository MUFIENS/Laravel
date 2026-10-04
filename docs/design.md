# KOPDIG — Design System & Visual Direction

## 1. Design Intent

KOPDIG should feel like a premium local commerce product built specifically for a school ecosystem.

The experience must not resemble:

- a school administration dashboard;
- a generic CRUD template;
- a generic SaaS landing page;
- a direct clone of an established marketplace;
- a visually noisy "AI generated" interface.

The visual language should combine:

- modern retail;
- trust and institutional stability;
- youthfulness;
- entrepreneurship;
- warm community character.

The mobile experience is the primary reference point.

---

## 2. Brand Foundation

**Name:** KOPDIG

**Descriptor:** Ruang Niaga Warga Sekolah

**Tagline:** Tempat Karya Menjadi Transaksi.

The phrase "Tempat Karya Menjadi Transaksi" reflects the defining product behavior: students can bring products into the cooperative ecosystem and turn those products into real transactions.

The brand should therefore feel more like a curated retail environment than a conventional school application.

---

## 3. Design Personality

### Premium

Use restraint rather than decoration. Premium quality should come from spacing, typography, consistency, image treatment, and hierarchy.

### Confident

Use clear headings and direct actions. Avoid excessive explanatory text in primary purchase flows.

### Warm

Use a warm neutral canvas instead of sterile pure-white everywhere.

### Youthful

Product imagery, category chips, concise microcopy, and tactile interactions can keep the experience young without using childish illustrations.

### Curated

KOPDIG should communicate that products are managed and approved by the cooperative.

---

## 4. Color System

The default light theme is the primary visual mode.

### Core colors

| Token | Value | Purpose |
|---|---|---|
| `--color-canvas` | `#F7F6F1` | Main page background |
| `--color-surface` | `#FFFFFF` | Cards, sheets, inputs |
| `--color-primary` | `#183C32` | Primary actions, navigation, important labels |
| `--color-primary-hover` | `#245746` | Hover / active variation |
| `--color-primary-soft` | `#E7EFEB` | Soft selected backgrounds |
| `--color-accent` | `#D5A84C` | Small premium highlights, decorative accents |
| `--color-ink` | `#171A18` | Main text |
| `--color-muted` | `#707770` | Secondary text |
| `--color-border` | `#E4E4DC` | Dividers and control borders |
| `--color-success` | `#2E795A` | Success states |
| `--color-warning` | `#A97122` | Warning states |
| `--color-danger` | `#B34B4B` | Destructive/error states |
| `--color-info` | `#416B83` | Informational states |

### Color usage rules

- Deep green is the main brand/action color.
- Gold is an accent, not a second primary button color.
- Gold text should not be used on a light canvas for long passages because contrast can be insufficient.
- Red is reserved for destructive or error states.
- Status should not rely on color alone; pair color with text or an icon.
- Avoid rainbow-like product status systems.
- Avoid gradient backgrounds as a default visual device.

---

## 5. Typography

Recommended font direction:

### Primary display and UI family

**Satoshi**

Use for:
- page titles;
- product titles;
- navigation labels;
- buttons;
- prominent prices.

### Secondary text family

**General Sans**

Use for:
- descriptions;
- metadata;
- form helper text;
- long-form content.

If the project environment already has a deliberate font setup, do not replace it blindly. The agent must inspect the current implementation and preserve a consistent typography system.

### Type hierarchy

| Role | Suggested size | Weight |
|---|---:|---:|
| Display | 32–40px | 600–700 |
| Page heading | 24–30px | 600–700 |
| Section heading | 18–22px | 600 |
| Product title | 15–18px | 600 |
| Body | 14–16px | 400–500 |
| Metadata | 12–14px | 400–500 |
| Price | 16–22px | 700 |
| Tiny label | 11–12px | 600 |

Mobile should use the lower end of these ranges where appropriate. Typography must remain breathable and never create dense walls of text.

---

## 6. Spacing System

Use a 4px base rhythm with a practical set of spacing steps:

- 4px
- 8px
- 12px
- 16px
- 20px
- 24px
- 32px
- 40px
- 48px
- 64px

The most common mobile spacing should be 16px, 20px, and 24px.

Use larger spacing to separate sections rather than adding thick visual separators everywhere.

---

## 7. Radius System

The reference image uses soft rounded surfaces. KOPDIG should adopt this visual softness without turning every element into a pill.

| Element | Radius |
|---|---:|
| Large cards / sheets | 24px |
| Product cards | 20px |
| Inputs | 16px |
| Buttons | 14px |
| Small controls | 12px |
| Chips / tags | 9999px |
| Bottom navigation shell | 22–26px |

Avoid nested rounded rectangles with too many different radii in the same component.

---

## 8. Shadow and Elevation

KOPDIG uses low-contrast elevation.

Default preference:
- subtle shadow for floating surfaces;
- border for card separation;
- almost no shadow for ordinary product cards when the background already provides enough separation.

Avoid large dark drop shadows.

A component should not require a shadow simply to look finished.

---

## 9. Borders

Borders are soft and low contrast.

Use borders for:
- inputs;
- segmented controls;
- cart item separation where useful;
- subtle card definition;
- tables in the cooperative interface.

Do not outline every element heavily.

---

## 10. Iconography

Use **Lucide React** as the primary icon source.

Rules:

- do not use emoji as UI icons;
- keep stroke weight visually consistent;
- use icons to reinforce meaning, not to decorate every label;
- use an icon with a text label for unfamiliar actions;
- keep icon sizes consistent across controls.

The preferred base sizes are 16px, 18px, 20px, and 24px.

---

## 11. Mobile Layout Principles

The mobile viewport is the primary product canvas.

Typical structure:

- safe top area;
- compact header;
- search;
- horizontally scrollable category chips where needed;
- featured or active-order surface;
- product grid;
- persistent bottom navigation.

A two-column product grid is preferred for catalog browsing when product imagery allows it.

The main content should feel like a commerce application, not a long dashboard feed.

---

## 12. Student Navigation

Mobile primary navigation:

- Home
- Explore
- Orders
- Cart

Profile can be accessed from the header/avatar and from the account area.

The bottom navigation should be visually separated from the page without becoming a large opaque block that consumes excessive vertical space.

---

## 13. Home Screen Direction

The home screen should establish the KOPDIG identity quickly.

Recommended content priority:

1. compact greeting and user identity;
2. search field;
3. categories;
4. active order / pickup status when relevant;
5. featured or recommended products;
6. product grid;
7. secondary promotional or informational content only when necessary.

The page should prioritize products and current tasks over decorative hero sections.

---

## 14. Product Card

A KOPDIG product card should communicate four things immediately:

1. product image;
2. product name;
3. source/owner context;
4. selling price and add action.

Optional:
- small status badge;
- favorite action;
- stock state.

The card should not contain long descriptions.

For student consignments, show concise source text such as:

`Dititipkan oleh Nabila`

For cooperative products:

`Koperasi`

This source context is part of KOPDIG's identity.

---

## 15. Product Detail

Product detail is a focused commerce surface.

Priority order:

- back navigation;
- product imagery;
- product name;
- source/owner;
- price;
- stock state;
- concise description;
- quantity selector;
- primary add-to-cart action.

The purchase action should remain easy to reach on a mobile screen. Sticky action treatment is allowed when it improves usability.

---

## 16. Cart

The cart should use stacked compact product rows rather than desktop table conventions.

Each item should expose:
- image;
- name;
- price;
- quantity control;
- remove action.

The summary should be visually distinct but compact.

Avoid exposing internal financial calculations that are irrelevant to the customer. The customer needs to see the final price clearly; internal cooperative margin details belong in cooperative-facing views.

---

## 17. Checkout

Checkout should be short and sequential.

Recommended sections:

- order summary;
- payment method;
- pickup information;
- final total;
- pay action.

Do not add long forms when the application already knows the user's identity.

---

## 18. Order Tracking

The order page should make state obvious.

Primary information:

- order number;
- payment status;
- order status;
- queue number;
- pickup session;
- QR code when eligible;
- item summary.

The student should be able to understand "what do I need to do now?" without reading a long explanation.

---

## 19. QR Pickup Experience

QR pickup is a signature interaction.

The screen should be calm and high contrast.

The student should see:

- READY FOR PICKUP label;
- queue number;
- large QR code;
- short instruction;
- order summary.

The QR code should not be surrounded by heavy decoration.

The cooperative scanner view should prioritize:

- camera or scan input;
- success confirmation;
- student/order identity needed for verification;
- duplicate/invalid state;
- completion action.

---

## 20. Consignment UI

The consignment flow should feel like entering a product into a curated store, not uploading an arbitrary marketplace listing.

Submission form should emphasize:

- product name;
- category;
- image;
- description;
- base price;
- suggested stock.

The cooperative then reviews it and sets or confirms the selling price and margin according to business rules.

The student view should clearly communicate:

- submitted;
- under review;
- approved;
- rejected;
- published.

---

## 21. Cooperative UI

The cooperative area can be more information-dense than the student app.

It should still follow KOPDIG's brand identity but may use:

- tables;
- compact filter bars;
- status chips;
- summary metrics;
- queue management panels;
- order lists.

Do not force the student bottom-navigation pattern onto every cooperative management page.

The cooperative interface should optimize for operational accuracy rather than consumer-style decoration.

---

## 22. Components

Core reusable components should include:

- AppShell;
- MobileBottomNav;
- SearchField;
- CategoryChip;
- ProductCard;
- ProductGrid;
- PriceDisplay;
- QuantityControl;
- CartItem;
- OrderStatusBadge;
- QueueNumberCard;
- QRPickupCard;
- EmptyState;
- LoadingState;
- ErrorState;
- ConfirmationDialog;
- Toast/Notification;
- FormField;
- ProductSourceBadge.

Components should be composed from the project's established UI primitives instead of creating one-off variants for every page.

---

## 23. Interaction Design

### Micro-interactions

Use restrained motion for:

- button press feedback;
- quantity changes;
- cart updates;
- page transitions;
- loading placeholders;
- successful QR verification.

Avoid:

- constant floating animations;
- parallax everywhere;
- exaggerated spring transitions;
- long entrance animations.

### Motion duration

Typical UI transitions should be short, roughly 120–220ms. Important state transitions can use slightly longer durations when they improve comprehension.

Respect reduced-motion preferences.

---

## 24. Content and Microcopy

KOPDIG language should be concise and confident.

Avoid generic marketing filler such as:

- "Belanja mudah, cepat, dan nyaman!";
- "Nikmati pengalaman berbelanja terbaik!";
- "Temukan produk favoritmu sekarang!"

Prefer context-rich microcopy such as:

- "Ambil saat istirahat.";
- "Siap diambil.";
- "Dititipkan oleh Nabila.";
- "Sedang disiapkan.";
- "Nomor antrean A-0182.";

The language should feel like a real product, not a generated template.

---

## 25. Responsive Behavior

Mobile is primary.

Desktop should introduce additional horizontal space, not a completely different information architecture.

Recommended behavior:

- mobile: bottom navigation and two-column product grid;
- tablet: wider grid and optional persistent navigation;
- desktop: centered content container, wider product grid, and cooperative admin layouts with greater information density.

Never allow a mobile component to become unusably large on desktop simply because the mobile dimensions were copied without adaptation.

---

## 26. Accessibility

All interactive components must have:

- visible focus states;
- sufficient contrast;
- accessible labels;
- logical keyboard order;
- meaningful error messages;
- semantic buttons and links;
- touch-friendly target sizes.

Do not use low-contrast gray text for essential information.

---

## 27. Anti-Generic Rules

The AI agent must actively avoid the following visual patterns unless there is a clear reason:

- purple-to-blue gradients;
- oversized centered hero headings on every page;
- excessive glassmorphism;
- giant floating cards with no content purpose;
- excessive rounded pills;
- default shadcn-looking pages with no brand customization;
- repetitive shadow-heavy cards;
- arbitrary decorative blobs;
- excessive icon usage;
- generic dashboard templates copied from starter kits;
- generated marketing copy that says nothing about KOPDIG.

The presence of a component library must not dictate the brand identity.

---

## 28. Design Decision Rule

Every visual element should answer at least one of these questions:

- Does it improve navigation?
- Does it clarify a transaction?
- Does it strengthen KOPDIG's visual identity?
- Does it help the user make a decision?
- Does it communicate state?

If not, remove it or reduce it.
