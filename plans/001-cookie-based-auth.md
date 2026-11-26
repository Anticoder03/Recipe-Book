# 001 — Move the auth token into an HttpOnly cookie

- **Status**: TODO
- **Commit**: 47a5366
- **Severity**: HIGH
- **Category**: Security
- **Rule**: react-doctor/auth-token-in-web-storage
- **Estimated scope**: 5 files (3 frontend, 2 backend), ~120 lines

## Problem

`frontend/src/auth/AuthProvider.jsx:15`, `:21-22`, `:29-30` persist the JWT in `localStorage`:

    // frontend/src/auth/AuthProvider.jsx:15 — current
    const [token, setToken] = useState(() => localStorage.getItem('rb_token'))

    // frontend/src/auth/AuthProvider.jsx:20-26 — current
    const persist = useCallback((nextToken, nextUser) => {
      localStorage.setItem('rb_token', nextToken)
      localStorage.setItem('rb_user', JSON.stringify(nextUser))
      setToken(nextToken)
      setUser(nextUser)
      setChecking(false)
    }, [])

`frontend/src/api/client.js:8-11` then reads that token and sends it as a Bearer header. Any XSS in this app can read `rb_token` and exfiltrate it. `README.md:201` acknowledges the risk but no fix has been applied.

Validation outcome: **Confirmed failure**. The stored value is a usable HS256 credential (`backend/middleware/auth.js:5-9`), not non-sensitive metadata.

## Target

Canonical fix recipe from `https://www.react.doctor/prompts/rules/react-doctor/auth-token-in-web-storage.md`, inlined verbatim:

> Move the credential to a server-set `HttpOnly`, `Secure`, and appropriate `SameSite` cookie so browser JavaScript cannot read it. Keep only non-sensitive display metadata in browser storage. If an API returns a usable key in an opaque `id` field, treat that field as a credential, remove it from persisted records, and rotate any key already exposed to browser storage.

Exact end state:

    // backend/controllers/authController.js — signup and login response, before return res.status(...).json(...)
    res.cookie('rb_token', generateToken(user._id), {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

Keep the existing `token` field in the JSON body for non-browser API clients, but the browser must never write it to storage. Add `GET /api/auth/logout` that calls `res.clearCookie('rb_token', { httpOnly: true, secure: config.isProd, sameSite: 'lax' })`.

    // backend/middleware/auth.js:12-15 — replace the header-only read with cookie fallback
    const authHeader = req.headers.authorization || ''
    const [scheme, headerToken] = authHeader.split(' ')
    const token = scheme === 'Bearer' && headerToken ? headerToken : req.cookies?.rb_token

    // Require cookie-auth mutations to come from the app's own origin.
    if (req.cookies?.rb_token && !headerToken) {
      const origin = req.headers.origin
      if (origin && !config.clientOrigins.includes(origin)) {
        return res.status(403).json({ success: false, message: 'Origin not allowed' })
      }
    }

Register `cookie-parser` in `backend/server.js` next to `express.json()`, and add the matching dependency to `backend/package.json`.

    // frontend/src/api/client.js — remove the storage interceptor
    const client = axios.create({
      baseURL,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    })

    // frontend/vite.config.js — add a same-origin proxy so SameSite=Lax works in dev
    server: {
      proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
    }

Set `VITE_API_URL=/api` in `frontend/.env.example`.

    // frontend/src/auth/AuthProvider.jsx — target shape
    const [user, setUser] = useState(readStoredUser)
    const [checking, setChecking] = useState(true)

    const persist = useCallback((nextUser) => {
      localStorage.setItem('rb_user', JSON.stringify(nextUser))
      setUser(nextUser)
      setChecking(false)
    }, [])

    const logout = useCallback(async () => {
      try { await client.post('/auth/logout') } finally {
        localStorage.removeItem('rb_user')
        setUser(null)
        setChecking(false)
      }
    }, [])

Remove the `token` state, the `/auth/me` effect's `token` argument, and `token` from the memoized context value. `login`/`signup` call `persist(data.user)`; the server cookie handles authentication. Keep `rb_user` (name/email/id only) in storage as non-sensitive display metadata.

## Repo conventions to follow

- Keep the `useCallback` + `useMemo` provider pattern in `frontend/src/auth/AuthProvider.jsx:59-80`.
- Keep pure storage helpers at file top like `readStoredUser` at `AuthProvider.jsx:5-12`.
- Mirror backend error shape (`{ success, message, errors }`) used in `backend/controllers/authController.js`.
- Preserve the existing `useAuth()` API (`user`, `checking`, `login`, `signup`, `logout`) so `AppShell`, `ProtectedRoute`, and `AuthPage` need no edits.

## Steps

1. In `backend/server.js`, add `cookieParser()` immediately after `express.json({ limit: '1mb' })`; add `cookie-parser` to `backend/package.json` with `npm install cookie-parser` (allowed only by the executor; this plan makes no edits itself).
2. In `backend/controllers/authController.js`, set the cookie in both `signup` and `login` before sending the JSON response; add `logout`.
3. In `backend/middleware/auth.js`, add the cookie fallback and same-origin origin check shown above. Do not weaken the `algorithms: ['HS256']` verify options or the user reload.
4. In `frontend/src/api/client.js`, delete the request interceptor and add `withCredentials: true`.
5. In `frontend/vite.config.js`, add the `/api` proxy; update `frontend/.env.example` to `VITE_API_URL=/api`.
6. In `frontend/src/auth/AuthProvider.jsx`, apply the target shape. Do not call `setState` synchronously inside the effect body (ESLint `react-hooks/set-state-in-effect`); `persist`/`logout` are called from promise callbacks only.
7. Update `README.md` security/auth notes to describe cookie storage instead of "prefer httpOnly later".
8. Re-read the full diff; remove unrelated churn.

## Boundaries

- Do NOT keep a copy of the JWT in any web storage key, even temporarily.
- Do NOT disable or suppress `react-doctor/auth-token-in-web-storage`.
- Do NOT replace server-side authorization with client-only checks.
- Do NOT change public `useAuth()` consumer APIs or visible UI copy except the README note.
- STOP if the code has drifted from commit `47a5366`; report drift instead of improvising.

## Verification

- **Mechanical**:
  - `cd backend && npm start` with a test Mongo DB; `cd frontend && npm run lint && npm run build`.
  - `npx react-doctor@latest --scope changed` clears `auth-token-in-web-storage` and the full score is not below 64.
  - `curl -i` signup/login and confirm `Set-Cookie: rb_token=...; HttpOnly; ...`; confirm `GET /api/auth/me` works with the cookie and no Authorization header.
  - Browser DevTools Application tab: no `rb_token` key after login; Network tab: protected requests send `Cookie` and no `Authorization`.
- **Behavior check**: Log in on `http://localhost:5173`, reload, navigate to `/recipes/new`, create a recipe, then log out and confirm protected routes redirect to `/login`. Confirm a cross-origin POST with the cookie is rejected with 403.
- **Done when**: the diagnostic is clear, score is not lower, checks pass, and no browser JavaScript can read the token.
