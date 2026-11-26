import { useEffect, useRef } from 'react'

export default function ErrorSummary({ errors, title = 'There is a problem' }) {
  const containerRef = useRef(null)
  const hadErrors = useRef(false)

  useEffect(() => {
    if (errors.length > 0 && !hadErrors.current) {
      containerRef.current?.focus()
    }
    hadErrors.current = errors.length > 0
  }, [errors.length])

  if (errors.length === 0) return null

  return (
    <div
      className="rb-error-summary"
      role="alert"
      tabIndex={-1}
      ref={containerRef}
      aria-labelledby="rb-error-summary-title"
    >
      <h2 id="rb-error-summary-title">{title}</h2>
      <ul>
        {errors.map((error) => (
          <li key={error.id}>
            <a href={`#${error.id}`}>{error.message}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
