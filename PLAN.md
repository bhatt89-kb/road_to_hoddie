# PLAN.md — Eventoria: GenAI Celebration & Event Planner

> **Challenge:** Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with **budgets, timelines, vendor checklists, and personalized ideas**.
>
> **Scored on:** Code Quality · Security · Efficiency · Testing · Accessibility · Problem Statement Alignment
>
> **Stack:** Next.js 15 · TypeScript (strict) · Vanilla CSS · Gemini API · Deployed on **Vercel**

---

## 0. Agent Instructions

1. Read this entire file before writing any code.
2. Build **phase by phase** (Section 12). Do not start a phase until the previous phase's gate passes.
3. Maintain `CHANGELOG.md` at the repo root — after every phase, append: what was built, files touched, decisions made, gaps, next step.
4. Never invent facts. Do not claim a score, coverage figure, or Lighthouse number unless CI actually produced it.
5. Every feature must trace to the problem statement (Section 1). If it does not, cut it.
6. Prefer small, boring, well-tested code over clever code.

---

## 1. Problem Statement Alignment

### 1.1 Requirement → Feature Traceability

| Problem Statement Phrase | Feature | API Route | UI Location |
|---|---|---|---|
| "GenAI-powered planning assistant" | Context-aware AI chat that knows the event and can answer planning questions | `POST /api/chat` (SSE) · `POST /api/ask` | Assistant panel |
| "weddings, birthdays, community events" | Event-type-aware form with type-specific templates and prompts | `POST /api/plan` | Plan form |
| "budgets" | AI-generated budget allocation with category breakdown, editable amounts, overspend warnings | Part of `/api/plan` response | Budget tab |
| "timelines" | Backward-planned task schedule from event date, grouped by phase, status tracking | Part of `/api/plan` response | Timeline tab |
| "vendor checklists" | Per-category vendor checklist: what to book, questions to ask, booking status | Part of `/api/plan` response | Vendors tab |
| "personalized ideas" | Themes, decor, menu, activities, gifts tailored to guest profile, culture, budget | Part of `/api/plan` response | Ideas tab |
| "GenAI-powered" (used well) | Structured JSON output + SSE streaming + two-tier model routing + input chunking | `lib/gemini.ts` · `lib/classifier.ts` | Model tier label |

### 1.2 Personas

- **Wedding planner-by-family**: large budget, many vendors, cultural customs, multi-day.
- **Parent planning a birthday**: small budget, short timeline, wants themes and activity ideas fast.
- **Community organizer**: tight budget, volunteers, permits, safety, sponsors.

### 1.3 Scope Boundaries

**In scope (must be polished):**
- Event plan form (wizard) → AI generates budget + timeline + vendors + ideas in one call
- Tabbed results (ARIA tab pattern) with editable/trackable items
- Streaming chat assistant + non-streaming quick-ask
- Export (JSON download, print/PDF via CSS)
- Delete my data (clear localStorage)
- Rate limiting with usage indicator
- Dark/light theme

**Out of scope:**
- User accounts/login (anonymous, localStorage-based)
- Real vendor marketplace, live pricing, booking integrations
- Database/backend persistence (all data in localStorage — stateless deployment)
- The assistant **must not invent vendor names, phone numbers, or exact prices**

### 1.4 Assumptions

1. **Anonymous sessions.** No accounts; data lives in localStorage and can be cleared.
2. **Currency.** INR with Indian digit grouping by default (`en-IN`). Amounts are estimates.
3. **Language.** English for MVP.
4. **Gemini availability.** If API is down, show a graceful error with retry.
5. **Timing advice.** Booking lead times are general best practice, not live availability.

---

## 2. Scoring Factors → Acceptance Gates

