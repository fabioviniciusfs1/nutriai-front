# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build; this also type-checks the project (`next build` runs `tsc` as part of the build)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + typescript)

There is no test suite configured in this repo.

## Docker

- `docker compose up -d --build` builds and runs the production image on port 3000.
- The `Dockerfile` is a 3-stage build (`deps` → `builder` → `runner`) relying on `output: "standalone"` in `next.config.ts`; the runner stage only copies `.next/standalone`, `.next/static`, and `public`, and runs as a non-root `nextjs` user. If you add a dependency that needs native/runtime files not covered by the standalone trace, the Docker image will be missing them even though `next dev`/`next build` work fine locally.

## Architecture

This is **NutriAI**, a nutrition/diet dashboard. All UI copy is in pt-BR — keep new text consistent with that.

- Next.js App Router (TypeScript, Tailwind CSS v4). Path alias `@/*` → `src/*`.
- Four routes: `/` (dashboard home: meal plan + daily goal card), `/nutrientes` (calorie chart plus macro/vitamin/mineral progress cards), `/historico` (7/30/90-day calorie balance, activity data shaped like Google Fit / Apple Saúde exports, past meal plans; components in `src/components/history/`) and `/chat` (mocked AI chat). The page files are thin — they just compose the shared `Topbar` with page-specific components.
- `src/lib/mock-data.ts` is the single source of all data (macro breakdown, calorie history, meal plan/foods, chat messages/suggestions). **There is no backend or API layer** — every component renders straight from this static data. When asked to add "real" data, this is the file to extend, and it's the natural seam if a backend gets introduced later.
- `src/components/dashboard/`:
  - `Topbar` — client component; nav is `next/link` + `usePathname` for active-route highlighting.
  - `CalorieChart`, `MacroDonut` — Recharts wrappers. **Any component importing from `recharts` must have `"use client"`**, even ones that look presentational (e.g. `StatCard` used to omit it and broke `next build` with `createContext is not a function` during static generation, since Recharts needs client runtime). Set `isAnimationActive={false}` on series (`Area`, `Line`, `Bar`, `Pie`): the entry animation gets stuck after client-side navigation via the navbar and leaves the series clipped to a sliver, even though a full reload (F5) renders fine.
  - `ProgressBar` — shared consumed/target bar, used by `MacroDonut` and `src/components/nutrition/NutrientCard`.
  - `MealPlan` — category filter (`mealCategories`) over `mealPlan` entries; each meal lists individual foods, with per-meal macro/kcal totals computed client-side via `sumTotals`, not stored pre-aggregated in the mock data.
- `src/lib/food-feedback.ts` — the "Não gosto / Não quero / Não tenho" options (ids, labels, icons), shared by `MealPlan` and the history page. Marking a food in `MealPlan` goes through `ConfirmDialog` (native `<dialog>`) and is client state only — it resets on reload.
- `src/components/chat/ChatPanel.tsx` — client-only mock chat. Sending a message appends it and picks a random canned reply from `chatFallbackReplies`; there's no real AI/backend call.
- `next.config.ts`: `images.remotePatterns` whitelists `images.unsplash.com` for `next/image` — new external image hosts must be added there or `next/image` will refuse to load them. `output: "standalone"` is required for the Docker build described above.
