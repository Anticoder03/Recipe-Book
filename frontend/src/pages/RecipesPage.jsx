import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import client from '../api/client'
import RecipeCard from '../components/RecipeCard'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true

    client
      .get('/recipes')
      .then(({ data }) => {
        if (active) {
          setRecipes(data.recipes)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })

    return () => {
      active = false
    }
  }, [])

  const tags = useMemo(() => {
    const all = recipes.flatMap((recipe) => recipe.tags || [])
    return [...new Set(all)].sort((a, b) => a.localeCompare(b))
  }, [recipes])

  const visibleRecipes = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return recipes.filter((recipe) => {
      const matchesTag = !activeTag || recipe.tags?.includes(activeTag)
      const matchesQuery =
        !needle ||
        recipe.title.toLowerCase().includes(needle) ||
        recipe.description.toLowerCase().includes(needle) ||
        recipe.tags?.some((tag) => tag.toLowerCase().includes(needle))
      return matchesTag && matchesQuery
    })
  }, [recipes, query, activeTag])

  return (
    <section className="rb-section">
      <div className="rb-section__head">
        <h1 className="rb-section__title">The collection</h1>
        <p className="rb-section__intro">
          Every recipe in one place. Search by name, ingredient, or the tags you gave it.
        </p>
      </div>

      <div className="rb-toolbar">
        <div className="rb-search">
          <label className="rb-visually-hidden" htmlFor="rb-recipe-search">
            Search recipes
          </label>
          <Search size={17} aria-hidden="true" />
          <input
            id="rb-recipe-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search recipes…"
          />
        </div>

        {tags.length > 0 && (
          <div className="rb-chip-row" aria-label="Filter by tag">
            <button
              type="button"
              className="rb-chip"
              aria-pressed={activeTag === ''}
              onClick={() => setActiveTag('')}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rb-chip"
                aria-pressed={activeTag === tag}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="rb-result-count" role="status">
        {status === 'ready' ? `${visibleRecipes.length} recipes` : ''}
      </p>

      {status === 'loading' && (
        <p className="rb-loading" role="status">Opening the notebook…</p>
      )}

      {status === 'error' && (
        <div className="rb-empty" role="alert">
          <p>We could not load the recipes.</p>
          <p>Make sure the API is running, then refresh the page.</p>
        </div>
      )}

      {status === 'ready' && visibleRecipes.length === 0 && (
        <div className="rb-empty">
          <p>Nothing matches that search.</p>
          <Link to="/recipes/new" className="rb-button rb-button--quiet">
            Add a new recipe
          </Link>
        </div>
      )}

      {visibleRecipes.length > 0 && (
        <div className="rb-recipe-grid">
          {visibleRecipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  )
}
