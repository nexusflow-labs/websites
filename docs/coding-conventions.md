# Coding Conventions

- Use Vue SFC with `<script setup lang="ts">`.
- Use `@/` alias imports.
- Group by domain across pages/components/stores/api/types.
- Prefer typed interfaces for props and request payloads.
- Keep async logic in stores or API modules, not deep in presentational UI components.
- Normalize API errors via `getErrorMessage`.

## Naming
- Components: `PascalCase.vue`
- UI primitives: `Nx*`
- Stores: `<domain>.store.ts` with `use<Domain>Store`
- APIs: `<domain>.api.ts` with `<domain>Api`

## Proposed
- Proposed: require explicit return types on all exported functions.
