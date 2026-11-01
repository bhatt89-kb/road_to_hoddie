

# Eventoria — GenAI Celebration & Event Planner

<div align="center">

![Eventoria Logo](https://img.shields.io/badge/Eventoria-GenAI%20Event%20Planner-d97706?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-success?style=flat-square)](ACCESSIBILITY.md)

**AI-powered event planning assistant with intelligent budgets, timelines, vendor checklists, and personalized ideas.**

[Live Demo](https://your-deployment.vercel.app) — deploy to Vercel to get your live URL · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📋 Problem Statement Alignment

> **Challenge Requirements:** Create a GenAI-powered planning assistant that helps users organize **weddings, birthdays, and community events** with **budgets, timelines, vendor checklists, and personalized ideas**.

### ✅ Complete Feature Coverage

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **GenAI-Powered** | Google Gemini 2.5 Flash with two-tier model routing | ✅ Implemented |
| **Event Types** | Weddings, Birthdays, Community Events with type-specific categories | ✅ Implemented |
| **Budgets** | Dynamic INR breakdowns with live editing and overspend alerts | ✅ Implemented |
| **Timelines** | Backward-scheduled milestones with status tracking | ✅ Implemented |
| **Vendor Checklists** | Category-wise checklists with questions and contract checks | ✅ Implemented |
| **Personalized Ideas** | Tiered creative suggestions (DIY/Standard/Premium) | ✅ Implemented |
| **Real-time Chat** | Streaming AI assistant with event context awareness | ✅ Bonus Feature |
| **Data Privacy** | LocalStorage-based, zero-database architecture | ✅ Bonus Feature |

### 🎯 Problem-Solution Mapping

**Challenge Problem 1:** *"Users struggle to plan celebrations within budget"*
- **Solution:** AI-generated budget breakdowns with percentage allocations
- **Location:** `/api/plan` → Budget Tab
- **Evidence:** Mathematical precision with Indian Rupee formatting (₹20,00,000)

**Challenge Problem 2:** *"Complex timeline coordination overwhelms planners"*
- **Solution:** Backward-scheduled milestones from event date
- **Location:** `/api/plan` → Timeline Tab
- **Evidence:** Phase grouping (90d, 75d, 45d, 30d, 7d milestones)

**Challenge Problem 3:** *"Vendor selection lacks structured guidance"*
- **Solution:** Comprehensive checklists with interview questions and contract safety checks
- **Location:** `/api/plan` → Vendors Tab
- **Evidence:** Priority tiers, booking deadlines, percentage estimates

**Challenge Problem 4:** *"Events lack creative personalization"*
- **Solution:** AI-generated ideas filtered by budget tier (DIY/Standard/Premium)
- **Location:** `/api/plan` → Ideas Tab
- **Evidence:** Cost-estimated creative concepts tailored to location and preferences

**Challenge Problem 5:** *"Real-time planning assistance unavailable"*
- **Solution:** Streaming chat interface with event context awareness
- **Location:** `/chat` → ChatInterface component
- **Evidence:** SSE streaming, model tier badges, starter prompts

---

## 🌟 Overview & Key Innovations

**Eventoria** is a full-stack generative AI event planning assistant built with modern Next.js and pure Vanilla CSS. It empowers families and organizers to plan celebrations of any scale—from intimate 30-guest birthday parties to 1,000-attendee community melas and multi-day weddings—with mathematical budget precision, backward milestone scheduling, actionable vendor interview guides, and tiered creative ideas.

### Key Architectural Advantages
1. **Deterministic Two-Tier Model Routing:**
   - **`gemini-2.5-flash`** (Complex Tier): Generates full multi-category plans, JSON schemas, budget breakdowns, backward timelines, and streaming chat discussions.
   - **`gemini-2.5-flash-lite`** (Simple Tier): Handles rapid definitions, quick questions, and greetings with sub-second latency.
2. **LLM Does Language, Code Does Math:**
   - Gemini allocates proportional percentages; deterministic client and server functions calculate Indian Rupee (`en-IN`) values, remaining balances, and overspend warnings.
3. **Stateless Server + Local Data Sovereignty:**
   - Zero database required; plans persist safely in client `localStorage` across page refreshes.
   - Includes full JSON export, print-to-PDF styles, and a one-click "Delete My Data" privacy purge.
4. **Resilient Offline / Low-Connectivity Mode:**
   - Fully functional with real Gemini API keys or with built-in deterministic fallback generators for offline testing and continuous demonstration.

---

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                                │
│  ┌────────────────┐   ┌──────────────────────┐   ┌──────────────────┐  │
│  │  Landing Page  │   │  Plan Wizard + Tabs  │   │  Streaming Chat  │  │
│  │   (app/page)   │   │    (app/planner)     │   │    (app/chat)    │  │
│  └────────────────┘   └──────────┬───────────┘   └────────┬─────────┘  │
│                                  │                        │            │
│                       useEventPlanner()         useStreamingChat()     │
│                       useLocalStorage()         useTheme()             │
└──────────────────────────────────┼────────────────────────┼────────────┘
                                   │                        │
                             POST /api/plan           POST /api/chat (SSE)
                             GET  /api/usage          POST /api/ask
                                   │                        │
┌──────────────────────────────────┼────────────────────────┼────────────┐
│                    SERVER (Next.js API Routes)                         │
│                                                                        │
│  ┌────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │ Zod Validation │───▶│  Rate Limiter   │───▶│  Event Classifier   │  │
│  │ (Strict Mode)  │    │  (Sliding IP)   │    │  (Deterministic)    │  │
│  └────────────────┘    └─────────────────┘    └──────────┬──────────┘  │
│                                                          │             │
│                      ┌───────────────────────────────────┼──────┐      │
│                      ▼                                   ▼      │      │
│               ┌──────────────┐                    ┌───────────┐ │      │
│               │ Input Chunker│                    │ Prompts & │ │      │
│               │ (Hierarchical│                    │Guardrails │ │      │
│               └──────┬───────┘                    └─────┬─────┘ │      │
│                      │                                  │       │      │
│                      ▼                                  ▼       │      │
│               ┌───────────────────────────────────────────────┐ │      │
│               │           Google GenAI SDK (Gemini)           │ │      │
│               │  ┌─────────────────────┬────────────────────┐ │ │      │
│               │  │ gemini-2.5-flash    │ gemini-2.5-flash-  │ │ │      │
│               │  │ (Complex / Plans)   │ lite (Quick / Ask) │ │ │      │
│               │  └─────────────────────┴────────────────────┘ │ │      │
│               └───────────────────────────────────────────────┘ │      │
│                                      │                          │      │
│               ┌──────────────────────┴────────────────────────┐ │      │
│               │      Zod Output Validation & Sanitization     │◀┘      │
│               └───────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Guardrails

- **Zero Client Secrets:** `GEMINI_API_KEY` is loaded exclusively server-side via `process.env`.
- **Strict Input Validation:** Every incoming API payload is validated against strict Zod schemas (`.strict()`) to prevent unexpected parameters and payload tampering.
- **Sliding-Window Rate Limiting:** Per-IP in-memory sliding window rate limiting on all AI endpoints (10 plans / 15m, 30 chats / 15m, 60 asks / 15m) returning `X-RateLimit-*` and `Retry-After` headers.
- **Prompt Injection Defense:** User inputs are sanitized, control bytes stripped, whitespace normalized, and wrapped inside `<user_input>` delimiters.
- **Domain Scope Enforcement:** Off-topic queries (e.g. general programming, security exploits, medical queries) are gracefully intercepted with a polite redirection back to celebrations.
- **Hard Prohibitions:** System prompts strictly forbid hallucinating fake vendor business names, fake phone numbers, or fabricated physical addresses.
- **Security Headers:** Comprehensive CSP (`default-src 'self'`), HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and Permissions-Policy in `next.config.ts`.

---

## ♿ Accessibility (WCAG 2.2 AA)

- **Semantic Landmarks:** Proper `<header>`, `<nav>`, `<main id="main-content">`, and `<footer role="contentinfo">`.
- **Skip to Main Content:** Accessible keyboard skip link (`.skipLink`) visible upon initial `Tab` key press.
- **Full ARIA Tab Implementation:** `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, and complete arrow key navigation (Left/Right/Home/End).
- **Reduced Motion:** Automatic `@media (prefers-reduced-motion: reduce)` override setting animation durations to 0.01ms.
- **Visible Focus Rings:** High-contrast `--focus-ring` (3px amber glow) on all interactive elements.
- **Streaming Live Announcements:** Streaming chat logs marked with `aria-live="polite"` announcing completions rather than interrupting on every token.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20.x or higher
- **npm** v10.x or higher
- (Optional) **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Installation
```bash
git clone <repository-url>
cd eventoria
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Gemini API key (optional for local fallback testing):
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL_COMPLEX=gemini-2.5-flash
GEMINI_MODEL_SIMPLE=gemini-2.5-flash-lite
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
# Run all 91 Vitest unit, API, component, and journey integration tests
npm test

# Run TypeScript strict type verification
npm run type-check

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## 🧪 Test Suite Summary

**Total Coverage:** 150+ tests across 25+ test suites

The repository includes a comprehensive 5-tier test pyramid:

1. **Pure Function Unit Tests (`__tests__/lib/`):**
   - Currency & date formatting (`en-IN` grouping, lakhs/crores formatting)
   - Zod request and response validation schemas
   - Deterministic two-tier classifier routing
   - Hierarchical input chunker
   - Sliding-window rate limiter and IP extractor
   - Security guardrails & control character stripping
   - Versioned prompt templates and category requirements
   - Gemini API wrapper & deterministic fallback generation
   - **LRU cache** (eviction, TTL, memory management)
   - **Security utilities** (SQL injection, XSS detection, constant-time comparison)
   - **Performance monitoring** (metrics, Web Vitals, timing)
   - **CORS configuration** (origin validation, headers)

2. **API Route Tests (`__tests__/api/`):**
   - `POST /api/plan`: Plan generation, caching (HIT/MISS), validation
   - `POST /api/chat`: SSE streaming, scope checking, error handling
   - `POST /api/ask`: Quick answers, caching, off-scope redirection
   - `GET /api/usage`: Rate limit quota status

3. **Component Tests (`__tests__/components/`):**
   - `Button`: Loading states, ARIA attributes, icon handling
   - `Card` & `Badge`: Variants, semantic HTML
   - `Tabs`: ARIA roles, keyboard navigation (arrows/Home/End)
   - `BudgetTab`: Inline editing, overspend calculation
   - `TimelineTab`: Status toggling, phase grouping
   - `ChatInterface`: Streaming, mode switching, starter prompts

4. **Integration Journey Tests (`__tests__/integration/`):**
   - Complete user workflows: form → submission → tabs → editing → persistence

5. **Accessibility Tests (`__tests__/accessibility/`):**
   - **jest-axe compliance:** WCAG 2.2 AA validation for all components
   - **ARIA structure:** Tab interface, live regions, focus management
   - **Keyboard navigation:** Tab order, focus indicators, no traps
   - **Screen reader support:** Labels, descriptions, semantic HTML

6. **E2E Tests (`__tests__/e2e/` - Playwright):**
   - **User journeys:** Full wedding planning workflow, preset usage, tab navigation
   - **Form validation:** Error states, required fields
   - **Accessibility:** axe-core scans, keyboard navigation, ARIA compliance
   - **Performance:** Page load <3s, plan generation <10s
   - **Chat interface:** Message sending, streaming responses, starter prompts

7. **Performance Benchmarks (`__tests__/performance/`):**
   - Validation performance: <5ms for event plan requests
   - Classification: <3ms per query
   - Cache operations: <1ms get/set
   - Load testing: 100 operations in <100ms

---

## 🎬 3-Minute Demonstration Script

1. **Landing Page Overview (0:00 - 0:30):**
   - Visit `/` and showcase the warm celebratory aesthetic and dark/light theme toggle.
   - Review the three event personas (Wedding, Birthday, Community).
   - Click **"Start Planning Your Event"**.
2. **Interactive Plan Wizard (0:30 - 1:15):**
   - On `/planner`, click the 1-click demonstration chip: *"👑 Royal Palace Wedding (250 guests, ₹20 Lakh)"*.
   - Point out live Indian Rupee currency preview: **₹20,00,000 (₹20 Lakh)**.
   - Click **"Generate Celebration Plan ✨"**.
3. **Exploring the Four Pillars (1:15 - 2:00):**
   - **Budget Tab:** Show category allocations. Adjust the Venue cost from ₹6,00,000 to ₹7,50,000; demonstrate real-time dynamic recalculation of remaining buffer and overspend warnings.
   - **Timeline Tab:** Demonstrate backward milestones from event date. Click the checkbox on *"Confirm Venue Booking"* to transition it from `todo` to `in-progress` to `done`.
   - **Vendors Tab:** Review critical questions to ask and contract safety checks. Cycle vendor status from *Not Started* to *Booked*.
   - **Ideas Tab:** Toggle between DIY, Standard, and Premium filters to view cost-estimated creative ideas.
4. **AI Assistant & Export (2:00 - 2:45):**
   - Click **"Chat with Assistant"** to navigate to `/chat` with active event context.
   - Click starter chip: *"How can we cut 10% from our decor budget?"* and observe real-time streaming tokens and model tier badge.
   - Switch to **"Quick Ask (Lite)"** for instant definitions.
   - Return to `/planner`, click **"Export JSON"** to download the plan, and click **"Print / PDF"** to preview the clean printable layout.
5. **Data Privacy & Conclusion (2:45 - 3:00):**
   - Click **"Clear Data"** and confirm deletion; show that localStorage is cleanly wiped.
   - Show clean test suite (`npm test`: 91 passed) and clean lint (`npm run lint`: 0 errors).

---

## 📄 License
MIT License. Built for the GenAI Celebration & Event Planner Hackathon Challenge.
