import { Link, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeFormPage from './pages/RecipeFormPage'
import BulkImportPage from './pages/BulkImportPage'
import AuthPage from './pages/AuthPage'

function NotFoundPage() {
  return (
    <section className="rb-section rb-not-found">
      <h1 className="rb-section__title">That page is not in the notebook.</h1>
      <p className="rb-section__intro">The link may be old, or the page may have moved.</p>
      <Link to="/" className="rb-button rb-button--primary">
        Go home
      </Link>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/:id" element={<RecipeDetailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="recipes/new" element={<RecipeFormPage />} />
          <Route path="recipes/:id/edit" element={<RecipeFormPage />} />
          <Route path="bulk" element={<BulkImportPage />} />
        </Route>

        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="signup" element={<AuthPage mode="signup" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
