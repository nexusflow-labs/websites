# Component Guidelines

## Placement
- Put cross-domain primitives in `src/components/ui`.
- Put feature/domain components in `src/components/<domain>`.
- Put route-only composition in `src/pages`.

## Structure
- Typed props via `interface Props` and `withDefaults` when defaults exist.
- Use computed class maps for variants/sizes (`NxButton` pattern).
- Emit-focused logic can stay in component; data fetching belongs to stores/composables.

## Reuse
- Export shared UI components from `src/components/ui/index.ts`.
- Prefer existing `Nx*` components before creating new primitives.

## Proposed
- Proposed: each new domain component should include a short “Dependencies” comment if it relies on a specific store/router param.
