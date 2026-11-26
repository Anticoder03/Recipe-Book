import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { ToastContext } from './toastContext'

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() })
  }, [])

  const dismiss = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(dismiss, 4500)
    return () => window.clearTimeout(timer)
  }, [toast, dismiss])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="rb-toast-region" role="status" aria-live="polite">
        {toast && (
          <div className={`rb-toast ${toast.tone === 'error' ? 'rb-toast--error' : ''}`}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{toast.message}</span>
            <button
              type="button"
              className="rb-icon-button"
              onClick={dismiss}
              aria-label="Dismiss message"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
