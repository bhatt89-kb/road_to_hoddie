# Eventoria Project Changelog

All notable changes and phase transitions are recorded here.

---

## [Phase 0] — Foundation & Setup
**Date:** 2026-10-21  
**Status:** Completed

### Built
- Initialized Next.js 15+ (App Router) project with TypeScript strict mode, ESLint, and Vanilla CSS (no Tailwind).
- Configured security headers in `next.config.ts`: CSP, HSTS, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, and Permissions-Policy.
- Created `globals.css` with a complete design system tokens (light/dark mode, warm celebratory amber palette, spacing scale, accessible focus rings, reduced motion support, print styles).
- Configured Vitest test runner (`vitest.config.ts`, `vitest.setup.ts`, `@testing-library/react`, `jsdom`).
- Created `.env.example` with Gemini configuration placeholders (`GEMINI_API_KEY`, `GEMINI_MODEL_COMPLEX`, `GEMINI_MODEL_SIMPLE`).
- Configured `.gitignore` to track `.env.example` while ignoring secrets.
- Installed core production dependencies: `zod`, `@google/genai`.

### Files Touched
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `vitest.config.ts`
- `vitest.setup.ts`
- `app/globals.css`
- `.env.example`
- `.gitignore`
- `CHANGELOG.md`

### Decisions
- Pure Vanilla CSS design tokens with `data-theme="dark"` attribute for zero runtime CSS overhead and full theme flexibility.
- Used Vitest for lightning fast unit testing of pure functions and UI components.
- Enforced TypeScript strict mode with no implicit any.

### Next Step
- Phase 1: Core Lib Modules & Type System.

---

## [Phase 1] — Lib Modules & Type System
**Date:** 2026-10-21  
**Status:** Completed

### Built
- Domain types in `types/event.ts`: `EventType`, `EventPlanRequest`, `EventPlan`, `BudgetItem`, `TimelineItem`, `VendorChecklistItem`, `PersonalizedIdea`, `ChatMessage`, `ClassificationResult`, `RateLimitResult`, `ApiErrorResponse`.
- Constants in `lib/constants.ts`: `EVENT_TYPES`, `REQUIRED_CATEGORIES` per event type (wedding, birthday, community), default models, limits, and rate limit quotas.
- Currency & Date formatters in `lib/format.ts`: `formatCurrencyINR` (en-IN grouping), `formatPercentage`, `formatDate`, `calculateDateBefore`.
- Zod validation schemas in `lib/validators.ts`: strict input schemas for plan, chat, ask, and output schemas for AI results.
- Deterministic event & query classifier in `lib/classifier.ts`: two-tier model routing (`gemini-2.5-flash` for complex, `gemini-2.5-flash-lite` for simple), token estimation, and category detection.
- Hierarchical input chunker in `lib/chunker.ts`: splits across paragraphs, sentences, and words to fit token limits gracefully.
- Sliding window rate limiter in `lib/rate-limiter.ts`: per-IP in-memory tracking with standard headers (`X-RateLimit-*`, `Retry-After`) and automatic garbage collection.
- Versioned prompt templates in `lib/prompt-templates.ts`: explicit prohibitions against fake vendor names/numbers, required category enforcement.
- Security guardrails in `lib/guardrails.ts`: input sanitization, control char stripping, XML delimiter wrapping, scope verification, and output cleansing.
- Google GenAI SDK wrapper in `lib/gemini.ts`: server-only, structured output with fallback plan generation for offline/resilient execution, retry logic, and streaming chat generator.
- 66 Vitest unit tests across 9 test suites covering 100% of the `lib/` modules.

### Files Touched
- `types/event.ts`
- `lib/constants.ts`
- `lib/format.ts`
- `lib/validators.ts`
- `lib/classifier.ts`
- `lib/chunker.ts`
- `lib/rate-limiter.ts`
- `lib/prompt-templates.ts`
- `lib/guardrails.ts`
- `lib/gemini.ts`
- `__tests__/lib/format.test.ts`
- `__tests__/lib/validators.test.ts`
- `__tests__/lib/classifier.test.ts`
- `__tests__/lib/chunker.test.ts`
- `__tests__/lib/rate-limiter.test.ts`
- `__tests__/lib/prompt-templates.test.ts`
- `__tests__/lib/guardrails.test.ts`
- `__tests__/lib/gemini.test.ts`
- `CHANGELOG.md`

