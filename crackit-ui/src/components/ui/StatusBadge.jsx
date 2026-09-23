import { STATUS_COLORS } from '../../styles/theme'

const STATUS_ICONS = {
  SAVED: 'ti-bookmark',
  APPLIED: 'ti-send',
  CONTACTED: 'ti-mail',
  INTERVIEW: 'ti-user-question',
  OFFER: 'ti-rosette-discount-check',
  REJECTED: 'ti-x'
}

export default function StatusBadge({ status }) {
  const normalized = status?.toUpperCase() || 'SAVED'

  const s = STATUS_COLORS[normalized] || STATUS_COLORS.SAVED

  return (
    <span
      className="app-status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,

        height: 32,
        minWidth: 92,

        padding: '0 14px',

        borderRadius: 999,

        background: s.bg,
        color: s.color,

        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.01em',

        whiteSpace: 'nowrap',
        flexShrink: 0,

        border: `1px solid ${s.color}22`,

        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.45),
          0 2px 8px ${s.color}10
        `,

        backdropFilter: 'blur(6px)'
      }}
    >
      <i
        className={`ti ${STATUS_ICONS[normalized] || 'ti-circle'}`}
        style={{
          fontSize: 12,
          opacity: 0.9
        }}
      />

      <span style={{ position: 'relative', top: 0.5 }}>
        {normalized}
      </span>
    </span>
  )
}