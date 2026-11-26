import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../auth/authContext'
import RecipeForm from '../components/RecipeForm'
import { normalizeApiError } from '../utils/errors'

export default function RecipeFormPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState(null)
  const [status, setStatus] = useState(id ? 'loading' : 'ready')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!id) return undefined

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

  if (status === 'loading') {
    return <p className="rb-loading" role="status">Opening the recipe…</p>
  }

  if (status === 'error') {
    return (
      <section className="rb-section">
        <div className="rb-empty" role="alert">
          <p>{message}</p>
        </div>
      </section>
    )
  }

  // The edit route is protected, but a logged-in user can still open someone
  // else's edit URL directly. Keep them out before the form is mounted.
  if (id && recipe) {
    const isOwner = Boolean(
      user && recipe.createdBy && String(recipe.createdBy) === String(user.id)
    )

    if (!isOwner) {
      return (
        <section className="rb-section">
          <div className="rb-empty" role="alert">
            <p>You can only edit recipes you created.</p>
            <Link to={`/recipes/${recipe._id}`} className="rb-button rb-button--quiet">
              Back to the recipe
            </Link>
          </div>
        </section>
      )
    }
  }

  return <RecipeForm recipe={recipe} />
}