| Factor | What Judges Look For | Our Gate |
|---|---|---|
| **Code Quality** | Structure, typing, readability, lint-clean | TS `strict`, zero `any`, ESLint + Prettier clean, well-structured `lib/` modules, small focused functions, JSDoc on exports |
| **Security** | Secrets, validation, headers, abuse resistance | Gemini key server-only (env var), Zod validation on all inputs/outputs, rate limiting, CSP + security headers in `next.config.ts`, no `dangerouslySetInnerHTML` |
| **Efficiency** | Bundle size, latency, no waste | Route-level dynamic imports, optimized package imports, streaming for long responses, smart input chunking, compressed output |
| **Testing** | Coverage, variety, determinism | Vitest unit tests for every `lib/` module, component tests, E2E with Playwright, Gemini always mocked, coverage badge |
| **Accessibility** | WCAG compliance, keyboard, screen readers | WCAG 2.2 AA, ARIA tabs, skip link, focus management, `prefers-reduced-motion`, visible focus rings, semantic HTML, contrast >= 4.5:1 |
| **Problem Statement Alignment** | Does it do what was asked | Traceability table, demo script, every capability works end-to-end |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐    │
│  │ Landing Page  │  │ Plan Form +      │  │ Streaming Chat     │    │
│  │ (app/page)    │  │ Tabbed Results   │  │ (SSE Real-time)    │    │
│  │               │  │ (app/planner)    │  │ + Quick Ask        │    │
│  └──────────────┘  └───────┬──────────┘  └────────┬───────────┘    │
│                            │                       │                │
│                  useEventPlanner()       useStreamingChat()          │
│                  (hooks/)               (hooks/)                    │
└────────────────────────────┼───────────────────────┼────────────────┘
                             │                       │
                        POST /api/plan          POST /api/chat (SSE)
                        POST /api/ask           GET  /api/usage
                             │                       │
┌────────────────────────────┼───────────────────────┼────────────────┐
│                     SERVER (Next.js API Routes)                     │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────┐      │
│  │ Zod          │──▶│ Rate Limiter │──▶│ Event Classifier   │      │
│  │ Validation   │   │ (IP-based)   │   │ (Deterministic)    │      │
│  └──────────────┘   └──────────────┘   └────────┬───────────┘      │
│                                                  │                  │
│                          ┌───────────────────────┼──────┐           │
│                          ▼                       ▼      │           │
│                   ┌──────────────┐    ┌──────────────┐  │           │
│                   │ Input        │    │ Prompt       │  │           │
│                   │ Chunker      │    │ Templates    │  │           │
│                   └──────┬───────┘    └──────┬───────┘  │           │
│                          │                   │          │           │
│                          ▼                   ▼          │           │
│                   ┌──────────────────────────────────┐  │           │
│                   │   Google GenAI SDK (Gemini)      │  │           │
│                   │  ┌──────────────┬──────────────┐ │  │           │
│                   │  │ gemini-2.5-  │ gemini-2.5-  │ │  │           │
│                   │  │ flash        │ flash-lite   │ │  │           │
│                   │  │ (Complex)    │ (Simple)     │ │  │           │
│                   │  └──────────────┴──────────────┘ │  │           │
│                   └──────────────────────────────────┘  │           │
│                                                         │           │
│                   ┌──────────────────────────────────┐  │           │
│                   │  Zod Output Validation +         │◀─┘           │
│                   │  Guardrails                      │              │
│                   └──────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Technology Choices

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Full-stack TS, API routes = no separate backend, SSR/SSG capable, deploys to Vercel |
| **Language** | TypeScript (strict mode, zero `any`) | Type safety, better DX, compile-time error catching |
| **Styling** | Vanilla CSS with CSS Custom Properties | Maximum control, no framework lock-in, supports theming (dark/light) via `:root` variables, `prefers-color-scheme`, `prefers-reduced-motion` |
| **Validation** | Zod | Runtime type validation for API inputs AND AI outputs, TypeScript inference |
| **AI** | Google GenAI SDK (`@google/genai`) | Gemini structured output, streaming, two model tiers |
| **Testing** | Vitest + Playwright | Fast unit tests, real E2E coverage |
| **Linting** | ESLint 9 + Prettier | Code consistency |
| **Deployment** | Vercel | Zero-config Next.js deployment, edge functions, automatic HTTPS |

### 3.2 Key Design Decisions

