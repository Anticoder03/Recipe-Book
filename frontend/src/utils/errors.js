export function normalizeApiError(error) {
  const data = error.response?.data

  if (error.response?.status === 401) {
    return {
      message: data?.message || 'Please log in again to continue.',
      fieldErrors: []
    }
  }

  if (Array.isArray(data?.errors)) {
    // express-validator sends { field, message }; Mongoose validation sends plain strings.
    return {
      message: data.message || 'Check the highlighted fields.',
      fieldErrors: data.errors.map((item, index) =>
        typeof item === 'string'
          ? { field: `server-error-${index}`, message: item }
          : { field: item.field, message: item.message }
      )
    }
  }

  return {
    message: data?.message || 'Something went wrong. Please try again.',
    fieldErrors: []
  }
}

export function makeErrorSummary(fieldErrors, fieldMap = {}) {
  return fieldErrors.map((item, index) => ({
    id: fieldMap[item.field] || item.field || `server-error-${index}`,
    message: item.message
  }))
}

export function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value))
}
