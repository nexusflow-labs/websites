# Architecture

## High-level flow
1. `src/main.ts` creates app, installs Pinia + router, initializes auth store.
2. Router guards control guest/auth access.
3. Pages orchestrate domain components and stores.
4. Stores call domain API modules.
5. API modules use shared `http` client with auth/refresh interceptors.
6. Realtime events are applied through explicit store mutation helpers.

## Layering
- UI: `src/components/ui`
- Feature UI: `src/components/<domain>`
- Route pages: `src/pages`
- State: `src/stores`
- Data access: `src/api`
- Infrastructure: `src/router`, `src/composables`, `src/styles`, `src/types`

## Proposed
- Proposed: keep page files thin (fetch + compose), and push business logic into stores/composables.