1. **No separate backend.** Next.js API routes handle everything server-side. Gemini key stays in `process.env`, never exposed to the client.
2. **No database.** Plans are stored in localStorage on the client. The server is stateless. This simplifies deployment and avoids free-tier DB expiry issues.
3. **LLM does language, code does math.** Gemini proposes budget percentages and relative offsets. The code computes actual amounts, dates, and totals.
4. **Structured JSON output.** Every Gemini call specifies a JSON schema via `responseMimeType: "application/json"` + `responseSchema`. Output is validated with Zod.
5. **Deterministic fallback.** If Gemini fails, return empty arrays with an error notice — the app never crashes.
6. **CSS-only theming.** Dark/light mode via CSS custom properties and `data-theme` attribute. No runtime JS for styling.

---

## 4. Repository Structure

```
eventoria/
├── PLAN.md                        # this file
├── CHANGELOG.md                   # agent handoff log
├── README.md                      # overview, traceability, setup, demo
├── .env.example                   # GEMINI_API_KEY placeholder only
├── .gitignore
├── next.config.ts                 # security headers, compression, CSP
├── tsconfig.json                  # strict mode
├── package.json
├── vitest.config.ts
├── playwright.config.ts
│
├── app/
│   ├── layout.tsx                 # root layout, meta, skip-link, theme provider
│   ├── page.tsx                   # landing page
│   ├── globals.css                # CSS custom properties, reset, theme, utilities
│   ├── planner/
│   │   └── page.tsx               # plan form + tabbed results
│   ├── chat/
│   │   └── page.tsx               # dedicated chat page
│   └── api/
│       ├── plan/
│       │   └── route.ts           # POST: generate full event plan
│       ├── chat/
│       │   └── route.ts           # POST: SSE streaming chat
│       ├── ask/
│       │   └── route.ts           # POST: non-streaming quick answer
│       └── usage/
│           └── route.ts           # GET: caller's rate limit status
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx + Button.module.css
│   │   ├── Card.tsx + Card.module.css
│   │   ├── Tabs.tsx + Tabs.module.css       # ARIA tab pattern
│   │   ├── Badge.tsx + Badge.module.css
│   │   ├── ThemeToggle.tsx + ThemeToggle.module.css
│   │   ├── UsageWidget.tsx + UsageWidget.module.css
│   │   ├── SkipLink.tsx + SkipLink.module.css
│   │   ├── Spinner.tsx + Spinner.module.css
│   │   └── Toast.tsx + Toast.module.css
│   └── planner/
│       ├── EventPlanForm.tsx + EventPlanForm.module.css
│       ├── PlanResults.tsx + PlanResults.module.css
│       ├── BudgetTab.tsx + BudgetTab.module.css
│       ├── TimelineTab.tsx + TimelineTab.module.css
│       ├── VendorsTab.tsx + VendorsTab.module.css
│       ├── IdeasTab.tsx + IdeasTab.module.css
│       └── ChatInterface.tsx + ChatInterface.module.css
│
├── hooks/
│   ├── useEventPlanner.ts         # plan generation state machine
│   ├── useStreamingChat.ts        # SSE streaming hook
│   ├── useLocalStorage.ts         # typed localStorage persistence
│   └── useTheme.ts                # dark/light theme hook
│
├── lib/
│   ├── gemini.ts                  # GenAI SDK wrapper (server-only)
│   ├── classifier.ts              # deterministic query classifier → model tier
│   ├── chunker.ts                 # smart input chunking at paragraph/sentence/word
│   ├── rate-limiter.ts            # sliding-window per-IP rate limiter
│   ├── validators.ts              # Zod schemas for all request/response shapes
│   ├── prompt-templates.ts        # versioned prompt constants, one per capability
│   ├── guardrails.ts              # input sanitization, output validation, scope check
│   ├── format.ts                  # currency formatting (INR, en-IN), date formatting
│   └── constants.ts               # event types, categories, limits
│
├── types/
│   └── event.ts                   # all TypeScript interfaces and type aliases
│
├── __tests__/
│   └── lib/
│       ├── classifier.test.ts
│       ├── chunker.test.ts
│       ├── gemini.test.ts
│       ├── rate-limiter.test.ts
│       ├── validators.test.ts
│       ├── prompt-templates.test.ts
│       ├── guardrails.test.ts
│       └── format.test.ts
│
└── e2e/
    └── planner.spec.ts            # full journey E2E test
```

**Layering rule:** API routes → lib modules. API routes never import the GenAI SDK directly; they always go through `lib/gemini.ts`. Components never call API routes directly; they use hooks.

---

