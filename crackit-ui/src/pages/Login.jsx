import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('crackit_remembered_email')
    if (saved) setForm(prev => ({ ...prev, email: saved }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password
      })
      login(res.data.token, {
        userId: res.data.userId,
        fullName: res.data.fullName,
        email: res.data.email,
        role: res.data.role,
        avatarUrl: res.data.avatarUrl,
        authProvider: res.data.authProvider || 'LOCAL'
      })
      if (rememberMe) {
        localStorage.setItem('crackit_remembered_email', form.email.trim().toLowerCase())
      } else {
        localStorage.removeItem('crackit_remembered_email')
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-container" style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #ede9ff 0%, #f5f0ff 50%, #ebe5ff 100%)'
    }}>
      {/* Left panel */}
      <div className="auth-left-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', maxWidth: 480
      }}>
        {/* Logo */}
        <div className="auth-logo-wrap" style={{ width: '100%', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/favicon.png" alt="CrackIt" style={{ width: 38, height: 38, objectFit: 'contain' }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: '#12053a', letterSpacing: '-1px' }}>
              Crack<span style={{ color: '#7c3aed' }}>!t</span>
            </span>
          </div>
        </div>

        {/* Heading */}
        <div style={{ width: '100%', marginBottom: 32 }}>
          <h1 className="auth-heading" style={{ fontSize: 28, fontWeight: 700, color: '#12053a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Welcome back
          </h1>
          <p className="auth-subtitle" style={{ fontSize: 15, color: '#7c6faa', margin: 0 }}>
            Sign in to continue your job search
          </p>
        </div>

        {/* Google Sign In Button */}
        <div style={{ width: '100%' }}>
          <GoogleSignInButton text="Sign in with Google" onError={setError} />
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', width: '100%',
          margin: '20px 0', gap: 12
        }}>
          <div style={{ flex: 1, height: 1, background: '#e4daff' }} />
          <span style={{ fontSize: 12, color: '#8c80b3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            or continue with email
          </span>
          <div style={{ flex: 1, height: 1, background: '#e4daff' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="auth-field" style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email" value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="auth-input"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e4daff'}
            />
          </div>

          <div className="auth-field" style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password} required
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="auth-input"
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#e4daff'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#a094c4', padding: 0, display: 'flex', alignItems: 'center'
                }}
              >
                <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'}`} style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 10, marginBottom: 16
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#554a78' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
              />
              Remember me
            </label>
            <span
              style={{ fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontWeight: 500 }}
              onClick={() => setError('Password recovery: You can sign in instantly with Google or contact administrator.')}
            >
              Forgot password?
            </span>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff1f1', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 12px', marginBottom: 16
            }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 14, color: '#ef4444' }} />
              <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="auth-btn"
            style={{
              ...btnStyle, marginTop: 20,
              opacity: loading ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            {loading
              ? <><i className="ti ti-loader" style={{ fontSize: 15 }} /> Signing in...</>
              : 'Sign in'
            }
          </button>
        </form>

        <p style={{ fontSize: 13, textAlign: 'center', color: '#7c6faa', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>

      {/* Right panel */}
      <div className="auth-right-panel" style={{
        flex: 1, background: 'linear-gradient(145deg, #7c3aed, #5b21b6)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)'
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>🎯</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            Land your dream job faster
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 32px' }}>
            AI-powered resume tailoring, job tracking, and match scoring — everything you need in one place.
          </p>

          {/* Feature pills */}
          {[
            { icon: 'ti-file-cv', text: 'AI resume tailoring' },
            { icon: 'ti-chart-bar', text: 'ATS match scoring' },
            { icon: 'ti-list-check', text: 'Job application tracker' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 14, padding: '10px 16px',
              background: 'rgba(255,255,255,0.12)', borderRadius: 10,
              backdropFilter: 'blur(4px)'
            }}>
              <i className={`ti ${icon}`} style={{ fontSize: 18, color: '#c4b5fd' }} />
              <span style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  fontSize: 13, color: '#4a3f6b', display: 'block',
  marginBottom: 6, fontWeight: 500
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e4daff', fontSize: 14, outline: 'none',
  color: '#1a1040', background: '#fff', boxSizing: 'border-box',
  transition: 'border-color 0.15s', fontFamily: 'inherit'
}

const btnStyle = {
  width: '100%', padding: '12px', borderRadius: 10,
  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  color: '#fff', border: 'none', fontSize: 14,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  boxShadow: '0 4px 14px rgba(124,58,237,0.35)'
}