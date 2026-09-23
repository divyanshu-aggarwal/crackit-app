import { useEffect, useState } from 'react'
import { STATUS_COLORS, STATUS_ORDER } from '../styles/theme'

export default function DonutChart({ statusCounts, isMobile: isMobileProp }) {
  const [isMobileWindow, setIsMobileWindow] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const handleResize = () => setIsMobileWindow(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileWindow
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const gap = 3

  let offset = circumference * 0.25

  const segments = STATUS_ORDER.map(status => {
    const count = statusCounts[status] || 0
    const pct = total > 0 ? count / total : 0
    const dash = Math.max(0, pct * circumference - gap)
    const seg = { status, count, dash, offset }
    offset -= pct * circumference
    return seg
  })

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'center',
      gap: isMobile ? 16 : 24
    }}>
      {/* Donut */}
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <svg viewBox="0 0 110 110" width="110" height="110">
          <circle cx="55" cy="55" r={radius} fill="none" stroke="#f3f0ff" strokeWidth="12" />
          {segments.map(({ status, dash, offset: off }) => (
            dash > 0 && (
              <circle
                key={status}
                cx="55" cy="55" r={radius}
                fill="none"
                stroke={STATUS_COLORS[status].dot}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={off}
                strokeLinecap="round"
              />
            )
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1040', lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 10, color: '#7c6faa', marginTop: 2 }}>total</div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{
        flex: 1,
        width: isMobile ? '100%' : 'auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '8px 12px' : 8
      }}>
        {STATUS_ORDER.map(status => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: STATUS_COLORS[status].dot, flexShrink: 0
            }} />
            <div style={{
              fontSize: 11,
              color: '#7c6faa',
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {status}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1040', marginLeft: 'auto' }}>
              {statusCounts[status] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}