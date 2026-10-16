# CLAUDE.md — Acme Widget Co Basket Assessment

## Mission

Build and deliver a clean, fully working proof of concept for Acme Widget Co's shopping basket. This is a **technical assessment**: prioritize correctness, straightforward architecture, tested business rules, developer experience, and a presentable UI over excessive infrastructure.

**Stack (mandatory):** React + TypeScript frontend, modern PHP backend, a single monorepo managed with **Turborepo**, and **pnpm** for JavaScript workspace management. PHP dependencies must be managed with **Composer**. Publish the completed work to a **public GitHub repository** when GitHub access and authorization are available.

Work autonomously in small, verifiable increments. Before creating code, inspect the repository and existing files. Do not overwrite useful work. Implement the complete solution; do not stop at scaffolding.

## Definition of done

- [ ] A backend basket service is initialized with a product catalogue, delivery rules, and offer rules.
- [ ] It exposes `add(string $productCode)` and `total()` in PHP. `total()` accounts for promotions and shipping.
- [ ] All four assessment examples return their **exact expected totals**.
- [ ] The frontend can add widgets, inspect a basket, see a clear price breakdown, remove/decrement items, and see totals update.
- [ ] Pricing rules are implemented only on the backend; frontend displays server-calculated amounts.
- [ ] API contracts and errors are predictable and documented.
- [ ] Automated PHP unit tests, API integration tests, and React component tests cover happy paths, rounding, thresholds, invalid codes, and boundaries.
- [ ] Formatting, linting, type checking, tests, and build commands pass.
- [ ] Root `README.md` explains setup, architecture, assumptions, commands, examples, and tests.
- [ ] `.env.example`, `.gitignore`, and CI workflow are included; no secrets committed.
- [ ] All work is committed and pushed to a public GitHub repository **only when credentials, remote, and user authorization permit it**. Never claim a push succeeded unless verified.

## Business requirements — source of truth

### Product catalogue

| Product | Code | Price |
|---|---|---:|
| Red Widget | `R01` | $32.95 |
| Green Widget | `G01` | $24.95 |
| Blue Widget | `B01` | $7.95 |

Catalogue must be injectable, not buried in the basket class. Use the listed products as default seed data.

### Delivery rules

Delivery is calculated from the **discounted merchandise subtotal**, before adding delivery fees:

| Discounted subtotal | Delivery |
|---|---:|
| < $50.00 | $4.95 |
| >= $50.00 and < $90.00 | $2.95 |
| >= $90.00 | $0.00 |

At precisely $50.00, delivery is $2.95. At precisely $90.00, delivery is free. Configure these rules independently of the basket. Explain the discounted-subtotal interpretation as an assumption in the README.

### Offer rules

For every **complete pair** of red widgets, one red widget is half price. Examples: 1 red = no discount; 2 reds = 1 half-price; 3 reds = 1 half-price; 4 reds = 2 half-price. Discounts stack across disjoint pairs only. Other products are not discounted.

**Critical rounding decision:** Represent money in integer **cents**, never floating-point dollars. A red widget costs 3295 cents. Half of its price is 1647.5 cents; round the **discount up** to 1648 cents (the discounted second widget costs 1647 cents). This matches the supplied expected outputs. The offer discount for `n` red widgets is `floor(n / 2) * 1648` cents. Make the rounding behavior explicit and test it.

Calculation order:

1. Sum item prices in cents (`subtotalCents`).
2. Calculate applicable offers (`discountCents`).
3. `discountedSubtotalCents = subtotalCents - discountCents`.
4. Resolve shipping using `discountedSubtotalCents` (`deliveryCents`).
5. `totalCents = discountedSubtotalCents + deliveryCents`.

**Never** calculate shipping from the undiscounted subtotal or the final total. Do not independently recalculate discounts or shipping in the frontend.

### Required acceptance examples

| Basket product codes | Expected total | Verification |
|---|---:|---|
| `B01, G01` | $37.85 | 795 + 2495 + 495 = 3785 cents |
| `R01, R01` | $54.37 | 6590 - 1648 + 495 = 5437 cents |
| `R01, G01` | $60.85 | 3295 + 2495 + 295 = 6085 cents |
| `B01, B01, R01, R01, R01` | $98.27 | 1590 + 9885 - 1648 + 0 = 9827 cents |

