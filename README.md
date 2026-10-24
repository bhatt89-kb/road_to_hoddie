# ✨ Eventoria — GenAI Celebration & Event Operating System

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![WCAG](https://img.shields.io/badge/WCAG_2.2-Level_AA_Compliant-10B981?style=for-the-badge)](ACCESSIBILITY.md)
[![License](https://img.shields.io/badge/License-MIT-amber-500?style=for-the-badge)](LICENSE)

**Eventoria** is a production-grade, AI-powered celebration and event planning operating system. Built on Next.js 16 and powered by the Google GenAI SDK (`@google/genai`), Eventoria generates itemized financial budgets, chronological timelines, vendor negotiation checklists, and personalized creative concepts for **Weddings**, **Birthdays**, and **Community Events**.

---

## 🚀 Key Features

### 1. Multi-Domain Event Architecture
* **Weddings:** 10 core specialized categories (Venue, Catering, Attire, Photography, Decor, Music/DJ, Invitations, Transport, Makeup, Cake).
* **Birthdays:** 7 age-milestone categories (Venue, Entertainment, Food/Cake, Favors, Theme Decor, Invitations, Games).
* **Community Events:** 8 civic-focused categories (Permits/Insurance, Sound System, Waste Management, Volunteer Coordination, Seating, Food Trucks, Marketing, First Aid).

### 2. Intelligent AI Engine & Optimization
* **Two-Tier Model Routing:** A deterministic query complexity classifier routes quick Q&A to `gemini-2.5-flash-lite` and full event plan generations to `gemini-2.5-flash` to optimize latency and API costs.
* **In-Memory LRU Caching:** Built-in Least Recently Used (LRU) cache with 15-minute TTL for event plans and 30-minute TTL for Q&A pairs, featuring automated 5-minute memory pruning.
* **Server-Sent Events (SSE) Streaming:** Real-time streaming chat interface for interactive planning advice.
* **Hierarchical Input Chunking:** Token-aware text chunker that splits inputs cleanly along paragraph and sentence boundaries without truncating tokens.

### 3. Enterprise Security & Guardrails
* **OWASP Input Validation:** Strict Zod schema enforcement across all endpoints.
* **Prompt Injection Defense:** Input sanitization that strips script tags, prevents system prompt overrides, and enforces strict event-domain scope limits.
* **Sliding-Window Rate Limiting:** Per-IP rate limiting enforcing quotas and emitting standard `X-RateLimit-*` headers.
* **API Key Isolation:** Zero client-side leakage; all AI requests are executed strictly through server-side Next.js route handlers.

### 4. Accessibility & UI/UX (WCAG 2.2 Level AA)
* **Axe-Core Validated:** Automated accessibility test coverage across components and E2E routes.
* **Keyboard Navigation & ARIA Live:** Full focus management, accessible skip links, aria-live streaming updates, and visual high-contrast theme support.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 16.4](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
* **Frontend UI:** [React 19](https://react.dev/), Tailwind CSS, Glassmorphic CSS Modules
* **Language:** [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
* **AI Engine:** [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (`@google/genai` v2.30.0)
* **Validation:** [Zod 4](https://zod.dev/)
* **Unit/Integration Testing:** [Vitest 5](https://vitest.dev/), React Testing Library, `jest-axe`
* **E2E Testing:** [Playwright](https://playwright.dev/), `@axe-core/playwright`

---

## 📁 Repository Structure

```text
eventoria/
├── app/                        # Next.js App Router
│   ├── api/                    # Server-side API endpoints
│   │   ├── ask/route.ts        # Fast Q&A endpoint (gemini-2.5-flash-lite)
│   │   ├── chat/route.ts       # SSE Real-time streaming assistant endpoint
│   │   ├── plan/route.ts       # Full event plan generator endpoint
│   │   └── usage/route.ts      # Rate limit & usage tracking endpoint
│   ├── chat/page.tsx           # Interactive AI assistant page
│   ├── planner/page.tsx        # Event studio workspace
│   ├── layout.tsx              # Root layout with theme provider
│   └── globals.css             # Design tokens & glassmorphic styles
├── components/                 # Modular React components
│   ├── layout/                 # Header, Footer, Navigation
│   ├── planner/                # Event form, Budget, Timeline, Vendor, Ideas tabs
│   └── ui/                     # Badge, Button, Card, SkipLink, ThemeToggle, UsageWidget
├── hooks/                      # Custom React hooks
│   ├── useEventPlanner.ts      # Plan state & API hook
│   ├── useStreamingChat.ts     # SSE stream handler hook
│   └── useLocalStorage.ts      # Persisted client state hook
├── lib/                        # Core backend utilities
│   ├── cache.ts                # LRU cache implementation
│   ├── classifier.ts           # Two-tier model routing classifier
│   ├── gemini.ts               # Google GenAI SDK wrapper
│   ├── guardrails.ts           # Security sanitization & domain check
│   ├── prompt-templates.ts     # Structured prompts and versioning
│   ├── rate-limiter.ts         # Sliding-window rate limiting engine
│   └── validators.ts           # Zod schema definitions
├── __tests__/                  # Comprehensive test suite (26 files)
│   ├── accessibility/          # Axe-core WCAG AA tests
│   ├── api/                    # Route handler integration tests
│   ├── components/             # React component unit tests
│   ├── e2e/                    # Playwright end-to-end user journeys
│   ├── lib/                    # Utility logic unit tests
│   └── performance/            # Timing & benchmark tests
└── public/                     # Static assets & security.txt
