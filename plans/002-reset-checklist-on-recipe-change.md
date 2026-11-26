# 002 — Reset the ingredient checklist when the recipe changes

- **Status**: TODO
- **Commit**: 47a5366
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan (async state carry-over; adjacent to react-doctor/no-array-index-as-key)

## Problem

`frontend/src/pages/RecipeDetailPage.jsx:17` creates one `Set` for ticked ingredients, and the fetch effect at `:19-40` never resets it when `id` changes:

    // frontend/src/pages/RecipeDetailPage.jsx:17
    const [checked, setChecked] = useState(() => new Set())

    // frontend/src/pages/RecipeDetailPage.jsx:22-29 — current
    client
      .get(`/recipes/${id}`)
      .then(({ data }) => {
        if (active) {
          setRecipe(data.recipe)
          setStatus('ready')
        }
      })

React keeps this component mounted when the router changes only `:id`, so ticking ingredient 2 on recipe A and then opening recipe B shows ingredient 2 of B as already ticked. The same effect also leaves recipe A's title and steps on screen while recipe B is loading.

The scanner's adjacent `react-doctor/no-array-index-as-key` finding at `:126` is **rejected**: `ingredients` and `steps` are static, never reordered or filtered while mounted, and the key includes the item text (`${ingredient}-${index}`). It is the stale `Set` that is the real defect.

## Target

Reset checklist state in the existing promise callback (no synchronous `setState` in an effect body), and derive the loading guard from the rendered recipe id:

    // frontend/src/pages/RecipeDetailPage.jsx — target effect callback
    client
      .get(`/recipes/${id}`)
      .then(({ data }) => {
        if (active) {
          setRecipe(data.recipe)
          setChecked(new Set())
          setStatus('ready')
        }
      })

    // frontend/src/pages/RecipeDetailPage.jsx — target render guard (replaces lines 66-68)
    const isStaleRecipe = recipe && recipe._id !== id

    if (status === 'loading' || isStaleRecipe) {
      return <p className="rb-loading" role="status">Opening the recipe…</p>
    }

Keep `useEffect(..., [id])` unchanged and keep the cleanup that sets `active = false`.

## Repo conventions to follow

- Match the cancellation pattern already used in `frontend/src/pages/RecipeFormPage.jsx:13-31` (`let active = true` + cleanup).
- Keep state local to the page; do not lift it into context or add a state library.
- Preserve `toggleIngredient` at `:42-52` and the checkbox markup at `:124-137`.
- Do not introduce `useEffect` calls that set state synchronously; ESLint 10 enforces `react-hooks/set-state-in-effect` in this repo.

## Steps

1. At `frontend/src/pages/RecipeDetailPage.jsx:25-28`, add `setChecked(new Set())` immediately after `setRecipe(data.recipe)` inside the `.then` callback.
2. At `:66-68`, replace the loading-only early return with the `isStaleRecipe` guard shown above; place the `const` just above the existing `if` so it runs on every render.
3. Leave the error branch at `:70-79` and the article markup unchanged.
4. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT change the API call, route param name, or error handling.
- Do NOT change list keys; the scanner's index-key warning is deliberately accepted here.
- Do NOT add dependencies or tests that require a new test runner.
- STOP if the code has drifted from commit `47a5366`; report drift instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npm run lint && npm run build`; `npx react-doctor@latest --scope changed` must not introduce new diagnostics and the score must not drop below 64.
- **Behavior check**: Open recipe A, tick two ingredients, then use the browser back button and open recipe B from `/recipes`. Confirm B's checkboxes are all empty and A's title/steps never flash while B loads. Repeat by navigating A → B → A and confirm ticks do not carry across.
- **Done when**: checkboxes reset on every successful recipe load, the stale-title flash is gone, and all checks pass.