## 5. Type System (`types/event.ts`)

```typescript
/** Supported event categories */
export type EventType = 'wedding' | 'birthday' | 'community';

/** Complexity classification for model routing */
export type QueryComplexity = 'simple' | 'moderate' | 'complex';

/** Gemini model identifiers */
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

/** Budget priority */
export type BudgetPriority = 'essential' | 'recommended' | 'optional';

/** Task status */
export type TaskStatus = 'todo' | 'in-progress' | 'done';

/** Vendor booking status */
export type VendorStatus = 'not-started' | 'shortlisted' | 'booked';

/** User-submitted event planning request */
export interface EventPlanRequest {
  readonly eventType: EventType;
  readonly guestCount: number;
  readonly budget: number;
  readonly date: string;
  readonly city: string;
  readonly description: string;
  readonly preferences: ReadonlyArray<string>;
}

/** Complete AI-generated event plan */
export interface EventPlan {
  readonly summary: string;
  readonly eventType: EventType;
  readonly budgetBreakdown: ReadonlyArray<BudgetItem>;
  readonly timeline: ReadonlyArray<TimelineItem>;
  readonly vendorChecklist: ReadonlyArray<VendorChecklistItem>;
  readonly personalizedIdeas: ReadonlyArray<PersonalizedIdea>;
  readonly tips: ReadonlyArray<string>;
}

/** Budget line item */
export interface BudgetItem {
  readonly category: string;
  readonly estimatedCost: number;
  readonly percentOfTotal: number;
  readonly notes: string;
  readonly priority: BudgetPriority;
  readonly savingTips: ReadonlyArray<string>;
}

/** Timeline task */
export interface TimelineItem {
  readonly title: string;
  readonly description: string;
  readonly phase: string;
  readonly daysBeforeEvent: number;
  readonly category: string;
  readonly priority: 'high' | 'medium' | 'low';
}

/** Vendor checklist entry */
export interface VendorChecklistItem {
  readonly category: string;
  readonly priorityTier: 'must-have' | 'should-have' | 'nice-to-have';
  readonly itemsToBook: ReadonlyArray<string>;
  readonly questionsToAsk: ReadonlyArray<string>;
  readonly contractChecks: ReadonlyArray<string>;
  readonly tips: ReadonlyArray<string>;
  readonly estimateLowPercent: number;
  readonly estimateHighPercent: number;
  readonly bookByDaysBefore: number;
}

/** Personalized idea */
export interface PersonalizedIdea {
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly tier: 'diy' | 'standard' | 'premium';
  readonly estimatedCost: number;
}

/** Chat message */
export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: number;
  readonly modelTier?: 'quick' | 'detailed';
}

/** Classification result from event classifier */
export interface ClassificationResult {
  readonly complexity: QueryComplexity;
  readonly model: GeminiModel;
  readonly eventType: EventType | null;
  readonly detectedCategories: ReadonlyArray<string>;
  readonly estimatedTokens: number;
  readonly requiresChunking: boolean;
}

/** Rate limit check result */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
  readonly headers: Record<string, string>;
}

/** API error response */
export interface ApiErrorResponse {
  readonly error: string;
  readonly code: string;
  readonly details?: string;
}
```

---

## 6. API Routes

### `POST /api/plan` — Generate Full Event Plan

**Flow:** Validate input (Zod) → Rate limit check → Classify complexity → Chunk if needed → Build prompt → Call Gemini (structured JSON output) → Validate output (Zod) → Return plan.

**Request:** `EventPlanRequest` (Zod-validated)
**Response:** `{ plan: EventPlan, model: GeminiModel, classification: { complexity, model } }`

### `POST /api/chat` — SSE Streaming Chat

**Flow:** Validate → Rate limit → Classify → Stream Gemini response via SSE → Client renders chunks in real-time.

**Request:** `{ messages: ChatMessage[], eventContext?: Partial<EventPlanRequest> }`
**Response:** SSE stream of text chunks.

### `POST /api/ask` — Non-Streaming Quick Answer

**Flow:** Same as chat but returns a complete JSON response. Used for simple questions (greetings, definitions, tips).

**Request:** `{ question: string, eventContext?: Partial<EventPlanRequest> }`
**Response:** `{ answer: string, model: GeminiModel }`

