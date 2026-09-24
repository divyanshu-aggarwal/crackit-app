import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from 'react-router-dom'

const mainLinks = [
  { to: '/dashboard', label: 'Home', icon: 'ti-layout-dashboard' },
  { to: '/jobs', label: 'Jobs', icon: 'ti-briefcase' },
  { to: '/tracker', label: 'Tracker', icon: 'ti-list-check' },
  { to: '/discover', label: 'Discover', icon: 'ti-compass' }
]

export default function MobileBottomNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()
  const location = useLocation()

  const go = (path) => {
    setOpen(false)
    navigate(path)
  }

  useEffect(() => {
  setOpen(false)
}, [location.pathname])

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,10,35,0.36)',
            zIndex: 80
          }}
        />
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 86,
            zIndex: 90,
            background: '#fff',
            borderRadius: 22,
            padding: 10,
            boxShadow: '0 20px 50px rgba(26,16,64,0.22)',
            border: '1px solid rgba(124,58,237,0.12)'
          }}
        >
          <MobileMenuItem icon="ti-map-2" label="Prep Roadmap" onClick={() => go('/roadmap')} />
          <MobileMenuItem icon="ti-target" label="Interviews" onClick={() => go('/interviews')} />
          <MobileMenuItem icon="ti-file-cv" label="Resume" onClick={() => go('/resume')} />
          <MobileMenuItem icon="ti-user-circle" label="Profile" onClick={() => go('/profile')} />
          <MobileMenuItem
            danger
            icon="ti-logout"
            label="Logout"
            onClick={() => {
              logout()
              go('/login')
            }}
          />
        </div>
      )}

      <div
  style={{
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    zIndex: 95,
    pointerEvents: 'none',
    background:
      'linear-gradient(to top, rgba(244,236,255,1) 0%, rgba(244,236,255,0.92) 42%, rgba(244,236,255,0) 100%)'
  }}
/>

      <nav
        style={{
          position: 'fixed',
          left: 16,
          right: 16,
          bottom: 'max(14px, env(safe-area-inset-bottom))',
          height: 60,
          zIndex: 100,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(14px)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 14px 38px rgba(124,58,237,0.16)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          padding: 6
        }}
      >
        {mainLinks.map(link => (
          <MobileNavLink key={link.to} {...link} />
        ))}

        <button
          onClick={() => setOpen(prev => !prev)}
          style={{
            border: 'none',
            background: open ? 'rgba(124,58,237,0.10)' : 'transparent',
            borderRadius: 18,
            color: open ? '#7c3aed' : '#8b7bb4',
            fontFamily: 'inherit',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            left: 16,
            right: 16,
            bottom: 92,
          }}
        >
          <i className={`ti ${open ? 'ti-x' : 'ti-dots'}`} style={{ fontSize: 20 }} />
          More
        </button>
      </nav>
    </>
  )
}

function MobileNavLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: 'none',
        borderRadius: 18,
        color: isActive ? '#7c3aed' : '#8b7bb4',
        background: isActive ? 'rgba(124,58,237,0.10)' : 'transparent',
        fontSize: 10,
        fontWeight: 700,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3
      })}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
      {label}
    </NavLink>
  )
}

function MobileMenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '13px 14px',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 700,
        color: danger ? '#ef4444' : '#1a1040',
        borderRadius: 14
      }}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 18, color: danger ? '#ef4444' : '#7c3aed' }} />
      {label}
    </button>
  )
}