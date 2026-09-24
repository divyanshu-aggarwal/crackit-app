import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import AiLoadingOverlay from "../components/AiLoadingOverlay";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("milestones"); // "milestones", "gaps", "companies", "actionPlan"
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Form state for generating/updating roadmap
  const [formData, setFormData] = useState({
    currentRole: "Backend Engineer",
    yearsOfExperience: 2,
    currentSkills: "Java, Spring Boot, MySQL, REST APIs",
    currentCompensation: "8-10 LPA",
    targetRole: "Senior Backend Engineer",
    targetCompensation: "25-35 LPA",
    targetTimelineWeeks: 8,
    targetCompanyTypes: ["Fintech Unicorns", "Tier-1 Product Startups", "Global Tech MNCs"]
  });

  useEffect(() => {
    fetchCurrentRoadmap();
  }, []);

  const fetchCurrentRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/roadmap/current");
      if (res.status === 200 && res.data) {
        setRoadmap(res.data);
      } else {
        setRoadmap(null);
      }
    } catch (err) {
      console.error("Failed to load roadmap", err);
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setGenerating(true);
    setShowConfigModal(false);

    try {
      const skillsArray = typeof formData.currentSkills === "string"
        ? formData.currentSkills.split(",").map(s => s.trim()).filter(Boolean)
        : formData.currentSkills;

      const payload = {
        currentRole: formData.currentRole,
        yearsOfExperience: parseFloat(formData.yearsOfExperience) || 2.0,
        currentSkills: skillsArray,
        currentCompensation: formData.currentCompensation,
        targetRole: formData.targetRole,
        targetCompensation: formData.targetCompensation,
        targetTimelineWeeks: parseInt(formData.targetTimelineWeeks) || 8,
        targetCompanyTypes: formData.targetCompanyTypes
      };

      const res = await api.post("/api/roadmap/generate", payload);
      setRoadmap(res.data);
      setActiveTab("milestones");
    } catch (err) {
      console.error("Failed to generate roadmap", err);
      alert("Failed to generate career roadmap. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTopic = async (topicId, currentCompleted) => {
    if (!roadmap) return;
    try {
      const res = await api.post(
        `/api/roadmap/${roadmap.id}/topics/${topicId}/progress?completed=${!currentCompleted}`
      );
      setRoadmap(res.data);
    } catch (err) {
      console.error("Failed to update topic progress", err);
    }
  };

  const data = roadmap?.roadmapData || {};
  const readiness = data.readiness || {};
  const skillGaps = data.skillGaps || {};
  const milestones = data.milestones || [];
  const compatibleCompanies = data.compatibleCompanies || [];
  const actionPlan = data.actionPlanFirst48Hours || [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>
      {generating && (
        <AiLoadingOverlay
          title="Engineering Your Career Roadmap..."
          subtitle="Analyzing technical delta, evaluating hiring bars, and synthesizing milestones."
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <PageHeader
            title="Career Prep Roadmap"
            subtitle="Reverse-engineered path from your current stack to your target role & compensation."
          />
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 8px 18px rgba(124, 58, 237, 0.25)"
          }}
        >
          <i className="ti ti-adjustments-horizontal" style={{ fontSize: 18 }} />
          {roadmap ? "Configure Target & Re-Generate" : "Build Your Career Roadmap"}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#7c6faa" }}>
          <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 36, color: "#7c3aed", marginBottom: 16, display: "block" }} />
          Loading your career roadmap...
        </div>
      ) : !roadmap ? (
        /* Empty State / First-Time Experience */
        <Card style={{ padding: "60px 24px", textAlign: "center", maxWidth: 760, margin: "40px auto", borderRadius: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(124, 58, 237, 0.1)",
              color: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 32
            }}
          >
            <i className="ti ti-compass" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1a1040", margin: "0 0 10px" }}>
            No Active Career Roadmap Yet
          </h2>
          <p style={{ fontSize: 15, color: "#7c6faa", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Tell us your current role and your dream role (e.g. SDE-1 to Senior Backend Engineer at ₹30 LPA). We'll analyze current hiring bars, diagnose your exact skill gaps, match compatible companies, and build a week-by-week preparation roadmap.
          </p>
          <button
            onClick={() => setShowConfigModal(true)}
            style={{
              padding: "13px 28px",
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 16,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(124, 58, 237, 0.3)"
            }}
          >
            <i className="ti ti-rocket" style={{ marginRight: 8 }} />
            Build My Personalized Roadmap
          </button>
        </Card>
      ) : (
        /* Active Roadmap Content */
        <>
          {/* Top Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              marginBottom: 24
            }}
          >
            {/* Target Role & Package */}
            <Card style={{ padding: 20, borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#7c6faa", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Target Destination
                </span>
                <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(124,58,237,0.1)", color: "#7c3aed", fontSize: 12, fontWeight: 700 }}>
                  {roadmap.targetTimelineWeeks || 8} Weeks
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1040", marginBottom: 4 }}>
                {roadmap.targetRole}
              </div>
              <div style={{ fontSize: 14, color: "#10b981", fontWeight: 700 }}>
                {roadmap.targetCompensation || "Top of Market"}
              </div>
            </Card>

            {/* Readiness Score */}
            <Card style={{ padding: 20, borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#7c6faa", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Readiness Score
                </span>
                <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: 12, fontWeight: 700 }}>
                  {readiness.marketDemand || "HIGH DEMAND"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: "#7c3aed" }}>
                  {roadmap.overallScore || 75}%
                </span>
                <span style={{ fontSize: 13, color: "#7c6faa" }}>
                  Uplift: <b>{readiness.salaryUpliftPotential || "2.0x - 3.0x"}</b>
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                {readiness.verdict}
              </div>
            </Card>

            {/* Preparation Progress */}
            <Card style={{ padding: 20, borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#7c6faa", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Preparation Progress
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#7c3aed" }}>
                  {roadmap.overallProgress || 0}%
                </span>
              </div>
              {/* Progress Bar */}
              <div style={{ height: 10, borderRadius: 999, background: "#f1f5f9", overflow: "hidden", margin: "14px 0 10px" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${roadmap.overallProgress || 0}%`,
                    background: "linear-gradient(90deg, #8b5cf6, #7c3aed)",
                    borderRadius: 999,
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: "#7c6faa" }}>
                Check off topics as you practice to track your readiness in real time.
              </div>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: 8, borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 24, overflowX: "auto" }}>
            {[
              { id: "milestones", label: "Week-by-Week Milestones", icon: "ti-calendar-event" },
              { id: "gaps", label: "Skill Gap Matrix", icon: "ti-chart-arrows" },
              { id: "companies", label: "Compatible Companies", icon: "ti-building" },
              { id: "actionPlan", label: "First 48-Hour Plan", icon: "ti-flame" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 18px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "3px solid #7c3aed" : "3px solid transparent",
                  color: activeTab === tab.id ? "#7c3aed" : "#7c6faa",
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                <i className={`ti ${tab.icon}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Milestones */}
          {activeTab === "milestones" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {milestones.map((m, mIdx) => (
                <Card key={mIdx} style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", background: "rgba(124,58,237,0.1)", padding: "4px 10px", borderRadius: 12, marginRight: 8 }}>
                        {m.weekSpan || `Phase ${m.milestoneNumber}`}
                      </span>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "8px 0 4px" }}>
                        {m.title}
                      </h3>
                      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                        {m.objective}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                    {(m.topics || []).map((topic, tIdx) => {
                      const isDone = !!topic.completed;
                      return (
                        <div
                          key={topic.id || tIdx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 14,
                            padding: 14,
                            borderRadius: 14,
                            background: isDone ? "rgba(16, 185, 129, 0.04)" : "#f8fafc",
                            border: isDone ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(0,0,0,0.05)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTopic(topic.id, isDone)}
                            style={{
                              marginTop: 4,
                              width: 18,
                              height: 18,
                              accentColor: "#7c3aed",
                              cursor: "pointer"
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: isDone ? "#059669" : "#1e293b", textDecoration: isDone ? "line-through" : "none" }}>
                                {topic.title}
                              </span>
                              {topic.estimatedHours && (
                                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                                  ~{topic.estimatedHours}h
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>
                              <b>Concepts:</b> {topic.keyConcepts}
                            </div>
                            {topic.practiceTask && (
                              <div style={{ fontSize: 12, color: "#7c3aed", background: "rgba(124,58,237,0.06)", padding: "6px 10px", borderRadius: 8 }}>
                                <i className="ti ti-code" style={{ marginRight: 6 }} />
                                <b>Build Drill:</b> {topic.practiceTask}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Tab 2: Skill Gaps */}
          {activeTab === "gaps" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {/* Direct Gaps */}
              <Card style={{ padding: 22, borderRadius: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-alert-triangle" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a1040", margin: 0 }}>
                    Direct Knowledge Gaps
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(skillGaps.directGaps || []).map((gap, idx) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 12, background: "#fef2f2", border: "1px solid #fee2e2" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#991b1b" }}>{gap.skill}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", background: "#fecaca", padding: "2px 8px", borderRadius: 10 }}>
                          {gap.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#7f1d1d" }}>{gap.description}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Elimination Dealbreakers */}
              <Card style={{ padding: 22, borderRadius: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-shield-alert" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a1040", margin: 0 }}>
                    Elimination Dealbreakers
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(skillGaps.dealbreakersForTargetTier || []).map((db, idx) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 12, background: "#fffbeb", border: "1px solid #fef3c7" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                        {db.topic}
                      </div>
                      <div style={{ fontSize: 12, color: "#78350f" }}>
                        <b>Why Candidates Fail:</b> {db.why}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Transferable Strengths */}
              <Card style={{ padding: 22, borderRadius: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-check" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a1040", margin: 0 }}>
                    Transferable Strengths
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(skillGaps.transferableStrengths || []).map((st, idx) => (
                    <div key={idx} style={{ padding: 12, borderRadius: 12, background: "#f0fdf4", border: "1px solid #dcfce7" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#166534", marginBottom: 4 }}>
                        {st.skill}
                      </div>
                      <div style={{ fontSize: 12, color: "#14532d" }}>
                        <b>Interview Leverage:</b> {st.leverage}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Tab 3: Compatible Companies */}
          {activeTab === "companies" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
              {compatibleCompanies.map((c, idx) => (
                <Card key={idx} style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 4px" }}>
                        {c.companyName}
                      </h3>
                      <span style={{ fontSize: 12, color: "#7c6faa", fontWeight: 600 }}>
                        {c.category}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#7c3aed" }}>
                        {c.matchScore}%
                      </div>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>Affinity</span>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, margin: "0 0 14px" }}>
                    <b>Why Matched:</b> {c.whyMatched}
                  </p>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
                      Interview Rounds:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {(c.interviewRounds || []).map((round, rIdx) => (
                        <div key={rIdx} style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                          <i className="ti ti-circle-check" style={{ color: "#7c3aed", fontSize: 14 }} />
                          {round}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
                      Priority Focus Topics:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(c.priorityTopics || []).map((topic, tIdx) => (
                        <span key={tIdx} style={{ padding: "4px 10px", borderRadius: 8, background: "#f1f5f9", color: "#1e293b", fontSize: 11, fontWeight: 600 }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Tab 4: First 48-Hour Plan */}
          {activeTab === "actionPlan" && (
            <Card style={{ padding: 28, borderRadius: 20, maxWidth: 800 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(124,58,237,0.1)", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  <i className="ti ti-flame" />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: 0 }}>
                    Immediate Action Items (First 48 Hours)
                  </h3>
                  <p style={{ fontSize: 13, color: "#7c6faa", margin: 0 }}>
                    Small, decisive wins to break procrastination and establish momentum today.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {actionPlan.map((action, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: 16,
                      borderRadius: 14,
                      background: "#faf5ff",
                      border: "1px solid rgba(124,58,237,0.15)"
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#7c3aed",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ fontSize: 14, color: "#2e1065", lineHeight: 1.5, fontWeight: 500 }}>
                      {action}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Target Configuration Modal */}
      {showConfigModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 10, 35, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 28,
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(26,16,64,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1040", margin: 0 }}>
                Configure Your Career Roadmap
              </h2>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                    Current Role
                  </label>
                  <input
                    type="text"
                    value={formData.currentRole}
                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                  Current Tech Stack & Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={formData.currentSkills}
                  onChange={(e) => setFormData({ ...formData, currentSkills: e.target.value })}
                  placeholder="e.g. Java, Spring Boot, MySQL, REST APIs"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    placeholder="e.g. Senior Backend Engineer"
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                    Target Compensation
                  </label>
                  <input
                    type="text"
                    value={formData.targetCompensation}
                    onChange={(e) => setFormData({ ...formData, targetCompensation: e.target.value })}
                    placeholder="e.g. 25-35 LPA"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>
                  Target Timeline (Weeks)
                </label>
                <select
                  value={formData.targetTimelineWeeks}
                  onChange={(e) => setFormData({ ...formData, targetTimelineWeeks: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
                >
                  <option value={4}>4 Weeks (Aggressive Sprint)</option>
                  <option value={8}>8 Weeks (Recommended Standard)</option>
                  <option value={12}>12 Weeks (Comprehensive Deep Dive)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 12, background: "#f1f5f9", color: "#475569", border: "none", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(124, 58, 237, 0.25)"
                  }}
                >
                  Generate Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
