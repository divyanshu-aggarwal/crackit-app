export default function PageHeader({
  title,
  subtitle,
  icon = 'ti-layout-dashboard',
  action
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 460,
        marginBottom: 24
      }}
    >
      <div>
        {/* top accent */}
        <div
          style={{
            width: 34,
            height: 3,
            opacity: 0.85,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            marginBottom: 14,
            boxShadow: '0 2px 10px rgba(124,58,237,0.18)'
          }}
        />

        <div
          style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          paddingTop: 2
          }}
        >
          <div
            style={{
            width: 38,
            height: 38,
            borderRadius: 12,
              background: 'rgba(124,58,237,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
              flexShrink: 0
            }}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
          </div>

          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#1a1040',
                letterSpacing: '-0.03em',
                lineHeight: 1.1
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <p
                style={{
                  marginTop: 5,
                  fontSize: 14,
                  color: '#7c6faa',
                  lineHeight: 1.5
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  )
}