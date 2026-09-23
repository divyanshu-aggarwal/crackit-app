import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ProBadge from '../ui/ProBadge'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
  { to: '/jobs', label: 'My Jobs', icon: 'ti-briefcase' },
  { to: '/tracker', label: 'Tracker', icon: 'ti-list-check' },
  { to: '/discover', label: 'Discover', icon: 'ti-compass' },
]

function SidebarLink({
  to,
  label,
  icon,
  expanded,
  tablet,
  onClose
}) {
  return (
    <NavLink
      to={to}
      title={!expanded ? label : ''}
      onClick={() => {
        if (tablet && expanded && onClose) {
          onClose()
        }
      }}
      style={({ isActive }) => ({
        position: 'relative',

        display: 'flex',
        alignItems: 'center',

        justifyContent: expanded
          ? 'flex-start'
          : 'center',

        gap: expanded ? 10 : 0,

        padding: expanded
          ? '10px 12px'
          : '10px',

        borderRadius: 14,

        color: isActive ? '#1a1040' : '#7c6faa',

        background: isActive
          ? 'linear-gradient(90deg, rgba(124,58,237,0.24) 0%, rgba(124,58,237,0.14) 38%, rgba(124,58,237,0.06) 72%, transparent 100%)'
          : 'transparent',

        fontWeight: isActive ? 700 : 500,

        fontSize: 14.5,

        textDecoration: 'none',

        transition:
          'all 0.18s ease'
      })}
      onMouseEnter={e => {
        e.currentTarget.style.transform =
          'translateX(2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform =
          'translateX(0)'
      }}
    >
      {({ isActive }) => (
        <>
          <span
            style={{
              width: 34,
              height: 34,

              borderRadius: 12,

              background: isActive
                ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                : 'rgba(124,58,237,0.08)',

              color: isActive
                ? '#fff'
                : '#7c3aed',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              flexShrink: 0
            }}
          >
            <i
              className={`ti ${icon}`}
              style={{ fontSize: 16 }}
            />
          </span>

          {expanded && label}
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: '#9b8ec4',

        padding: '0 12px 5px',

        letterSpacing: '0.12em',

        fontWeight: 700
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: 1,

        background:
          'linear-gradient(90deg, transparent, rgba(124,58,237,0.16), transparent)',

        margin: '12px 6px'
      }}
    />
  )
}