### `GET /api/usage` — Rate Limit Status

**Response:** `{ remaining: number, resetAt: number, limit: number }`

---

## 7. Gemini Integration

### 7.1 Client Wrapper (`lib/gemini.ts`)

- Server-only module — never imported on the client
- Config from env: `GEMINI_API_KEY`, `GEMINI_MODEL_COMPLEX` (default `gemini-2.5-flash`), `GEMINI_MODEL_SIMPLE` (default `gemini-2.5-flash-lite`)
- Structured output via `responseMimeType: "application/json"` + `responseSchema`
- Streaming for chat via `generateContentStream()`
- Low temperature (0.4) for plans, higher (0.8) for creative ideas and chat
- Hard timeout, retry on 429/5xx (max 2 retries with exponential backoff)

### 7.2 Event Classifier (`lib/classifier.ts`)

Deterministic, pure function — no AI call. Routes to the optimal model tier.

**Rules:**
- Plan generation (budget, timeline, vendors, ideas) → always **complex** tier
- Chat messages classified per-message:
  - Greetings, definitions, short tips → **simple** tier
  - Multi-category, long input, complex planning → **complex** tier
  - **When uncertain, default to complex** (safer)

**Pattern tables** (not scattered regexes):

```typescript
const COMPLEX_PATTERNS: ReadonlyArray<RegExp> = [
  /budget\s*(breakdown|allocat|optimiz)/i,
  /vendor\s*(comparison|negoti|contract)/i,
  /timeline\s*(creat|build|plan|schedul)/i,
  /multi[- ]?day/i,
  /destination\s*(wedding|event)/i,
  /\d{3,}\s*guests?/i,
  /cultur(al|e)\s*(theme|tradition)/i,
  /contingency|backup\s*plan/i,
  /full\s*(plan|comprehensive)/i,
];

const SIMPLE_PATTERNS: ReadonlyArray<RegExp> = [
  /^(what|how\s+much|when|where)\b/i,
  /recommend(ation)?s?\b/i,
  /tip(s)?\s*(for|about)/i,
  /hello|hi|hey|thanks/i,
];
```

### 7.3 Input Chunker (`lib/chunker.ts`)

Caps input at ~6000 estimated tokens (chars / 4). If over:
1. Split at paragraph boundaries
2. Then sentence boundaries
3. Then word boundaries
4. Return the most relevant section

### 7.4 Prompt Templates (`lib/prompt-templates.ts`)

- Versioned constants: `PLAN_PROMPT_V1`, `CHAT_SYSTEM_PROMPT_V1`
- System prompt defines: role, scope (event planning only), tone, cultural sensitivity, currency, hard prohibitions (no invented vendors/prices/contacts)
- User input wrapped in `<user_input>...</user_input>` delimiters — treated as data, not instructions
- Event facts sent as compact JSON, not prose, to reduce tokens

### 7.5 Guardrails (`lib/guardrails.ts`)

- **Input:** length caps (2000 char per field), strip control characters, normalize whitespace
- **Scope:** if chat is off-topic, redirect to event planning
- **Output:** Zod validation, strip HTML/links from plain text fields
- **Disclosure:** UI shows "AI-generated suggestions — verify vendors, prices, and local rules"

---

## 8. CSS Architecture

### 8.1 Design System (`app/globals.css`)

Using CSS Custom Properties for a complete design system:

```css
:root {
  /* Colors — Light theme */
  --color-bg-primary: #fefefe;
  --color-bg-secondary: #f8f7f4;
  --color-bg-tertiary: #f0eeeb;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #555;
  --color-text-muted: #888;
  --color-accent: #d97706;
  --color-accent-hover: #b45309;
  --color-accent-subtle: #fef3c7;
  --color-success: #16a34a;
  --color-warning: #ea580c;
  --color-error: #dc2626;
  --color-border: #e5e5e5;
  --color-border-focus: #d97706;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --font-size-4xl: 2.5rem;

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Radius, shadows, transitions */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08);
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --focus-ring: 0 0 0 3px rgba(217, 119, 6, 0.4);
  --max-width: 1200px;
  --header-height: 64px;
}

[data-theme="dark"] {
  --color-bg-primary: #0f0f0f;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #262626;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #a3a3a3;
  --color-text-muted: #737373;
  --color-accent: #f59e0b;
  --color-accent-hover: #fbbf24;
  --color-accent-subtle: #451a03;
  --color-border: #333;
  --focus-ring: 0 0 0 3px rgba(245, 158, 11, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.2 CSS Organization

- `globals.css` — reset, custom properties, utility classes, global layouts
- Component-level CSS modules for scoped styling (e.g., `EventPlanForm.module.css`)
- No Tailwind, no CSS-in-JS — pure vanilla CSS

### 8.3 Responsive Strategy

- Mobile-first approach
- Breakpoints: `640px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl)
- Works at 320px viewport and 200% zoom
- Touch targets >= 44px on mobile

