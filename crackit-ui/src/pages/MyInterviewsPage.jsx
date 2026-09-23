import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from '../components/ui/PageHeader'
import { API_BASE_URL } from '../api/axios'

const API = `${API_BASE_URL}/api`;
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  Authorization: `Bearer ${token()}`,
  "Content-Type": "application/json",
});

function ProgressRing({ progress, size = 56, stroke = 4, color = "#7c3aed" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ede9fe" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontSize: size * 0.22, fontWeight: 700, fill: color }}
      >
        {progress}%
      </text>
    </svg>
  );
}

function StatPill({ icon, value, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 13, color }} />
      <span style={{ fontSize: 12, color: "#1a1040", fontWeight: 600 }}>{value}</span>
      <span style={{ fontSize: 12, color: "#a094c4" }}>{label}</span>
    </div>
  );
}

function InterviewCard({ interview, onNavigate }) {
  const isMobile = window.innerWidth < 768;
  const progressColor = interview.overallProgress >= 75 ? "#10b981"
    : interview.overallProgress >= 40 ? "#f59e0b" : "#7c3aed";

  const readiness = !interview.prepGenerated ? "Not started"
    : interview.overallProgress >= 75 ? "Ready"
    : interview.overallProgress >= 40 ? "In progress"
    : "Just started";

  const readinessColor = !interview.prepGenerated ? "#a094c4"
    : interview.overallProgress >= 75 ? "#10b981"
    : interview.overallProgress >= 40 ? "#f59e0b" : "#7c3aed";

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "1.5rem",
      border: "1px solid #f0eeff", transition: "all 0.2s",
      display: "flex", flexDirection: "column", gap: "1rem",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#c4b5fd"; e.currentTarget.style.boxShadow = "0 14px 34px rgba(124,58,237,0.12)"; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0eeff"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = 'translateY(0)';}}
    >
      {/* Header */}
      <div style={{ display: "flex",
flexDirection: isMobile ? "column" : "row",
alignItems: isMobile ? "stretch" : "flex-start",
justifyContent: "space-between",
 gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1040", marginBottom: "0.25rem", lineHeight: 1.3 }}>
            {interview.jobTitle}
          </div>
          <div style={{ fontSize: "0.88rem", color: "#7c3aed", fontWeight: 500, marginBottom: "0.25rem" }}>
            {interview.companyName}
          </div>
          {interview.location && (
            <div style={{ fontSize: "0.78rem", color: "#a094c4", display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 11 }} /> {interview.location}
            </div>
          )}
        </div>

        {/* Progress ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
          <ProgressRing
            progress={interview.overallProgress || 0}
            color={progressColor}
          />
          <span style={{ fontSize: "0.7rem", color: readinessColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {readiness}
          </span>
        </div>
      </div>

      {/* Stats */}
      {interview.prepGenerated ? (
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", padding: "0.75rem 0", borderTop: "1px solid #f5f3ff", borderBottom: "1px solid #f5f3ff" }}>
          <StatPill icon="ti-list-check" value={`${interview.completedTopics}/${interview.totalTopics}`} label="topics done" color="#7c3aed" />
          <StatPill icon="ti-message-question" value={`${interview.practicedQuestions}/${interview.totalQuestions}`} label="questions practiced" color="#2563eb" />
        </div>
      ) : (
        <div style={{ padding: "0.75rem 0", borderTop: "1px solid #f5f3ff", borderBottom: "1px solid #f5f3ff" }}>
          <div style={{ fontSize: "0.82rem", color: "#a094c4", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 14 }} />
            No prep generated yet — generate your prep plan to get started
          </div>
        </div>
      )}

      {/* Topic progress bar */}
      {interview.prepGenerated && interview.totalTopics > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.72rem", color: "#a094c4", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Study progress</span>
            <span style={{ fontSize: "0.72rem", color: progressColor, fontWeight: 600 }}>{interview.overallProgress || 0}%</span>
          </div>
          <div style={{ height: 6, background: "#f0eeff", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${progressColor}80, ${progressColor})`,
              width: `${interview.overallProgress || 0}%`,
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>
      )}

      {/* Last updated */}
      {interview.updatedAt && (
        <div style={{ fontSize: "0.72rem", color: "#c4b5fd" }}>
          Last updated {new Date(interview.updatedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      )}

      {/* Actions */}
      <div
  style={{
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: "0.5rem"
  }}
>
        <button
          onClick={() => onNavigate(`/jobs/${interview.jobId}/prep`)}
          style={{
            flex: 1, padding: "0.6rem 1rem", borderRadius: 10,
            background: "#7c3aed", color: "#fff", border: "none",
            fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "inherit", transition: "background 0.15s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#6b2fd6"}
          onMouseLeave={e => e.currentTarget.style.background = "#7c3aed"}
        >
          <i className="ti ti-brain" style={{ fontSize: 14 }} />
          {interview.prepGenerated ? "Continue Prep" : "Start Prep"}
        </button>
        <button
          onClick={() => onNavigate(`/jobs/${interview.jobId}`)}
          style={{
            flex: isMobile ? 1 : undefined,
            padding: "0.6rem 1rem", borderRadius: 10,
            background: "transparent", color: "#7c3aed",
            border: "1px solid #e0d9ff", fontSize: "0.85rem",
            fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center",justifyContent: "center", gap: 6, transition: "all 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f5f0ff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <i className="ti ti-briefcase" style={{ fontSize: 14 }} /> View Job
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onNavigate }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 480, margin: "0 auto" }}>
      <div style={{fontSize: "4rem",
color: "#c4b5fd",
marginBottom: "1rem",
display: "inline-block" }}><i className="ti ti-target-arrow" /></div>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1a1040", margin: "0 0 0.5rem" }}>
        No interviews scheduled yet
      </h2>
      <p style={{ fontSize: "0.88rem", color: "#a094c4", lineHeight: 1.7, margin: "0 0 1.5rem" }}>
        When you update a job's status to <strong>INTERVIEW</strong> in the tracker, it'll appear here with your AI-generated prep plan.
      </p>
      <button
        onClick={() => onNavigate("/tracker")}
        style={{
          padding: "0.6rem 1.5rem", borderRadius: 10,
          background: "#7c3aed", color: "#fff", border: "none",
          fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit"
        }}
      >
        Go to Tracker →
      </button>
    </div>
  );
}

export default function MyInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchInterviews(); }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/interviews`, { headers: authHeaders() });
      if (res.ok) setInterviews(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const overallReady = interviews.filter(i => i.overallProgress >= 75).length;
  const totalPrepped = interviews.filter(i => i.prepGenerated).length;

  return (
    <>
      <style>{`
       .interviews-page {
  max-width: 960px;
}

.interviews-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  color: #a094c4;
  gap: 0.5rem;
  font-size: 0.9rem;
}

@media (max-width: 768px) {

  .interviews-page {
    max-width: 100%;
  }

  .interviews-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

  .mobile-summary {
    flex-direction: column;
    
  }

  .mobile-summary-card {
    width: 100%;
  }
}
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <div className="interviews-page">
        {/* Header */}
        <PageHeader
  title="Interviews"
  subtitle="Track and prepare for upcoming interviews"
  icon="ti-messages"
/>

        {loading ? (
          <div className="loading-state">
            <i className="ti ti-loader spin" /> Loading your interviews...
          </div>
        ) : interviews.length === 0 ? (
          <EmptyState onNavigate={navigate} />
        ) : (
          <>
            {/* Summary bar */}
 <div
  className="mobile-summary"
  style={{
    display: 'flex',
    gap: '1rem',
    marginBottom: 16,

    background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(10px)',

  borderRadius: 20,

  padding: '1rem 1.1rem',

  border: '1px solid rgba(255,255,255,0.6)',

  boxShadow:
    '0 10px 28px rgba(124,58,237,0.08)'
}}>
              {[
                { label: "Interviews", value: interviews.length, icon: "ti-calendar", color: "#7c3aed", bg: "#ede9fe" },
                { label: "Prep generated", value: totalPrepped, icon: "ti-sparkles", color: "#2563eb", bg: "#dbeafe" },
                { label: "Interview ready", value: overallReady, icon: "ti-circle-check", color: "#10b981", bg: "#d1fae5" },
              ].map(({ label, value, icon, color, bg }) => (
                <div
  key={label}
  className="mobile-summary-card"
  style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: '0.9rem 1rem',
borderRadius: 16,

background: '#fff',

border: '1px solid rgba(124,58,237,0.08)',

boxShadow:
  '0 2px 8px rgba(124,58,237,0.04)', flex: 1
                }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 18, color }} />
                  <div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a1040", lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "0.68rem", color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2, opacity:0.9 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cards grid */}
            <div className="interviews-grid">
              {interviews.map(interview => (
                <InterviewCard
                  key={interview.jobId}
                  interview={interview}
                  onNavigate={navigate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}