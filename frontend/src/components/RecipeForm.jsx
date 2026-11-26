import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Plus, X } from 'lucide-react'
import client from '../api/client'
import { makeErrorSummary, normalizeApiError } from '../utils/errors'
import { useToast } from './toastContext'
import ErrorSummary from './ErrorSummary'

function initialValues(recipe, createRow) {
  return {
    title: recipe?.title || '',
    description: recipe?.description || '',
    ingredients: (recipe?.ingredients?.length ? recipe.ingredients : ['']).map(createRow),
    steps: (recipe?.steps?.length ? recipe.steps : ['']).map(createRow),
    servings: recipe?.servings ?? 2,
    tags: recipe?.tags?.join(', ') || '',
    image: recipe?.image || ''
  }
}

function validate(values) {
  const problems = []

  if (!values.title.trim()) {
    problems.push({ id: 'title', message: 'Give the recipe a title.' })
  }
  if (!values.description.trim()) {
    problems.push({ id: 'description', message: 'Add a short description.' })
  }

  values.ingredients.forEach((row, index) => {
    if (!row.value.trim()) {
      problems.push({
        id: `ingredient-${row.id}`,
        message: `Ingredient ${index + 1} needs text, or remove that row.`
      })
    }
  })

  values.steps.forEach((row, index) => {
    if (!row.value.trim()) {
      problems.push({
        id: `step-${row.id}`,
        message: `Step ${index + 1} needs text, or remove that row.`
      })
    }
  })

  const servings = Number(values.servings)
  if (!Number.isInteger(servings) || servings < 1) {
    problems.push({ id: 'servings', message: 'Servings must be at least 1.' })
  }

  return problems
}

// Row IDs only need to be unique within a mounted form; a module counter keeps
// them stable across re-renders without reading a ref during render.
let rowSequence = 0
const createRow = (value = '') => ({ id: `row-${++rowSequence}`, value })

