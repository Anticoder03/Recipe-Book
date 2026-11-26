# React improvement plans

These plans are the read-only output of the `improve-react` workflow. They do **not** edit source code. Each plan is self-contained and can be handed to any executor, including a cheaper agent with no conversation context.

- **Scan evidence**: `npx react-doctor@latest --json` — 4 warnings, score **64 / 100** (`Needs work`), 22 files analysed.
- **Commit stamped on all plans**: `47a5366`.
- **Scan report**: `frontend/react-doctor-report.json` was generated outside `plans/` and deleted after these plans were written, as the skill requires.

## Vetted findings

| # | Severity | Category | Location | Rule | Finding | Fix summary |
| - | -------- | -------- | -------- | ---- | ------- | ----------- |
| 1 | HIGH | Security | `frontend/src/auth/AuthProvider.jsx:21` | `react-doctor/auth-token-in-web-storage` | JWT is written to `localStorage` and read by any XSS. | Server-set HttpOnly/Secure/SameSite cookie; remove token from web storage. |
| 2 | MEDIUM | Bugs & correctness | `frontend/src/pages/RecipeDetailPage.jsx:17,22-29` | Beyond the scan | Ticked ingredients carry over when the router changes only `:id`; stale recipe renders while the next one loads. | Reset `checked` in the fetch callback; derive a loading guard from `recipe._id !== id`. |
| 3 | MEDIUM | Accessibility | `frontend/src/components/AppShell.jsx:26` | `react-doctor/no-static-element-interactions` | Click handler on a `div` wrapper has no interactive role. | Remove the wrapper handler; attach close handlers to native `Link`/`NavLink` elements. |
| 4 | LOW | Performance | `frontend/src/utils/errors.js:38` | `react-doctor/js-hoist-intl` | `Intl.DateTimeFormat` is rebuilt once per recipe card. | Hoist the formatter to module scope. |

**Rejected finding:** `react-doctor/no-array-index-as-key` at `frontend/src/pages/RecipeDetailPage.jsx:126`. The ingredient and step lists never reorder or filter while mounted, and each key includes the item text, so index suffixing is stable here. The real state bug is covered by plan 002.

## Missed opportunities (not defects; no plan yet)

1. **Error boundary around route content** — a render error in any page currently blanks the whole app. Confirm with a thrown error in a dev-only branch before adding `react-error-boundary` or a local class boundary.
2. **Split auth context** — `useAuth()` exposes `login`/`signup`/`logout` to every consumer, including `ProtectedRoute`, which only needs `user`/`checking`. Profile with React DevTools before splitting; the tree is small today.
3. **Optimistic ingredient checklist** — the tick state is local-only already; persisting it would need a backend field and is a product decision, not a bug fix.
4. **AbortController on page fetches** — the current `active` flag prevents state updates after unmount but does not cancel in-flight requests. Measure request churn on slow networks before adding controllers.

## Execution order and dependencies

| Order | Plan | Depends on | Why |
| ----- | ---- | ---------- | --- |
| 1 | [002 — Reset checklist](002-reset-checklist-on-recipe-change.md) | Nothing | Isolated frontend bug fix; quick win. |
| 2 | [003 — Native nav links](003-native-links-for-mobile-nav-close.md) | Nothing | Isolated accessibility fix; quick win. |
| 3 | [004 — Hoist formatter](004-hoist-date-formatter.md) | Nothing | Trivial, behavior-preserving cleanup. |
| 4 | [001 — Cookie auth](001-cookie-based-auth.md) | Do 1–3 first | Cross-stack change; do it last so its regression check covers a stable tree. |

Plans 001–004 each expect to start from commit `47a5366`. After executing earlier plans, refresh the line references in later plans (`reconcile` behavior) before applying them.

## Status legend

- `TODO` — not started.
- `IN PROGRESS` — executor actively applying it.
- `DONE` — verification section passed.
- `DROPPED` — deliberately not doing; add a reason next to the table row.
