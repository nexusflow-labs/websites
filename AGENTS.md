# AGENTS.md

## Project overview
NexusFlow frontend is a Vue 3 + TypeScript single-page app for workspace/project/task collaboration with auth, notifications, and realtime updates.

## Tech stack
- Vue 3 (`<script setup lang="ts">`)
- TypeScript with `@/*` path alias
- Nx + Vite
- Pinia stores (setup stores)
- Vue Router with route guards
- Axios API layer with token refresh
- Socket.io client for realtime
- Tailwind CSS v4 + custom theme tokens

## Folder structure
- `src/app`: app shell (`App.vue`) and app-level tests.
- `src/pages`: route-level pages (auth, workspace, project, user).
- `src/components`: reusable and domain components (`ui`, `task`, `workspace`, etc.).
- `src/stores`: Pinia stores by domain.
- `src/api`: HTTP client and per-domain API modules.
- `src/router`: route table and guards.
- `src/types`: shared domain/API types.
- `src/composables`: reusable composition functions.
- `src/styles`: Tailwind/CSS theme and utilities.
- `docs`: project documentation for contributors/Codex.
- `.codex/skills`: reusable Codex task workflows.

## Coding conventions
- Use `script setup` + TypeScript in Vue SFCs.
- Use `@/` imports over deep relative paths.
- Keep domain grouping (`tasks.store.ts`, `tasks.api.ts`, `task.types.ts`, `components/task/*`).
- Prefer explicit return types on store actions and exported helpers.
- Use `getErrorMessage` for API error normalization in stores.
- Keep comments concise and meaningful (section headers are used in stores).

## Component conventions
- UI primitives are prefixed `Nx` in `src/components/ui`.
- Domain components live under domain folders (`task`, `workspace`, `project`, etc.).
- Strongly type props with `interface Props` + `withDefaults(defineProps<Props>(), ...)` where defaults exist.
- Use computed class maps for variant/size UI components.
- Re-export shared UI components from `src/components/ui/index.ts`.

## State management conventions
- Use Pinia setup stores: `defineStore('name', () => { ... })`.
- Store shape: state refs, computed getters, async actions, sync mutation helpers, `reset`.
- Use `isLoading`/`error` flags at store level.
- Realtime updates should have dedicated mutation helpers (`add*FromRealtime`, `update*FromRealtime`, `remove*FromRealtime`).
- Cross-store shared initialization belongs in app bootstrap (`main.ts`) or guards/composables.

## API/service conventions
- Use shared Axios instance in `src/api/http.ts`.
- Keep endpoint logic in domain API modules (`*.api.ts`), not in components.
- API responses are unwrapped centrally by interceptor; consumers should expect payload data directly.
- Auth token lifecycle is handled by `tokenManager` and 401 refresh queue in `http.ts`.
- Export API modules via `src/api/index.ts`.

## Routing conventions
- Define routes in `src/router/index.ts` with lazy-loaded pages.
- Use `beforeEnter` guards (`authGuard`, `guestGuard`) instead of auth checks inside pages.
- Attach `meta.title` for document title handling.
- Keep workspace child routes nested under `/workspaces/:workspaceId`.

## Styling conventions
- Tailwind CSS v4 is primary styling approach.
- Reuse theme tokens/utilities in `src/styles/main.css` (`@theme`, `@utility`).
- Keep component styles mostly utility-first in templates/computed class strings.
- Prefer existing color tokens (`primary`, `success`, `warning`, `danger`) before adding new palettes.

## Testing/build commands
- Install deps: `npm install`
- Dev server: `npm start`
- Build: `npm run build`
- Tests: `npm test`
- (Optional) Type checks/lint should run through Nx targets if configured.

## Rules for safe edits
- Do not change API contract assumptions unless updating related types/stores/components together.
- Do not bypass `http.ts` by adding ad-hoc fetch/axios clients.
- Keep route names and params stable; they are used across navigation and guards.
- Preserve Pinia store IDs and exported function names to avoid runtime breakage.
- For broad refactors, update barrel exports (`src/api/index.ts`, `src/stores/index.ts`, `src/components/ui/index.ts`) when needed.
- If no existing pattern exists, add a minimal pattern and label it **Proposed** in docs/PR notes.

## What Codex must check before final answer
- Confirm files changed match the requested scope only.
- Run relevant checks/tests for touched areas (at minimum `npm test` when feasible).
- Verify imports and path aliases resolve.
- Verify no obvious route/store/API naming mismatches were introduced.
- Summarize: what changed, why, and any **Proposed** conventions introduced.
