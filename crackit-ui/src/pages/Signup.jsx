import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import GoogleSignInButton from '../components/auth/GoogleSignInButton'
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/signup', {
        fullName: form.name.trim(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password
      })

      // Auto-login upon successful registration
      login(res.data.token, {
        userId: res.data.userId,
        fullName: res.data.fullName,
        email: res.data.email,
        role: res.data.role,
        avatarUrl: res.data.avatarUrl,
        authProvider: res.data.authProvider || 'LOCAL'
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.')
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
        padding: '36px 40px', maxWidth: 480
      }}>
        {/* Logo */}
        <div className="auth-logo-wrap" style={{ width: '100%', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/favicon.png" alt="CrackIt" style={{ width: 38, height: 38, objectFit: 'contain' }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: '#12053a', letterSpacing: '-1px' }}>
              Crack<span style={{ color: '#7c3aed' }}>!t</span>
            </span>
          </div>
        </div>

        {/* Heading */}
        <div style={{ width: '100%', marginBottom: 24 }}>
          <h1 className="auth-heading" style={{ fontSize: 28, fontWeight: 700, color: '#12053a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Create your account
          </h1>
          <p className="auth-subtitle" style={{ fontSize: 15, color: '#7c6faa', margin: 0 }}>
            Start cracking your job search today
          </p>
        </div>

        {/* Google Sign Up Button */}
        <div style={{ width: '100%' }}>
          <GoogleSignInButton text="Sign up with Google" onError={setError} />
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', width: '100%',
          margin: '18px 0', gap: 12
        }}>
          <div style={{ flex: 1, height: 1, background: '#e4daff' }} />
          <span style={{ fontSize: 12, color: '#8c80b3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            or register with email
          </span>
          <div style={{ flex: 1, height: 1, background: '#e4daff' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="auth-field" style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Full name</label>
            <input
              type="text" value={form.name} required
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Divyanshu Sharma"
              className="auth-input"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#e4daff'}
            />
          </div>

          <div className="auth-field" style={{ marginBottom: 14 }}>
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

          {/* Password with Strength Meter */}
          <div className="auth-field" style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password} required
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters"
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
            <PasswordStrengthMeter password={form.password} />
          </div>

          {/* Confirm Password */}
          <div className="auth-field" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Confirm password</label>
              {form.confirmPassword && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: passwordsMatch ? '#059669' : '#ef4444'
                }}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword} required
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                className="auth-input"
                style={{
                  ...inputStyle,
                  paddingRight: 44,
                  borderColor: form.confirmPassword
                    ? (passwordsMatch ? '#10b981' : '#f87171')
                    : '#e4daff'
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = form.confirmPassword ? (passwordsMatch ? '#10b981' : '#f87171') : '#e4daff'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#a094c4', padding: 0, display: 'flex', alignItems: 'center'
                }}
              >
                <i className={`ti ${showConfirmPassword ? 'ti-eye-off' : 'ti-eye'}`} style={{ fontSize: 16 }} />
              </button>
            </div>
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
              ? <><i className="ti ti-loader" style={{ fontSize: 15 }} /> Creating account...</>
              : 'Create account'
            }
          </button>
        </form>

        <p style={{ fontSize: 13, textAlign: 'center', color: '#7c6faa', marginTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
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
          <div style={{ fontSize: 48, marginBottom: 24 }}>🚀</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            Your unfair advantage in job hunting
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Upload your resume once. Let AI tailor it for every job. Track applications and know exactly where you stand.
          </p>

          {[
            { icon: 'ti-upload', text: 'Upload resume once, reuse everywhere' },
            { icon: 'ti-sparkles', text: 'AI tailors it for every job description' },
            { icon: 'ti-target', text: 'Know your ATS match score instantly' },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 14, padding: '10px 16px',
              background: 'rgba(255,255,255,0.12)', borderRadius: 10,
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