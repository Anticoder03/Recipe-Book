# 003 — Close the mobile menu from native links instead of a static wrapper

- **Status**: TODO
- **Commit**: 47a5366
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: react-doctor/no-static-element-interactions
- **Estimated scope**: 1 file, ~15 lines

## Problem

`frontend/src/components/AppShell.jsx:13-15` and `:26` put a click handler on a static `div` wrapper:

    // frontend/src/components/AppShell.jsx:13-15 — current
    const closeMenuOnNavigate = (event) => {
      if (event.target.closest('a')) setMenuOpen(false)
    }

    // frontend/src/components/AppShell.jsx:26 — current
    <div className="rb-header__inner" onClick={closeMenuOnNavigate}>

The wrapper is only catching bubbled clicks from its `<a>` children; it is not itself an interaction target. React Doctor flags it because assistive tech sees a clickable `div` with no interactive role. Keyboard activation works only because the real links handle Enter, but the semantics are wrong.

Validation outcome: **Confirmed failure** (the canonical suppression applies to a bubbled-event wrapper, but the cleaner fix is to remove the handler and let native links do the work).

## Target

Canonical fix recipe from `https://www.react.doctor/prompts/rules/react-doctor/no-static-element-interactions.md`, inlined verbatim:

> If the element is an interaction target, use a native semantic element (<button>, <a href>, <input>): they ship with role, focus, and keyboard support. If you must keep the div, add an appropriate role (role='button', 'link', 'menuitem', 'switch', etc.) plus tabIndex={0} and keyboard handlers so users can reach and activate it. Do not use role='presentation'.

Exact end state for `frontend/src/components/AppShell.jsx`:

    // Remove lines 13-15 entirely; remove onClick from line 26.
    <div className="rb-header__inner">

    // Add the same native-link handler to the brand link at :27.
    <Link to="/" className="rb-brand" aria-label="Recipe Book home" onClick={() => setMenuOpen(false)}>

    // Add it to each NavLink at :50, :56, and :65.
    <NavLink
      to="/recipes"
      className={({ isActive }) => `rb-nav__link${isActive ? ' is-active' : ''}`}
      onClick={() => setMenuOpen(false)}
    >
      Recipes
    </NavLink>

Apply the identical `onClick={() => setMenuOpen(false)}` prop to the `/recipes/new` and `/bulk` NavLinks. Keep the toggle button at `:34-43` exactly as it is.

## Repo conventions to follow

- The app already uses React Router `<Link>`/`<NavLink>` for all navigation (`frontend/src/App.jsx`, `frontend/src/components/RecipeCard.jsx`); follow that pattern.
- Keep `menuOpen` state local to `AppShell` (`useState` at `:11`).
- Do not add `role`, `tabIndex`, or key handlers to the wrapper; native `<a>` elements already provide them.

## Steps

1. In `frontend/src/components/AppShell.jsx`, delete the `closeMenuOnNavigate` function at lines 13-15.
2. Remove `onClick={closeMenuOnNavigate}` from the `div` at line 26.
3. Add `onClick={() => setMenuOpen(false)}` to the brand `Link` at line 27 and to all three `NavLink` elements at lines 50, 56, and 65.
4. Re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT disable or suppress `react-doctor/no-static-element-interactions`.
- Do NOT change navigation destinations, `aria-expanded`, `aria-controls`, or CSS classes.
- Do NOT change which links are visible to logged-in vs anonymous users.
- STOP if the code has drifted from commit `47a5366`; report drift instead of improvising.

## Verification

- **Mechanical**: `cd frontend && npm run lint && npm run build`; `npx react-doctor@latest --scope changed` clears this diagnostic and the full score is not below 64.
- **Behavior check**: At a viewport under 1000px, open the mobile menu with the toggle, press Tab to each link and activate it with Enter. Confirm navigation happens and the menu closes. Repeat with a mouse click on the brand logo and on "Bulk import" while logged in.
- **Done when**: no click handler remains on a static element, keyboard and pointer navigation both close the menu, and all checks pass.
