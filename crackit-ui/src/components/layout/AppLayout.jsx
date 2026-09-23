import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'

export default function AppLayout() {
  const location = useLocation()

  const [visible, setVisible] = useState(false)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 568)

  const [isTablet, setIsTablet] = useState(
  window.innerWidth >= 568 && window.innerWidth < 1100
)


  const [sidebarOpen, setSidebarOpen] =
    useState(false)

useEffect(() => {
  const handleResize = () => {
    const mobile = window.innerWidth < 768
    const tablet = window.innerWidth >= 768 && window.innerWidth < 1100

    setIsMobile(mobile)
    setIsTablet(tablet)

    if (!tablet) setSidebarOpen(false)
  }

  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

  useEffect(() => {
    setVisible(false)

    const t = setTimeout(() => setVisible(true), 30)

    return () => clearTimeout(t)
  }, [location.pathname])

  useEffect(() => {
    if (isTablet) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  return (
    <div
      className="app-bg-pattern"
      style={{
        display: 'flex',
        minHeight: '100vh',
        padding: 14,
        gap: 0,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dark overlay */}
      {isTablet && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 10, 35, 0.42)',
            backdropFilter: 'blur(3px)',
            zIndex: 40
          }}
        />
      )}
{!isMobile && (
  <Sidebar
    tablet={isTablet}
    open={sidebarOpen}
    onToggle={() => setSidebarOpen(prev => !prev)}
    onClose={() => setSidebarOpen(false)}
  />
)}

      <main
        className="smart-scroll"
        style={{
          flex: 1,
          minWidth: 0,

          marginLeft: isTablet ? 70 : -10,
          padding: isMobile ? '22px 5px 126px 16px' : '28px 32px',
          background: 'transparent',
          boxShadow: 'none',
          borderRadius: 18,

          overflowY: 'auto',
          

          minHeight: 'calc(100vh - 28px)',

          position: 'relative'
        }}
      >
        
        <div
          style={{
            opacity: visible ? 1 : 0,

            transform: visible
              ? 'translateY(0)'
              : 'translateY(10px)',

            transition:
              'opacity 0.22s ease, transform 0.22s ease'
          }}
        >
          <Outlet />
        </div>
</main>

{isMobile && <MobileBottomNav />}

</div>
)
}