Build parameterized automated tests for these scenarios and include them in the README. Empty basket total should be $0.00, with **no shipping charge**: document this explicitly as a POC assumption.

## Architecture: deliberately small, modular, testable

Use this structure (adapt only with a clear reason):

```text
.
├── CLAUDE.md
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── .github/
│   └── workflows/ci.yml
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── lib/api.ts
│   │       ├── types/
│   │       └── test/
│   └── api/
│       ├── composer.json
│       ├── composer.lock
│       ├── public/index.php
│       ├── src/
│       │   ├── Domain/
│       │   │   ├── Basket.php
│       │   │   ├── Product.php
│       │   │   ├── Catalogue.php
│       │   │   ├── DeliveryRules.php
│       │   │   ├── OfferInterface.php
│       │   │   ├── RedWidgetHalfPriceOffer.php
│       │   │   └── BasketTotals.php
│       │   └── Http/
│       ├── tests/
│       │   ├── Unit/
│       │   └── Integration/
│       └── phpunit.xml
└── scripts/
    └── (only if necessary)
```

Do **not** create a database, user accounts, authentication, distributed services, Docker orchestration, or unnecessary shared packages for this single-session POC. Keep basket state on the client and submit product codes to the backend for authoritative pricing. This avoids session complexity and makes calculations reproducible. The PHP `Basket` class must still have the required stateful `add()` / `total()` interface internally.

### Suggested backend design

- `Product`: immutable code, display name, and `priceCents`.
- `Catalogue`: injectable product lookup; reject unknown product codes with a typed/domain exception.
- `OfferInterface`: e.g. `discountCents(array $items): int`, allowing additional offers to be plugged in without modifying the basket.
- `RedWidgetHalfPriceOffer`: isolated offer with pair-count logic.
- `DeliveryRules`: configurable ordered thresholds with deterministic rate selection.
- `Basket`: constructor receives `Catalogue`, `DeliveryRules`, and a list of `OfferInterface`; `add(string $code): void`; `total(): int` returns integer cents. Provide a separate `breakdown(): BasketTotals` for UI/API detail. Ensure `total()` delegates to one calculation path shared with `breakdown()`.
- `BasketTotals`: immutable value object with subtotal, discount, discounted subtotal, delivery, and total (all cents). If additional fields are helpful, keep them clear and typed.
- Wiring / composition root creates default products and rules once; business classes remain free of HTTP and framework code.

Prefer `declare(strict_types=1);`, PHP typed properties, constructor property promotion, `readonly` where appropriate, `final` for concrete value classes, narrow public interfaces, and dependency injection. Keep domain code framework-agnostic. Avoid an overengineered rules engine; a small offer interface and delivery calculator suffice.

### Backend API contract

Keep the HTTP interface minimal and stateless:

**`GET /api/products`** — return the three configured products, e.g.

```json
{
  "products": [
    { "code": "R01", "name": "Red Widget", "priceCents": 3295 },
    { "code": "G01", "name": "Green Widget", "priceCents": 2495 },
    { "code": "B01", "name": "Blue Widget", "priceCents": 795 }
  ]
}
```

**`POST /api/basket/quote`** — body:

```json
{ "items": ["R01", "R01", "B01"] }
```

Success response:

```json
{
  "items": [
    { "code": "R01", "name": "Red Widget", "unitPriceCents": 3295, "quantity": 2, "lineSubtotalCents": 6590 },
    { "code": "B01", "name": "Blue Widget", "unitPriceCents": 795, "quantity": 1, "lineSubtotalCents": 795 }
  ],
  "subtotalCents": 7385,
  "discountCents": 1648,
  "discountedSubtotalCents": 5737,
  "deliveryCents": 295,
  "totalCents": 6032
}
```

These example values are illustrative of the API format; ensure implementation and tests calculate the same values. Never take client-provided prices, discount amounts, or delivery amounts as authoritative.

- `Content-Type: application/json` for JSON responses.
- Return HTTP 400 for malformed JSON or invalid payload shape.
- Return HTTP 422 for valid JSON containing unknown product codes or invalid items.
- Return HTTP 404 for unknown routes and 405 for unsupported methods; add `Allow` where appropriate.
- Consistent error shape, e.g. `{ "error": { "code": "INVALID_PRODUCT", "message": "Unknown product code: XYZ" } }`.
- Validate that `items` is a list of product-code strings. Put a sensible cap on item count (e.g. 100) and return 422 on excess; never let untrusted request data reach domain calculations unvalidated.
- Handle `OPTIONS` / CORS for local development if needed. Prefer Vite development proxy to avoid cross-origin configuration. Do not use wildcard CORS unnecessarily.
- Document endpoints and example `curl` calls in the README.

