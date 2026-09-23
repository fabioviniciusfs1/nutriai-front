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
- Routes: `/login` (sign in / sign up), `/perfil` (body data → calorie goal; first stop after sign-up), `/` (daily goal card + meal plan), `/nutrientes` (macro/vitamin/mineral progress cards), `/historico` (user weight log — `WeightChart` + `WeightDialog`, entries saved per user via `addWeightEntry` in `auth.ts`; purely a record, it never changes `profile.weightKg` or the calorie target; the chart prepends `mockWeightHistory` — 90 simulated days losing 0.5–1 kg/week, anchored on the first real entry and never stored —, 7/30/90-day calorie balance, daily intake of one selected nutrient from `/nutrientes` vs its goal (`NutrientChart`, fed by `nutrientHistory`/`nutrientGroups` in mock-data; nutrients with `limit: true` — açúcares, gordura saturada, colesterol, sódio — treat `meta` as a maximum, so the chart text says "limite" and counts days above it), activity data shaped like Google Fit / Apple Saúde exports, past meal plans; components in `src/components/history/`) and `/chat` (mocked AI chat). Page files are thin — they compose `AuthGuard`, the shared `Topbar` and page-specific components.
- **Auth is simulated in the browser** (`src/lib/auth.ts`): users, session and each user's profile live in `localStorage` (`nutriai:users`, `nutriai:session`), read via `useAuth()` (`useSyncExternalStore`; returns `undefined` on the server/before hydration). Not secure — it's the seam to replace when a backend exists. `AuthGuard` (client) redirects to `/login` without a session and to `/perfil` without a profile (`requireProfile={false}` on `/perfil` itself). Because the session is client-only, every protected page prerenders as a loading spinner.
- `src/lib/calorie-target.ts` — Mifflin-St Jeor BMR × activity factor, ±goal adjustment (−500 / 0 / +300), floored at 1200 (F) / 1500 (M); plus water (35 ml/kg). The resulting target drives the "Meta diária" card and the history goal line. Macro gram targets in `macroBreakdown` are still static mock data.
- `src/lib/mock-data.ts` is the single source of all data (macro breakdown, micronutrients, meal plan/foods, activity and plan history, chat messages/suggestions). **There is no backend or API layer** — every component renders straight from this static data. When asked to add "real" data, this is the file to extend, and it's the natural seam if a backend gets introduced later.
- `src/components/dashboard/`:
  - `Topbar` — client component; nav is `next/link` + `usePathname` for active-route highlighting.
  - `MacroDonut` (plus `src/components/history/WeightChart`, `BalanceChart`, `NutrientChart` and `ActivityPanel`) — Recharts wrappers. **Any component importing from `recharts` must have `"use client"`**, even ones that look presentational (e.g. `StatCard` used to omit it and broke `next build` with `createContext is not a function` during static generation, since Recharts needs client runtime). Set `isAnimationActive={false}` on series (`Area`, `Line`, `Bar`, `Pie`): the entry animation gets stuck after client-side navigation via the navbar and leaves the series clipped to a sliver, even though a full reload (F5) renders fine.
  - `ProgressBar` — shared consumed/target bar, used by `MacroDonut` and `src/components/nutrition/NutrientCard`.
  - `MealPlan` — filter by meal time (each `mealPlan` entry has a `time` like `"12:30"`; the chips are derived from those times, there are no category names). The time badge on each meal opens `TimePickerDialog` (its `TimeFields` is reused by `WeightDialog`) (hour/minute fields that can be typed or stepped with arrows — not `<input type="time">`, whose native Android picker truncates its buttons); the change is saved per user through `saveMealTime` in `auth.ts`, and meals are sorted by time; each meal lists individual foods, with per-meal macro/kcal totals computed client-side via `sumTotals`, not stored pre-aggregated in the mock data.
- `src/lib/food-feedback.ts` — the "Não gosto / Não quero / Não tenho" options (ids, labels, icons), shared by `MealPlan` and the history page. Marking a food in `MealPlan` goes through `ConfirmDialog` (native `<dialog>`) and is client state only — it resets on reload.
- `src/components/chat/ChatPanel.tsx` — client-only mock chat. Sending a message appends it and picks a random canned reply from `chatFallbackReplies`; there's no real AI/backend call.
- `next.config.ts`: `output: "standalone"` is required for the Docker build described above. No external image host is whitelisted (meals have no photos); if you add `next/image` with a remote URL, add its host under `images.remotePatterns` or it will refuse to load.