### Decisions
- Adopted strict Zod `.strict()` schemas to reject unexpected fields and mitigate parameter tampering.
- Implemented deterministic fallback generator in `lib/gemini.ts` to ensure development, offline testing, and graceful degradation when API keys or network are unavailable.
- Pure function deterministic classifier to choose model tiers without adding extra LLM latency or cost.

### Next Step
- Phase 2: Next.js API Routes.

---

## [Phase 2] — API Routes
**Date:** 2026-10-21  
**Status:** Completed

### Built
- `POST /api/plan`: Full plan generation endpoint. Validates input with Zod, checks sliding-window rate limit, classifies complexity, executes plan generation via Gemini with resilient fallback, returns structured JSON and rate limit headers.
- `POST /api/chat`: Real-time Server-Sent Events (SSE) streaming chat endpoint. Validates history, performs domain scope check, streams token chunks (`data: {"text": "..."}\n\n`) and terminates cleanly with `data: [DONE]\n\n`.
- `POST /api/ask`: Fast non-streaming quick advice endpoint routed through `gemini-2.5-flash-lite`.
- `GET /api/usage`: Rate limit status check endpoint for UI widgets.
- API route test suites: `__tests__/api/plan.test.ts`, `__tests__/api/chat.test.ts`, `__tests__/api/ask.test.ts`, `__tests__/api/usage.test.ts` (all 74 tests passing across 13 test files).

### Files Touched
- `app/api/plan/route.ts`
- `app/api/chat/route.ts`
- `app/api/ask/route.ts`
- `app/api/usage/route.ts`
- `__tests__/api/plan.test.ts`
- `__tests__/api/chat.test.ts`
- `__tests__/api/ask.test.ts`
- `__tests__/api/usage.test.ts`
- `CHANGELOG.md`

### Next Step
- Phase 3: UI Shell, Primitives & Landing Page.

---

## [Phase 3] — UI Shell, Primitives & Landing Page
**Date:** 2026-10-21  
**Status:** Completed

### Built
- UI Component Primitives in `components/ui/` with scoped CSS modules:
  - `Button.tsx` (primary, secondary, outline, ghost, danger, sizes sm/md/lg, fullWidth, loading spinner).
  - `Spinner.tsx` (accessible loading indicator with size variants and `role="status"`).
  - `Card.tsx` (glassmorphism support, hover lift effects, header/footer slots).
  - `Badge.tsx` (color variants: amber, emerald, rose, sky, gray).
  - `Tabs.tsx` (full W3C ARIA tab pattern, `role="tablist"`, keyboard arrow navigation Left/Right/Home/End).
  - `SkipLink.tsx` (accessible keyboard skip link pointing to `#main-content`).
  - `ThemeToggle.tsx` (dark/light theme toggle, zero hydration flash, `useSyncExternalStore` for React 19).
  - `UsageWidget.tsx` (live quota indicator showing "—" during load and real numbers once loaded).
- Layout Shell:
  - `components/layout/Header.tsx` (responsive nav, brand icon, theme toggle, usage widget, CTA).
  - `components/layout/Footer.tsx` (disclaimer banner, legal notice, navigation links).
  - `app/layout.tsx` (SEO metadata, theme color, OpenGraph tags, semantic landmark structure).
- Landing Page in `app/page.tsx`:
  - Celebratory hero with amber radial glow, single `<h1>`, clear CTA buttons.
  - Three event type cards (Wedding, Birthday, Community).
  - Four pillars section matching challenge requirements (INR Budget, Backward Timeline, Vendor Checklists, Personalized Ideas).
  - Bottom call-to-action banner.
- React Testing Library component tests in `__tests__/components/ui.test.tsx`.
- Total test count: 80 tests passing across 14 test files.

