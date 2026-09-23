import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Card from '../components/ui/Card'
import QuickScanModal from '../components/QuickScanModal'
import { JobsSkeleton } from '../components/Skeletons'
import { useToast } from '../components/ui/ToastProvider'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [showScan, setShowScan] = useState(false)
  const [screenWidth, setScreenWidth] = useState(window.innerWidth)

  const navigate = useNavigate()
  const { showToast } = useToast()

  const isMobile = screenWidth < 760

  const [form, setForm] = useState({
    companyName: '',
    title: '',
    location: '',
    experienceRequired: '',
    salaryRange: '',
    source: '',
    applyUrl: '',
    jdText: ''
  })

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    api.get('/api/jobs')
      .then(res => setJobs(res.data))
      .finally(() => setPageLoading(false))
  }, [])

  const toTitleCase = (value) => {
    if (!value) return ''
    return value.toString().trim().toLowerCase().split(' ')
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
      .join(' ')
  }

  const formatExperience = (value) => {
    if (!value?.trim()) return ''
    const v = value.trim()
    if (v.toLowerCase().includes('year')) return toTitleCase(v)
    return `${v} Years`
  }

  const formatSalary = (value) => {
    if (!value?.trim()) return ''
    const v = value.trim()
    const lower = v.toLowerCase()

    if (
      lower.includes('not disclosed') ||
      lower.includes('undisclosed') ||
      lower.includes('confidential') ||
      lower.includes('negotiable')
    ) return 'Not Disclosed'

    if (lower.includes('lpa')) return v.replace(/lpa/gi, 'LPA')

    return `${v} LPA`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...form,
      location: toTitleCase(form.location),
      experienceRequired: formatExperience(form.experienceRequired),
      salaryRange: formatSalary(form.salaryRange)
    }

    try {
      const res = await api.post('/api/jobs', payload)
      setJobs(prev => [res.data, ...prev])
      setOpen(false)

      setForm({
        companyName: '',
        title: '',
        location: '',
        experienceRequired: '',
        salaryRange: '',
        source: '',
        applyUrl: '',
        jdText: ''
      })

      showToast({ type: 'success', message: 'Job added successfully' })
    } catch (e) {
      showToast({ type: 'error', message: 'Failed to add job' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (job) => {
    const id = job.id || job.jobId
    if (!id) return showToast({ type: 'error', message: 'Could not delete job' })
    if (!window.confirm('Delete this job?')) return

    try {
      await api.delete(`/api/jobs/${id}`)
      setJobs(prev => prev.filter(j => (j.id || j.jobId) !== id))
      showToast({ type: 'success', message: 'Job deleted' })
    } catch (e) {
      showToast({ type: 'error', message: 'Failed to delete job' })
    }
  }

  const goToJob = (job) => {
    const id = job.id || job.jobId
    if (!id) return showToast({ type: 'error', message: 'Could not open job details' })
    navigate(`/jobs/${id}`)
  }

  if (pageLoading) return <JobsSkeleton />

  return (
    <>
      <style>
        {`
          .jobs-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(18, 11, 44, 0.54);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 32px 18px;
            overflow-y: auto;
          }

          .jobs-modal {
            width: 100%;
            max-width: 680px;
            background: #fff;
            border-radius: 26px;
            box-shadow: 0 30px 90px rgba(18, 11, 44, 0.30);
            overflow: hidden;
            border: 1px solid rgba(139, 92, 246, 0.14);
            max-height: calc(100dvh - 24px);
            display: flex;
            flex-direction: column;
          }

          .jobs-modal-header {
            padding: 28px 30px 18px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
          }

          .jobs-modal-body {
            padding: 0 30px 24px;
            overflow-y: auto;
          }

          .jobs-modal-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 14px;
          }

          .jobs-modal-footer {
            padding: 18px 30px 24px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            border-top: 1px solid rgba(139,92,246,0.10);
            background: #fff;
            position: sticky;
bottom: 0;
z-index: 5;
          }

          @media (max-width: 720px) {
            .jobs-modal-grid {
              grid-template-columns: 1fr;
            }

            .jobs-modal-overlay {
            min-height: 100dvh;
              padding: 12px 12px 110px;
            }

            .jobs-modal-header,
            .jobs-modal-body,
            .jobs-modal-footer {
              padding-left: 20px;
              padding-right: 20px;
            }
          }
        `}
      </style>

      <div style={{ width: '100%', maxWidth: 1200 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'start',
            gap: 18,
            marginBottom: 24,
            width: '100%'
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                width: 46,
                height: 4,
                borderRadius: 999,
                background: '#8b5cf6',
                marginBottom: 12
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  background: 'rgba(124,58,237,0.10)',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <i className="ti ti-briefcase" style={{ fontSize: 22 }} />
              </div>

              <div>
                <h1
                  style={{
                    fontSize: isMobile ? 26 : 30,
                    fontWeight: 800,
                    color: '#1a1040',
                    margin: 0,
                    lineHeight: 1.05,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Jobs
                </h1>

                <p
                  style={{
                    fontSize: isMobile ? 14 : 15,
                    color: '#7c6faa',
                    marginTop: 8,
                    marginBottom: 0
                  }}
                >
                  {jobs.length} jobs added
                </p>
              </div>
            </div>
          </div>

          <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 10,

    transform: isMobile ? 'scale(0.88)' : 'none',
    transformOrigin: 'top right',

    flexShrink: 0
  }}

>
            <button onClick={() => setOpen(true)} style={{
  ...secondaryActionBtn,
  width: isMobile ? 165 : 170,
  justifyContent: 'center'
}}>
              <i className="ti ti-plus" style={{ fontSize: 15 }} />
              Add Job
            </button>

            <button onClick={() => setShowScan(true)} style={{
  ...primaryActionBtn,
  width: isMobile ? 165 : 170,
  justifyContent: 'center'
}}>
              <i className="ti ti-bolt" style={{ fontSize: 15 }} />
              Quick JD Scan
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 14
          }}
        >
          {jobs.length === 0 && (
            <div className="app-card" style={{ gridColumn: '1/-1', padding: 34, textAlign: 'center' }}>
              <i className="ti ti-briefcase" style={{ fontSize: 38, color: '#a78bfa' }} />

              <div style={{ marginTop: 12, fontSize: 16, fontWeight: 700, color: '#1a1040' }}>
                No jobs yet
              </div>

              <div style={{ marginTop: 5, fontSize: 13, color: '#8b7bb4' }}>
                Add your first job to start tracking and tailoring your resume.
              </div>

              <button onClick={() => setOpen(true)} style={{ ...primaryActionBtn, margin: '18px auto 0' }}>
                <i className="ti ti-plus" style={{ fontSize: 15 }} />
                Add Job
              </button>
            </div>
          )}

          {jobs.map(job => {
            const cardKey = job.id || job.jobId
            const displayLocation = toTitleCase(job.location)
            const displayExperience = formatExperience(job.experienceRequired)
            const displaySalary = formatSalary(job.salaryRange)

            return (
              <Card key={cardKey} style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
                <div
                  onClick={() => goToJob(job)}
                  style={{
                    display: 'flex',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: 18,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={companyAvatarStyle}>
                      {job.companyName?.charAt(0)?.toUpperCase() || 'C'}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={jobTitleStyle}>{job.title}</div>

                      <div style={companyNameStyle}>
                        <i className="ti ti-building" style={{ fontSize: 14 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {job.companyName}
                        </span>
                      </div>

                      <div style={metaWrapStyle}>
                        {displayLocation && (
                          <div style={metaStyle}>
                            <i className="ti ti-map-pin" style={{ fontSize: 12 }} />
                            {displayLocation}
                          </div>
                        )}

                        {displaySalary && (
                          <div style={metaStyle}>
                            <i className="ti ti-currency-rupee" style={{ fontSize: 12 }} />
                            {displaySalary}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={rightSideStyle}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(job)
                      }}
                      title="Delete job"
                      style={deleteBtnStyle}
                    >
                      <i className="ti ti-trash" style={{ fontSize: 14 }} />
                    </button>

                    {displayExperience && <span style={experienceBadgeStyle}>{displayExperience}</span>}

                    {job.source && (
                      <span style={sourceBadgeStyle}>
                        {job.source}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {showScan && <QuickScanModal onClose={() => setShowScan(false)} />}
      </div>

      {open && createPortal(
        <div className="jobs-modal-overlay">
          <div className="jobs-modal">
            <div className="jobs-modal-header">
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1040' }}>
                  Add New Job
                </div>

                <div style={{ fontSize: 13, color: '#8b7bb4', marginTop: 6 }}>
                  Save a role and start tailoring your resume
                </div>
              </div>

              <button onClick={() => setOpen(false)} style={closeBtnStyle}>
                <i className="ti ti-x" style={{ fontSize: 18 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="jobs-modal-body">
                <div className="jobs-modal-grid">
                  {[
                    { key: 'companyName', label: 'Company Name *', placeholder: 'Google' },
                    { key: 'title', label: 'Job Title *', placeholder: 'Senior Backend Engineer' },
                    { key: 'location', label: 'Location', placeholder: 'Remote / Bangalore' },
                    { key: 'experienceRequired', label: 'Experience', placeholder: '3 or 3-5' },
                    { key: 'salaryRange', label: 'Salary Range', placeholder: '18, 18-25, Not Disclosed' },
                    { key: 'source', label: 'Source', placeholder: 'LinkedIn, Naukri...' }
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder}
                        required={label.includes('*')}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Apply URL</label>
                  <input
                    value={form.applyUrl}
                    onChange={e => setForm({ ...form, applyUrl: e.target.value })}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Job Description *</label>
                  <textarea
                    value={form.jdText}
                    onChange={e => setForm({ ...form, jdText: e.target.value })}
                    placeholder="Paste the full job description here..."
                    required
                    style={{ ...inputStyle, minHeight: 135, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
              </div>

              <div className="jobs-modal-footer">
                <button type="button" onClick={() => setOpen(false)} style={cancelBtnStyle}>
                  Cancel
                </button>

                <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.65 : 1 }}>
                  {loading ? 'Adding...' : 'Add Job'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const primaryActionBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '10px 18px',
  borderRadius: 18,
  background: '#7c3aed',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(124, 58, 237, 0.18)'
}

const secondaryActionBtn = {
  ...primaryActionBtn,
  background: '#fff',
  color: '#7c3aed',
  border: '1px solid rgba(124, 58, 237, 0.18)',
  boxShadow: 'none'
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 13,
  border: '1px solid #e4daff',
  fontSize: 13,
  outline: 'none',
  color: '#1a1040',
  background: '#faf8ff'
}

const labelStyle = {
  fontSize: 11.5,
  color: '#7c6faa',
  display: 'block',
  marginBottom: 6,
  fontWeight: 700
}

const btnStyle = {
  padding: '11px 22px',
  borderRadius: 14,
  background: '#7c3aed',
  color: '#fff',
  border: 'none',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer'
}

const cancelBtnStyle = {
  padding: '11px 20px',
  borderRadius: 14,
  background: '#fff',
  color: '#7c3aed',
  border: '1px solid rgba(124,58,237,0.18)',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer'
}

const closeBtnStyle = {
  width: 38,
  height: 38,
  borderRadius: 14,
  border: 'none',
  background: '#f5f0ff',
  color: '#7c3aed',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const companyAvatarStyle = {
  width: 46,
  height: 46,
  borderRadius: 15,
  background: 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(167,139,250,0.18))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 17,
  fontWeight: 800,
  color: '#7c3aed'
}

const jobTitleStyle = {
  fontSize: 15,
  fontWeight: 700,
  color: '#1a1040',
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}

const companyNameStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  color: '#7c3aed',
  marginTop: 6,
  fontWeight: 600
}

const metaWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 8
}

const metaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11.5,
  color: '#8b7bb4',
  fontWeight: 500
}

const rightSideStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 8,
  flexShrink: 0,
  marginLeft: 'auto'
}

const deleteBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: '#b09adf',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const experienceBadgeStyle = {
  fontSize: 10.5,
  background: '#ede9fe',
  color: '#5b21b6',
  padding: '5px 10px',
  borderRadius: 999,
  fontWeight: 700
}

const sourceBadgeStyle = {
  fontSize: 10,
  padding: '4px 8px',
  borderRadius: 999,
  background: '#dbeafe',
  color: '#1e40af',
  fontWeight: 700,
  textTransform: 'uppercase'
}