export default function RecipeForm({ recipe }) {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [values, setValues] = useState(() => initialValues(recipe, createRow))
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const errorFor = (id) => errors.find((error) => error.id === id)?.message

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const updateRow = (field, id, value) => {
    setValues((current) => ({
      ...current,
      [field]: current[field].map((row) => (row.id === id ? { ...row, value } : row))
    }))
  }

  const addRow = (field) => {
    setValues((current) => ({ ...current, [field]: [...current[field], createRow()] }))
  }

  const removeRow = (field, id) => {
    setValues((current) => {
      const rows = current[field]
      return {
        ...current,
        [field]: rows.length > 1 ? rows.filter((row) => row.id !== id) : [createRow()]
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const localProblems = validate(values)
    if (localProblems.length > 0) {
      setErrors(localProblems)
      return
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      ingredients: values.ingredients.map((row) => row.value.trim()),
      steps: values.steps.map((row) => row.value.trim()),
      servings: Number(values.servings),
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      image: values.image.trim() || null
    }

    setSubmitting(true)
    setErrors([])

    try {
      const { data } = recipe
        ? await client.put(`/recipes/${recipe._id}`, payload)
        : await client.post('/recipes', payload)

      showToast(recipe ? 'Recipe updated.' : 'Recipe saved to your notebook.')
      navigate(`/recipes/${data.recipe._id}`)
    } catch (error) {
      const normalized = normalizeApiError(error)
      const fieldMap = {
        ingredients: `ingredient-${values.ingredients[0].id}`,
        'ingredients.*': `ingredient-${values.ingredients[0].id}`,
        steps: `step-${values.steps[0].id}`,
        'steps.*': `step-${values.steps[0].id}`
      }
      setErrors(makeErrorSummary(normalized.fieldErrors, fieldMap))
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
        <h1 className="rb-section__title">{recipe ? 'Edit this recipe' : 'A new recipe'}</h1>
        <p className="rb-section__intro">
          Write it the way you will cook it. Ingredients first, then the steps in order.
        </p>
      </div>

      <ErrorSummary errors={errors} />

      <form className="rb-form" onSubmit={handleSubmit} noValidate>
        <div className="rb-field">
          <label className="rb-field__label" htmlFor="title">
            Recipe title
          </label>
          <input
            id="title"
            className="rb-field__input"
            value={values.title}
            onChange={(event) => updateField('title', event.target.value)}
            aria-invalid={Boolean(errorFor('title'))}
            aria-describedby={errorFor('title') ? 'title-error' : undefined}
          />
          {errorFor('title') && (
            <p className="rb-field__error" id="title-error">
              {errorFor('title')}
            </p>
          )}
        </div>

        <div className="rb-field">
          <label className="rb-field__label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="rb-field__input"
            rows={3}
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
            aria-invalid={Boolean(errorFor('description'))}
            aria-describedby={errorFor('description') ? 'description-error' : undefined}
          />
          {errorFor('description') && (
            <p className="rb-field__error" id="description-error">
              {errorFor('description')}
            </p>
          )}
        </div>

        <div className="rb-form__split">
          <div className="rb-field">
            <label className="rb-field__label" htmlFor="servings">
              Servings
            </label>
            <input
              id="servings"
              className="rb-field__input"
              type="number"
              min="1"
              value={values.servings}
              onChange={(event) => updateField('servings', event.target.value)}
              aria-invalid={Boolean(errorFor('servings'))}
              aria-describedby={errorFor('servings') ? 'servings-error' : undefined}
            />
            {errorFor('servings') && (
              <p className="rb-field__error" id="servings-error">
                {errorFor('servings')}
              </p>
            )}
          </div>

          <div className="rb-field">
            <label className="rb-field__label" htmlFor="tags">
              Tags
            </label>
            <input
              id="tags"
              className="rb-field__input"
              value={values.tags}
              onChange={(event) => updateField('tags', event.target.value)}
              placeholder="weeknight, vegetarian"
              aria-describedby="tags-hint"
            />
            <p className="rb-field__hint" id="tags-hint">
              Separate tags with commas.
            </p>
          </div>
        </div>

        <div className="rb-field">
          <label className="rb-field__label" htmlFor="image">
            Image URL <span className="rb-field__optional">optional</span>
          </label>
          <input
            id="image"
            className="rb-field__input"
            type="url"
            value={values.image}
            onChange={(event) => updateField('image', event.target.value)}
            placeholder="https://…"
          />
        </div>

        <fieldset className="rb-fieldset">
          <legend>Ingredients</legend>
          {values.ingredients.map((row, index) => (
            <div className="rb-repeat__row" key={row.id}>
              <label className="rb-visually-hidden" htmlFor={`ingredient-${row.id}`}>
                Ingredient {index + 1}
              </label>
              <input
                id={`ingredient-${row.id}`}
                className="rb-field__input"
                value={row.value}
                onChange={(event) => updateRow('ingredients', row.id, event.target.value)}
                aria-invalid={Boolean(errorFor(`ingredient-${row.id}`))}
              />
              <button
                type="button"
                className="rb-icon-button"
                onClick={() => removeRow('ingredients', row.id)}
                aria-label={`Remove ingredient ${index + 1}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
              {errorFor(`ingredient-${row.id}`) && (
                <p className="rb-field__error">{errorFor(`ingredient-${row.id}`)}</p>
              )}
            </div>
          ))}
          <button
            type="button"
            className="rb-button rb-button--quiet"
            onClick={() => addRow('ingredients')}
          >
            <Plus size={15} aria-hidden="true" />
            Add ingredient
          </button>
        </fieldset>

        <fieldset className="rb-fieldset">
          <legend>Method</legend>
          {values.steps.map((row, index) => (
            <div className="rb-repeat__row" key={row.id}>
              <label className="rb-visually-hidden" htmlFor={`step-${row.id}`}>
                Step {index + 1}
              </label>
              <textarea
                id={`step-${row.id}`}
                className="rb-field__input"
                rows={2}
                value={row.value}
                onChange={(event) => updateRow('steps', row.id, event.target.value)}
                aria-invalid={Boolean(errorFor(`step-${row.id}`))}
              />
              <button
                type="button"
                className="rb-icon-button"
                onClick={() => removeRow('steps', row.id)}
                aria-label={`Remove step ${index + 1}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
              {errorFor(`step-${row.id}`) && (
                <p className="rb-field__error">{errorFor(`step-${row.id}`)}</p>
              )}
            </div>
          ))}
          <button
            type="button"
            className="rb-button rb-button--quiet"
            onClick={() => addRow('steps')}
          >
            <Plus size={15} aria-hidden="true" />
            Add step
          </button>
        </fieldset>

        <div className="rb-form__actions">
          <button type="submit" className="rb-button rb-button--primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="rb-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save recipe'
            )}
          </button>
          <Link to="/recipes" className="rb-button rb-button--quiet">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
