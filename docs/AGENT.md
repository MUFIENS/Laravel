# KOPDIG — AI Agent Rules

## 1. Role

You are the engineering agent responsible for implementing and maintaining KOPDIG.

Your job is not to blindly generate code. Your job is to understand the project, inspect the existing implementation, verify available tools/skills/documentation, make the smallest appropriate change, and validate the result.

The repository documentation is part of the system's source of truth.

---

## 2. Mandatory Context Files

Before major implementation work, read the relevant documentation files:

- `docs/prd.md`
- `docs/design.md`
- `docs/architecture.md`
- `docs/System-design.md`
- `docs/database-structure.md`
- `docs/AGENT.md`

Do not assume that you know the project solely from the current prompt.

When working on a specific feature, read the documents most relevant to that feature before editing code.

---

## 3. First Rule: Inspect Before Changing

Never immediately start writing application code when entering a new project or a new feature.

First inspect:

- project tree;
- `composer.json`;
- `package.json`;
- Laravel version;
- PHP version;
- React version;
- Inertia version;
- Tailwind version;
- Vite configuration;
- authentication setup;
- existing routes;
- controllers;
- models;
- migrations;
- React pages;
- shared components;
- existing tests;
- existing configuration;
- environment example files;
- existing project documentation.

Never overwrite an existing implementation just because a new generated version looks cleaner.

---

## 4. Skill Discovery Is Mandatory

This project is expected to be developed with Antigravity and installed AI skills.

Before using a skill, inspect the actual skill installation and documentation available in the current environment.

At minimum, investigate:

- `ui-ux-pro-max`;
- `antigravity-awesome-skills`.

Also inspect any other installed skill that is relevant to:

- Laravel;
- React;
- Tailwind;
- UI/UX;
- testing;
- accessibility;
- architecture;
- debugging;
- security;
- Git/GitHub.

Do not assume a skill's commands from memory.

Do not invent a skill command.

Do not assume a skill path.

If local documentation points to a GitHub repository, inspect the referenced official repository/documentation when available.

---

## 5. How to Discover Skill Commands

For each relevant skill:

1. locate the installed skill;
2. read its `SKILL.md`;
3. read the skill's README or instruction files;
4. inspect referenced scripts/workflows;
5. identify documented commands or invocation patterns;
6. verify that the command exists in the installed version;
7. only then use it.

When a command differs between documentation versions, follow the installed version and record the discovery if it affects future work.

Do not replace a skill's documented workflow with a guessed equivalent.

---

## 6. UI/UX Skill Rule

When building or reviewing KOPDIG's UI, use the installed UI/UX skill when it is relevant.

Before calling a UI/UX workflow, inspect how the installed skill is actually invoked.

Use the skill to improve:

- layout hierarchy;
- mobile-first interaction;
- typography;
- spacing;
- visual consistency;
- accessibility;
- component patterns;
- responsiveness.

The skill is a support tool. KOPDIG's own `design.md` remains the product-specific visual source of truth.

Do not allow a generic skill output to overwrite the KOPDIG brand identity.

---

## 7. Antigravity Skill Rule

When a relevant Antigravity skill exists, inspect its documentation and use the appropriate workflow instead of inventing your own process.

The agent must understand:

- what the skill does;
- when it should be used;
- which command or workflow invokes it;
- what output it expects;
- whether the command is destructive or modifies files.

Never execute a destructive or bulk-modifying skill command without checking its documented behavior.

---

## 8. Official Documentation Rule

For framework/API behavior that may have changed, verify current documentation.

Preferred sources:

- Laravel official documentation;
- React official documentation;
- Inertia official documentation;
- Tailwind official documentation;
- Vite official documentation;
- official payment gateway documentation;
- official library documentation for packages actually installed in the project.

Do not trust an old tutorial when official current documentation contradicts it.

---

## 9. Architecture Rules

KOPDIG uses a Laravel-centered monolith with Inertia and React unless the project explicitly changes this decision.

Do not introduce a separate frontend API architecture without a clear requirement.

Laravel owns:

- routing;
- server-side authorization;
- validation;
- business rules;
- database access;
- payment integration;
- webhook processing;
- order state transitions;
- QR pickup verification.

React owns:

- presentation;
- interaction;
- local UI state;
- form interaction;
- client-side presentation logic.

The client is never the final authority for:

- price;
- stock;
- payment status;
- order status;
- cooperative margin;
- authorization.

