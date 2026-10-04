# KOPDIG Landing Page: Structural Redesign & Progressive Interaction System

## 1. Executive Summary

This phase finalized the interaction and progressive storytelling behaviors of the KOPDIG public landing page (`resources/js/pages/welcome.tsx`), elevating it from a static editorial layout into an award-winning, responsive, and cinematic digital brand experience.

---

## 2. Progressive Ecosystem Story System ("Alur Ekosistem KOPDIG")

The ecosystem section now functions as a true scroll-driven narrative with step-specific artwork and synchronized state transitions:

### A. Three Distinct Visual Assets (Campaign-Aligned)
Each chapter of the cooperative workflow has its own high-resolution editorial photograph:
1. **Step 01: Siswa Berkarya** (`/images/campaign/student-craft.jpg`)
   - Visual subject: Authentic handcrafted student goods, artisan bookbinding with Indonesian batik pattern, tactile workshop tools.
   - Annotation: `[ FIG. 01 — KONSINYASI & KARYA MANDIRI ]`
2. **Step 02: Koperasi Mengkurasi** (`/images/campaign/curation-step.jpg`)
   - Visual subject: Quality inspection and verification on a wooden cooperative desk, magnifying glass, precision calipers, and official stamp of approval.
   - Annotation: `[ FIG. 02 — KURASI & STANDAR MUTU ]`
3. **Step 03: Warga Sekolah Bertransaksi** (`/images/campaign/transaction-step.jpg`)
   - Visual subject: Modern Indonesian school cooperative counter, student presenting a sleek smartphone QR voucher, cooperative officer scanning the slip, prepared orders ready for instant collection.
   - Annotation: `[ FIG. 03 — TRANSAKSI QR & LOKET PICKUP ]`

### B. Desktop Sticky/Pinned Interaction (`min-width: 1024px`)
- **Pinned Stage**: The left container pins smoothly at `top-32` during the scroll sequence.
- **Crossfade & Scale Transitions**: When the active step changes, the outgoing image scales slightly (`scale-105`) and fades out (`opacity-0`) while the incoming image smoothly scales from `scale-105` to `scale-100` and fades in (`opacity-100`) with `duration-700 ease-out`.
- **Synchronized Progress**:
  - Step counter updates dynamically: `01 / 03`, `02 / 03`, `03 / 03`.
  - Progress line bar animates its width smoothly (`33% -> 66% -> 100%`).
  - Active step narrative on the right highlights with full opacity (`opacity-100`) and a glowing vermilion border (`border-[#E34A27]`), while inactive steps are softly dimmed (`opacity-35`).
- **Interactive Quick Selector**: Users can click `01`, `02`, or `03` buttons to smoothly scroll directly to that chapter.

### C. Mobile Graceful Degradation (`< 1024px`)
- Unpins cleanly into an intuitive vertical editorial flow.
- Each step features its dedicated image embedded directly beneath the step title, ensuring mobile visitors (390px, 430px) experience rich visuals without awkward pin locks or horizontal overflow.

---

## 3. Microinteractions & Hover Design System

All interactions follow purposeful, restrained, and tactile motion principles:

1. **Primary Call-to-Action Buttons**:
   - **Hover**: Subtle vertical lift (`hover:-translate-y-0.5`), glowing accent shadow (`hover:shadow-lg hover:shadow-[#E34A27]/25`), and arrow translation (`group-hover:translate-x-1.5`).
   - **Press Feedback**: Immediate active scale down (`active:scale-[0.98] active:translate-y-0`).
   - **Background Fill**: Smooth directional wipe from left to right on hover.
2. **Navigation Links**:
   - Subtle color shift from `#A3A3A3` to `#F5F2EB`.
   - Micro-underline slide reveal (`after:w-0 hover:after:w-full after:transition-all after:duration-300`).
3. **Interactive Visual Frames**:
   - Hero and campaign image frames feature subtle scale (`group-hover:scale-[1.03]`), grayscale-to-full-color reveal, and contrast shifts.
