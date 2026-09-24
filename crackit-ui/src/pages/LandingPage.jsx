import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

// Trajectory presets for the interactive Career Growth Graph
const TRAJECTORY_DATA = {
  backend: {
    label: "Backend / Distributed Systems",
    currentRole: "SDE-1 / Junior Backend",
    currentPackage: "₹10 - 12 LPA",
    targetRole: "Senior Backend / Staff Architect",
    targetPackage: "₹34 - 48 LPA",
    multiplier: "3.2x",
    weeks: "8 Weeks",
    skills: ["Distributed Locks & Lua", "Kafka Partitioning & EDA", "TiDB / Sharding", "High Concurrency"],
    graphPoints: [
      { step: "Current", val: 20, tag: "REST APIs" },
      { step: "Week 2", val: 38, tag: "Redis Locks" },
      { step: "Week 4", val: 58, tag: "Kafka EDA" },
      { step: "Week 6", val: 78, tag: "Raft / TiDB" },
      { step: "Target", val: 100, tag: "Staff: ₹42L" }
    ]
  },
  frontend: {
    label: "Frontend / Web Architecture",
    currentRole: "Frontend Engineer (React)",
    currentPackage: "₹9 - 11 LPA",
    targetRole: "Lead Frontend / UI Architect",
    targetPackage: "₹30 - 42 LPA",
    multiplier: "3.1x",
    weeks: "6 Weeks",
    skills: ["Micro-Frontends & Module Fed", "Core Web Vitals (LCP/INP)", "State Machines & Offline First", "AST & Tooling"],
    graphPoints: [
      { step: "Current", val: 20, tag: "React / UI" },
      { step: "Week 2", val: 42, tag: "Core Vitals" },
      { step: "Week 4", val: 65, tag: "State Sync" },
      { step: "Week 6", val: 82, tag: "Micro-UI" },
      { step: "Target", val: 100, tag: "Lead: ₹36L" }
    ]
  },
  fullstack: {
    label: "Full-Stack Tech Lead",
    currentRole: "Fullstack Developer (MERN)",
    currentPackage: "₹11 - 13 LPA",
    targetRole: "Founding Engineer / Tech Lead",
    targetPackage: "₹36 - 52 LPA",
    multiplier: "3.4x",
    weeks: "8 Weeks",
    skills: ["Fullstack System Design", "Zero-Cost Cloud Topology", "Event Sourcing & CQRS", "AI Workflow Orchestration"],
    graphPoints: [
      { step: "Current", val: 22, tag: "CRUD & DB" },
      { step: "Week 2", val: 45, tag: "Cache & Auth" },
      { step: "Week 4", val: 68, tag: "Event Sagas" },
      { step: "Week 6", val: 84, tag: "System Design" },
      { step: "Target", val: 100, tag: "Lead: ₹46L" }
    ]
  },
  devops: {
    label: "DevOps & Cloud Architect",
    currentRole: "Cloud / DevOps Engineer",
    currentPackage: "₹12 - 14 LPA",
    targetRole: "Staff Site Reliability / Cloud Architect",
    targetPackage: "₹38 - 55 LPA",
    multiplier: "3.3x",
    weeks: "8 Weeks",
    skills: ["Kubernetes Operator Patterns", "GitOps & ArgoCD", "Multi-Region Zero-RPO", "Chaos Engineering"],
    graphPoints: [
      { step: "Current", val: 25, tag: "Docker / CI" },
      { step: "Week 2", val: 48, tag: "K8s Ingress" },
      { step: "Week 4", val: 70, tag: "OpenTelemetry" },
      { step: "Week 6", val: 86, tag: "Multi-Region" },
      { step: "Target", val: 100, tag: "Staff: ₹48L" }
    ]
  },
  sdet: {
    label: "QA Automation & SDET",
    currentRole: "QA / Automation Engineer",
    currentPackage: "₹8 - 11 LPA",
    targetRole: "Staff SDET / Test Architect",
    targetPackage: "₹28 - 40 LPA",
    multiplier: "3.2x",
    weeks: "6 Weeks",
    skills: ["Playwright & Cypress Architecture", "Distributed Performance Testing (k6)", "CI/CD Quality Gates", "API & Contract Testing (Pact)"],
    graphPoints: [
      { step: "Current", val: 20, tag: "Manual & UI" },
      { step: "Week 2", val: 42, tag: "E2E Frameworks" },
      { step: "Week 4", val: 65, tag: "k6 & Load Ops" },
      { step: "Week 6", val: 84, tag: "CI Quality Gate" },
      { step: "Target", val: 100, tag: "Staff SDET: ₹36L" }
    ]
  }
};