---

## 9. Security

| Area | Controls |
|---|---|
| **Secrets** | `GEMINI_API_KEY` only in `process.env` (server-side). Never in client bundle. `.env.example` with placeholder only. |
| **Input Validation** | Zod schemas with `strict()` — reject unknown fields, enforce length limits (guestCount: 1-10000, budget: 1-100000000, description: max 2000 chars), enums for event types |
| **Rate Limiting** | Sliding-window per-IP: 10 plan generations / 15 min, 30 chat messages / 15 min, 60 ask requests / 15 min. Return `429` with `Retry-After` and `X-RateLimit-*` headers |
| **Headers** | In `next.config.ts`: CSP (`default-src 'self'`), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` |
| **XSS** | React escaping only. **Never** `dangerouslySetInnerHTML`. AI text rendered as plain text. |
| **Prompt Injection** | User input wrapped in `<user_input>` delimiters and declared as data. Strict JSON schemas. Output validated with Zod. |
| **Errors** | Generic client messages. Never leak stack traces. Structured error shape: `{ error, code, details? }` |

---

## 10. Accessibility (WCAG 2.2 AA)

**Structure & Navigation:**
- `<html lang="en">`, one `<h1>` per page, logical heading order
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`
- Visible **Skip to Content** link
- Unique page `<title>` per route

**Keyboard & Focus:**
- Everything operable by keyboard
- Visible focus ring (>= 3:1 contrast, using `--focus-ring` custom property)
- `Esc` closes overlays
- No keyboard traps

**Tabs (ARIA):**
- Budget/Timeline/Vendors/Ideas tabs use `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected`, `aria-controls`, `aria-labelledby`
- Arrow key navigation between tabs

**Forms:**
- Visible labels via `<label htmlFor>`
- Error text linked with `aria-describedby`
- `aria-invalid` on error
- Required indicators in text (not just `*`)

**Dynamic Content:**
- Streaming chat in `aria-live="polite"` region (announce on completion, not every token)
- Loading states use `aria-busy`
- Never convey state by color alone (add icon + text)

**Visual:**
- Text contrast >= 4.5:1, UI components >= 3:1
- Support 200% zoom and 320px reflow
- Touch targets >= 44px
- `prefers-reduced-motion` and `prefers-color-scheme` respected

---

## 11. Testing

**Principles:** Deterministic. Fast. No real network. Gemini is always mocked.

### 11.1 Unit Tests (Vitest)

Test every `lib/` module:

| Module | Key Test Cases |
|---|---|
| `classifier.ts` | Simple vs complex classification, empty input, long input, non-English, ambiguous defaults to complex, event type detection, category detection |
| `chunker.ts` | Under-limit passthrough, paragraph splitting, sentence splitting, word splitting, delimiter preservation |
| `gemini.ts` | Successful response, JSON parse failure, timeout, retry on 429, structured output schema |
| `rate-limiter.ts` | Allow within limit, reject over limit, window expiry/reset, header values, per-IP independence |
| `validators.ts` | Valid inputs pass, missing fields reject, out-of-range values reject, extra fields reject, AI output validation |
| `prompt-templates.ts` | Placeholders filled, system prompt contains prohibitions, each event type has correct categories |
| `guardrails.ts` | Control char stripping, whitespace normalization, length capping, scope detection |
| `format.ts` | INR formatting with Indian digit grouping, date formatting, edge cases |

### 11.2 Component Tests (Vitest + React Testing Library)