### Files Touched
- `components/ui/Button.tsx` + `Button.module.css`
- `components/ui/Spinner.tsx` + `Spinner.module.css`
- `components/ui/Card.tsx` + `Card.module.css`
- `components/ui/Badge.tsx` + `Badge.module.css`
- `components/ui/Tabs.tsx` + `Tabs.module.css`
- `components/ui/SkipLink.tsx` + `SkipLink.module.css`
- `components/ui/ThemeToggle.tsx` + `ThemeToggle.module.css`
- `components/ui/UsageWidget.tsx` + `UsageWidget.module.css`
- `components/layout/Header.tsx` + `Header.module.css`
- `components/layout/Footer.tsx` + `Footer.module.css`
- `hooks/useTheme.ts`
- `app/layout.tsx`
- `app/page.tsx` + `page.module.css`
- `__tests__/components/ui.test.tsx`
- `CHANGELOG.md`

### Next Step
- Phase 4: Plan Form + Results View.

---

## [Phase 4] — Plan Form + Results View
**Date:** 2026-10-21  
**Status:** Completed

### Built
- State management hooks:
  - `hooks/useLocalStorage.ts`: Type-safe localStorage hook with React 19 lazy state initializer, SSR safety, and quota error resilience.
  - `hooks/useEventPlanner.ts`: State machine orchestrating plan creation, dynamic budget line item cost edits with live total recalculation, task status cycling (`todo` -> `in-progress` -> `done`), vendor booking status cycling (`not-started` -> `shortlisted` -> `booked`), and localStorage persistence.
- Planning components in `components/planner/`:
  - `EventPlanForm.tsx`: Multi-section wizard with event type selector (wedding, birthday, community), scale & budget inputs with live formatted INR previews, destination city suggestions, custom vision textarea, preference tag cloud, and 1-click demonstration presets.
  - `PlanResults.tsx`: Results container orchestrating summary cards, quick stats, action bar (Export JSON, Print/PDF, Chat jump, New Plan, and Delete My Data).
  - `BudgetTab.tsx`: Category breakdown with visual progress bars, overspend detection alerts, dynamic editable cost inputs, and expandable category saving tips.
  - `TimelineTab.tsx`: Milestone schedules grouped by chronological phase, priority badges, days-before countdowns, and interactive completion checkboxes.
  - `VendorsTab.tsx`: Categorized vendor checklists with priority tiers, booking status cycle button, scopes to book, contract check items, and vendor interview questions.
  - `IdeasTab.tsx`: Filterable creative concepts categorized by DIY (budget), Standard, and Premium tiers with estimated costs.
- Planner route in `app/planner/page.tsx` with query parameter pre-selection (`?type=wedding`) wrapped in React `Suspense`.
- Testing suite expanded to 86 tests passing across 15 test files (`__tests__/components/planner.test.tsx`).

### Files Touched
- `hooks/useLocalStorage.ts`
- `hooks/useEventPlanner.ts`
- `components/planner/EventPlanForm.tsx` + `EventPlanForm.module.css`
- `components/planner/PlanResults.tsx` + `PlanResults.module.css`
- `components/planner/BudgetTab.tsx` + `BudgetTab.module.css`
- `components/planner/TimelineTab.tsx` + `TimelineTab.module.css`
- `components/planner/VendorsTab.tsx` + `VendorsTab.module.css`
- `components/planner/IdeasTab.tsx` + `IdeasTab.module.css`
- `app/planner/page.tsx`
- `__tests__/components/planner.test.tsx`
- `CHANGELOG.md`

### Next Step
- Phase 5: Streaming Chat Assistant.

---

## [Phase 5] — Streaming Chat Assistant
**Date:** 2026-10-21  
**Status:** Completed

### Built
- `hooks/useStreamingChat.ts`:
  - Real-time Server-Sent Events (SSE) stream consumer from `POST /api/chat`.
  - Incremental token accumulation into local message state.
  - Non-streaming fast-path fallback via `POST /api/ask`.
  - Abort stream control with `AbortController`.
  - Persistent message history in localStorage with pure static initialization complying with React 19 rules.
- `components/planner/ChatInterface.tsx` + `ChatInterface.module.css`:
  - Active event context banner displaying current event type, guest count, city, and budget context.
  - Responsive conversation bubbles with distinct user styling and assistant card styling.
  - Model tier metadata tags indicating whether Gemini Flash or Flash-Lite processed the response.
  - Live typing indicator for tokens in transit.
  - Quick starter prompt chips for instant assistance.
  - Mode toggle: Deep Streaming vs Quick Ask.
  - Stop button to cancel active streaming immediately.
  - Accessible `aria-live="polite"` log container.
