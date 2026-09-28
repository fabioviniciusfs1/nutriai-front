# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build; this also type-checks the project (`next build` runs `tsc` as part of the build)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config: `eslint-config-next` core-web-vitals + typescript)

There is no test suite configured in this repo.

## Cloudflare

- Deployed to Cloudflare Workers as a **static site** (`wrangler.jsonc`, `assets.directory: ./out`). `npm run build:cloudflare` sets `NEXT_OUTPUT=export`, which switches `next.config.ts` from `output: "standalone"` to `output: "export"` and writes one HTML file per route to `out/`. `wrangler.jsonc` runs that command itself (`build.command`) before `wrangler deploy` / `wrangler preview`, and has the empty `previews` block that `wrangler preview` requires.
- This only works because every route is static and all data is fetched from the backend by the browser (`NEXT_PUBLIC_API_URL` must be set when building, e.g. in `.env.production`). Adding server features (route handlers that read the request, middleware/proxy, `cookies()`/`headers()`, `next/image` optimization) would break the static export — the deploy would then need the OpenNext Cloudflare adapter instead.

## Docker

- `NEXT_PUBLIC_API_URL` is inlined at build time, so the `Dockerfile` takes it as a build arg and `docker-compose.yml` requires it (from the shell or a `.env` next to it — `.env*` files are excluded from the build context).
- `docker compose up -d --build` builds and runs the production image on port 3000.
- The `Dockerfile` is a 3-stage build (`deps` → `builder` → `runner`) relying on `output: "standalone"` in `next.config.ts` (the default when `NEXT_OUTPUT` is not `export`); the runner stage only copies `.next/standalone`, `.next/static`, and `public`, and runs as a non-root `nextjs` user. If you add a dependency that needs native/runtime files not covered by the standalone trace, the Docker image will be missing them even though `next dev`/`next build` work fine locally.

## Architecture

This is **NutriAI**, a nutrition/diet dashboard. All UI copy is in pt-BR — keep new text consistent with that.

- Next.js App Router (TypeScript, Tailwind CSS v4). Path alias `@/*` → `src/*`.
- Routes: `/login` (sign in / sign up), `/perfil` (body data, meals per day and `weighInDay` — the weekday of the weigh-in reminder; the "Sua meta diária" card asks `POST /profile/estimate` while the user edits; first stop after sign-up), `/` (`WeighInReminder` when `me.weighInDue`, the "Meta diária" card and the meal plan), `/nutrientes` (`NutrientsOverview`: three `NutrientSection` cards — Macronutrientes, Micronutrientes split into Vitaminas/Minerais, Fibras — holding one `NutrientTile` per nutrient), `/alimentos` (`MarkedFoods`: foods the user marked "Não gosto / Não quero / Não tenho", grouped by mark, with their substitute and a "Liberar" button), `/historico` (weight log, 7/30/90-day summary, calorie balance, one selected nutrient vs its goal or limit, activity, past meal plans; components in `src/components/history/`) and `/chat`. Page files are thin — they compose `AuthGuard`, the shared `Topbar` and page-specific components.
- **The backend owns all the logic and data; the front only displays and sends actions.** Endpoints and the business rules the backend implements are in `docs/api.md`; request/response types in `src/lib/api/types.ts` (the contract — keep both in sync). Calorie target, today's meal plan (swaps, portion factors, created/removed meals, redistribution), substitutes, food search, suggestions and history statistics all come computed. Don't reintroduce domain math in components — only display math (bar percentages, chart axes). The old client-side implementation is in git history (`158453f`), listed in `docs/api.md`.
  - `src/lib/api/client.ts` — `apiFetch` (base URL `NEXT_PUBLIC_API_URL`, Bearer token from `localStorage` `nutriai:token`, `X-Timezone` header so the backend knows the user's "today", errors as `ApiError` with the body's `error` message; a 401 drops the token). `useToken()` for the session.
  - `src/lib/api/query.ts` — `useApiQuery(path)` for reads: in-memory cache per path shared across components, cleared when the token changes; `invalidate(prefix…)` refetches. `mutate()` sends a change, puts the response in the cache of the path it represents (`update`) and refetches `invalidate` prefixes; on failure it returns `null` and sets the error toast rendered by `AuthGuard`. Components render `QueryStatus` (`src/components/api/`) while loading or on error.
  - `src/lib/api/actions.ts` — every plan/food/weight action (`changeMealTime`, `removeMeal`, `createMeal`, `addFood`, `removeExtraFood`, `swapFood`, `releaseFood`, `addWeightEntry`). Plan actions respond with the whole `TodayPlan`. Dialogs close only when the action returns non-`null`.
  - `src/lib/auth.ts` — `signIn`/`signUp` get a token, then `GET /me` (`Me`: user, profile, computed `targets`, `weighInDue`) is loaded through the query cache. `useAuth()` is `undefined` on the server, before hydration and while `/me` loads; `useSession()` also exposes the `/me` error. `AuthGuard` (client) redirects to `/login` without a session and to `/perfil` without a profile (`requireProfile={false}` on `/perfil` itself), and shows a retry screen if `/me` fails. Every protected page prerenders as a loading spinner.
