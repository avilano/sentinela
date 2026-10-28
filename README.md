# 🛡️ Sentinela (PulseQA) — AI-Augmented Quality Platform & Risk Engine

A developer-facing **Playwright + TypeScript Quality Platform**, **Changed-File Risk Engine**, and **Autonomous AI Failure Triage Agent** built around **[Practice Software Testing (Testsmith Toolshop v5)](https://github.com/testsmith-io/practice-software-testing)** and extended with **Stripe Payment Webhooks** & **Creator Community** workflows.

---

## 🏗️ Architecture Overview

```
                    ┌────────────────────────────────────────┐
                    │          Pull Request / Commit         │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │   Risk Engine (scripts/risk-engine.ts) │
                    │   Maps git diff -> @smoke, @pay, @a11y │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │    Playwright Test Runner (Sharded)    │
                    │  • <50ms API Auth & storageState seed  │
                    │  • Toolshop E2E + Community Feed specs │
                    │  • Signed Stripe Webhook verification  │
                    │  • axe-core WCAG 2.1 AA Quality Gate   │
                    └───────────────────┬────────────────────┘
                                        │ (on failure / chaos injection)
                                        ▼
                    ┌────────────────────────────────────────┐
                    │    AI Triage & Root-Cause Reporter     │
                    │  Ingests: Locator, Stack, Network, Diff│
                    │  Outputs: APP_BUG | SELECTOR_DRIFT |   │
                    │           FLAKY_RACE_CONDITION | A11Y  │
                    └───────────────────┬────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────┐
                    │   Automated GitHub PR Triage Summary   │
                    │   Markdown table + 1-click repro cmd   │
                    └────────────────────────────────────────┘
```

---

## ✨ Key Engineering Capabilities

1. **Multi-Environment Target Engine (`src/config/env.ts`)**
   - **`local-sandbox` (Default):** Automatically boots a fast, self-contained Toolshop v5 + Stripe Webhook + Community server (`src/sandbox/server.ts`) in `<500ms` so local runs and GitHub Actions pass immediately with zero external flakiness.
   - **`docker`:** Full `docker-compose.yml` for spinning up the official `testsmith/practice-software-testing` MySQL + API + Angular stack locally (`npm run docker:up && npm run test:docker`).
   - **`live` & `live-buggy`:** Point tests directly at `https://practicesoftwaretesting.com` or `https://with-bugs.practicesoftwaretesting.com`.

2. **Speed & Reliability via Custom Fixtures (`src/fixtures/base.fixture.ts`)**
   - **API Session Pre-Conditioning (`tests/auth.setup.ts`):** Authenticates against `POST /users/login` via API and injects `auth-token` into `.auth/customer.json` across Chromium and Mobile Safari (`iPhone 14`).
   - **Signed Stripe Webhook Simulator (`sendStripeWebhook`):** Validates HMAC-SHA256 `Stripe-Signature` headers on `customer.subscription.created` events and verifies negative security cases (HTTP 400 on tampered signatures).
   - **Automated Accessibility Gating (`checkA11y`):** Runs `@axe-core/playwright` WCAG 2.1 AA audits on interactive views and fails only on `critical` or `serious` violations.

3. **Autonomous AI Triage Engine & Chaos Injection (`src/reporters/ai-triage-reporter.ts`)**
   - Hooks into Playwright failures, attaches recent API status codes (`network-log.json`), and queries **Google Gemini (`GEMINI_API_KEY`)** or **OpenAI (`OPENAI_API_KEY`)** (with a built-in deterministic heuristic fallback when keys are omitted).
   - Includes built-in **Chaos Mode (`CHAOS_MODE`)** toggles so reviewers can trigger and inspect the AI Triage report on demand.

---

## 🚀 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (Chromium & WebKit for Mobile Safari emulation)
npx playwright install chromium webkit

# 3. Run the full E2E + API + A11y suite (auto-starts local sandbox)
npm test
```

---

## 🧪 Running Targeted Suites & Chaos Demos

```bash
# Run Risk Engine (analyzes git diff and selects @smoke, @pay, @a11y, @api)
npm run test:risk

# Simulate a PR modifying payment files and run only matching risk-tagged tests
npx tsx scripts/risk-engine.ts --files=src/payment/stripe.ts --run

# 🔥 Demo 1: Inject an upstream HTTP 500 Payment Gateway Bug & inspect AI Triage Report
npm run test:chaos:api500
npm run triage:preview

# 🔥 Demo 2: Inject a UI Selector Drift (broken data-test locator) & inspect AI Triage Report
npm run test:chaos:drift
npm run triage:preview

# 🐳 Run against the official Testsmith Docker Compose stack
npm run docker:up
npm run test:docker
```

---

## 📂 Repository Structure

```text
sentinela/
├── .github/workflows/
│   └── e2e-ci.yml                  # Sharded CI pipeline + Risk Engine + PR Triage Commenter
├── docs/decisions/                 # Architecture Decision Records (ADRs)
├── scripts/
│   ├── risk-engine.ts              # Git diff analyzer -> Playwright tag selector
│   └── post-pr-triage.ts           # Posts triage-comment.md to GitHub Pull Requests
├── src/
│   ├── config/env.ts               # Multi-environment switcher (local-sandbox, docker, live)
│   ├── fixtures/base.fixture.ts    # authedApi, checkA11y, sendStripeWebhook & Chaos hooks
│   ├── pages/toolshop.page.ts      # Resilient Page Object Model using data-test locators
│   ├── reporters/ai-triage-reporter.ts # LLM + Heuristic Root-Cause Triage Reporter
│   └── sandbox/server.ts           # Fast local Toolshop v5 + Stripe Webhook replica
├── tests/
│   ├── auth.setup.ts               # <50ms API login & storageState generator
│   ├── catalog-search.spec.ts      # Product catalog, search, sort & WCAG 2.1 AA checks
│   ├── checkout-payment.spec.ts    # Multi-step checkout + signed Stripe webhook validation
│   └── community-feed.spec.ts      # Creator Community feed publishing & a11y checks
├── docker-compose.yml              # Official Testsmith Toolshop MySQL + API + Web stack
└── playwright.config.ts
```
