# Landing Page Research: Weav-Inspired Hard Reset

## Weav Analysis

Weav.com utilizes a premium, editorial design language that feels entirely distinct from generic SaaS templates. Key observations include:

- **Aggressive Typography**: Oversized, tightly-tracked headlines that command the viewport.
- **Stark Contrast**: Use of deep dark backgrounds with crisp off-white typography, accented by highly saturated interaction colors.
- **Minimal Navigation**: Navigation is highly restrained, drawing the eye directly to the primary call-to-action (CTA).
- **Storytelling via Scrolling**: Reliance on smooth scrolling and scroll-triggered animations (like sticky elements where content changes as you scroll) to narrate a cohesive product story.
- **Interface as Art**: The product interface isn't just a flat screenshot; it's presented dynamically, often layered or animated, to prove the product's existence and quality.
- **Asymmetric Grids**: Avoiding centered, repetitive 3-column layouts in favor of edge-to-edge imagery and asymmetric text placement.

## Color Direction (Hard Reset)

The previous KOPDIG palette (#F7F6F1, #183C32, etc.) was too closely tied to the old, soft visual direction. For this hard reset, we've developed a **landing-page-scoped** palette:

- **Background**: `#0A0A0A` (Deepest Charcoal) - creates a premium canvas.
- **Surface**: `#161616` (Elevated Charcoal) - for containers and UI mockups.
- **Primary Text**: `#F5F2EB` (Warm Off-White) - provides high contrast without the harshness of pure white.
- **Muted Text**: `#888888` and `#A3A3A3` - for typographic hierarchy.
- **Accent/CTA**: `#E34A27` (Editorial Vermilion) - high energy, commerce feel.
- **Border**: `#2A2A2A` - subtle delineation.

## Typography Direction

- Moving away from standardized, safe line-heights to extremely tight leading (e.g., `leading-[0.9]`, `leading-none`) on massive `font-heading` elements.
- Utilizing extended tracking (`tracking-widest`, `tracking-[0.2em]`) for uppercase metadata and labels to create an editorial feel.

## Libraries Evaluated & Selected

- **GSAP & ScrollTrigger** (`gsap`, `@gsap/react`): Selected as the industry standard for complex, performant, scroll-linked animations and pinned storytelling sections.
- **Lenis** (`lenis`): Selected for butter-smooth scrolling to elevate the premium feel.
- **Lucide React**: Selected for all iconography, adhering to the "zero emoji" rule.

## Final Concept

A cinematic, dark-themed editorial experience. The page acts as a standalone brand campaign that tells the story of KOPDIG—focusing on student creativity, rigorous cooperative curation, and rapid transactions—before asking the user to authenticate and enter the functional marketplace.