- Form validation (wizard steps, error display)
- Tab switching (keyboard + click)
- Budget editing and total recalculation
- Task status toggle
- Theme toggle
- Loading/error/empty states

### 11.3 E2E Tests (Playwright)

Full journey:
1. Load landing page → navigate to planner
2. Fill wizard (wedding, 200 guests, Rs 15,00,000, Bengaluru)
3. Submit and see plan results
4. Switch between tabs
5. Edit a budget line
6. Mark a task done
7. Open chat, send a message
8. Export plan
9. Clear data

### 11.4 Coverage

- CI-enforced minimum
- Badge in README from CI artifacts

---

## 12. Phased Build Order

### Phase 0 — Foundation
**Build:** Repo structure, `package.json`, `tsconfig.json` (strict), `next.config.ts` (security headers), `vitest.config.ts`, `.env.example`, `.gitignore`, `CHANGELOG.md`, `globals.css` (full design system), ESLint + Prettier config.

**Gate:** `npm run build` succeeds. `npm run lint` clean. Dev server starts. Security headers verified.

### Phase 1 — Lib Modules
**Build:** All `lib/` modules: `validators.ts` (Zod schemas), `classifier.ts`, `chunker.ts`, `rate-limiter.ts`, `prompt-templates.ts`, `guardrails.ts`, `format.ts`, `constants.ts`, `gemini.ts`. All `types/event.ts`.

**Gate:** All unit tests pass (`__tests__/lib/*.test.ts`). Zero `any`. `tsc --noEmit` clean.

### Phase 2 — API Routes
**Build:** `POST /api/plan`, `POST /api/chat` (SSE), `POST /api/ask`, `GET /api/usage`. Wire up lib modules. Gemini integration with mocked tests.

**Gate:** Each route works with mocked Gemini (valid response, malformed response, timeout). Rate limiting works. Zod validation rejects bad input.

### Phase 3 — UI Shell + Landing Page
**Build:** Root layout, skip link, theme toggle, nav, landing page with hero + feature cards + CTA. All UI primitives (`components/ui/`). CSS for everything.

**Gate:** Landing page renders. Theme toggle works. Skip link works. Keyboard-only navigation passes. Mobile responsive to 320px.

### Phase 4 — Plan Form + Results
**Build:** `EventPlanForm.tsx` (wizard), `PlanResults.tsx` (tab container), `BudgetTab.tsx`, `TimelineTab.tsx`, `VendorsTab.tsx`, `IdeasTab.tsx`. Hooks: `useEventPlanner.ts`, `useLocalStorage.ts`.

**Gate:** Full form → submit → see tabbed results. ARIA tabs work with keyboard (arrow keys). Plans persist in localStorage across page refresh. Budget totals correct. Loading/error/empty states all visible.

### Phase 5 — Chat Assistant
**Build:** `ChatInterface.tsx`, `useStreamingChat.ts`. SSE streaming in the UI with real-time rendering. Quick-ask mode. `UsageWidget.tsx` showing rate limit status.

**Gate:** Streaming works (text appears token by token). Quick-ask returns full response. Usage indicator shows "—" until loaded, real number after. Stop button aborts stream.

### Phase 6 — Export + Polish
**Build:** JSON export, print CSS for PDF, delete-my-data button. Accessibility pass (focus management, ARIA audit). Performance pass (dynamic imports, optimize images).

**Gate:** Export downloads valid JSON. Print preview looks good. Delete clears all localStorage. Lighthouse a11y score >= 90.

### Phase 7 — Testing + Hardening
**Build:** E2E tests (Playwright), increase unit test coverage, manual keyboard-only walkthrough, screen reader check. README finalized with traceability table, setup instructions, demo script.

**Gate:** All tests pass. Coverage meets threshold. README complete with real clone URL (no placeholders). Lint clean.

### Phase 8 — Deploy
**Build:** Deploy to Vercel. Set `GEMINI_API_KEY` env var. Verify production: headers, rate limiting, full smoke test.

**Gate:** Production smoke test passes (create plan → edit → chat → export → delete).

---

## 13. Per-Event-Type Required Categories

Enforced by the backend — the AI may add more, but these are the minimum:

**Wedding:** venue, catering, decor & florals, photography/video, attire & grooming, music & entertainment, stationery, rituals/officiants, transport, contingency.

