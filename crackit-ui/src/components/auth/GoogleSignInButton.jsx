import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function GoogleSignInButton({ text = 'Sign in with Google', onError }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [googleRendered, setGoogleRendered] = useState(false)
  const googleBtnRef = useRef(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!googleClientId) return

    // Load Google Identity Services script if not already loaded
    if (!window.google && !document.getElementById('google-gsi-client')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-client'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGoogleClient()
      document.body.appendChild(script)
    } else if (window.google) {
      initGoogleClient()
    }
  }, [googleClientId])

  const initGoogleClient = () => {
    if (!window.google?.accounts?.id || !googleClientId) return

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    if (googleBtnRef.current) {
      try {
        googleBtnRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: text.toLowerCase().includes('up') ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          width: Math.min(400, Math.max(200, googleBtnRef.current?.offsetWidth || window.innerWidth - 40)),
          logo_alignment: 'left',
        })
        setGoogleRendered(true)
      } catch (e) {
        console.error('Failed to render official Google button:', e)
      }
    }
  }

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return
    setLoading(true)
    if (onError) onError('')

    try {
      const res = await api.post('/api/auth/google', { idToken: response.credential })
      login(res.data.token, {
        userId: res.data.userId,
        fullName: res.data.fullName,
        email: res.data.email,
        role: res.data.role,
        avatarUrl: res.data.avatarUrl,
        authProvider: 'GOOGLE'
      })
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed. Please try again.'
      if (onError) onError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    } else {
      // Display friendly setup & demo modal
      setShowDemoModal(true)
    }
  }

  const handleDemoSignIn = async () => {
    setShowDemoModal(false)
    setLoading(true)
    try {
      const demoEmail = 'candidate.demo@gmail.com'
      const demoPass = 'CrackItDemo@2026'

      let res
      try {
        res = await api.post('/api/auth/login', { email: demoEmail, password: demoPass })
      } catch {
        res = await api.post('/api/auth/signup', {
          fullName: 'Demo Candidate (Google User)',
          email: demoEmail,
          password: demoPass,
        })
      }

      login(res.data.token, {
        userId: res.data.userId,
        fullName: res.data.fullName,
        email: res.data.email,
        role: res.data.role || 'ROLE_USER',
        avatarUrl: res.data.avatarUrl || 'https://lh3.googleusercontent.com/a/default-user',
        authProvider: 'GOOGLE'
      })
      navigate('/dashboard')
    } catch (err) {
      if (onError) onError(err.response?.data?.message || 'Demo sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Official Google Identity Services Rendered Button (Opens real OAuth popup on click) */}
      {googleClientId && (
        <div
          ref={googleBtnRef}
          className="auth-google-btn"
          style={{
            width: '100%',
            display: googleRendered ? 'flex' : 'none',
            justifyContent: 'center',
            minHeight: 44
          }}
        />
      )}

      {/* Fallback button when Google script is loading or Google Client ID not configured */}
      {(!googleClientId || !googleRendered) && (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="auth-google-btn"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '11px 16px',
            background: '#ffffff',
            border: '1.5px solid #e4daff',
            borderRadius: 10,
            color: '#1a1040',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 6px rgba(124,58,237,0.06)',
            fontFamily: 'inherit'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#7c3aed'
            e.currentTarget.style.background = '#faf8ff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e4daff'
            e.currentTarget.style.background = '#ffffff'
          }}
        >
          {/* Official Google SVG Logo */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{loading ? 'Connecting...' : text}</span>
        </button>
      )}

      {/* Setup & Demo Guidance Modal if VITE_GOOGLE_CLIENT_ID not configured */}
      {showDemoModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(18, 5, 58, 0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, maxWidth: 440, width: '100%',
            padding: '24px 20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e4daff',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed'
              }}>
                <i className="ti ti-brand-google" style={{ fontSize: 20 }} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#12053a', fontWeight: 700 }}>
                Google OAuth Setup
              </h3>
            </div>

            <p style={{ fontSize: 13, color: '#554a78', lineHeight: 1.5, marginBottom: 14 }}>
              To connect real Google accounts, create an OAuth 2.0 Client ID in your Google Cloud Console and add it to <code style={{ background: '#f3e8ff', color: '#7c3aed', padding: '2px 5px', borderRadius: 4, fontSize: 12 }}>crackit-ui/.env</code>:
            </p>

            <pre style={{
              background: '#12053a', color: '#c4b5fd', padding: '10px 12px',
              borderRadius: 8, fontSize: 11, marginBottom: 18,
              whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.5
            }}>
              VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
            </pre>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={handleDemoSignIn}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
                  border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                }}
              >
                Instant Demo Google Sign-In
              </button>

              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  background: 'none', border: '1px solid #e4daff', color: '#554a78',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