**Framework guidance:** Prefer a tiny PHP HTTP layer (native PHP router/front controller with Composer autoloading) over Laravel for this small assessment. If introducing Slim or another microframework clearly improves maintainability, explain why and keep dependencies minimal. Use PHP's built-in server for local API development; provide a working router command that supports `/api/*` paths.

## Frontend requirements

Build an attractive, responsive single-page basket interface using **React, TypeScript, and Vite**.

- Product cards for red, green, and blue widgets, displaying name, code, and formatted price.
- Clear `Add to basket` buttons and visible quantity/cart feedback.
- Basket panel with quantity increment/decrement and remove interactions.
- Price breakdown showing item subtotal, red-widget savings, discounted subtotal (optional), shipping, and total.
- Make free shipping obvious when applicable; show discount savings when eligible.
- Show loading, empty, and API-error states with a retry option. Disable controls appropriately while processing if needed.
- Mobile-friendly layout, consistent spacing/typography, accessible labels, keyboard support, and visible focus styles.
- No hardcoded frontend calculation of offers or shipping; use backend quotes after every basket change. Prices in the product listing must come from the products endpoint.
- Avoid stale-response races when quote requests overlap (abort older requests or use request sequencing).
- Format integer cents as USD via `Intl.NumberFormat`.

**UI libraries:** Use Tailwind CSS for styling and **Lucide React** for icons if useful. Build components directly rather than adding a heavyweight design-system dependency. A restrained color system, polished empty state, and responsive cards are enough. Do not rely on remotely hosted assets to render the UI.

**State/data:** `useState` and small custom hooks are enough for this app. Use native `fetch` with a typed API module; React Query / Redux / Zustand are unnecessary unless a clear, documented need emerges. Keep product codes typed and API DTOs defined. Prefer derivable quantities over duplicate mutable state.

## Tooling and dependencies

### Root / monorepo

- Node.js current supported LTS (document pinned version in `.nvmrc` or `engines`).
- `pnpm` with a pinned `packageManager` entry and committed lockfile.
- `turbo` as a root development dependency.
- `pnpm-workspace.yaml` includes `apps/*` (and `packages/*` only when actually used).
- Root scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `format`, `check`.
- Turborepo handles JS workspace tasks; **PHP remains a Composer-managed application**. Do not try to install PHP dependencies via pnpm. To orchestrate backend tasks, add an `apps/api/package.json` containing shell script wrappers around `composer` or `php`, with no JavaScript runtime dependencies. Explicitly document that PHP and Composer must be installed locally.
- Make `pnpm dev` reliably launch Vite and PHP's built-in server concurrently via Turbo persistent `dev` tasks. Backend and frontend ports should be documented (suggest API 8000, Vite 5173).
- Avoid assuming shell glob support across environments. Use portable commands where reasonable.

