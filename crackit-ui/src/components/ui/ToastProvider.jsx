import { createContext, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = ({ type = 'success', message }) => {
    const id = Date.now()

    setToasts(prev => [...prev, { id, type, message }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2800)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 99999
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            minWidth: 260,
            maxWidth: 360,
            padding: '12px 14px',
            borderRadius: 14,
            background: '#fff',
            border: '1px solid rgba(124,58,237,0.14)',
            boxShadow: '0 14px 34px rgba(124,58,237,0.14)',
            color: '#1a1040',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <i
              className={`ti ${
                t.type === 'success'
                  ? 'ti-circle-check'
                  : t.type === 'error'
                    ? 'ti-alert-circle'
                    : 'ti-info-circle'
              }`}
              style={{
                fontSize: 18,
                color:
                  t.type === 'success'
                    ? '#10b981'
                    : t.type === 'error'
                      ? '#ef4444'
                      : '#7c3aed'
              }}
            />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}