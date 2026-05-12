# Codex Workflows

## Before editing
1. Inspect related page/component/store/api/type files.
2. Reuse existing patterns first; mark any new pattern as **Proposed**.

## During editing
1. Keep changes in the correct layer (UI vs store vs API).
2. Update barrels (`index.ts`) when exporting new modules.
3. Keep route/store/API naming aligned.

## Before final response
1. Run relevant checks (`npm test`, optionally build).
2. Report changed files and intent.
3. Call out risks, follow-ups, and any **Proposed** conventions.