Example Turborepo task shape (adjust to actual package scripts):

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "outputs": [] },
    "lint": { "outputs": [] },
    "typecheck": { "outputs": [] },
    "format": { "outputs": [] }
  }
}
```

Ensure all matching per-app scripts exist and behave sensibly. PHP has no compiled frontend-style `dist` output; its build script can validate PHP syntax or be an intentional no-op with a clear explanation. Root `check` should invoke the relevant lint, typecheck, test, and build tasks in a reliable order.

### Frontend

- React + React DOM
- TypeScript, strict mode enabled
- Vite + `@vitejs/plugin-react`
- Tailwind CSS (choose plugin/config approach compatible with installed version)
- `lucide-react` (optional but preferred for a tasteful UI)
- Vitest + React Testing Library + `@testing-library/jest-dom` + `@testing-library/user-event` + jsdom
- ESLint with TypeScript and React hooks rules
- Prettier, with Tailwind plugin if useful

### Backend

- PHP **8.3+** with compatible, currently supported Composer dependencies
- Composer PSR-4 autoloading, namespace e.g. `Acme\Basket\`
- PHPUnit (install a version compatible with the chosen PHP runtime)
- PHPStan for static analysis (appropriate strictness, ideally level 8+)
- PHP-CS-Fixer or Laravel Pint for consistent formatting (pick **one**, document the choice)
- PSR-12-compatible style and consistent JSON error handling

Use stable compatible dependency versions, commit both JS and Composer lockfiles, and avoid `latest` floating versions. Check installed runtime/package versions before choosing constraints. Do not add runtime frameworks, databases, or tools just to demonstrate familiarity.

## Coding standards and engineering practices

1. **Correctness first:** treat the four supplied totals as immutable acceptance criteria. If a calculation disagrees, fix the implementation, not the expected values.
2. **Use integer cents end to end:** no `float` for prices, discounts, shipping, or totals; no JavaScript monetary arithmetic except converting cents for display.
3. **Single responsibility:** isolate catalogue lookup, discounts, delivery selection, basket aggregation, HTTP serialization, and UI concerns.
4. **Dependency injection and configurability:** products, delivery tiers, and offer list are constructor inputs or injected services. Do not hardcode these into `Basket`.
5. **Keep it simple:** readable classes, explicit names, small functions, few dependencies, limited abstractions, no speculative patterns.
6. **Handle invalid input:** throw or return deliberate domain errors, map them to clear HTTP responses; no silent fallbacks for unknown products.
7. **Type safety:** strict PHP types, typed return values, PHPStan, strict TypeScript, typed fetch responses, no unjustified `any`.
8. **Accessibility:** semantic HTML, usable buttons, text labels, contrast, focus states, and keyboard interactions.
9. **Tests are code:** deterministic fixtures and separate business logic from network/UI; do not rely only on manual clicking.
10. **Documentation:** explain what was done and *why*, with exact commands, environment requirements, pricing rules, and trade-offs.
11. **Git hygiene:** focused commits, no generated dependencies or credentials, run checks before commit/push.
12. **No unrelated features:** checkout/payments, inventory management, user accounts, database persistence, and authentication are out of scope.

## Testing plan (required)

### PHPUnit — domain tests

- Each of the four supplied basket cases, exact integer-cent totals.
- Empty basket => 0 cents and no delivery.
- Each individual SKU and mixed combinations.
- Red widget quantities 1, 2, 3, 4 (pairing behavior).
- Boundary conditions at **exactly 5000 and 9000 discounted cents**; construct targeted test fixtures via injectable catalogue prices or direct delivery-rule tests.
- Values immediately below thresholds (4999, 8999 cents).
- Shipping threshold based on discounted, not undiscounted, subtotal (two reds is the critical example).
- Unknown product code and invalid business configuration (if validated).
- Non-mutating `total()`, repeatability, and offer calculation independent of product ordering.
- Addition of a second offer implementation can be tested without changing `Basket`.

### HTTP/API integration tests

- Product catalogue endpoint response.
- Basket quote success, exact JSON breakdown and content type.
- Invalid JSON, missing `items`, wrong array item type, unknown code, oversized basket.
- Unknown route and unsupported method.
- Do not require a production server or external services for unit tests; use an in-process router/test harness or a controlled local server for integration tests.

### Frontend tests

- Product list and formatted prices render from API data.
- Clicking Add updates basket and quote output.
- Increment, decrement, remove, and empty states.
- Discount, free delivery, and loading/error messaging.
- Ignore/abort stale quote responses when basket changes rapidly.

### Validation commands

Set up and document commands such as:

```bash
pnpm install
cd apps/api && composer install && cd ../..
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

Make the scripts real and working; do not leave placeholders. Verify PHP formatter/static analysis as part of backend checks. Add GitHub Actions CI that installs Node/pnpm and PHP/Composer, restores reasonable caches, and runs the relevant checks. CI must not need secrets.

## README requirements

The root `README.md` must include:

1. Project summary and tech stack, noting Turborepo orchestrates a pnpm + Composer monorepo.
2. Requirements (Node, pnpm, PHP, Composer) and exact minimum versions.
3. Clone/setup/start steps and frontend/backend local URLs.
4. How to run tests, lint, typecheck, formatter, and build.
5. Backend API endpoints with `curl` request/response examples.
6. Basket class initialization with catalogue, delivery rules, and offers, and a brief PHP code example demonstrating `add()` and `total()`.
7. All four provided acceptance cases and exact totals.
8. Explanation of cents, red-widget rounding, offer application order, discounted-subtotal shipping thresholds, and empty-cart shipping assumption.
9. Architectural decisions and limitations (stateless quotes, in-memory frontend basket, no persistence).
10. Repository structure and optional screenshots if available.

