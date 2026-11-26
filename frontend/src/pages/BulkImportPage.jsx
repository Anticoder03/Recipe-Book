import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import client from '../api/client'
import ErrorSummary from '../components/ErrorSummary'
import { useToast } from '../components/toastContext'
import { normalizeApiError } from '../utils/errors'

const EXAMPLE = `[
  {
    "title": "Garlic bread",
    "description": "Quick bread for a weeknight.",
    "ingredients": ["Bread", "Butter", "Garlic"],
    "steps": ["Mix butter and garlic.", "Spread and bake."],
    "servings": 4,
    "tags": ["side"]
  }
]`

export default function BulkImportPage() {
  const { showToast } = useToast()
  const [value, setValue] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [createdCount, setCreatedCount] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setCreatedCount(null)

    let recipes
    try {
      recipes = JSON.parse(value)
    } catch {
      setErrors([{ id: 'rb-bulk-json', message: 'That is not valid JSON.' }])
      return
    }

    if (!Array.isArray(recipes) || recipes.length === 0 || recipes.length > 100) {
      setErrors([
        { id: 'rb-bulk-json', message: 'Provide an array with between 1 and 100 recipes.' }
      ])
      return
    }

    setErrors([])
    setSubmitting(true)

    try {
      const { data } = await client.post('/recipes/bulk', { recipes })
      setCreatedCount(data.count)
      setValue('')
      showToast(`${data.count} recipes added to your notebook.`)
    } catch (error) {
      const normalized = normalizeApiError(error)
      setErrors([{ id: 'rb-bulk-json', message: normalized.message }])
      showToast(normalized.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rb-section rb-form-page">
      <div className="rb-section__head">
        <Link to="/recipes" className="rb-back-link">
          Back to recipes
        </Link>
        <h1 className="rb-section__title">Bring in a batch</h1>
        <p className="rb-section__intro">
          Paste up to 100 recipes as JSON. Each one needs a title, description, ingredients, and
          steps.
        </p>
      </div>

      <ErrorSummary errors={errors} />

      {createdCount !== null && (
        <div className="rb-success-note" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          {createdCount} recipes saved.
        </div>
      )}

      <form className="rb-form" onSubmit={handleSubmit} noValidate>
        <div className="rb-field">
          <label className="rb-field__label" htmlFor="rb-bulk-json">
            Recipe array
          </label>
          <textarea
            id="rb-bulk-json"
            className="rb-field__input rb-field__input--code"
            rows={16}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={EXAMPLE}
            aria-invalid={errors.length > 0}
            aria-describedby="rb-bulk-hint"
          />
          <p className="rb-field__hint" id="rb-bulk-hint">
            Use the same fields as a single recipe. Example shown when the box is empty.
          </p>
        </div>

        <div className="rb-form__actions">
          <button type="submit" className="rb-button rb-button--primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="rb-spin" aria-hidden="true" />
                Importing…
              </>
            ) : (
              'Import recipes'
            )}
          </button>
          <Link to="/recipes/new" className="rb-button rb-button--quiet">
            Add one instead
          </Link>
        </div>
      </form>
    </section>
  )
}