---

## 10. Database Rules

Before changing database structure:

1. read `database-structure.md`;
2. inspect existing migrations;
3. determine whether the field/table already exists;
4. preserve historical data;
5. create constraints where the rule must be impossible to violate;
6. update the documentation if the data model intentionally changes.

Never store IDR money as floating-point values.

Use integer rupiah values.

Do not store raw passwords.

Do not store payment provider secrets in the database.

Do not delete historical order information merely because a current product is archived.

---

## 11. Business Rule Priority

Server-side business rules are authoritative.

Important rules include:

- only approved active products can be purchased;
- student accounts can see only their own sensitive order data;
- student consignment requires cooperative review;
- cooperative margin is calculated server-side;
- final order total is calculated server-side;
- payment status must be verified server-side;
- queue numbers are assigned server-side;
- QR pickup is verified server-side;
- completed orders cannot be completed again.

---

## 12. Authorization Rules

Never rely on frontend visibility for authorization.

A hidden button is not security.

Every sensitive action must be protected by Laravel authentication and authorization.

Examples:

- student cannot access another student's order;
- student cannot approve a consignment;
- student cannot change cooperative margin;
- student cannot mark an order as completed;
- cooperative cannot act as another student without an explicit supported workflow.

---

## 13. Coding Style

Prefer code that is:

- explicit;
- readable;
- boring in a good way;
- modular where reuse is real;
- consistent with Laravel conventions;
- consistent with React conventions;
- easy for a student developer to understand later.

Avoid:

- giant controllers;
- giant React components;
- deeply nested conditional logic;
- unnecessary design patterns;
- unnecessary repositories;
- unnecessary abstractions;
- duplicate component implementations;
- magic strings scattered across the application.

---

## 14. Component Rules

Create a reusable component when:

- it appears in multiple places;
- it represents a stable UI pattern;
- it has a clear responsibility;
- reuse will genuinely reduce duplication.

Do not extract every three-line JSX fragment into a separate component.

The UI should be composable without becoming impossible to follow.

---

## 15. Design Rules

Treat `docs/design.md` as the visual source of truth.

KOPDIG is:

- mobile-first;
- premium;
- modern;
- warm;
- confident;
- commerce-oriented;
- entrepreneurial.

Avoid:

- generic purple/blue startup gradients;
- excessive glassmorphism;
- excessive pill buttons;
- giant shadows;
- decorative blobs without purpose;
- emoji as icons;
- generic school dashboards;
- copied marketplace layouts;
- over-animated pages;
- visual noise.

Use the provided mobile commerce reference as inspiration for interaction and composition, never as something to reproduce 1:1.

---

## 16. Mobile-First Rules

Build for mobile first.

Do not design the desktop layout and then shrink it.

Prioritize:

- compact header;
- search;
- category chips;
- product grid;
- bottom navigation;
- sticky transaction actions when useful;
- readable touch targets;
- short checkout flows.

Desktop should expand the system rather than invent a completely different product.

---

## 17. Payment Rules

Payment integration is sandbox-only for the MVP.

Never hard-code provider secrets.

Use environment variables.

Never trust a payment status supplied only by the browser.

For provider notifications:

- verify authenticity;
- normalize provider status to an application status;
- make processing idempotent;
- protect against duplicate callbacks;
- log enough information to troubleshoot without exposing secrets.

Follow the current official provider documentation rather than copying old integration tutorials.

---

## 18. QR Rules

QR pickup must use an opaque/safe token.

Do not encode sensitive student information in the QR.

Pickup verification must confirm:

- order exists;
- payment is valid;
- order is ready for pickup;
- order has not already been completed;
- pickup is authorized.

Pickup completion should be atomic.

---

## 19. Inventory Rules

Stock must be checked on the backend.

Never trust quantity values sent by the frontend without checking current inventory.

Stock-changing operations should use a clear database transaction strategy.

If inventory history is implemented, every important stock change should have a movement reason/reference.

---

## 20. Error Handling Rules

Every non-trivial feature must consider:

- loading;
- empty;
- success;
- validation failure;
- authorization failure;
- not found;
- business conflict;
- external service failure;
- server failure.

Never silently fail.

Never expose stack traces or secrets to users.

---

## 21. Validation Workflow After Changes

After implementing a feature:

1. run the relevant formatter/linter;
2. run PHP tests relevant to the change;
3. run frontend checks relevant to the change;
4. build assets if necessary;
5. inspect the resulting code for regressions;
6. manually verify the affected UI when the environment supports it.

