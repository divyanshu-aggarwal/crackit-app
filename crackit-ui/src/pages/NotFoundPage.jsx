import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Home, 
  Briefcase, 
  RefreshCw, 
  Sparkles, 
  Compass, 
  ArrowLeft,
  Search,
  Bot
} from 'lucide-react'

const RECRUITER_EXCUSES = [
  "We decided to move forward with an internal candidate who has 14 years of experience in React 19.",
  "Our hiring team loved your resume, but the budget was reallocated to buy a commercial espresso machine for the breakroom.",
  "This page failed our automated ATS keyword screening because it didn't mention 'Kubernetes' at least 17 times.",
  "The role was filled 3 weeks ago, but our automated system will keep reposting it on LinkedIn every Monday morning.",
  "The interviewer asked this URL to invert a binary tree in O(1) space, and it panicked and vanished into the void.",
  "We noticed a 4-minute employment gap on this route in 2022, so the system automatically archived it.",
  "Our AI recruiter hallucinated this URL during an automated screening round. It sincerely apologizes.",
  "This route requires 5+ years of production experience in a framework that was released last Tuesday."
]

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [excuseIndex, setExcuseIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setExcuseIndex(Math.floor(Math.random() * RECRUITER_EXCUSES.length))
  }, [])

  const handleNextExcuse = () => {
    setIsSpinning(true)
    setTimeout(() => {
      setExcuseIndex(prev => (prev + 1) % RECRUITER_EXCUSES.length)
      setIsSpinning(false)
    }, 200)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/jobs')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 16px',
      background: 'radial-gradient(circle at 18% 18%, rgba(124,58,237,0.18) 0px, transparent 350px), radial-gradient(circle at 82% 22%, rgba(168,85,247,0.15) 0px, transparent 420px), linear-gradient(180deg, #f3eeff 0%, #ebe5fb 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: '620px' }}>
        
        {/* Main 404 Glass Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 20px 45px rgba(124, 58, 237, 0.12), 0 4px 12px rgba(15, 23, 42, 0.04)',
          padding: '40px 36px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          
          {/* Top Status Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            background: '#f3eeff',
            color: '#7c3aed',
            border: '1px solid #ddd6fe',
            marginBottom: '20px'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#7c3aed',
              boxShadow: '0 0 8px rgba(124,58,237,0.6)'
            }} />
            HTTP 404 : ATS_SCREENING_REJECTED
          </div>

          {/* Big Creative 4 [Compass] 4 Graphic */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            margin: '8px 0 20px',
            userSelect: 'none'
          }}>
            <span style={{
              fontSize: '96px',
              fontWeight: 900,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'JetBrains Mono Variable', monospace"
            }}>
              4
            </span>

            {/* Rotating compass badge replacing the '0' */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 12px 28px rgba(124,58,237,0.22)',
              border: '1.5px solid #ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  color: '#7c3aed', 
                  animation: 'spin 12s linear infinite' 
                }} 
              />
            </div>

            <span style={{
              fontSize: '96px',
              fontWeight: 900,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'JetBrains Mono Variable', monospace"
            }}>
              4
            </span>
          </div>

          {/* Headings */}
          <h1 style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#1a1040',
            letterSpacing: '-0.5px',
            margin: '0 0 10px'
          }}>
            Career Path Not Found
          </h1>

          <p style={{
            fontSize: '14px',
            color: '#6b6389',
            lineHeight: 1.55,
            maxWidth: '480px',
            margin: '0 auto 24px'
          }}>
            The job listing or page you’re hunting for seems to have ghosted us. It may have been filled, archived, or deleted by the recruiter.
          </p>

          {/* Interactive "Recruiter Translation" Widget */}
          <div style={{
            background: 'linear-gradient(180deg, #f9f7ff 0%, #f4f0ff 100%)',
            border: '1px solid #e4daff',
            borderRadius: '16px',
            padding: '16px 20px',
            textAlign: 'left',
            marginBottom: '22px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#6d28d9'
              }}>
                <Bot style={{ width: '15px', height: '15px', color: '#7c3aed' }} />
                Recruiter Rejection Reason #{excuseIndex + 1}
              </span>

              <button
                onClick={handleNextExcuse}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#7c3aed',
                  background: '#ffffff',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd6fe',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <RefreshCw style={{ 
                  width: '12px', 
                  height: '12px', 
                  animation: isSpinning ? 'spin 0.6s linear infinite' : 'none' 
                }} />
                Next Excuse
              </button>
            </div>

            <p style={{
              fontSize: '13px',
              fontStyle: 'italic',
              color: '#473d66',
              lineHeight: 1.5,
              paddingLeft: '12px',
              borderLeft: '3px solid #a78bfa',
              margin: 0
            }}>
              "{RECRUITER_EXCUSES[excuseIndex]}"
            </p>
          </div>

          {/* Quick Search Jump */}
          <form 
            onSubmit={handleSearchSubmit} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '460px',
              margin: '0 auto 28px',
              position: 'relative'
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{
                width: '16px',
                height: '16px',
                color: '#9ca3af',
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                placeholder="Looking for a specific role? (e.g. Java, Frontend)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  fontSize: '13px',
                  borderRadius: '13px',
                  border: '1.5px solid #e4daff',
                  background: '#ffffff',
                  color: '#1a1040',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <button
              type="submit"
              style={{
                padding: '11px 18px',
                borderRadius: '13px',
                background: '#7c3aed',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                transition: 'background 0.2s'
              }}
            >
              Search
            </button>
          </form>

          {/* Divider */}
          <div style={{ height: '1px', background: '#f0ecfc', margin: '0 0 24px' }} />

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '13px',
                background: '#7c3aed',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(124,58,237,0.28)'
              }}
            >
              <Home style={{ width: '16px', height: '16px' }} />
              Back to Dashboard
            </button>

            <button
              onClick={() => navigate('/jobs')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 18px',
                borderRadius: '13px',
                background: '#ffffff',
                color: '#7c3aed',
                fontSize: '13px',
                fontWeight: 600,
                border: '1.5px solid #ddd6fe',
                cursor: 'pointer'
              }}
            >
              <Briefcase style={{ width: '16px', height: '16px', color: '#7c3aed' }} />
              Explore Open Jobs
            </button>

            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '11px 14px',
                borderRadius: '13px',
                background: 'transparent',
                color: '#6b7280',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} />
              Go Back
            </button>
          </div>

          {/* Pro Tips Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#7c6faa'
          }}>
            <Sparkles style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
            <span>
              Need to polish your application? Head over to{' '}
              <button 
                onClick={() => navigate('/resume')} 
                style={{ 
                  color: '#7c3aed', 
                  fontWeight: 600, 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Resume Studio
              </button>.
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}