export default function Sidebar({
  tablet = false,
  open = false,
  onToggle,
  onClose
}) {
  const { logout, user, isPro, aiUsageCount, openUpgradeModal } = useAuth()

  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] =
    useState(false)

  const dropdownRef = useRef(null)

  const expanded = !tablet || open

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const firstName =
    user?.fullName?.trim()?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'User'

  const initials =
    user?.fullName
      ?.trim()
      ?.split(' ')
      ?.map(word => word[0])
      ?.join('')
      ?.slice(0, 2)
      ?.toUpperCase() || 'ME'

  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handler
    )

    return () =>
      document.removeEventListener(
        'mousedown',
        handler
      )
  }, [])

  useEffect(() => {
    if (!expanded) {
      setDropdownOpen(false)
    }
  }, [expanded])

  return (
    <aside
      style={{
        width: expanded ? 218 : 87,

        transition:
          'width 0.22s ease',

        padding: '16px 12px',

        display: 'flex',
        flexDirection: 'column',

        gap: 2,

        flexShrink: 0,

        position: tablet
          ? 'fixed'
          : 'relative',

        left: tablet ? 14 : 'auto',
        top: tablet ? 14 : 'auto',
        bottom: tablet && !open ? 14 : 'auto',
        height: tablet && open ? 'calc(100vh - 28px)' : 'auto',

        zIndex: tablet ? 60 : 1,

        overflow: 'visible',

background: tablet
  ? 'rgba(255,255,255,0.92)'
  : 'transparent',

backdropFilter: tablet ? 'blur(16px)' : 'none',

border: tablet
  ? '1px solid rgba(255,255,255,0.78)'
  : 'none',

borderRadius: tablet ? 24 : 0,

boxShadow: tablet
  ? '0 18px 42px rgba(124,58,237,0.16)'
  : 'none',
      }}
    >
      {/* Expand strip */}
      {tablet && (
        <button
          onClick={onToggle}
          title={
            open
              ? 'Collapse sidebar'
              : 'Expand sidebar'
          }
style={{
  position: 'absolute',
  top: '50%',
  right: -2,
  transform: 'translateY(-50%)',

  width: 21,
  height: 36,

  border: 'none',
  background: 'transparent',
  color: '#969191ff',

  cursor: 'pointer',
  zIndex: 100,

  borderRadius: 999,

  boxShadow: '0 42px 9px rgba(124,58,237,0.14)',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
        >
          <i
            className={`ti ${
              open
                ? 'ti-chevron-left'
                : 'ti-chevron-right'
            }`}
            style={{ fontSize: 15 }}
          />
        </button>
      )}

      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',

          justifyContent: expanded
            ? 'flex-start'
            : 'center',

          gap: 8,

          padding: '8px 4px 26px',

          marginLeft: expanded ? -10 : 0
        }}
      >
        <img
          src="/favicon.png"
          alt="CrackIt Logo"
          style={{
            width: expanded ? 55 : 46,
            height: expanded ? 55 : 46,

            objectFit: 'contain',

            display: 'block',

            transition:
              'all 0.18s ease'
          }}
        />

        {expanded && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,

              lineHeight: 1,

              color: '#12053a',

              letterSpacing: '-1.3px',

              whiteSpace: 'nowrap'
            }}
          >
            Crack
            <span style={{ color: '#7c3aed' }}>
              !t
            </span>
          </div>
        )}
      </div>

      {/* Links */}
<div
  className="sidebar-scroll"
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    flex: 1,
    minHeight: 0,
    overflowY: tablet && open ? 'auto' : 'visible',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    paddingBottom: 10
  }}