- Dedicated chat page at `app/chat/page.tsx` with automatic event context linking from saved plans.
- Vitest + RTL component tests in `__tests__/components/chat.test.tsx` (all 90 tests passing).

### Files Touched
- `hooks/useStreamingChat.ts`
- `components/planner/ChatInterface.tsx` + `ChatInterface.module.css`
- `app/chat/page.tsx`
- `vitest.setup.ts`
- `__tests__/components/chat.test.tsx`
- `CHANGELOG.md`

### Next Step
- Phase 6: Export, Accessibility & Polish.

---

## [Phase 6] — Export, Accessibility & Polish
**Date:** 2026-10-21  
**Status:** Completed

### Built
- Export features:
  - JSON plan export (`eventoria-plan-<eventType>-<timestamp>.json`) containing the full structured plan data.
  - Dedicated print stylesheet (`@media print`) stripping chrome, navigation, skip links, and interactive buttons, ensuring page-break-inside avoidance on cards and high contrast output for print-to-PDF.
  - Data privacy: "Delete My Data" confirmation dialog that resets the client state and purges local storage.
- Accessibility & WCAG 2.2 AA enhancements:
  - Validated contrast ratios (>4.5:1 for body copy and >3:1 for large display headers).
  - ARIA landmark structure with `<header>`, `<nav>`, `<main id="main-content">`, and `<footer role="contentinfo">`.
  - Accessible focus indicator styles using `--focus-ring`.
  - Reduced motion override (`prefers-reduced-motion: reduce`) collapsing animations to 0.01ms.
- 90 Vitest & React Testing Library tests passing cleanly across 16 test suites.

### Files Touched
- `app/globals.css`
- `components/planner/PlanResults.tsx`
- `CHANGELOG.md`

### Next Step
- Phase 7: Testing + Hardening + Comprehensive Documentation.

---

## [Phase 7] — Testing, Hardening & Documentation
**Date:** 2026-10-21  
**Status:** Completed

### Built
- Integration journey test in `__tests__/integration/planner-journey.test.tsx` verifying the complete lifecycle:
  - Form loading with presets.
  - Multi-category plan generation.
  - Tab navigation across Budget, Timeline, Vendors, and Ideas.
  - Dynamic budget recalculation and status cycling.
  - LocalStorage persistence across simulated reloads.
  - User-driven data erasure ("Delete My Data").
- Comprehensive, polished `README.md` containing:
  - Problem statement traceability matrix.
  - High-level architecture diagram and data flow.
  - Two-tier Gemini model selection rationale (`gemini-2.5-flash` vs `gemini-2.5-flash-lite`).
  - Security, rate limiting, and prompt injection defense.
  - WCAG 2.2 AA accessibility specifications.
  - Step-by-step local installation and environment setup.
  - 3-Minute walkthrough demonstration script for judges and evaluators.
- Test suite verification: 91 tests passing across 17 test suites with 0 failures, 0 lint warnings, and clean TypeScript strict compilation.

### Files Touched
- `__tests__/integration/planner-journey.test.tsx`
- `README.md`
- `CHANGELOG.md`

### Next Step
- Phase 8: Production Readiness Verification & Final Sanity Check.

---

## [Phase 8] — Production Readiness & Final Sanity Check
**Date:** 2026-10-21  
**Status:** Completed & Ready for Submission

### Verification
- Production build (`npm run build`) compiles cleanly in ~700ms with Turbopack, static page generation (10/10 routes prerendered), and dynamic API route handlers.
- TypeScript strict verification (`npm run type-check`) passed with 0 errors across all types, interfaces, components, and tests.
- ESLint verification (`npm run lint`) passed with 0 errors and 0 warnings.
- Test suite (`npm test`) passed with 91/91 tests green across 17 test suites (unit, API, UI component, and end-to-end user journey tests).
- All security headers, content security policy, and rate limits verified.
- Complete documentation in `README.md` and `PLAN.md`.








