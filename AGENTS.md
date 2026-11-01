# Project notes for AI coding agents

Eventoria is a **Next.js 14 (App Router) + TypeScript (strict)** app that calls the Gemini API **server-side only** (`lib/gemini.ts`).

## Commands
- `npm run validate` - type-check, test type-check, lint and unit tests (run before committing)
- `npm run dev` / `npm run build` - run or build the app
- `npm run test:e2e -- --project=chromium` - Playwright end-to-end tests

## Conventions
- Route handlers live in `app/api/*/route.ts` and must: rate-limit (`lib/rate-limiter.ts`), read the body with `readJsonBody` (`lib/http.ts`), validate with the Zod schemas in `lib/validators.ts`, and run user text through `lib/guardrails.ts`.
- Never expose `GEMINI_API_KEY` to the browser or add third-party origins to the CSP in `next.config.mjs` without a reason.
- Entity IDs use branded types (`types/event.ts`); create them with the provided helpers instead of `as` casts.
- No `any` and no `@ts-ignore` (ESLint enforces this). Components must stay keyboard-accessible and pass the jest-axe suite.
