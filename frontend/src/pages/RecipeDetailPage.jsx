import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Pencil, Trash2, Users } from 'lucide-react'
import client from '../api/client'
import { useAuth } from '../auth/authContext'
import { useToast } from '../components/toastContext'
import { formatDate, normalizeApiError } from '../utils/errors'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [recipe, setRecipe] = useState(null)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [checked, setChecked] = useState(() => new Set())

  useEffect(() => {
    let active = true

    client
      .get(`/recipes/${id}`)
      .then(({ data }) => {
        if (active) {
          setRecipe(data.recipe)
          setStatus('ready')
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(normalizeApiError(error).message)
          setStatus('error')
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const toggleIngredient = (index) => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this recipe from your notebook?')) return

    try {
      await client.delete(`/recipes/${id}`)
      showToast('Recipe deleted.')
      navigate('/recipes')
    } catch (error) {
      showToast(normalizeApiError(error).message, 'error')
    }
  }

  const isOwner = Boolean(
    user && recipe?.createdBy && String(recipe.createdBy) === String(user.id)
  )

  if (status === 'loading') {
    return <p className="rb-loading" role="status">Opening the recipe…</p>
  }

  if (status === 'error') {
    return (
      <section className="rb-section">
        <div className="rb-empty" role="alert">
          <p>{message}</p>
          <Link to="/recipes" className="rb-button rb-button--quiet">
            Back to recipes
          </Link>
        </div>
      </section>
    )
  }

  return (
    <article className="rb-recipe">
      <div className="rb-recipe__header">
        <Link to="/recipes" className="rb-back-link">
          <ArrowLeft size={15} aria-hidden="true" />
          All recipes
        </Link>
        <h1>{recipe.title}</h1>
        <p className="rb-recipe__description">{recipe.description}</p>

        <div className="rb-meta" aria-label="Recipe details">
          <span><Users size={15} aria-hidden="true" />{recipe.servings} servings</span>
          <span><Clock size={15} aria-hidden="true" />Added {formatDate(recipe.createdAt)}</span>
          {isOwner && <span>In your notebook</span>}
        </div>

        {recipe.tags?.length > 0 && (
          <ul className="rb-tags" aria-label="Tags">
            {recipe.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}

        {isOwner && (
          <div className="rb-recipe__actions">
            <Link to={`/recipes/${recipe._id}/edit`} className="rb-button rb-button--quiet">
              <Pencil size={15} aria-hidden="true" />
              Edit recipe
            </Link>
            {isOwner && (
              <button type="button" className="rb-button rb-button--danger" onClick={handleDelete}>
                <Trash2 size={15} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rb-recipe__body">
        <aside className="rb-recipe__aside" aria-labelledby="rb-ingredients-title">
          <h2 id="rb-ingredients-title">What you need</h2>
          <ul className="rb-check-list rb-check-list--interactive">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${ingredient}-${index}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked.has(index)}
                    onChange={() => toggleIngredient(index)}
                  />
                  <span>{ingredient}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="rb-margin-note">Tick things off as you gather them.</p>
        </aside>

        <div className="rb-recipe__method">
          <h2>Method</h2>
          <ol className="rb-step-list">
            {recipe.steps.map((step, index) => (
              <li key={`${step}-${index}`}>
                <span className="rb-step-list__number" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  )
}