>
        {links.map(link => (
          <SidebarLink
            key={link.to}
            {...link}
            expanded={expanded}
            tablet={tablet}
            onClose={onClose}
          />
        ))}

        <Divider />

        {expanded && (
          <SectionLabel>
            Interviews
          </SectionLabel>
        )}

        <SidebarLink
          to="/interviews"
          label="My Interviews"
          icon="ti-target"
          expanded={expanded}
          tablet={tablet}
          onClose={onClose}
        />

        <Divider />

        {expanded && (
          <SectionLabel>
            Resume
          </SectionLabel>
        )}

        <SidebarLink
          to="/resume"
          label="My Resume"
          icon="ti-file-cv"
          expanded={expanded}
          tablet={tablet}
          onClose={onClose}
        />
      </div>

      {/* Profile */}
      <div
        ref={dropdownRef}
        style={{
          position: 'relative',
          flexShrink: 0
        }}
      >
        {expanded && !isPro && (
          <div
            onClick={openUpgradeModal}
            style={{
              margin: '0 4px 6px',
              padding: '10px 12px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(236, 72, 153, 0.10) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.22)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(236, 72, 153, 0.16) 100%)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(236, 72, 153, 0.10) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5, color: '#6d28d9' }}>
                <i className="ti ti-crown" style={{ fontSize: 14, color: '#f59e0b' }} />
                <span>Crackit Pro</span>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#7c3aed', background: '#ffffff', padding: '2px 6px', borderRadius: 9999, border: '1px solid rgba(124,58,237,0.2)' }}>
                UPGRADE
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {aiUsageCount >= 3 ? 'Free AI credits exhausted' : `${aiUsageCount}/3 free AI scans used`}
            </div>
          </div>
        )}

        {!expanded && !isPro && (
          <button
            onClick={openUpgradeModal}
            title="Upgrade to Pro"
            style={{
              width: 36,
              height: 36,
              margin: '0 auto 6px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#d97706'
            }}
          >
            <i className="ti ti-crown" style={{ fontSize: 17 }} />
          </button>
        )}

        <Divider />

        <button
          onClick={() => {
            if (!expanded && onToggle) {
              onToggle()
              return
            }

            setDropdownOpen(!dropdownOpen)
          }}
          title={!expanded ? firstName : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 54,
            maxWidth: '100%',
            overflow: 'hidden',

            justifyContent: expanded
              ? 'flex-start'
              : 'center',

            gap: 10,

            padding: expanded
              ? '9px 10px'
              : '8px',

            borderRadius: 16,

            width: '100%',

            background: dropdownOpen
              ? 'rgba(255,255,255,0.72)'
              : 'rgba(255,255,255,0.34)',

            border:
              '1px solid rgba(255,255,255,0.46)',

            cursor: 'pointer',

            transition:
              'all 0.18s ease',

            fontFamily: 'inherit'
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,

              borderRadius: '50%',

              background:
                'linear-gradient(135deg, #7c3aed, #a78bfa)',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              color: '#fff',

              fontSize: 13,
              fontWeight: 800,

              flexShrink: 0
            }}
          >
            {initials}
          </div>

          {expanded && (
            <>
              <div
                style={{
                  flex: 1,

                  textAlign: 'left',

                  minWidth: 0
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: '#1a1040',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstName}</span>
                  {isPro && <ProBadge size="sm" />}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: isPro ? '#d97706' : '#9b8ec4',
                    fontWeight: isPro ? 700 : 500
                  }}
                >
                  {isPro ? 'Pro Member' : 'Free Tier'}
                </div>
              </div>

              <i
                className={`ti ${
                  dropdownOpen
                    ? 'ti-chevron-down'
                    : 'ti-chevron-up'
                }`}
                style={{
                  fontSize: 14,

                  color: '#a094c4',

                  flexShrink: 0
                }}
              />
            </>
          )}
        </button>

        {dropdownOpen && expanded && (
          <div
            style={{
              position: 'absolute',

              bottom: '100%',

              left: 0,
              right: 0,

              background:
                'rgba(255,255,255,0.96)',

              backdropFilter: 'blur(12px)',

              borderRadius: 16,

              marginBottom: 8,

              boxShadow:
                '0 16px 34px rgba(124,58,237,0.16)',

              border:
                '1px solid rgba(255,255,255,0.75)',

              overflow: 'hidden',

              zIndex: 100
            }}
          >
            <DropdownItem
              icon="ti-user-circle"
              label="My Profile"
              onClick={() => {
                navigate('/profile')
                setDropdownOpen(false)

                if (tablet && onClose) {
                  onClose()
                }
              }}
            />

            <DropdownItem
              icon="ti-file-cv"
              label="My Resume"
              onClick={() => {
                navigate('/resume')
                setDropdownOpen(false)

                if (tablet && onClose) {
                  onClose()
                }
              }}
            />

            <DropdownItem
              icon="ti-crown"
              label={isPro ? "Pro Membership & Plans" : "Upgrade to Pro"}
              onClick={() => {
                openUpgradeModal()
                setDropdownOpen(false)

                if (tablet && onClose) {
                  onClose()
                }
              }}
            />

            <div
              style={{
                height: 1,

                background:
                  'rgba(124,58,237,0.10)',

                margin: '2px 0'
              }}
            />

            <DropdownItem
              danger
              icon="ti-logout"
              label="Logout"
              onClick={handleLogout}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
function DropdownItem({
  icon,
  label,
  onClick,
  danger
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',

        gap: 10,

        padding: '11px 14px',

        width: '100%',

        background: 'transparent',

        border: 'none',

        cursor: 'pointer',

        fontSize: 14,

        color: danger
          ? '#ef4444'
          : '#1a1040',

        fontWeight: 600,

        fontFamily: 'inherit',

        transition:
          'background 0.15s ease'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background =
          danger
            ? '#fff5f5'
            : '#f5f0ff'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background =
          'transparent'
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{
          fontSize: 15,

          color: danger
            ? '#ef4444'
            : '#7c3aed'
        }}
      />

      {label}
    </button>
  )
}