4. **Art-Directed UI Showcase (Digital Order Voucher)**:
   - Floating card elevation on hover (`hover:-translate-y-1.5 hover:border-[#E34A27] hover:shadow-2xl hover:shadow-[#E34A27]/10`).
   - Individual order items respond to hover with a subtle highlight (`hover:bg-[#202020]`).
5. **Mobile Navigation Drawer**:
   - Smooth 90-degree rotate and cross-morph transition between the hamburger icon (`Menu`) and close icon (`X`).

---

## 4. Technical Architecture & Motion Synchronization

```ts
// Lenis Smooth Scroll Synchronized with GSAP Ticker & ScrollTrigger
const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 1.8,
});

lenis.on('scroll', () => {
    ScrollTrigger.update();
});

const tickerCb = (time: number) => {
    lenis.raf(time * 1000);
};

gsap.ticker.add(tickerCb);
gsap.ticker.lagSmoothing(0);
```

- **ScrollTrigger Lifecycle**: All triggers are created within `useGSAP({ scope: containerRef })` and scoped strictly to prevent duplicate triggers or memory leaks upon re-renders.
- **Accessibility**: Full respect for `prefers-reduced-motion`—disables Lenis, collapses preloader immediately, and resets all animated transforms.
- **Zero Emoji Compliance**: Strictly Lucide React SVG icons.

---

## 5. Quality Gates & Test Suite Verification

All quality gates passed at 100%:

| Check | Tool / Command | Result |
| :--- | :--- | :--- |
| **TypeScript** | `npm run types:check` (`tsc --noEmit`) | **Passed (0 errors)** |
| **Lint / Format** | `npx vp check --fix` | **Passed (107 files checked, 0 warnings, 0 errors)** |
| **Vite Production** | `npm run build` | **Passed (`welcome` bundle compiled at 177 kB)** |
| **Code Style** | `vendor/bin/pint --test` | **Passed (0 style violations)** |
| **Static Analysis** | `vendor/bin/phpstan --configuration=phpstan.neon` | **Passed (Level 5, 0 errors)** |
| **Backend Test Suite** | `php artisan test` | **Passed (251 tests passed, 1,738 assertions)** |
| **Endpoint Live Check**| `curl.exe -I http://127.0.0.1:8000/` | **`HTTP/1.1 200 OK`** |

---

## 6. Navbar In-Page Smooth Scroll Fix (Lenis & Anchor Architecture)

### A. Root Cause
1. **Native Anchor Bypassing Virtual Scroll**: Default HTML anchor navigation (`<a href="#id">`) triggers native browser jump behavior, bypassing the running Lenis smooth-scrolling engine and RAF loop.
2. **Hash Update Side-Effects**: Setting `window.location.hash` directly triggers a secondary native browser jump.
3. **Fixed Header Occlusion**: The landing page employs a fixed top navigation bar (`h-20` / 80px). Standard native jumps position the target element at the very top of the viewport (`top: 0`), obscuring section titles beneath the navbar.

### B. Solution & Architecture
- **Single Lenis Instance Re-use**: Bound the existing landing page Lenis instance to a ref (`lenisRef.current = lenis`) inside the primary lifecycle `useEffect`. Cleaned up on unmount. No secondary instances or duplicate RAF loops are created.
- **Controlled Event Interception (`handleNavClick`)**:
  1. Calls `e.preventDefault()` to stop native browser jump.
  2. Measures the actual rendered navbar height dynamically via `getHeaderOffset()`, defaulting to 80px.
  3. Executes `lenisRef.current.scrollTo(targetElement, { offset: -headerOffset, duration: 1.1 })`.
  4. Updates the browser URL hash cleanly using `window.history.pushState(null, '', hash)`, ensuring history push without triggering a native browser jump.
- **Section ID Standardization & Aliases**:
  - `#tentang` (Scene 02: Filosofi Niaga) with legacy alias `<div id="filosofi" />`.
  - `#cara-kerja` (Scene 03: Alur Ekosistem) with legacy alias `<div id="ekosistem" />`.
  - `#karya-siswa` (Scene 04: Kurasi Produk Siswa).
  - `#showcase-ui` (Scene 05: Sistem Digital Terpadu) with legacy alias `<div id="sistem-digital" />`.
