# name
vue-state-management

# description
Reusable Codex workflow for vue-state-management tasks in this Vue + TypeScript + Pinia + Nx repo.

## Trigger cases
- Use when request clearly matches "vue-state-management" outcomes.

## When to use
- User asks for this exact task type in this repository.
- Change touches Vue components, Pinia stores, API modules, router, or shared types.

## When not to use
- Non-Vue infrastructure-only tasks unrelated to app code.
- One-line typo fixes with no workflow value.

## Step-by-step workflow
1. Inspect related files in `src/pages`, `src/components`, `src/stores`, `src/api`, `src/types`, and `src/router`.
2. Identify existing pattern; if absent, define a minimal **Proposed** pattern.
3. Implement changes in the correct layer:
   - UI/component behavior in components/pages.
   - State/business logic in stores/composables.
   - Network logic in API modules via `http.ts`.
4. Preserve naming conventions (`Nx*`, `use*Store`, `*.api.ts`, route `meta.title`).
5. Update exports (`index.ts`) when creating reusable modules.
6. Run checks (`npm test`; optionally `npm run build` for wider changes).
7. Summarize edits, impacted files, checks, and any **Proposed** convention.

## Output checklist
- [ ] Followed existing repo conventions or marked new ones as **Proposed**.
- [ ] Kept logic in correct architecture layer.
- [ ] Added/updated imports and exports cleanly.
- [ ] Ran relevant commands and reported results.
- [ ] Documented assumptions and follow-up recommendations.

## Examples for this repo
- Build/update components under `src/components/*` using `<script setup lang="ts">` and typed props.
- Refactor repeated request handling into `src/stores/*.store.ts` actions.
- Fix auth/API bugs via `src/api/http.ts` refresh + error normalization.
- Review route additions in `src/router/index.ts` and corresponding pages.
