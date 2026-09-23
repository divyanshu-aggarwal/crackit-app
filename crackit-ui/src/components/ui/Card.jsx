export default function Card({ children, style, className = '' }) {
  return (
    <div
      className={`app-card ${className}`}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: 20,
        border: '1px solid rgba(196,181,253,0.25)',
        boxShadow: `
          0 1px 0 0 rgba(255,255,255,0.9) inset,
          0 1px 3px rgba(15,23,42,0.04),
          0 8px 24px rgba(109,70,193,0.07)
        `,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        willChange: 'transform',
        position: 'relative',
        zIndex: 1,
        ...style
      }}
    >
      {children}
    </div>
  )
}