## Milestones — small, reviewable Git commits (required)

Treat **Git history as an assessment deliverable**. Implement the project in the sequence below, making **one focused commit at each completed milestone**. These milestones are intended to show the reasoning and evolution of the solution: foundation → tested domain model → HTTP API → working UI → polish and delivery. Do not build everything first and retroactively fabricate history.

Before beginning, inspect `git status`, recent history, and the current tree. Preserve existing commits and work; if the repository is not initialized, initialize it. For each milestone:

1. Implement only that milestone's scope and any small prerequisite necessary to make it work.
2. Run the milestone's relevant checks and fix failures before committing. Record any existing unrelated failures honestly.
3. Review `git diff` / `git status`; stage **only** the intended files using explicit paths where practical (`git add <paths>`). Never commit secrets, installed dependencies, generated build outputs, or unrelated changes.
4. Create a commit with the **suggested Conventional Commit message** (or a more precise equivalent), then verify a clean status for the files you own. Do not use empty commits to satisfy a milestone.
5. Move to the next milestone only when the present milestone is functional and reviewable. If two tiny milestones cannot reasonably be separated, combine them and explain why in the final handoff; do not split cohesive changes artificially.

| # | Milestone and scope | Acceptance checkpoint before commit | Suggested commit message |
|---|---|---|---|
| 01 | **Repository foundation:** initialize Git if needed; add root pnpm workspace, Turbo config, pinned Node/pnpm versions, root scripts, `.gitignore`, and minimal `README.md`. | Workspace configuration parses; no dependency folders or secrets staged. | `chore: initialize turborepo monorepo` |
| 02 | **Application scaffolds:** create Vite/React/TypeScript frontend and Composer/PHP backend with PSR-4 autoloading; wire reproducible local `dev` commands and proxy. | Frontend renders; PHP health/root route responds; `pnpm dev` starts both apps. | `chore: scaffold react and php applications` |
| 03 | **Product catalogue and money model:** immutable Product, injectable Catalogue, integer-cent representations, sensible validation and domain exceptions. | PHPUnit tests prove catalogue lookup, prices, and unknown-code behavior. | `feat(api): add product catalogue and money primitives` |
| 04 | **Offers and delivery rules:** injectable shipping tiers, `OfferInterface`, red-widget half-price offer, consistent half-cent rounding. | PHPUnit tests cover pairs, odd counts, exact 5000/9000 thresholds and immediately-below cases. | `feat(api): implement offers and delivery rules` |
| 05 | **Basket domain and acceptance tests:** add Basket and BasketTotals, `add()` and `total()`, shared breakdown calculation. | All four given totals match **exactly**; empty basket and ordering/aggregation edge cases pass. | `feat(api): implement basket pricing and totals` |
| 06 | **Public API endpoints:** products and stateless quote endpoints, composition root, JSON DTOs, input validation and consistent HTTP errors. | API integration tests pass for success, invalid payloads, unknown codes, 404 and 405; verify with `curl` if possible. | `feat(api): expose catalogue and basket quote endpoints` |
| 07 | **Frontend API integration:** typed DTOs, API client, product loading, basket state, server-authoritative quote updates, and stale-request protection. | Basic add flow fetches a server quote; loading/error states work; no frontend pricing duplication. | `feat(web): connect catalogue and basket quote api` |
| 08 | **Basket interactions:** product grid, add/increment/decrement/remove, item quantities, empty states, subtotal/discount/shipping/total breakdown. | User can complete all four example baskets using the UI; amounts match API totals. | `feat(web): build interactive shopping basket` |
| 09 | **UI presentation and accessibility:** responsive layout, consistent styling, clear savings/free-shipping messaging, focus/keyboard and mobile usability. | Check narrow and wide layouts, readable labels, focus states and all interaction states. | `style(web): polish responsive basket experience` |
| 10 | **Frontend tests and quality gates:** Vitest/React Testing Library coverage including loading/errors, quantities, and stale quotes; ESLint, TS checks, PHPStan and formatter wiring. | `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass locally. | `test: cover basket ui and enforce quality checks` |
| 11 | **CI automation:** GitHub Actions for pnpm and Composer dependency install, static checks, tests, and builds; ensure lockfiles are committed. | Workflow is valid and runs checks without secrets; if GitHub unavailable, validate configuration locally and mark remote CI as unverified. | `ci: add monorepo validation workflow` |
| 12 | **Documentation and final verification:** complete README setup, API examples, assumptions, architecture, exact totals, and contribution/evaluation notes; tidy project. | `pnpm check` succeeds; run/review acceptance tests, inspect diff and `git log --oneline`, confirm reproducible start. | `docs: complete setup and assessment handoff` |

**Milestone discipline:**

- Each commit should leave the codebase in a coherent state. Tests relevant to newly added behavior should be committed **with** that behavior, not postponed to one catch-all testing commit. Milestone 10 expands the frontend regression suite and adds any missing cross-project checks.
- Keep commit subjects in imperative form and preferably under 72 characters. Use `feat`, `fix`, `test`, `docs`, `chore`, `style`, or `ci` appropriately. If a bug is found later, make a separate focused `fix:` commit instead of rewriting unrelated history.
- Prefer a sequence of **approximately 10–12 meaningful commits** over dozens of cosmetic commits or one monolithic submission. The table is a plan, not permission to create misleading empty or artificial commits.
- Never use `git commit --amend`, `git rebase`, force push, or reset to rewrite existing/shared history unless explicitly asked. Do not automatically commit changes that predate this task.
- Do **not** create or push a public repository until user authorization and GitHub access are established. If publishing is authorized, push the existing milestone commits without squashing them; verify the remote repository and preserve the history.
- In the final report, show the actual chronological `git log --oneline` and the validation status. If any milestone was merged, skipped, blocked, or not committed, explain it transparently. Do not invent commit hashes, passing CI results, or a GitHub URL.

## Implementation order for Claude Code

### Phase 1 — inspect and scaffold

- Inspect the repository, tool/runtime availability, and Git status.
- Choose compatible tool versions; create pnpm/Turbo and Composer manifests with lockfiles.
- Set up the workspace scripts, `.gitignore`, environment example, PHP autoloading, TS/Vite setup.

### Phase 2 — pricing domain (highest priority)

- Build Product, Catalogue, OfferInterface, RedWidgetHalfPriceOffer, DeliveryRules, BasketTotals, and Basket.
- Write and run PHPUnit tests, starting with all four acceptance totals and the half-cent rounding rule.
- Do not move on until the pricing examples pass.

### Phase 3 — API

- Implement GET products and POST basket quote, input validation, response serialization, status codes, and API integration tests.
- Verify routes with actual `curl` calls when possible.

### Phase 4 — UI

- Build responsive product cards, basket controls, a totals panel, and meaningful empty/loading/error states.
- Wire typed API requests and stale-request handling.
- Add React component tests.

### Phase 5 — polish, docs, delivery

- Finish README, `.env.example`, `.gitignore`, and CI.
- Run formatter, lint, static analysis, unit/integration/component tests, and production build; fix failures.
- Review resulting diff for secrets, accidental generated files, and complexity.
- Review the milestone commits created throughout implementation using `git log --oneline`; commit only remaining documentation or cleanup changes under the relevant milestone. Do not squash the milestone history.
- If the GitHub CLI is authenticated and repository publishing is authorized, create/push a **public** repo and verify its URL; otherwise provide exact manual GitHub publishing commands and clearly report that push was not performed.

## Collaboration instructions for Claude Code

- Implement rather than merely describe. Follow the **Milestones** section and create a verified, focused Git commit after each meaningful milestone; provide a concise progress summary after each one.
- When there is ambiguity, favor the simplest behavior consistent with the sample totals and document assumptions. Do not change assessment expectations to fit the code.
- Use the repository's tools to inspect/edit/run/check work. Do not state that tests or GitHub publishing succeeded without execution evidence.
- Before completion, report: files/major modules implemented; check results; all four verified totals; how to run locally; GitHub repo URL **if actually published**; and any genuine limitations.
- Never commit credentials, tokens, `.env` secrets, `node_modules`, `vendor`, build artifacts, or coverage output.

## Out of scope

Actual purchasing or payment processing, account management, external databases, stock tracking, authorization, background jobs, elaborate infrastructure, container orchestration, end-to-end deployment, and hypothetical future promotional complexity. Maintain extensibility without overbuilding.
