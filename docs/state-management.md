# State Management

- Use Pinia setup stores (`defineStore('id', () => {})`).
- Store sections should stay predictable: state, getters, actions, realtime helpers, reset.
- Track `isLoading` and `error` per store.
- Keep API calls inside store actions, not components.
- Expose focused mutation helpers for optimistic and realtime updates.

## Existing patterns
- `tasks.store.ts` demonstrates grouped computed getters, async CRUD actions, optimistic updates, and realtime helpers.

## Proposed
- Proposed: standardize store method order across all stores for faster code review.