- **Ecosystem Step Sync**: Updated Scene 03 quick-selector button handler (`scrollToStep`) to also leverage `lenisRef.current.scrollTo` rather than native `scrollIntoView`.
- **Deep-linking & History Popstate Handling**:
  - Direct URL loads with hash (e.g. `/#cara-kerja`) or browser Back/Forward (`popstate` events) smoothly scroll to the requested anchor with correct navbar offset.
- **Accessibility & Reduced Motion**:
  - Detects `window.matchMedia('(prefers-reduced-motion: reduce)')`. When active, performs instant alignment (`window.scrollTo({ top: offsetPosition, behavior: 'auto' })`) to respect user preferences while keeping navigation fully functional.

### C. Mobile Drawer Navigation Flow (`handleMobileNavClick`)
- Clicking an in-page link inside the mobile drawer:
  1. Closes the mobile drawer menu (`setIsMobileMenuOpen(false)`).
  2. Defers scroll execution using `requestAnimationFrame` so the menu drawer dismisses cleanly without layout jitter.
  3. Smoothly glides to the target section with the mobile header offset applied.

### D. Validation Results
- **Desktop (1280x800, 1440x900)**:
  - Navbar links (`Tentang`, `Cara Kerja`, `Karya Siswa`, `Sistem Digital`) glide smoothly without instant jumps.
  - Section tops align with perfect clearance below the 80px fixed header.
  - Pinned GSAP ScrollTrigger in the ecosystem section remains fully synchronized before, during, and after navigation.
- **Mobile (390x844, 430x932)**:
  - Drawer closes smoothly without abrupt shift; section glides to target with correct spacing.
- **URL & History**:
  - Address bar updates correctly (`#tentang`, `#cara-kerja`, etc.) without triggering a secondary jump.
  - Browser Back and Forward buttons navigate between sections smoothly.
- **Console & Performance**:
  - 0 console warnings or errors; 0 duplicate RAF loops.

---

## 7. Ecosystem Story Flow: Stage Size & Sticky Pinned Optimization

### A. Root Cause: Photo Disconnecting During Scroll
- In the initial implementation, `containerRef` had `overflow-x-hidden`. Under modern browser CSS rendering rules, applying `overflow-x: hidden` to any ancestor element creates an overflow clipping context that disables `position: sticky` on descendant elements.
- As a consequence, on desktop viewports the sticky left image stage was rendered as a static relative block at the top of the grid. When users scrolled down toward Step 02 and Step 03, the photo container scrolled away out of the viewport ("tertinggal di atas"), leaving Step 03 adjacent to empty whitespace.

### B. Solution & Visual Enhancements
1. **Unlocking `position: sticky` via `overflow-x: clip`**:
   - Replaced `overflow-x-hidden` with `overflow-x-clip` (and inline `style={{ overflowX: 'clip' }}`). This completely eliminates horizontal scrollbars without breaking native `position: sticky`.
   - Explicitly assigned `lg:self-start lg:sticky lg:top-28` to the photo stage container, ensuring it stays centered and pinned in the viewport throughout all three narrative steps.
2. **Enlarged Visual Stage to Fill Whitespace**:
   - Rebalanced the layout grid from `5 cols (photo) / 7 cols (text)` to **`7 cols (photo) / 5 cols (text)`**.
   - Expanded the visual container to `aspect-[16/11]` with a robust minimum height (`min-h-[460px] lg:min-h-[500px] xl:min-h-[540px]`), utilizing available canvas whitespace for a cinematic editorial showcase.
   - Enhanced the internal frame with `p-6 sm:p-8`, enlarged progress bar, and crisp step captions.
3. **Optimized ScrollTrigger Synchronization**:
   - Refined the step trigger boundaries to `start: 'top 60%', end: 'bottom 40%'` so active step transitions occur naturally as each chapter reaches the viewport reading line.
   - Step 03 remains pinned in view alongside the photo until the entire ecosystem section completes and transitions smoothly into the student creativity showcase.