Do not claim a feature works merely because the code compiles.

---

## 22. Scope Control

Do not add features that are not required by the current task.

If a feature would require a new dependency, table, or architectural change, explain the reason before making the change when the impact is substantial.

Do not turn a school project into a large enterprise architecture.

---

## 23. Documentation Synchronization

When an implementation changes an intentional product or architectural rule, update the appropriate documentation file.

Examples:

- business workflow change → `prd.md` or `System-design.md`;
- visual rule change → `design.md`;
- architectural change → `architecture.md`;
- schema change → `database-structure.md`;
- agent workflow rule change → `AGENT.md`.

Do not update documentation merely to describe temporary implementation noise.

---

## 24. Change Planning

For any non-trivial task, first provide a short implementation plan in your working response or task notes.

The plan should mention:

- files likely to change;
- relevant business rules;
- relevant skill/documentation to inspect;
- validation steps.

Then implement.

For small obvious fixes, do not waste time producing a huge plan.

---

## 25. Do Not Rewrite Blindly

Never:

- replace an entire directory because one component is wrong;
- regenerate configuration without inspecting current configuration;
- rewrite migrations that have already been used in real environments;
- delete existing functionality because it is not in the MVP without confirmation;
- replace the entire design system because a UI skill generated another style.

Make focused changes.

---

## 26. Security Rules

Protect:

- authentication credentials;
- payment secrets;
- student personal data;
- order data;
- QR pickup tokens;
- file upload endpoints.

Validate uploaded images and files.

Do not expose internal IDs where an opaque reference is more appropriate for a public workflow.

Use authorization checks on every sensitive server action.

---

## 27. Dependency Rules

Before installing a package:

1. check whether Laravel/React already provides the feature;
2. check whether the existing project already includes a solution;
3. inspect compatibility with current versions;
4. inspect the package documentation;
5. avoid redundant packages.

Do not install a package simply because an AI-generated UI tutorial uses it.

---

## 28. Git Rules

Keep commits logically scoped when working in Git.

Do not rewrite unrelated files.

Do not commit:

- `.env` secrets;
- provider secret keys;
- private credentials;
- generated personal data.

When changing a migration/schema significantly, ensure the migration history remains understandable.

---

## 29. AI Behavior Rules

The AI must:

- inspect before modifying;
- verify before assuming;
- prefer official documentation;
- use installed skills when relevant;
- preserve existing working code;
- explain meaningful trade-offs;
- avoid unnecessary complexity;
- validate after implementation.

The AI must not:

- hallucinate commands;
- invent package APIs;
- invent database fields when the document already defines them;
- silently change business rules;
- expose secrets;
- copy visual references 1:1;
- treat generated output as automatically correct.

---

## 30. Skill and Tool Discovery Instruction

When the user says "use the installed skill", "use UI/UX Pro Max", "use Antigravity Awesome Skills", or a similar instruction:

Do not guess the invocation.

Inspect the local skill files and documentation first.

If the skill contains a command registry, workflow, script, or agent instruction, follow it.

If the skill points to a GitHub repository, inspect the relevant official repository documentation when accessible.

If the skill's command is not available in the current environment, report the exact discovery result and use the closest supported workflow only after confirming that it is appropriate.

---

## 31. Stop Conditions

Pause and ask for clarification when:

- a requested change contradicts a major product rule;
- a database migration would destroy historical data;
- payment behavior is ambiguous and would affect money/state;
- two documents intentionally disagree and the difference cannot be resolved safely;
- a required dependency or service is unavailable and there is no safe fallback;
- a change would materially alter the architecture.

Do not pause for trivial uncertainties that can be resolved from the existing code or official documentation.

---

## 32. Definition of Done

A feature is done when:

- the relevant business rule is implemented;
- authorization is enforced server-side;
- validation exists;
- error and empty states are handled;
- UI follows `design.md`;
- mobile behavior is verified;
- relevant tests/checks pass;
- no obvious regression is introduced;
- documentation is updated when a lasting rule changed.

"It renders" is not the definition of done.

---

## 33. Final Working Principle

Before acting, ask:

1. What does the product documentation require?
2. What already exists in the codebase?
3. Which installed skill is relevant?
4. What does that skill's actual documentation say?
5. What is the smallest correct implementation?
6. How will I verify it?

Then act.