**Birthday:** venue or home setup, theme & decor, cake & food, entertainment & activities, return gifts, photography, contingency.

**Community:** venue & permits, logistics & AV, safety & first aid, volunteers, sponsors & outreach, food & water, cleanup, contingency.

---

## 14. Environment Variables

**Server (Vercel):**
- `GEMINI_API_KEY` — required
- `GEMINI_MODEL_COMPLEX` — default `gemini-2.5-flash`
- `GEMINI_MODEL_SIMPLE` — default `gemini-2.5-flash-lite`

**Client:**
- None. No secrets in the client bundle.

`.env.example`:
```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_COMPLEX=gemini-2.5-flash
GEMINI_MODEL_SIMPLE=gemini-2.5-flash-lite
```

---

## 15. Advantages Over Velora (Reference)

| Velora | Our Version |
|---|---|
| Uses Groq (3rd party LLM) | Uses Gemini API (per challenge requirement) |
| Stateless — plans lost on refresh | Plans persist in localStorage |
| Unit tests only on `lib/` (6 files) | Full test pyramid: lib + component + E2E |
| No component or E2E tests visible | Playwright E2E for full journey |
| USD only | INR default with Indian digit grouping |
| No editable budget/timeline/vendors | Editable: adjust amounts, toggle tasks, check vendors |
| No export | JSON export + print/PDF |
| No delete-my-data | Clear all data button |
| Regex-only classifier can be brittle | Same pattern but with safe default to complex |
| Usage widget shows "0" before data loads | Shows "—" until real data arrives |
| CSS via globals.css only | Vanilla CSS with custom properties + CSS modules per component |

---

## 16. Demo Script (3 minutes)

1. **Landing page** — show warm, celebratory design. Toggle dark mode.
2. **Wizard** — "Wedding, 250 guests, Bengaluru, Rs 15,00,000, vegetarian, traditional + modern theme."
3. **Plan generation** — watch spinner, then see budget + timeline + vendors + ideas populate across tabs.
4. **Budget tab** — show category breakdown with percentages. Edit an amount; totals recalculate.
5. **Timeline tab** — tasks grouped by phase. Mark a task as done with keyboard. Show priority badges.
6. **Vendors tab** — accordion per category. Check off booking items. Show questions to ask.
7. **Ideas tab** — themed ideas with cost tier badges (DIY / Standard / Premium).
8. **Chat** — "We're over budget on decor, what should we cut?" → streaming answer. Show model tier label.
9. **Quick ask** — "What's the average wedding photographer cost in Bengaluru?" → instant answer.
10. **Export** — download plan as JSON. Print preview.
11. **Privacy** — delete all data. Verify localStorage is clear.
12. **Close** — show traceability table, test coverage, clean lint output.

---

## 17. Definition of Done

**Problem Alignment:**
- [ ] Wedding, birthday, and community flows each produce budget + timeline + vendors + ideas
- [ ] Chat assistant answers event-aware questions
- [ ] README contains traceability table and demo script

**Code Quality:**
- [ ] `tsc --noEmit` clean, zero `any`, ESLint + Prettier clean
- [ ] Well-structured `lib/` with single-responsibility modules
- [ ] JSDoc on all exported functions

**Security:**
- [ ] No secrets in repo or client bundle
- [ ] CSP + security headers in `next.config.ts`
- [ ] Rate limiting on all AI endpoints
- [ ] Zod validation on all inputs and AI outputs

**Efficiency:**
- [ ] Dynamic imports for heavy components
- [ ] Streaming for chat (not blocking)
- [ ] Smart input chunking
- [ ] Compressed responses

**Testing:**
- [ ] Unit tests for all `lib/` modules
- [ ] Component tests for key interactions
- [ ] E2E test for full journey
- [ ] Gemini mocked in all tests
- [ ] Coverage badge in README

**Accessibility:**
- [ ] ARIA tabs, skip link, focus management
- [ ] Keyboard-only walkthrough passes
- [ ] `prefers-reduced-motion` respected
- [ ] Contrast >= 4.5:1

**Production:**
- [ ] Deployed to Vercel with working live URL
- [ ] Full smoke test passes end-to-end
- [ ] No console errors
