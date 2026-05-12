# API Layer

## Core rules
- All HTTP goes through `src/api/http.ts`.
- Domain modules (`*.api.ts`) wrap endpoints and return typed payloads.
- Global interceptor unwraps `{ success, data }` shape.
- Auth token refresh queue handles concurrent 401s.

## Error handling
- Store actions should use `getErrorMessage(error)` and set store-level `error` state.

## Proposed
- Proposed: for new endpoints, define/extend request-response types in `src/types` before store/component integration.
