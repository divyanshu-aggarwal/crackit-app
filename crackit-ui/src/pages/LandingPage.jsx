import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LandingPage() {
  const navigate = useNavigate();
  const [sampleRoadmap, setSampleRoadmap] = useState(null);
  const [selectedRole, setSelectedRole] = useState("backend");
  const [checkedTopics, setCheckedTopics] = useState({ "s-1": true, "s-2": true });

  useEffect(() => {
    api.get("/api/roadmap/sample")
      .then(res => setSampleRoadmap(res.data))
      .catch(() => {
        // Fallback demo data if backend is starting
        setSampleRoadmap({
          targetRole: "Senior Backend Engineer / Staff Architect",
          targetCompensation: "₹35 - 45 LPA ($140k - $180k)",
          readiness: {
            overallScore: 78,
            verdict: "Strong architectural foundation; requires sharpening distributed concurrency & LLD machine coding.",
            salaryUpliftPotential: "2.5x - 3.2x"
          },
          milestones: [
            {
              title: "Low-Level Design (LLD) & Concurrency Mastery",
              weekSpan: "Weeks 1 - 2",
              topics: [
                { id: "s-1", title: "Thread Pools & Lock Contention", keyConcepts: "ReentrantLock, synchronized, Atomic variables" },
                { id: "s-2", title: "Distributed Rate Limiter Implementation", keyConcepts: "Redis Sorted Sets, Atomic Lua scripts, HTTP 429" },
                { id: "s-3", title: "Idempotent Webhook Processing Engine", keyConcepts: "HMAC-SHA256 verification, distributed deduplication" }
              ]
            }
          ],
          compatibleCompanies: [
            { companyName: "Razorpay / PhonePe", category: "Fintech Unicorn", matchScore: 92, whyMatched: "Values deep JVM transaction isolation and zero payment loss." },
            { companyName: "Swiggy / Zepto", category: "Quick-Commerce", matchScore: 89, whyMatched: "Massive write concurrency and sub-100ms API latency." }
          ]
        });
      });
  }, []);

  const toggleTopic = (id) => {
    setCheckedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fcfbfe", color: "#1a1040", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(124, 58, 237, 0.08)",
          padding: "16px 24px"
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 18
              }}
            >
              C
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#1a1040", letterSpacing: -0.5 }}>
              Crack<span style={{ color: "#7c3aed" }}>It</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="#features" style={{ color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Features</a>
            <a href="#roadmap-preview" style={{ color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Roadmap Preview</a>
            <a href="#pricing" style={{ color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Free vs Pro</a>
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              to="/login"
              style={{
                padding: "8px 16px",
                color: "#7c3aed",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12
              }}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              style={{
                padding: "9px 18px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12,
                boxShadow: "0 6px 16px rgba(124, 58, 237, 0.25)"
              }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: "70px 24px 50px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        {/* Eyebrow Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: "rgba(124, 58, 237, 0.08)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            color: "#7c3aed",
            marginBottom: 20
          }}
        >
          <span style={{ fontSize: 14 }}>🚀</span>
          Zero-Cost Tech Career Acceleration Engine
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 54px)",
            fontWeight: 900,
            color: "#1a1040",
            lineHeight: 1.15,
            letterSpacing: -1,
            margin: "0 0 20px"
          }}
        >
          Land Your Next Senior Tech Role with{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Precision AI Coaching
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "#64748b",
            lineHeight: 1.6,
            maxWidth: 720,
            margin: "0 auto 32px"
          }}
        >
          Reverse-engineer the path from your current stack to your dream package. Get week-by-week prep roadmaps, Google X-Y-Z formula resume tailoring, and bar-raiser mock interview simulations.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 36 }}>
          <Link
            to="/signup"
            style={{
              padding: "14px 30px",
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              color: "#fff",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 16,
              boxShadow: "0 10px 24px rgba(124, 58, 237, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            Build My Free Career Roadmap
            <i className="ti ti-arrow-right" />
          </Link>
          <Link
            to="/login"
            style={{
              padding: "14px 24px",
              background: "#fff",
              color: "#1a1040",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
            }}
          >
            Sign In with Google
          </Link>
        </div>

        {/* Social Proof / Guarantee */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
          <span>✓ 100% Free Forever Tier</span>
          <span>✓ Google X-Y-Z Resume Standards</span>
          <span>✓ Zero Generic Fluff</span>
        </div>
      </section>

      {/* Interactive Roadmap Demo Section */}
      <section id="roadmap-preview" style={{ padding: "40px 24px 80px", maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
            See How CrackIt Reverse-Engineers Your Roadmap
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            Try this interactive sample for a <b>Backend Engineer (2 YOE)</b> targeting <b>₹35 LPA / $150k</b>.
          </p>
        </div>

        {/* Roadmap Preview Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "clamp(20px, 4vw, 36px)",
            boxShadow: "0 20px 50px rgba(124, 58, 237, 0.08)",
            border: "1px solid rgba(124, 58, 237, 0.12)"
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 20, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#7c3aed", background: "rgba(124,58,237,0.1)", padding: "4px 10px", borderRadius: 10 }}>
                8-Week Sprint
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: "#1a1040", margin: "10px 0 4px" }}>
                {sampleRoadmap?.targetRole || "Senior Backend Engineer"}
              </h3>
              <div style={{ fontSize: 14, color: "#10b981", fontWeight: 700 }}>
                Target Package: {sampleRoadmap?.targetCompensation || "₹35 - 45 LPA"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#7c3aed" }}>
                {sampleRoadmap?.readiness?.overallScore || 78}%
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Readiness Score • <b>2.5x-3.2x Uplift</b></div>
            </div>
          </div>

          {/* Compatible Companies Preview */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
              Top Matched Companies:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {(sampleRoadmap?.compatibleCompanies || []).map((c, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>{c.companyName}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#7c3aed" }}>{c.matchScore}% Match</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{c.whyMatched}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Week-by-Week Topics */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
              Interactive Week 1-2 Practice Drill (Try clicking checkboxes!):
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sampleRoadmap?.milestones?.[0]?.topics?.map((topic) => {
                const isChecked = !!checkedTopics[topic.id];
                return (
                  <div
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: isChecked ? "rgba(16, 185, 129, 0.05)" : "#fff",
                      border: isChecked ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ width: 18, height: 18, accentColor: "#7c3aed", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isChecked ? "#059669" : "#1e293b", textDecoration: isChecked ? "line-through" : "none" }}>
                        {topic.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {topic.keyConcepts}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isChecked ? "#10b981" : "#94a3b8" }}>
                      {isChecked ? "COMPLETED" : "CLICK TO COMPLETE"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teaser CTA */}
          <div style={{ marginTop: 28, textAlign: "center", padding: "20px 0 0", borderTop: "1px solid #f1f5f9" }}>
            <Link
              to="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 14,
                boxShadow: "0 8px 20px rgba(124, 58, 237, 0.25)"
              }}
            >
              Generate My Personal Roadmap in 15 Seconds
              <i className="ti ti-arrow-right" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pillars Feature Grid */}
      <section id="features" style={{ padding: "40px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1a1040", margin: "0 0 10px" }}>
            Everything You Need to Crack Senior Interviews
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", margin: 0 }}>
            Engineered to eliminate candidate rejection points at top tier tech companies.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
          {/* Pillar 1 */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 26, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,58,237,0.1)", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
              <i className="ti ti-map-2" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
              Personalized Prep Roadmap
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Calculates the exact delta between your current stack and your target role, with week-by-week practice drills.
            </p>
          </div>

          {/* Pillar 2 */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 26, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
              <i className="ti ti-file-text" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
              Google X-Y-Z Resume Tailoring
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Bans passive phrases. Automatically frames your real achievements into high-impact bullet points with diverse metrics.
            </p>
          </div>

          {/* Pillar 3 */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 26, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
              <i className="ti ti-building" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
              Target Company Compatibility
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Identifies companies actively hiring for your profile, their interview round breakdown, and priority focus topics.
            </p>
          </div>

          {/* Pillar 4 */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 26, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(245,158,11,0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
              <i className="ti ti-messages" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
              Bar-Raiser Mock Interviews
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Simulates tough failure scenarios and concurrency drills with conversational AI feedback powered by Gemini 2.5 Flash.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Free Tier Section */}
      <section id="pricing" style={{ padding: "40px 24px 80px", maxWidth: 840, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1a1040", margin: "0 0 10px" }}>
          Built for Developers. Free to Start.
        </h2>
        <p style={{ fontSize: 16, color: "#64748b", margin: "0 0 36px" }}>
          No hidden credit card traps. Everything you need to get job-ready today.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, textAlign: "left" }}>
          {/* Free Tier */}
          <div style={{ background: "#fff", borderRadius: 22, padding: 30, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Free Tier</span>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#1a1040", margin: "10px 0 4px" }}>₹0</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Forever free for every engineer</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#334155", marginBottom: 24 }}>
              <div>✓ Unlimited Personalized Roadmaps</div>
              <div>✓ Unlimited Quick JD Gap Scans</div>
              <div>✓ Verified Job Discovery & Tracking</div>
              <div>✓ 5 AI Resume Tailoring Runs / mo</div>
            </div>
            <Link
              to="/signup"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                background: "#f1f5f9",
                color: "#1e293b",
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14
              }}
            >
              Sign Up Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div style={{ background: "linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)", color: "#fff", borderRadius: 22, padding: 30, boxShadow: "0 15px 35px rgba(124, 58, 237, 0.25)" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#c084fc", textTransform: "uppercase" }}>Pro Membership</span>
            <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", margin: "10px 0 4px" }}>₹99 <span style={{ fontSize: 14, fontWeight: 500, color: "#a5b4fc" }}>/ month</span></div>
            <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 20 }}>For active job search sprints</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#e2e8f0", marginBottom: 24 }}>
              <div>✓ Everything in Free</div>
              <div>✓ Unlimited Google X-Y-Z Resume Tailoring</div>
              <div>✓ Real-Time Voice/Chat Mock Interview Coach</div>
              <div>✓ Direct Recruiter Application Export</div>
            </div>
            <Link
              to="/signup"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
                color: "#fff",
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: "0 6px 16px rgba(124, 58, 237, 0.35)"
              }}
            >
              Start 7-Day Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(124, 58, 237, 0.08)", padding: "40px 24px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontWeight: 700, color: "#1a1040" }}>
            CrackIt © 2026. Empowering Engineers to Reach Their Peak Potential.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link to="/login" style={{ color: "#64748b", textDecoration: "none" }}>Login</Link>
            <Link to="/signup" style={{ color: "#64748b", textDecoration: "none" }}>Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
