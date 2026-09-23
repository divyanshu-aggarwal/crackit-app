import React from 'react'
import { AlertTriangle, RefreshCw, Home, Copy, Check, Terminal, Bug } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error("CrackIt Runtime Exception Caught by ErrorBoundary:", error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  handleCopyReport = () => {
    const { error, errorInfo } = this.state
    const report = `[CrackIt Crash Report]
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
Error: ${error?.toString()}
Component Stack:
${errorInfo?.componentStack || 'N/A'}`

    navigator.clipboard.writeText(report).then(() => {
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2500)
    })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, copied, showDetails } = this.state

      return (
        <div style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 16px',
          background: 'radial-gradient(circle at 18% 18%, rgba(244,63,94,0.12) 0px, transparent 350px), radial-gradient(circle at 82% 22%, rgba(124,58,237,0.15) 0px, transparent 420px), linear-gradient(180deg, #fdf4f6 0%, #f4effd 100%)',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{ width: '100%', maxWidth: '580px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 20px 45px rgba(244, 63, 94, 0.10), 0 4px 14px rgba(15, 23, 42, 0.04)',
              padding: '38px 32px',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}>
              
              {/* Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 13px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                background: '#fff1f2',
                color: '#e11d48',
                border: '1px solid #fecdd3',
                marginBottom: '18px'
              }}>
                <AlertTriangle style={{ width: '14px', height: '14px' }} />
                <span>RUNTIME_EXCEPTION_TRIPPED</span>
              </div>

              {/* Icon Illustration */}
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #ffe4e6 0%, #ede9fe 100%)',
                border: '1px solid #fecdd3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 20px rgba(225, 29, 72, 0.12)'
              }}>
                <Bug style={{ width: '34px', height: '34px', color: '#e11d48' }} />
              </div>

              {/* Title & Description */}
              <h2 style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#1a1040',
                letterSpacing: '-0.4px',
                margin: '0 0 10px'
              }}>
                Our AI Got Stage Fright
              </h2>

              <p style={{
                fontSize: '13.5px',
                color: '#6b6389',
                lineHeight: 1.55,
                maxWidth: '440px',
                margin: '0 auto 24px'
              }}>
                An unexpected runtime exception slipped into this view. Don’t worry, your interview progress and saved credentials are completely safe!
              </p>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '22px'
              }}>
                <button
                  onClick={this.handleReload}
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
                  <RefreshCw style={{ width: '15px', height: '15px' }} />
                  Restart View
                </button>

                <button
                  onClick={this.handleGoHome}
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
                  <Home style={{ width: '15px', height: '15px' }} />
                  Return to Safety
                </button>

                <button
                  onClick={this.handleCopyReport}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '11px 14px',
                    borderRadius: '13px',
                    background: '#f3f4f6',
                    color: '#4b5563',
                    fontSize: '13px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Copy error report to clipboard"
                >
                  {copied ? (
                    <>
                      <Check style={{ width: '14px', height: '14px', color: '#059669' }} />
                      <span style={{ color: '#059669', fontWeight: 600 }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: '14px', height: '14px' }} />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible Tech Diagnostics */}
              <div style={{
                borderTop: '1px solid #f0ecfc',
                paddingTop: '18px',
                textAlign: 'left'
              }}>
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#7c6faa',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <Terminal style={{ width: '14px', height: '14px' }} />
                  <span>{showDetails ? 'Hide' : 'Show'} Technical Diagnostics</span>
                </button>

                {showDetails && (
                  <div style={{
                    marginTop: '12px',
                    padding: '14px',
                    borderRadius: '14px',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono Variable', monospace",
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid #1e293b'
                  }}>
                    <p style={{ color: '#fb7185', fontWeight: 700, margin: '0 0 6px' }}>{error?.toString()}</p>
                    <pre style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {errorInfo?.componentStack || 'No component stack available'}
                    </pre>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