// Lightweight, GPU-accelerated scroll reveal observer hook
function useScrollReveal() {
  const [element, setElement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, isVisible];
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedDiscipline, setSelectedDiscipline] = useState("backend");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sampleRoadmap, setSampleRoadmap] = useState(null);
  const [checkedTopics, setCheckedTopics] = useState({ "s-1": true, "s-2": true });

  const [growthRef, growthVisible] = useScrollReveal();
  const [featuresRef, featuresVisible] = useScrollReveal();
  const [roadmapRef, roadmapVisible] = useScrollReveal();
  const [pricingRef, pricingVisible] = useScrollReveal();

  const activeTrajectory = TRAJECTORY_DATA[selectedDiscipline];

  useEffect(() => {
    api.get("/api/roadmap/sample")
      .then(res => setSampleRoadmap(res.data))
      .catch(() => {
        // Fallback robust demo data
        setSampleRoadmap({
          targetRole: "Senior Backend Engineer / Staff Architect",
          targetCompensation: "₹35 - 45 LPA ($140k - $180k)",
          readiness: {
            overallScore: 84,
            verdict: "Strong foundational logic; sharpen distributed concurrency, idempotency guarantees, and cache consistency.",
            salaryUpliftPotential: "2.8x - 3.5x"
          },
          milestones: [
            {
              title: "Concurrency & Storage Engine Mastery",
              weekSpan: "Weeks 1 - 2",
              topics: [
                { id: "s-1", title: "Distributed Locks & Redis Lua Scripts", keyConcepts: "Atomic execution, TTL safety, fail-open design" },
                { id: "s-2", title: "Financial Webhook Idempotency", keyConcepts: "HMAC-SHA256 signature, row-level locks, state machines" },
                { id: "s-3", title: "Cache Stampede & Mutex Invalidation", keyConcepts: "TTL jitter, negative caching, cache-aside" }
              ]
            },
            {
              title: "Distributed Systems & Event-Driven Architecture",
              weekSpan: "Weeks 3 - 4",
              topics: [
                { id: "s-4", title: "Kafka Partitioning & Consumer Groups", keyConcepts: "At-least-once semantics, consumer rebalancing, DLQs" },
                { id: "s-5", title: "HTAP Databases & Consensus Protocols", keyConcepts: "Raft consensus, TiKV row-store, TiFlash columnar scans" }
              ]
            }
          ],
          compatibleCompanies: [
            { companyName: "Razorpay / PhonePe", category: "Fintech Unicorn", matchScore: 94, whyMatched: "Demands zero payment loss and deep JVM concurrency mastery." },
            { companyName: "Swiggy / Zepto", category: "Quick-Commerce", matchScore: 90, whyMatched: "Requires sub-50ms distributed rate limiting and high-write pipelines." },
            { companyName: "Uber / Atlassian", category: "Global Tech Tier-1", matchScore: 88, whyMatched: "Focuses on event-driven architecture and multi-datacenter consistency." }
          ]
        });
      });
  }, []);

  const toggleTopic = (id) => {
    setCheckedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdfcfe", color: "#1a1040", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        .features-grid-2x2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        @media (max-width: 860px) {
          .features-grid-2x2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      {/* ─────────────────────────────────────────────────────────────
          1. RESPONSIVE NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(124, 58, 237, 0.08)",
          padding: "14px 20px"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Logo with Bullseye & Target (Matches /favicon.png) */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/favicon.png"
              alt="CrackIt"
              style={{ width: 38, height: 38, objectFit: "contain" }}
            />
            <span style={{ fontSize: 23, fontWeight: 800, color: "#1a1040", letterSpacing: -0.8 }}>
              Crack<span style={{ color: "#7c3aed" }}>!t</span>
            </span>
          </Link>

          {/* Desktop Nav Links (Hidden on mobile) */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 32 }}>
            <a href="#features" style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "color 0.2s" }}>
              Features
            </a>
            <a href="#growth-engine" style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "color 0.2s" }}>
              Career Growth Simulator
            </a>
            <a href="#roadmap-preview" style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "color 0.2s" }}>
              Live Roadmap
            </a>
            <a href="#pricing" style={{ color: "#475569", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "color 0.2s" }}>
              Free vs Pro
            </a>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 14 }}>
            <Link
              to="/login"
              style={{
                padding: "8px 18px",
                color: "#7c3aed",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12,
                transition: "background 0.2s"
              }}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              style={{
                padding: "10px 22px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 14,
                boxShadow: "0 6px 18px rgba(124, 58, 237, 0.3)",
                transition: "transform 0.15s, box-shadow 0.15s"
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Right Controls (Hamburger & Quick CTA) */}
          <div className="flex md:hidden" style={{ alignItems: "center", gap: 10 }}>
            <Link
              to="/signup"
              style={{
                padding: "8px 14px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
              }}
            >
              Get Started
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
              style={{
                background: "#f1f5f9",
                border: "none",
                width: 38,
                height: 38,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1e1b4b",
                cursor: "pointer",
                fontSize: 20
              }}
            >
              <i className={mobileMenuOpen ? "ti ti-x" : "ti ti-menu-2"} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden"
            style={{
              padding: "18px 12px",
              marginTop: 12,
              background: "#ffffff",
              borderRadius: 18,
              border: "1px solid #ede9fe",
              boxShadow: "0 14px 30px rgba(124, 58, 237, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "8px 12px", color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
            >
              Features
            </a>
            <a
              href="#growth-engine"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "8px 12px", color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
            >
              Career Growth Simulator
            </a>
            <a
              href="#roadmap-preview"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "8px 12px", color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
            >
              Live Roadmap
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "8px 12px", color: "#334155", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
            >
              Free vs Pro
            </a>
            <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
            <Link
              to="/login"
              style={{ padding: "8px 12px", color: "#7c3aed", textDecoration: "none", fontSize: 14, fontWeight: 700 }}
            >
              Log in to Account
            </Link>
          </div>
        )}
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION WITH AMBIENT GLOW & BALANCED COPY
      ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "60px 20px 40px",
          textAlign: "center"
        }}
      >
        {/* Soft Radial Ambient Glow */}
        <div
          className="animate-pulse-glow"
          style={{
            position: "absolute",
            top: "-15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90vw",
            maxWidth: 1100,
            height: 520,
            background: "radial-gradient(circle at 50% 30%, rgba(124, 58, 237, 0.18) 0%, rgba(99, 102, 241, 0.10) 40%, transparent 70%)",
            filter: "blur(60px)",
            pointerEvents: "none",
            zIndex: 0
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 940, margin: "0 auto" }}>
          {/* Eyebrow Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 16px",
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.22)",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              color: "#7c3aed",
              marginBottom: 24,
              boxShadow: "0 2px 8px rgba(124, 58, 237, 0.08)"
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />
            Autonomous Career Acceleration & Interview Intelligence
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: "clamp(32px, 5.2vw, 56px)",
              fontWeight: 900,
              color: "#1a1040",
              lineHeight: 1.15,
              letterSpacing: -1.2,
              margin: "0 0 20px"
            }}
          >
            Land Your Next Senior Tech Role With{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)",
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
              fontSize: "clamp(15px, 2vw, 19px)",
              color: "#64748b",
              lineHeight: 1.65,
              maxWidth: 760,
              margin: "0 auto 34px"
            }}
          >
            Reverse-engineer the path from your current stack to your dream package. Get week-by-week interactive prep roadmaps, Google X-Y-Z formula resume tailoring, and bar-raiser mock interview simulations.
          </p>

          {/* Action CTAs */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 38 }}>
            <Link
              to="/signup"
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 15.5,
                fontWeight: 700,
                borderRadius: 16,
                boxShadow: "0 10px 24px rgba(124, 58, 237, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "transform 0.15s, box-shadow 0.15s"
              }}
            >
              Build My Career Roadmap
              <i className="ti ti-arrow-right" style={{ fontSize: 18 }} />
            </Link>

            <a
              href="#growth-engine"
              style={{
                padding: "14px 26px",
                background: "#ffffff",
                color: "#1e1b4b",
                border: "1.5px solid #e2e8f0",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
              }}
            >
              <i className="ti ti-chart-dots" style={{ color: "#7c3aed", fontSize: 18 }} />
              Simulate Growth Curve
            </a>
          </div>

          {/* Trust Points */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 24,
              fontSize: 13,
              fontWeight: 600,
              color: "#64748b"
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-check" style={{ color: "#10b981", fontWeight: 900 }} />
              100% Free Forever Tier
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-check" style={{ color: "#10b981", fontWeight: 900 }} />
              Google X-Y-Z Resume Standards
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-check" style={{ color: "#10b981", fontWeight: 900 }} />
              Zero Fluff & Anti-Anchoring
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE CAREER GROWTH & SALARY TRAJECTORY GRAPH
      ───────────────────────────────────────────────────────────── */}
      <section
        id="growth-engine"
        ref={growthRef}
        style={{
          padding: "30px 20px 70px",
          maxWidth: 1140,
          margin: "0 auto",
          opacity: growthVisible ? 1 : 0,
          transform: growthVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #faf8ff 100%)",
            borderRadius: 28,
            border: "1px solid rgba(124, 58, 237, 0.16)",
            boxShadow: "0 20px 45px rgba(124, 58, 237, 0.08), 0 4px 12px rgba(15, 23, 42, 0.03)",
            padding: "clamp(32px, 4vw, 44px) clamp(20px, 4vw, 36px)",
            overflow: "hidden"
          }}
        >
          {/* Header of Section */}
          <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 32px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 999,
                background: "#f3eeff",
                color: "#7c3aed",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 10
              }}
            >
              <i className="ti ti-trending-up" />
              Career Acceleration Trajectory Simulator
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 36px)", fontWeight: 800, color: "#1a1040", margin: "0 0 10px", letterSpacing: -0.6 }}>
              See How Your Package Jumps With Precision Coaching
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
              Select your engineering domain to visualize the technical delta and projected compensation growth.
            </p>
          </div>

          {/* Discipline Switcher Tabs */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 34
            }}
          >
            {Object.entries(TRAJECTORY_DATA).map(([key, disc]) => {
              const active = selectedDiscipline === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDiscipline(key)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 14,
                    border: active ? "1.5px solid #7c3aed" : "1.5px solid #e2e8f0",
                    background: active ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "#ffffff",
                    color: active ? "#ffffff" : "#475569",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: "pointer",
                    boxShadow: active ? "0 4px 14px rgba(124, 58, 237, 0.25)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  {disc.label}
                </button>
              );
            })}
          </div>

          {/* Visual Graph + Stats Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 28,
              alignItems: "center"
            }}
          >
            {/* Left: Interactive SVG Curve Graph */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 22,
                border: "1px solid #ede9fe",
                padding: "24px 20px",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.05)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#7c6faa", textTransform: "uppercase" }}>
                    Growth Curve Projection
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1040" }}>
                    {activeTrajectory.targetRole}
                  </div>
                </div>
                <span
                  style={{
                    padding: "5px 12px",
                    borderRadius: 999,
                    background: "#ecfdf5",
                    color: "#059669",
                    fontWeight: 800,
                    fontSize: 13
                  }}
                >
                  +{activeTrajectory.multiplier} Jump
                </span>
              </div>

              {/* Dynamic SVG Area / Line Chart */}
              <div style={{ position: "relative", width: "100%", height: 180, marginBottom: 12 }}>
                <svg viewBox="0 0 500 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Area */}
                  <path
                    d="M 20,150 Q 140,135 240,95 T 480,25 L 480,170 L 20,170 Z"
                    fill="url(#curveGradient)"
                  />

                  {/* Curve Line */}
                  <path
                    key={selectedDiscipline}
                    d="M 20,150 Q 140,135 240,95 T 480,25"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 700,
                      strokeDashoffset: 0,
                      animation: "draw-curve 0.75s ease-out forwards"
                    }}
                  />

                  {/* Step Markers along the curve */}
                  <circle cx="20" cy="150" r="6" fill="#7c3aed" stroke="#fff" strokeWidth="2.5" />
                  <circle cx="140" cy="135" r="5" fill="#a855f7" stroke="#fff" strokeWidth="2" />
                  <circle cx="260" cy="90" r="5" fill="#a855f7" stroke="#fff" strokeWidth="2" />
                  <circle cx="370" cy="55" r="5" fill="#a855f7" stroke="#fff" strokeWidth="2" />
                  <circle cx="480" cy="25" r="8" fill="#10b981" stroke="#fff" strokeWidth="3" />
                </svg>
              </div>

              {/* Graph Timeline Badges */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 6,
                  textAlign: "center"
                }}
              >
                {activeTrajectory.graphPoints.map((pt, i) => (
                  <div
                    key={i}
                    title={pt.tag}
                    style={{
                      background: i === 4 ? "#f0fdf4" : "#f8fafc",
                      padding: "8px 4px",
                      borderRadius: 10,
                      border: i === 4 ? "1.5px solid #86efac" : "1px solid #e2e8f0"
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: i === 4 ? "#059669" : "#64748b" }}>{pt.step}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: i === 4 ? "#047857" : "#1e293b",
                        fontWeight: 700,
                        lineHeight: 1.25,
                        marginTop: 2
                      }}
                    >
                      {pt.tag}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Compensation & Skills Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Compensation Comparison Box */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  background: "#ffffff",
                  padding: 20,
                  borderRadius: 18,
                  border: "1px solid #ede9fe"
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Current Benchmark</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#475569", margin: "4px 0" }}>{activeTrajectory.currentPackage}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{activeTrajectory.currentRole}</div>
                </div>

                <div style={{ borderLeft: "2px solid #ede9fe", paddingLeft: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>Target Trajectory</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981", margin: "4px 0" }}>{activeTrajectory.targetPackage}</div>
                  <div style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>In {activeTrajectory.weeks} Sprint</div>
                </div>
              </div>

              {/* Skills Delta To Unlock */}
              <div style={{ background: "#ffffff", padding: 20, borderRadius: 18, border: "1px solid #ede9fe" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", marginBottom: 12 }}>
                  High-Priority Technical Deltas
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {activeTrajectory.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 10,
                        background: "rgba(124, 58, 237, 0.08)",
                        color: "#6d28d9",
                        fontSize: 12.5,
                        fontWeight: 700,
                        border: "1px solid rgba(124, 58, 237, 0.15)"
                      }}
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA inside Simulator */}
              <Link
                to="/signup"
                style={{
                  padding: "13px 20px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 16px rgba(30, 27, 75, 0.25)"
                }}
              >
                Generate My Custom Roadmap for {activeTrajectory.label.split(" / ")[0]}
                <i className="ti ti-sparkles" style={{ color: "#a78bfa" }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FOUR CORE PILLARS (BALANCED 2x2 GRID WITH RICH PREVIEWS)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="features"
        ref={featuresRef}
        style={{
          padding: "40px 20px 80px",
          maxWidth: 1140,
          margin: "0 auto",
          opacity: featuresVisible ? 1 : 0,
          transform: featuresVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "#f3eeff",
              color: "#7c3aed",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12
            }}
          >
            For Software, QA, DevOps & Tech Leads
          </div>
          <h2 style={{ fontSize: "clamp(26px, 3.6vw, 38px)", fontWeight: 800, color: "#1a1040", margin: "0 0 12px", letterSpacing: -0.6 }}>
            Everything You Need to Crack Senior Technical Interviews
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", margin: 0, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
            Engineered to eliminate candidate rejection points and pass tough bar-raiser rounds across Development, QA Automation, DevOps, and Architecture.
          </p>
        </div>

        {/* Balanced 2x2 Responsive Grid */}
        <div className="features-grid-2x2">
          {/* Card 1: Prep Roadmap */}
          <div
            className="card-interactive"
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 30,
              border: "1.5px solid #ede9fe",
              boxShadow: "0 10px 30px rgba(124, 58, 237, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "rgba(124,58,237,0.1)",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 18
                }}
              >
                <i className="ti ti-map-2" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
                Personalized Prep Roadmap
              </h3>
              <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                Calculates the exact technical delta between your current stack and your target role, with structured week-by-week practice drills.
              </p>
            </div>

            {/* Mini Visual Preview Widget */}
            <div
              style={{
                background: "#faf8ff",
                borderRadius: 16,
                padding: "16px 18px",
                border: "1px solid #ede9fe"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b" }}>Week 1-2: Concurrency & Locks</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "#059669" }}>100%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b" }}>Week 3-4: Distributed Systems</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "#7c3aed" }}>Active</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Week 5-6: System Design Drills</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Upcoming</span>
              </div>
            </div>
          </div>

          {/* Card 2: Google X-Y-Z Resume Tailoring */}
          <div
            className="card-interactive"
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 30,
              border: "1.5px solid #ede9fe",
              boxShadow: "0 10px 30px rgba(124, 58, 237, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "rgba(59,130,246,0.1)",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 18
                }}
              >
                <i className="ti ti-file-text" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
                Google X-Y-Z Resume Tailoring
              </h3>
              <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                Bans passive phrases. Automatically frames your real achievements into high-impact bullet points with diverse metric dimensions.
              </p>
            </div>

            {/* Mini Visual Preview Widget */}
            <div
              style={{
                background: "#eff6ff",
                borderRadius: 16,
                padding: "16px 18px",
                border: "1px solid #dbeafe"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>X-Y-Z Formulation</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>ATS Score: 96/100</span>
              </div>
              <div style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.5, fontStyle: "italic" }}>
                "Accomplished <strong>sub-40ms p99 latency</strong> as measured by <strong>Prometheus dashboards</strong>, by migrating monolithic cache to <strong>Redis sliding window log</strong>."
              </div>
            </div>
          </div>

          {/* Card 3: Target Company Compatibility */}
          <div
            className="card-interactive"
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 30,
              border: "1.5px solid #ede9fe",
              boxShadow: "0 10px 30px rgba(124, 58, 237, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 18
                }}
              >
                <i className="ti ti-building" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
                Target Company Compatibility
              </h3>
              <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                Identifies companies actively hiring for your profile, their interview round breakdown, and priority focus topics.
              </p>
            </div>

            {/* Mini Visual Preview Widget */}
            <div
              style={{
                background: "#f0fdf4",
                borderRadius: 16,
                padding: "16px 18px",
                border: "1px solid #dcfce7"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>Razorpay / Fintech</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#15803d" }}>94% Match</span>
              </div>
              <div style={{ height: 6, background: "#dcfce7", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: "94%", height: "100%", background: "#10b981", borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>
                Rounds: Machine Coding (LLD) • Distributed Systems • Culture Fit
              </div>
            </div>
          </div>

          {/* Card 4: Bar-Raiser Mock Interviews (NO MODEL MENTION) */}
          <div
            className="card-interactive"
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 30,
              border: "1.5px solid #ede9fe",
              boxShadow: "0 10px 30px rgba(124, 58, 237, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "rgba(245,158,11,0.1)",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 18
                }}
              >
                <i className="ti ti-messages" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
                Bar-Raiser Mock Interviews
              </h3>
              <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                Simulates tough failure scenarios and concurrency drills with conversational feedback calibrated to top-tier engineering standards.
              </p>
            </div>

            {/* Mini Visual Preview Widget */}
            <div
              style={{
                background: "#fffbeb",
                borderRadius: 16,
                padding: "16px 18px",
                border: "1px solid #fef3c7"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <i className="ti ti-shield-check" style={{ color: "#d97706", fontSize: 16 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#92400e" }}>Rubric Diagnostic</span>
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#b45309" }}>Grade: Strong Hire</span>
              </div>
              <div style={{ fontSize: 11.5, color: "#78350f", lineHeight: 1.4 }}>
                Evaluates edge-case handling, deadlock prevention, and trade-off rationale before you meet the real hiring committee.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. LIVE INTERACTIVE ROADMAP TEASER
      ───────────────────────────────────────────────────────────── */}
      <section
        id="roadmap-preview"
        ref={roadmapRef}
        style={{
          padding: "20px 20px 80px",
          maxWidth: 1100,
          margin: "0 auto",
          opacity: roadmapVisible ? 1 : 0,
          transform: roadmapVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div
          className="card-interactive"
          style={{
            background: "#ffffff",
            borderRadius: 28,
            border: "1.5px solid #ede9fe",
            padding: "36px 24px",
            boxShadow: "0 18px 45px rgba(124, 58, 237, 0.08)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Interactive Blueprint Preview
              </span>
              <h2 style={{ fontSize: "clamp(22px, 3.2vw, 32px)", fontWeight: 800, color: "#1a1040", margin: "6px 0 6px" }}>
                Target: {sampleRoadmap?.targetRole || "Senior Backend Engineer"}
              </h2>
              <div style={{ fontSize: 14.5, color: "#10b981", fontWeight: 700 }}>
                Target Range: {sampleRoadmap?.targetCompensation || "₹35 - 45 LPA"}
              </div>
            </div>

            <Link
              to="/signup"
              style={{
                padding: "11px 22px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 14,
                boxShadow: "0 6px 18px rgba(124, 58, 237, 0.25)"
              }}
            >
              Generate Mine Now
            </Link>
          </div>

          {/* Interactive Milestone Modules */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {sampleRoadmap?.milestones?.map((milestone, mIdx) => (
              <div
                key={mIdx}
                style={{
                  background: "#faf8ff",
                  borderRadius: 20,
                  border: "1px solid #ede9fe",
                  padding: 22
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1040" }}>
                    Milestone {mIdx + 1}: {milestone.title}
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: "#ede9fe", color: "#6d28d9", fontSize: 12, fontWeight: 700 }}>
                    {milestone.weekSpan}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {milestone.topics.map((topic) => {
                    const isChecked = !!checkedTopics[topic.id];
                    return (
                      <div
                        key={topic.id}
                        onClick={() => toggleTopic(topic.id)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 14px",
                          borderRadius: 14,
                          background: isChecked ? "#ffffff" : "rgba(255,255,255,0.7)",
                          border: isChecked ? "1px solid #c4b5fd" : "1px solid #f1f5f9",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: isChecked ? "#7c3aed" : "#fff",
                            border: isChecked ? "none" : "2px solid #cbd5e1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 14,
                            marginTop: 2,
                            flexShrink: 0
                          }}
                        >
                          {isChecked && <i className="ti ti-check" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isChecked ? "#1a1040" : "#64748b", textDecoration: isChecked ? "none" : "none" }}>
                            {topic.title}
                          </div>
                          <div style={{ fontSize: 12.5, color: "#7c6faa", marginTop: 2 }}>
                            {topic.keyConcepts}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. PRICING & ZERO-COST VALUE GUARANTEE
      ───────────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        ref={pricingRef}
        style={{
          padding: "30px 20px 90px",
          maxWidth: 1040,
          margin: "0 auto",
          textAlign: "center",
          opacity: pricingVisible ? 1 : 0,
          transform: pricingVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <h2 style={{ fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 800, color: "#1a1040", margin: "0 0 12px" }}>
          Built for Tech Professionals. Transparent Pricing.
        </h2>
        <p style={{ fontSize: 16, color: "#64748b", margin: "0 0 40px" }}>
          No hidden fees or recurring traps. Start free or accelerate your prep on your terms.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, textAlign: "left" }}>
          {/* Card 1: Free Tier */}
          <div className="card-interactive" style={{ background: "#ffffff", borderRadius: 24, padding: 30, border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Free Tier</span>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1040", margin: "10px 0 4px" }}>₹0</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Forever free for every engineer</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#334155", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Unlimited Personalized Roadmaps</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> 16-Step Progressive Syllabus Tracker</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Verified Job Discovery (Adzuna + JSearch)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> 3 Free AI Generations (Resume & Prep)</div>
              </div>
            </div>
            <Link
              to="/signup"
              style={{
                display: "block",
                padding: "12px",
                borderRadius: 14,
                background: "#f1f5f9",
                color: "#1e293b",
                fontWeight: 700,
                fontSize: 14,
                textAlign: "center",
                textDecoration: "none"
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Card 2: 7-Day Sprint Trial */}
          <div
            className="card-interactive"
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 30,
              border: "1.5px solid #c4b5fd",
              boxShadow: "0 10px 25px rgba(124, 58, 237, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -12,
                right: 20,
                padding: "4px 12px",
                background: "#6366f1",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase"
              }}
            >
              Sprint Trial
            </span>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>7-Day Trial</span>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1040", margin: "10px 0 4px" }}>
                ₹99 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>/ 7 days</span>
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Intensive sprint for immediate interviews</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#334155", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Everything in Free Tier</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Unlimited AI Resume Tailoring (7 days)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Unlimited AI Mock Interview Drills</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Company Compatibility & Rubrics</div>
              </div>
            </div>
            <Link
              to="/signup"
              style={{
                display: "block",
                padding: "12px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 6px 16px rgba(99, 102, 241, 0.25)"
              }}
            >
              Start 7-Day Trial
            </Link>
          </div>

          {/* Card 3: 1 Month Pro */}
          <div
            className="card-interactive"
            style={{
              background: "#ffffff",
              borderRadius: 24,
              padding: 30,
              border: "2px solid #7c3aed",
              boxShadow: "0 14px 35px rgba(124, 58, 237, 0.15)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -12,
                right: 20,
                padding: "4px 12px",
                background: "#7c3aed",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase"
              }}
            >
              Most Popular
            </span>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase" }}>1-Month Pro</span>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1040", margin: "10px 0 4px" }}>
                ₹299 <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>/ month</span>
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Full month of sustained career acceleration</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#334155", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Everything in 7-Day Trial</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> 30 Days Full Unlimited Access</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Google X-Y-Z Bullet Enhancer</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><i className="ti ti-check" style={{ color: "#10b981" }} /> Priority ATS Single-Column PDFs</div>
              </div>
            </div>
            <Link
              to="/signup"
              style={{
                display: "block",
                padding: "12px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 6px 16px rgba(124, 58, 237, 0.3)"
              }}
            >
              Get 1-Month Pro
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid #f1f5f9",
          padding: "36px 20px",
          background: "#ffffff",
          textAlign: "center",
          fontSize: 13,
          color: "#94a3b8"
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <img src="/favicon.png" alt="CrackIt" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span style={{ fontWeight: 800, color: "#1e1b4b" }}>Crack<span style={{ color: "#7c3aed" }}>!t</span></span>
          <span>•</span>
          <span>Empowering engineers to crack senior technical interviews</span>
        </div>
        <div>
          © {new Date().getFullYear()} CrackIt. All rights reserved. Built for Software, QA, DevOps & Tech Professionals worldwide.
        </div>
      </footer>
    </div>
  );
}
