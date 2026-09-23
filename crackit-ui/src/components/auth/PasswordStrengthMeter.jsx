export default function PasswordStrengthMeter({ password = '' }) {
  if (!password) return null

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special symbol (!@#$%...)', met: /[^A-Za-z0-9]/.test(password) }
  ]

  const score = requirements.filter(r => r.met).length

  const getStrengthInfo = () => {
    if (score <= 1) return { label: 'Weak', color: '#ef4444', percent: 25 }
    if (score === 2) return { label: 'Fair', color: '#f59e0b', percent: 50 }
    if (score === 3 || score === 4) return { label: 'Good', color: '#10b981', percent: 75 }
    return { label: 'Strong', color: '#059669', percent: 100 }
  }

  const { label, color } = getStrengthInfo()

  return (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      {/* 4-segment Strength Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: idx <= Math.ceil((score / 5) * 4) ? color : '#e9e3ff',
              transition: 'background 0.2s ease'
            }}
          />
        ))}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: color, fontWeight: 600, marginBottom: 8
      }}>
        <span>Password strength:</span>
        <span>{label}</span>
      </div>

      {/* Requirement Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {requirements.map((req, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11,
              color: req.met ? '#059669' : '#8c80b3',
              transition: 'color 0.15s ease'
            }}
          >
            <i
              className={`ti ${req.met ? 'ti-check' : 'ti-point'}`}
              style={{ fontSize: 13, fontWeight: req.met ? 700 : 400 }}
            />
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
