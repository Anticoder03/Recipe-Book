# Recipe Book

A full-stack recipe application in progress. The repository contains an Express + MongoDB REST API for managing recipes (`backend/`) and a Vite + React frontend (`frontend/`).

> **Current status:** the backend CRUD API is implemented. The frontend is still the default Vite/React starter screen and is **not yet connected** to the API. See [Roadmap](#roadmap).

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Design tokens](#design-tokens)
- [Roadmap](#roadmap)
- [Repository notes](#repository-notes)

## Tech stack

**Backend**

- Node.js with Express 5
- MongoDB with Mongoose 9
- CORS enabled for cross-origin frontend requests
- `dotenv` for environment configuration
- `nodemon` for development auto-reload
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
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/recipeController.js  # CRUD business logic
│   ├── models/Recipe.js             # Mongoose schema
│   ├── routes/recipeRoutes.js       # /api/recipes routes
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   └── .env                         # Local secrets (not committed)
├── frontend/
│   ├── public/                      # favicon and icon sprite
│   ├── src/
│   │   ├── assets/                  # hero and logo images
│   │   ├── App.css
│   │   ├── App.jsx                  # Current starter UI
│   │   ├── index.css
│   │   └── main.jsx                 # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── color-scheme.css                 # Root color variables
└── README.md                        # This file
```

## Prerequisites

- Node.js 20.19+ / 22.12+ (required by Vite 8) and npm
- A MongoDB database — either a local MongoDB server or a MongoDB Atlas cluster
- Git

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Anticoder03/Recipe-Book.git
cd "Recipe Book"
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `backend/.env` file with your own values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

For a local MongoDB instance, `MONGO_URI` can be `mongodb://127.0.0.1:27017/recipe-book`.

Start the API:

```bash
npm run dev      # with auto-reload
# or
npm start        # plain node
```

The server listens on `http://localhost:5000` by default and logs `Server running on port 5000` plus the MongoDB connection result.

Health check:

```bash
curl http://localhost:5000/
# {"success":true,"message":"Recipe Book API is running"}
```

### 3. Set up the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local URL (usually `http://localhost:5173`). The frontend does not call the API yet, so no proxy is configured in `vite.config.js`.

## Environment variables

The backend reads `.env` through `dotenv.config()` in `backend/server.js`.

| Variable     | Required | Default | Description                              |
| ------------ | -------- | ------- | ---------------------------------------- |
| `MONGO_URI`  | Yes      | —       | MongoDB connection string used by Mongoose |
| `PORT`       | No       | `5000`  | HTTP port for the Express server         |

`.env` files are ignored by Git. Do not commit real credentials; commit only `.env.example` files if you add them.

## Available scripts

### Backend (`cd backend`)

| Script          | Command           | Purpose                     |
| --------------- | ----------------- | --------------------------- |
| `npm start`     | `node server.js`  | Start the API               |
| `npm run dev`   | `nodemon server.js` | Start with auto-reload    |

### Frontend (`cd frontend`)

| Script            | Purpose                                |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR     |
| `npm run build`   | Create a production build in `dist/`   |
| `npm run preview` | Preview the production build locally   |
| `npm run lint`    | Run ESLint across the project          |

## API reference

Base URL: `http://localhost:5000/api/recipes`

All responses use a JSON body with a `success` boolean.

| Method | Endpoint            | Description                                  | Success status |
| ------ | ------------------- | -------------------------------------------- | -------------- |
| `GET`  | `/`                 | Health check (root of the server)            | `200`          |
| `POST` | `/api/recipes`      | Create a recipe                              | `201`          |
| `GET`  | `/api/recipes`      | List all recipes, newest first               | `200`          |
| `GET`  | `/api/recipes/:id`  | Get one recipe by its MongoDB ObjectId       | `200`          |
| `PUT`  | `/api/recipes/:id`  | Update a recipe (validated fields only)      | `200`          |
| `DELETE` | `/api/recipes/:id` | Delete a recipe                              | `200`          |

### Create recipe

`POST /api/recipes` with `Content-Type: application/json`:

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

Required fields: `title`, `description`, `ingredients`, `steps`. Missing any of them returns `400` with `"All required fields must be provided"`.

Example response:

```json
{
  "success": true,
  "message": "Recipe created successfully",
  "recipe": { "...": "created document" }
}
```

### List recipes

`GET /api/recipes` returns:

```json
{
  "success": true,
  "count": 1,
  "recipes": ["..."]
}
```

### Get, update, and delete by ID

`:id` must be a valid MongoDB ObjectId. An invalid ID returns `400` with `"Invalid recipe ID"`. A valid ID with no matching document returns `404` with `"Recipe not found"`.

Example `PUT` body (partial updates are allowed):

```json
{
  "servings": 4,
  "tags": ["dinner"]
}
```

Unexpected server errors are handled by the global error middleware and returned as:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Data model

`Recipe` (`backend/models/Recipe.js`), with automatic `createdAt` / `updatedAt` timestamps:

| Field         | Type       | Rules                                            |
| ------------- | ---------- | ------------------------------------------------ |
| `title`       | String     | Required, trimmed, max 100 characters            |
| `description` | String     | Required, trimmed, max 1000 characters           |
| `ingredients` | `[String]` | Required; at least one non-empty entry           |
| `steps`       | `[String]` | Required; at least one non-empty entry           |
| `image`       | String     | Optional, defaults to `null`                     |
| `servings`    | Number     | Defaults to `2`, minimum `1`                     |
| `tags`        | `[String]` | Defaults to `[]`                                 |

Note: the schema has an `image` field, and the server exposes `/uploads` as a static directory, but no image upload/create route is implemented yet.

## Design tokens

`color-scheme.css` defines the palette intended for the UI:

| Variable          | Value     |
| ----------------- | --------- |
| `--primary`       | `#588157` |
| `--secondary`     | `#A3B18A` |
| `--accent`        | `#DDA15E` |
| `--background`    | `#F8F7F0` |
| `--surface`       | `#FFFFFF` |
| `--text-primary`  | `#344E41` |
| `--text-secondary`| `#606C5D` |

This file currently sits at the repository root and is not imported by the frontend.

## Roadmap

- Build the recipe list, detail, create, edit, and delete screens in React.
- Connect the frontend to the API with Axios (or add a Vite dev proxy).
- Import the color tokens into `frontend/src/index.css` and apply them to the UI.
- Add image upload handling with the already-installed `multer`.
- Add automated tests and request validation middleware.
- Add `.env.example` files for onboarding.

## Repository notes

- The root `.gitignore` excludes dependencies, build output, logs, caches, uploads, editor/OS files, and all `.env` variants (while allowing `.env.example`).
- `backend/.env` is intentionally untracked. Never commit MongoDB credentials.
- Commit only source files and lockfiles; `package-lock.json` files are tracked so installs are reproducible.

Typical first commit from the repository root:

```bash
git add -A
git commit -m "Initial commit: Recipe Book frontend and backend"
git push -u origin main
```
