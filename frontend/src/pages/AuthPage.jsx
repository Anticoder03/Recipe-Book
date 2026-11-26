import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../auth/authContext'
import ErrorSummary from '../components/ErrorSummary'
import { useToast } from '../components/toastContext'
import { makeErrorSummary, normalizeApiError } from '../utils/errors'

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { login, signup } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/'

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const problems = []
    if (isSignup && !values.name.trim()) {
      problems.push({ id: 'name', message: 'Tell us what to call you.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      problems.push({ id: 'email', message: 'Enter a valid email address.' })
    }
    if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
      problems.push({
        id: 'password',
        message: 'Use at least 8 characters, with a letter and a number.'
      })
    }

    if (problems.length > 0) {
      setErrors(problems)
      return
    }

    setErrors([])
    setSubmitting(true)

    try {
      const payload = {
        email: values.email.trim(),
        password: values.password
      }
      if (isSignup) payload.name = values.name.trim()

      if (isSignup) {
        await signup(payload)
        showToast('Your notebook is ready.')
      } else {
        await login(payload)
        showToast('You are logged in.')
      }
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const normalized = normalizeApiError(error)
      setErrors(makeErrorSummary(normalized.fieldErrors))
      showToast(normalized.message, 'error')
      setValues((current) => ({ ...current, password: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rb-auth">
      <aside className="rb-auth__note">
        <h2>A notebook that travels.</h2>
        <p>
          Log in to add recipes, edit the ones you have already written, or bring in a whole batch
          at once.
        </p>
        <p className="rb-margin-note">Reading stays open to everyone.</p>
      </aside>

      <div className="rb-auth__form">
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="rb-section__intro">
          {isSignup
            ? 'Keep your recipes somewhere you can always find them.'
            : 'Pick up where you left off in your kitchen notebook.'}
        </p>

        <ErrorSummary errors={errors} />

        <form className="rb-form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <div className="rb-field">
              <label className="rb-field__label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="rb-field__input"
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                autoComplete="name"
                aria-invalid={errors.some((error) => error.id === 'name')}
              />
            </div>
          )}

          <div className="rb-field">
            <label className="rb-field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="rb-field__input"
              type="email"
              value={values.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="email"
              aria-invalid={errors.some((error) => error.id === 'email')}
            />
          </div>

          <div className="rb-field">
            <label className="rb-field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="rb-field__input"
              type="password"
              value={values.password}
              onChange={(event) => updateField('password', event.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              aria-invalid={errors.some((error) => error.id === 'password')}
              aria-describedby="password-hint"
            />
            <p className="rb-field__hint" id="password-hint">
              At least 8 characters, including a letter and a number.
            </p>
          </div>

          <div className="rb-form__actions">
            <button type="submit" className="rb-button rb-button--primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="rb-spin" aria-hidden="true" />
                  One moment…
                </>
              ) : (
                isSignup ? 'Create account' : 'Log in'
              )}
            </button>
          </div>
        </form>

        <p className="rb-auth__switch">
          {isSignup ? 'Already have an account? ' : 'New here? '}
          <Link to={isSignup ? '/login' : '/signup'} state={location.state}>
            {isSignup ? 'Log in' : 'Create one'}
          </Link>
        </p>
      </div>
    </section>
  )
}