- `src/lib/profile.ts` — `Profile` type and the form's option lists (labels only; the formulas are in the backend).
- `src/components/dashboard/`:
  - `Topbar` — client component; shows the app name "NutriAI", nav (`next/link` + `usePathname` for active-route highlighting), the profile link and "Sair". Below `md` the nav is hidden and the pages live in a dropdown menu opened by the hamburger button left of the app name (closes on link click or tapping outside).
  - `MacroDonut` — the "Meta diária" card: a plain-SVG semicircle gauge of `consumedKcal` vs `me.targets.calories` (full arc when over the target), "Calorias gastas" (`burnedKcal`), the macro `ProgressBar`s (colors in `src/lib/nutrients.ts`) and water.
  - `src/components/history/WeightChart`, `BalanceChart`, `NutrientChart` and `ActivityPanel` — Recharts wrappers. **Any component importing from `recharts` must have `"use client"`**, even ones that look presentational (e.g. `StatCard` used to omit it and broke `next build` with `createContext is not a function` during static generation, since Recharts needs client runtime). Set `isAnimationActive={false}` on series (`Area`, `Line`, `Bar`, `Pie`): the entry animation gets stuck after client-side navigation via the navbar and leaves the series clipped to a sliver, even though a full reload (F5) renders fine.
  - `ProgressBar` — shared consumed/target bar, used by `MacroDonut`.
  - `MealPlan` — renders `GET /plan/today`. Filter chips derived from the meal times. Each meal card: time badge → `TimePickerDialog` (its `TimeFields` is reused by `WeightDialog` and `CreateMealDialog`; hour/minute fields — not `<input type="time">`, whose native Android picker truncates its buttons); add food → `AddFoodDialog` (searches `/plan/meals/{id}/food-search`); remove → `RemoveMealDialog` (loads `/removal-options`: suggest a new one, redistribute to later meals, or just remove); each food row has "Substituir alimento" → `FoodFeedbackDialog` (reason "Não gosto / Não quero / Não tenho" + substitute from `/substitutes`), and foods with `extraId` have a trash button. "Nova refeição" → `CreateMealDialog` (name + time, then the backend's preview of what the assistant suggests and how the other meals shrink). Amounts are always grams.
- `src/lib/food-feedback.ts` — the "Não gosto / Não quero / Não tenho" options (ids, labels, icons), shared by `MealPlan`, `/alimentos` and the history page. "Liberar" on `/alimentos` only lifts the restriction — swaps already made stay (backend rule). Food group labels are in `src/lib/food-groups.ts`.
- `src/components/chat/ChatPanel.tsx` — history from `GET /chat/messages`, suggestions from `/chat/suggestions`; sending posts to `/chat/messages` and appends the assistant's reply.
- `next.config.ts`: `output: "standalone"` is required for the Docker build described above. No external image host is whitelisted (meals have no photos); if you add `next/image` with a remote URL, add its host under `images.remotePatterns` or it will refuse to load.
