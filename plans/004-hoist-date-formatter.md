# 004 — Hoist the date formatter to module scope

- **Status**: TODO
- **Commit**: 47a5366
- **Severity**: LOW
- **Category**: Performance
- **Rule**: react-doctor/js-hoist-intl
- **Estimated scope**: 1 file, ~8 lines

## Problem

`frontend/src/utils/errors.js:36-43` builds a new `Intl.DateTimeFormat` on every call:

    // frontend/src/utils/errors.js:36-43 — current
    export function formatDate(value) {
      if (!value) return ''
      return new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date(value))
    }

`formatDate` is called once per recipe card (`frontend/src/components/RecipeCard.jsx:15`) and on the detail page (`:94`), so a collection view allocates a formatter per row. Locale and options are fixed, so construction can safely happen once.

Validation outcome: **Confirmed failure** for the modeled cost; impact is LOW because the list is small today, but the fix is trivial and removes the diagnostic.

## Target

Canonical fix recipe from `https://www.react.doctor/prompts/rules/react-doctor/js-hoist-intl.md`, inlined verbatim:

> Hoist to module scope: const numberFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }); In React, when locale or options vary, wrap with useMemo(() => new Intl.NumberFormat(locale), [locale]). Each constructor loads and allocates locale-data tables that are expensive to rebuild per render or per list item. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl

Exact end state:

    // frontend/src/utils/errors.js — module scope, above normalizeApiError
    const dateFormatter = new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

    export function formatDate(value) {
      if (!value) return ''
      return dateFormatter.format(new Date(value))
    }

## Repo conventions to follow

- `frontend/src/utils/errors.js` contains pure module-level helpers; keep the new constant at the top of that file.
- Keep the `formatDate` export name and signature unchanged; both call sites stay untouched.
- No `useMemo` is needed because locale and options never vary in this app.

## Steps

1. At the top of `frontend/src/utils/errors.js`, add the `dateFormatter` constant shown above.
2. In `formatDate`, replace the inline `new Intl.DateTimeFormat(...)` with `dateFormatter.format(new Date(value))`.
3. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the locale (`'en'`) or the date options; output must stay byte-identical.
- Do NOT add dependencies or wrap this pure helper in React hooks.
- STOP if the code has drifted from commit `47a5366`; report drift instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npm run lint && npm run build`; `npx react-doctor@latest --scope changed` clears `js-hoist-intl` and the full score is not below 64.
- **Behavior check**: Load `/recipes` and a recipe detail page; confirm dates still render like "24 Nov 2026" and that an empty/missing date still renders as an empty string.
- **Done when**: the diagnostic is clear, output is unchanged, and all checks pass.
