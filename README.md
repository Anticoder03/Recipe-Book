# Recipe Book

A full-stack recipe application. The repository contains a hardened Express + MongoDB REST API with user authentication (`backend/`) and a Vite + React frontend (`frontend/`).

> **Current status:** the backend is feature-complete for users and recipes, including signup/login, bulk recipe creation, and layered security protections. The frontend is still the default Vite/React starter screen and is **not yet connected** to the API. See [Roadmap](#roadmap).

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Authentication](#authentication)
- [API reference](#api-reference)
- [Security measures](#security-measures)
- [Data model](#data-model)
- [Design tokens](#design-tokens)
- [Roadmap](#roadmap)
- [Repository notes](#repository-notes)

## Tech stack

**Backend**

- Node.js with Express 5
- MongoDB with Mongoose 9
- JWT authentication (`jsonwebtoken`) with HS256
- Password hashing with `bcryptjs`
- Validation with `express-validator`
- Security middleware: `helmet`, `express-rate-limit`, `express-mongo-sanitize`, `hpp`, `xss`
- CORS with an origin allowlist, `dotenv`, and `nodemon`
- `multer` is installed but not wired into any route yet

**Frontend**

- React 19
- Vite 8
- React Router DOM 7 (installed, not used yet)
- Axios (installed, not used yet)
- Lucide React (installed)
- ESLint 10

## Project structure

```text
Recipe Book/
├── backend/
│   ├── config/
│   │   ├── db.js                      # MongoDB connection
│   │   └── env.js                     # Environment loading + validation
│   ├── controllers/
│   │   ├── authController.js          # Signup, login, current user
│   │   └── recipeController.js        # Single + bulk recipe CRUD
│   ├── middleware/
│   │   ├── auth.js                    # JWT generation + protect middleware
│   │   ├── rateLimiter.js             # API, auth, and bulk rate limits
│   │   ├── security.js                # NoSQL + XSS sanitization
│   │   └── validate.js                # express-validator rule sets
│   ├── models/
│   │   ├── Recipe.js                  # Recipe schema
│   │   └── User.js                    # User schema
│   ├── routes/
│   │   ├── authRoutes.js              # /api/auth routes
│   │   └── recipeRoutes.js            # /api/recipes routes
│   ├── server.js                      # Express app entry point
│   ├── .env.example                   # Safe configuration template
│   └── package.json
├── frontend/
│   ├── public/                        # favicon and icon sprite
│   ├── src/
│   │   ├── assets/                    # hero and logo images
│   │   ├── App.css
│   │   ├── App.jsx                    # Current starter UI
│   │   ├── index.css
│   │   └── main.jsx                   # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── progress/
│   └── 2026-11-24.md                  # Daily progress log
├── color-scheme.css                   # Root color variables
└── README.md                          # This file
```

## Prerequisites

- Node.js 20.19+ / 22.12+ (required by Vite 8) and npm
- A MongoDB database — either local MongoDB or MongoDB Atlas
- Git

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Anticoder03/Recipe-Book.git
cd "Recipe Book"
```

### 2. Configure and start the backend

```bash
cd backend
npm install
copy .env.example .env        # Windows; use `cp` on macOS/Linux
```

Generate a strong JWT secret and paste it into `backend/.env` as `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

A minimal `.env` looks like this:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/recipe-book
JWT_SECRET=<your-long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
TRUST_PROXY=0
```

Start the API:

```bash
npm run dev      # with auto-reload
# or
npm start        # plain node
```

Health check:

```bash
curl http://localhost:5000/
# {"success":true,"message":"Recipe Book API is running"}
```

The app fails fast on startup if `MONGO_URI` or `JWT_SECRET` is missing.

### 3. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local URL (usually `http://localhost:5173`). That origin is allowed by CORS by default. The frontend is not connected to the API yet, so no proxy is configured.

## Environment variables

Environment variables are loaded from `backend/.env` by `backend/config/env.js`.

| Variable          | Required | Default                    | Description                                                        |
| ----------------- | -------- | -------------------------- | ------------------------------------------------------------------ |
| `PORT`            | No       | `5000`                     | HTTP port for the Express server                                   |
| `NODE_ENV`        | No       | `development`              | `production` hides internal error messages                         |
| `MONGO_URI`       | Yes      | —                          | MongoDB connection string used by Mongoose                         |
| `JWT_SECRET`      | Yes      | —                          | Secret used to sign JWTs; generate a long random value             |
| `JWT_EXPIRES_IN`  | No       | `7d`                       | Token lifetime accepted by `jsonwebtoken`                          |
| `CLIENT_ORIGIN`   | No       | `http://localhost:5173`    | Comma-separated browser origins allowed by CORS                    |
| `TRUST_PROXY`     | No       | `0`                        | Set to `1` only when running behind a trusted reverse proxy        |

`.env` files are ignored by Git. Never commit real credentials; only `.env.example` is tracked.

## Available scripts

### Backend (`cd backend`)

| Script        | Command             | Purpose                       |
| ------------- | ------------------- | ----------------------------- |
| `npm start`   | `node server.js`    | Start the API                 |
| `npm run dev` | `nodemon server.js` | Start with auto-reload        |

### Frontend (`cd frontend`)

| Script            | Purpose                            |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Vite dev server with HMR           |
| `npm run build`   | Production build into `dist/`      |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | ESLint across the project          |

## Authentication

Write operations require a JWT. Reading recipes is public.

1. Call `POST /api/auth/signup` or `POST /api/auth/login`.
2. Copy the `token` from the response.
3. Send it on protected requests as `Authorization: Bearer <token>`.

`GET /api/auth/me` returns the account attached to the current token. Tokens are signed with HS256, expire according to `JWT_EXPIRES_IN`, and are verified against the current user on every request.

> For a production browser app, prefer storing the token in an `httpOnly`, `Secure`, `SameSite` cookie rather than `localStorage` to reduce XSS token theft risk.

## API reference

Base URL: `http://localhost:5000`

All responses use a JSON body with a `success` boolean.

### Auth endpoints

| Method | Endpoint            | Auth required | Description                  | Success |
| ------ | ------------------- | ------------- | ---------------------------- | ------- |
| `POST` | `/api/auth/signup`  | No            | Create an account            | `201`   |
| `POST` | `/api/auth/login`   | No            | Log in and receive a token   | `200`   |
| `GET`  | `/api/auth/me`      | Yes           | Get the current user         | `200`   |

#### Signup

```json
{
  "name": "Ashish",
  "email": "ashish@example.com",
  "password": "recipe123"
}
```

Rules: name is required (max 50), email must be valid, password must be 8–100 characters and contain at least one letter and one number.

```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Ashish", "email": "ashish@example.com" }
}
```

An existing email returns `409` with `"An account with this email already exists"`. Passwords are never returned.

#### Login

```json
{
  "email": "ashish@example.com",
  "password": "recipe123"
}
```

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Ashish", "email": "ashish@example.com" }
}
```

Invalid credentials return `401` with the generic message `"Invalid email or password"` so the API does not reveal which emails are registered.

#### Current user

`GET /api/auth/me` with the Bearer token returns:

```json
{
  "success": true,
  "user": { "id": "...", "name": "Ashish", "email": "ashish@example.com" }
}
```

Missing or invalid tokens return `401`.

### Recipe endpoints

| Method   | Endpoint              | Auth required | Description                                  | Success |
| -------- | --------------------- | ------------- | -------------------------------------------- | ------- |
| `GET`    | `/`                   | No            | API health check                             | `200`   |
| `POST`   | `/api/recipes`        | Yes           | Create one recipe                            | `201`   |
| `POST`   | `/api/recipes/bulk`   | Yes           | Create 1–100 recipes in one request          | `201`   |
| `GET`    | `/api/recipes`        | No            | List all recipes, newest first               | `200`   |
| `GET`    | `/api/recipes/:id`    | No            | Get one recipe by MongoDB ObjectId           | `200`   |
| `PUT`    | `/api/recipes/:id`    | Yes           | Update a recipe (partial updates allowed)    | `200`   |
| `DELETE` | `/api/recipes/:id`    | Yes           | Delete a recipe                              | `200`   |

#### Create one recipe

`POST /api/recipes` with `Authorization: Bearer <token>` and `Content-Type: application/json`:

```json
{
  "title": "Pasta Pomodoro",
  "description": "A simple tomato and basil pasta.",
  "ingredients": ["200 g pasta", "2 tomatoes", "Fresh basil"],
  "steps": ["Boil the pasta.", "Cook the tomatoes.", "Combine and serve."],
  "servings": 2,
  "tags": ["italian", "quick"]
}
```

Required: `title`, `description`, `ingredients`, `steps`. The authenticated user is stored in `createdBy` and cannot be set from the request body.

#### Bulk create

`POST /api/recipes/bulk` with the Bearer token:

```json
{
  "recipes": [
    {
      "title": "Pasta Pomodoro",
      "description": "A simple tomato and basil pasta.",
      "ingredients": ["200 g pasta", "2 tomatoes"],
      "steps": ["Boil the pasta.", "Combine and serve."],
      "servings": 2,
      "tags": ["italian"]
    },
    {
      "title": "Garlic Bread",
      "description": "Quick garlic butter bread.",
      "ingredients": ["Bread", "Butter", "Garlic"],
      "steps": ["Mix butter and garlic.", "Spread and bake."],
      "servings": 4,
      "tags": ["side"]
    }
  ]
}
```

The `recipes` array must contain between 1 and 100 items. Each item follows the same rules as a single create. The response includes `count` and all inserted documents. Bulk requests have their own stricter rate limit.

#### List and get recipes

`GET /api/recipes` returns:

```json
{
  "success": true,
  "count": 1,
  "recipes": ["..."]
}
```

`GET /api/recipes/:id` returns one recipe. An invalid ObjectId returns `400` with `"Invalid recipe ID"`; a valid ID with no match returns `404` with `"Recipe not found"`.

#### Update and delete

`PUT /api/recipes/:id` accepts any subset of the writable recipe fields:

```json
{
  "servings": 4,
  "tags": ["dinner"]
}
```

`DELETE /api/recipes/:id` returns `200` with `"Recipe deleted successfully"`. Update and delete require the Bearer token.

### Validation and error responses

Invalid request data returns `400` with field-level details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "password", "message": "Password must be between 8 and 100 characters" }
  ]
}
```

Other common responses:

| Status | Meaning                                            |
| ------ | -------------------------------------------------- |
| `400`  | Validation failure, malformed JSON, or invalid ID  |
| `401`  | Missing/invalid token or invalid credentials       |
| `403`  | Origin blocked by CORS                             |
| `404`  | Route or recipe not found                          |
| `409`  | Duplicate email                                    |
| `413`  | Request body larger than 1 MB                      |
| `429`  | Rate limit exceeded                                |
| `500`  | Unexpected error (generic message in production)   |

## Security measures

The backend applies defense in depth against common web attacks:

1. **Password hashing** — `bcryptjs` with 12 salt rounds; plain passwords are never stored or returned.
2. **JWT authentication** — HS256 is pinned on both sign and verify, expiry is enforced, and the user is reloaded from MongoDB on each protected request.
3. **Rate limiting** — 100 requests/15 min globally on `/api`, 10 auth attempts/15 min on signup/login, and 5 bulk requests/hour.
4. **CORS allowlist** — only origins listed in `CLIENT_ORIGIN` (default `http://localhost:5173`) may call the API from a browser; disallowed origins receive `403`.
5. **Security headers** — `helmet()` sets protective HTTP headers and `x-powered-by` is disabled.
6. **NoSQL injection prevention** — `express-mongo-sanitize` converts operator keys such as `$ne` and `$where` into `_ne` / `_where` in body and params before they reach Mongoose.
7. **HTTP parameter pollution** — `hpp()` collapses duplicate non-whitelisted parameters; `ingredients`, `steps`, `tags`, and `recipes` are whitelisted so legitimate arrays still work.
8. **XSS sanitization** — string input is escaped with `xss()` before storage; password fields are excluded so credentials are not altered.
9. **Payload limits** — JSON bodies are limited to 1 MB and oversized requests return `413`.
10. **Input validation** — `express-validator` checks every auth and recipe field, including array contents and MongoDB ObjectIds.
11. **Mass-assignment prevention** — controllers copy only an explicit whitelist of fields from the request; `createdBy` and internal fields cannot be injected.
12. **Safe errors** — stack traces are logged server-side only; production clients receive a generic `500` message. Login uses a generic failure message.
13. **Unique account emails** — the `User` schema enforces uniqueness and duplicate races return `409`.
14. **Secret hygiene** — `.env` is Git-ignored; `.env.example` contains only placeholders.

## Data model

### User (`backend/models/User.js`)

| Field      | Type   | Rules                                                  |
| ---------- | ------ | ------------------------------------------------------ |
| `name`     | String | Required, trimmed, max 50 characters                   |
| `email`    | String | Required, unique, lowercase, valid email format        |
| `password` | String | Required, 8–100 characters, hashed, `select: false`    |
| Timestamps | Date   | `createdAt` and `updatedAt` added automatically        |

### Recipe (`backend/models/Recipe.js`)

| Field       | Type       | Rules                                              |
| ----------- | ---------- | -------------------------------------------------- |
| `title`     | String     | Required, trimmed, max 100 characters              |
| `description` | String   | Required, trimmed, max 1000 characters             |
| `ingredients` | `[String]` | Required; at least one non-empty entry           |
| `steps`     | `[String]` | Required; at least one non-empty entry             |
| `image`     | String     | Optional, defaults to `null`                       |
| `servings`  | Number     | Defaults to `2`, minimum `1`                       |
| `tags`      | `[String]` | Defaults to `[]`                                   |
| `createdBy` | ObjectId   | Ref to `User`, defaults to `null`, set on create    |
| Timestamps  | Date       | `createdAt` and `updatedAt` added automatically    |

Note: the schema has an `image` field and the server exposes `/uploads` as a static directory, but no image upload route is implemented yet.

## Design tokens

`color-scheme.css` defines the palette intended for the UI:

| Variable           | Value     |
| ------------------ | --------- |
| `--primary`        | `#588157` |
| `--secondary`      | `#A3B18A` |
| `--accent`         | `#DDA15E` |
| `--background`     | `#F8F7F0` |
| `--surface`        | `#FFFFFF` |
| `--text-primary`   | `#344E41` |
| `--text-secondary` | `#606C5D` |

This file currently sits at the repository root and is not imported by the frontend.

## Roadmap

- Build recipe list, detail, create, edit, and delete screens in React.
- Connect the frontend to the API with Axios and configure a dev proxy or API base URL.
- Store auth tokens using an `httpOnly` cookie instead of client-side JavaScript storage.
- Import `color-scheme.css` tokens into the frontend styling.
- Implement image upload with the already-installed `multer` and save the path to `image`.
- Add automated tests for auth, validation, and recipe endpoints.
- Add ownership checks so users can only modify their own recipes.

## Repository notes

- The root `.gitignore` excludes dependencies, build output, logs, caches, uploads, editor/OS files, and all `.env` variants (while allowing `.env.example`).
- `backend/.env` is intentionally untracked. Never commit MongoDB credentials or JWT secrets.
- Commit source files and lockfiles; `package-lock.json` files are tracked for reproducible installs.
- Daily work is recorded in `progress/` using dated files.

Typical commit from the repository root:

```bash
git add -A
git commit -m "Add user auth, bulk recipes, and backend security"
git push
```
