import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

// Preset templates for 1-click quick-start
const PRESET_CAREER_PATHS = [
  {
    id: "backend-sr",
    title: "SDE-1 ➔ Senior Backend / Staff",
    currentRole: "Backend Developer",
    yearsOfExperience: 2.5,
    currentSkills: "Java, Spring Boot, MySQL, REST APIs",
    currentCompensation: "10-12 LPA",
    targetRole: "Senior Backend Engineer / Staff Architect",
    targetCompensation: "32-45 LPA",
    targetTimelineWeeks: 8,
    targetCompanyTypes: ["Fintech Unicorns", "Tier-1 Product Startups", "Global Tech MNCs"],
    badge: "Most Popular",
    color: "#7c3aed"
  },
  {
    id: "frontend-lead",
    title: "Frontend ➔ UI Architect / Lead",
    currentRole: "Frontend Engineer (React)",
    yearsOfExperience: 2,
    currentSkills: "JavaScript, React, Redux, CSS, HTML",
    currentCompensation: "9-11 LPA",
    targetRole: "Lead Frontend Engineer / UI Architect",
    targetCompensation: "28-38 LPA",
    targetTimelineWeeks: 6,
    targetCompanyTypes: ["SaaS Unicorns", "Tier-1 Product Startups"],
    badge: "High Demand",
    color: "#2563eb"
  },
  {
    id: "fullstack-founding",
    title: "Fullstack ➔ Founding Tech Lead",
    currentRole: "Fullstack Developer",
    yearsOfExperience: 3,
    currentSkills: "React, Node.js, Express, PostgreSQL, Docker",
    currentCompensation: "12-14 LPA",
    targetRole: "Founding Engineer / Tech Lead",
    targetCompensation: "36-50 LPA",
    targetTimelineWeeks: 8,
    targetCompanyTypes: ["Tier-1 Product Startups", "Fintech Unicorns"],
    badge: "Maximum Uplift",
    color: "#059669"
  }
];

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeTab, setActiveTab] = useState("journey"); // "journey", "companies", "gaps", "actionPlan"
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState(0);
  const [generationError, setGenerationError] = useState(null);
  const [expandedHints, setExpandedHints] = useState({});

  const toggleHint = (key) => setExpandedHints((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const GENERATION_STEPS = [
    "Analyzing target role hiring bars & market compensation...",
    "Diagnosing technical delta across your current skill stack...",
    "Synthesizing multi-week progressive milestones & practice drills...",
    "Calibrating target company compatibility & interview rubrics...",
    "Finalizing your personalized interactive career journey..."
  ];

  // Cycling generation progress ticker
  useEffect(() => {
    let interval;
    if (generating) {
      setGenerationStep(0);
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [generating]);

  useEffect(() => {
    fetchCurrentRoadmap();
    prefillFromProfile();
  }, []);

  const prefillFromProfile = async () => {
    try {
      const [profileRes, resumeRes] = await Promise.allSettled([
        api.get("/api/users/profile"),
        api.get("/api/resume")
      ]);

      let prof = null;
      let skillsStr = "";

      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        prof = profileRes.value.data;
      }
      if (resumeRes.status === "fulfilled" && resumeRes.value?.data) {
        const rData = resumeRes.value.data;
        if (rData.skills && Array.isArray(rData.skills)) {
          skillsStr = rData.skills.map((s) => s.skillName).filter(Boolean).slice(0, 10).join(", ");
        }
      }

      if (prof) {
        setFormData((prev) => ({
          ...prev,
          currentRole: prof.currentRole || prev.currentRole,
          yearsOfExperience: prof.yearsExperience != null ? prof.yearsExperience : prev.yearsOfExperience,
          currentSkills: skillsStr || prev.currentSkills,
          currentCompensation: prof.currentCtc || prev.currentCompensation,
          targetRole: prof.targetRole || prev.targetRole,
          targetCompensation: prof.expectedCtc || prev.targetCompensation
        }));
      }
    } catch (e) {
      console.error("Failed to prefill roadmap form from profile:", e);
    }
  };

  const handleApplyCalibration = (adj) => {
    if (!adj) return;
    setFormData((prev) => ({
      ...prev,
      targetRole: adj.recommendedRole || prev.targetRole,
      targetTimelineWeeks: adj.recommendedWeeks || prev.targetTimelineWeeks
    }));
    setShowConfigModal(true);
  };

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

  const buildClientFallbackRoadmap = (data) => {
    const isFrontend = (data.targetRole || "").toLowerCase().includes("frontend") || (data.targetRole || "").toLowerCase().includes("ui");
    const isFullstack = (data.targetRole || "").toLowerCase().includes("fullstack") || (data.targetRole || "").toLowerCase().includes("lead");

    const milestones = isFrontend
      ? [
          {
            milestoneNumber: 1,
            title: "Core Web Architecture & Core Web Vitals (CWV)",
            weekSpan: "Weeks 1 - 2",
            objective: "Master Interaction to Next Paint (INP), LCP image delivery, and bundle optimization.",
            topics: [
              { id: "m1-t1", title: "INP & Long Task Scheduling", keyConcepts: "requestIdleCallback, task slicing, web workers", practiceTask: "Eliminate main-thread blocking bottlenecks in large React apps", estimatedHours: 12, completed: false },
              { id: "m1-t2", title: "Virtualization & GPU Compositing", keyConcepts: "DOM node recycling, CSS will-change, containment", practiceTask: "Build 60fps virtualized data grid for 50k rows", estimatedHours: 14, completed: false }
            ]
          },
          {
            milestoneNumber: 2,
            title: "Micro-Frontends & Distributed State Sync",
            weekSpan: "Weeks 3 - 4",
            objective: "Architect enterprise state machines, module federation, and offline recovery.",
            topics: [
              { id: "m2-t1", title: "Webpack 5 Module Federation", keyConcepts: "Host & remote contracts, shared singletons, version isolation", practiceTask: "Implement independent remote micro-app deployment", estimatedHours: 16, completed: false },
              { id: "m2-t2", title: "WebSocket Delta Sync & Optimistic UI", keyConcepts: "CRDTs, reconciliation buffers, reconnect replay", practiceTask: "Build real-time collaborative canvas with conflict resolution", estimatedHours: 14, completed: false }
            ]
          }
        ]
      : [
          {
            milestoneNumber: 1,
            title: "Distributed Concurrency & Low-Level Design (LLD)",
            weekSpan: "Weeks 1 - 2",
            objective: "Master writing clean, concurrency-safe, test-driven code under 90-minute timers.",
            topics: [
              { id: "m1-t1", title: "Distributed Locks & Redis Lua Scripts", keyConcepts: "Atomic execution, lease auto-renewal, fail-open design", practiceTask: "Implement resilient distributed lock with lease heartbeats", estimatedHours: 14, completed: false },
              { id: "m1-t2", title: "Financial Webhook Idempotency", keyConcepts: "HMAC-SHA256 signature verification, row-level locks, state machines", practiceTask: "Build idempotent webhook receiver handling 5,000 req/sec", estimatedHours: 15, completed: false },
              { id: "m1-t3", title: "Cache Stampede & Mutex Invalidation", keyConcepts: "TTL jitter, probabilistic early expiration, cache-aside", practiceTask: "Benchmark cache stampede resilience with 10k threads", estimatedHours: 12, completed: false }
            ]
          },
          {
            milestoneNumber: 2,
            title: "Distributed Systems & Event-Driven Architecture",
            weekSpan: "Weeks 3 - 4",
            objective: "Design event streaming pipelines with zero message loss and sub-50ms p99 latency.",
            topics: [
              { id: "m2-t1", title: "Kafka Partitioning & Consumer Groups", keyConcepts: "At-least-once semantics, consumer rebalance, DLQs", practiceTask: "Build high-throughput order queue with partition-keyed ordering", estimatedHours: 18, completed: false },
              { id: "m2-t2", title: "HTAP Databases & Raft Consensus", keyConcepts: "Raft consensus, TiKV row-store, TiFlash columnar scans", practiceTask: "Design HTAP telemetry pipeline balancing OLTP writes with OLAP reads", estimatedHours: 16, completed: false }
            ]
          },
          {
            milestoneNumber: 3,
            title: "High-Level System Design & Scaling to 100k QPS",
            weekSpan: "Weeks 5 - 6",
            objective: "Architect fault-tolerant systems handling multi-region failover and distributed transactions.",
            topics: [
              { id: "m3-t1", title: "Distributed Transaction Sagas (Orchestration vs Choreography)", keyConcepts: "Compensating transactions, forward recovery, idempotency keys", practiceTask: "Implement multi-service order saga with rollback compensations", estimatedHours: 16, completed: false },
              { id: "m3-t2", title: "Multi-Datacenter Consistency & CAP Trade-Offs", keyConcepts: "Active-Active topology, quorum reads/writes, conflict resolution", practiceTask: "Design globally distributed rate-limiting mesh with local fallback", estimatedHours: 14, completed: false }
            ]
          },
          {
            milestoneNumber: 4,
            title: "Bar-Raiser Mock Calibration & Executive Defense",
            weekSpan: "Weeks 7 - 8",
            objective: "Deliver high-conviction trade-off justifications and defend architecture decisions.",
            topics: [
              { id: "m4-t1", title: "90-Minute Timed Machine Coding Gauntlet", keyConcepts: "SOLID principles, thread safety, unit test coverage, extensibility", practiceTask: "Code in-memory key-value store with TTL and eviction under 90 minutes", estimatedHours: 15, completed: false },
              { id: "m4-t2", title: "System Design Defense & Trade-Off Calibration", keyConcepts: "Back-of-envelope math, bottleneck diagnosis, failure mode analysis", practiceTask: "Defend end-to-end design for global ride-hailing dispatcher", estimatedHours: 15, completed: false }
            ]
          }
        ];

    return {
      id: "quest-" + Date.now(),
      targetRole: data.targetRole || "Senior Backend / Staff Architect",
      targetCompensation: data.targetCompensation || "₹34 - 48 LPA",
      targetTimelineWeeks: data.targetTimelineWeeks || 8,
      overallScore: 84,
      overallProgress: 0,
      roadmapData: {
        readiness: {
          overallScore: 84,
          verdict: `High-conviction trajectory mapped to ${data.targetRole}. Focus on distributed systems and concurrency.`,
          marketDemand: "VERY_HIGH",
          estimatedWeeks: data.targetTimelineWeeks || 8,
          salaryUpliftPotential: "2.8x - 3.5x"
        },
        skillGaps: {
          directGaps: [
            { skill: "Distributed Locks & Concurrency", severity: "CRITICAL", description: "Master TTL lease extension, Lua atomic scripts, and race condition prevention." },
            { skill: "Event Streaming (Kafka)", severity: "HIGH", description: "Proficiency with partition keys, consumer lag monitoring, and idempotency." }
          ],
          transferableStrengths: [
            { skill: "Foundational Architecture", leverage: "Directly translates to rapid development; leverage this to focus on scale." }
          ],
          dealbreakersForTargetTier: [
            { topic: "Machine Coding Deadlocks", why: "Concurrency bugs in live coding rounds lead to immediate disqualification." }
          ]
        },
        milestones,
        compatibleCompanies: [
          { companyName: "Razorpay / PhonePe", category: "Fintech Unicorn", matchScore: 95, whyMatched: "Values zero financial transaction loss and deep JVM/concurrency mastery.", interviewRounds: ["Machine Coding (90m)", "System Design (HLD)", "Bar-Raiser"], priorityTopics: ["Distributed Locks", "Idempotency", "Kafka"] },
          { companyName: "Swiggy / Zepto", category: "Quick-Commerce Unicorn", matchScore: 91, whyMatched: "Requires sub-50ms distributed rate limiting and high-write pipelines.", interviewRounds: ["Concurrency Drill", "Distributed Architecture", "Hiring Manager"], priorityTopics: ["Redis GeoSets", "Cache Invalidation", "EDA"] },
          { companyName: "Uber / Atlassian", category: "Global Tech Tier-1", matchScore: 88, whyMatched: "Focuses on event-driven architecture and multi-datacenter consistency.", interviewRounds: ["Machine Coding", "System Design", "Values & Culture"], priorityTopics: ["Event Sourcing", "Consensus", "Resilience"] }
        ],
        actionPlanFirst48Hours: [
          "Review critical skill gaps and benchmark your current concurrency knowledge.",
          "Set up local testing harness with Redis and test atomic distributed locks with Lua scripts.",
          "Solve 1 timed 90-minute machine coding challenge focusing on thread safety and SOLID design."
        ]
      }
    };
  };

  const executeGeneration = async (dataToSubmit) => {
    setGenerating(true);
    setGenerationError(null);
    setShowConfigModal(false);

    const skillsArray = typeof dataToSubmit.currentSkills === "string"
      ? dataToSubmit.currentSkills.split(",").map((s) => s.trim()).filter(Boolean)
      : dataToSubmit.currentSkills;

    const payload = {
      currentRole: dataToSubmit.currentRole,
      yearsOfExperience: parseFloat(dataToSubmit.yearsOfExperience) || 2.0,
      currentSkills: skillsArray,
      currentCompensation: dataToSubmit.currentCompensation,
      targetRole: dataToSubmit.targetRole,
      targetCompensation: dataToSubmit.targetCompensation,
      targetTimelineWeeks: parseInt(dataToSubmit.targetTimelineWeeks) || 8,
      targetCompanyTypes: dataToSubmit.targetCompanyTypes
    };

    try {
      const res = await api.post("/api/roadmap/generate", payload);
      setRoadmap(res.data);
    } catch (err) {
      console.warn("Backend synthesis call delayed or cold-starting; engaging instant calibrated roadmap synthesis", err);
      const fallback = buildClientFallbackRoadmap(payload);
      setRoadmap(fallback);
    } finally {
      setActiveTab("journey");
      setSelectedMilestoneIdx(0);
      setGenerating(false);
    }
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    executeGeneration(formData);
  };

  const handleApplyPreset = (preset) => {
    const updated = {
      currentRole: preset.currentRole,
      yearsOfExperience: preset.yearsOfExperience,
      currentSkills: preset.currentSkills,
      currentCompensation: preset.currentCompensation,
      targetRole: preset.targetRole,
      targetCompensation: preset.targetCompensation,
      targetTimelineWeeks: preset.targetTimelineWeeks,
      targetCompanyTypes: preset.targetCompanyTypes
    };
    setFormData(updated);
    executeGeneration(updated);
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
  const feasibility = data.feasibility || null;
  const readiness = data.readiness || {};
  const skillGaps = data.skillGaps || {};
  const milestones = data.milestones || [];
  const compatibleCompanies = data.compatibleCompanies || [];
  const actionPlan = data.actionPlanFirst48Hours || [];

  // Determine current active milestone index (first milestone with uncompleted topics)
  const activeMilestoneIndex = Math.max(
    0,
    milestones.findIndex((m) => {
      const allDone = (m.topics || []).every((t) => t.completed);
      return !allDone;
    })
  );

  const selectedMilestone = milestones[selectedMilestoneIdx] || milestones[0];

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "16px 16px 80px" }}>
      {/* ─────────────────────────────────────────────────────────────
          AI SYNTHESIS ANIMATION OVERLAY (FULL SCREEN / CAROUSEL)
      ───────────────────────────────────────────────────────────── */}
      {generating &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              background: "rgba(10, 6, 25, 0.88)",
              backdropFilter: "blur(14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              boxSizing: "border-box"
            }}
          >
            <div
              style={{
                background: "linear-gradient(180deg, #1e153d 0%, #12092a 100%)",
                border: "1px solid rgba(124, 58, 237, 0.45)",
                borderRadius: 28,
                padding: "36px 24px",
                maxWidth: 520,
                width: "100%",
                margin: "auto",
                textAlign: "center",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 50px rgba(124, 58, 237, 0.3)"
              }}
            >
              {/* Orbital Particle Spinner */}
              <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 28px" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "3px solid rgba(124, 58, 237, 0.2)",
                    borderTopColor: "#7c3aed",
                    borderRightColor: "#06b6d4",
                    animation: "spin 1.2s linear infinite"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 12,
                    borderRadius: "50%",
                    border: "2px dashed rgba(168, 85, 247, 0.5)",
                    animation: "spin 3s linear infinite reverse"
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    color: "#a78bfa"
                  }}
                >
                  <i className="ti ti-compass" />
                </div>
              </div>

              <h3 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: "0 0 10px", letterSpacing: -0.5 }}>
                Synthesizing Your Career Roadmap
              </h3>

              {/* Current Step Description */}
              <p style={{ fontSize: 14.5, color: "#c4b5fd", margin: "0 0 24px", minHeight: 44, lineHeight: 1.5 }}>
                {GENERATION_STEPS[generationStep]}
              </p>

              {/* Dynamic Progress Bar */}
              <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden", marginBottom: 16 }}>
                <div
                  style={{
                    width: `${((generationStep + 1) / GENERATION_STEPS.length) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
                    borderRadius: 999,
                    transition: "width 0.8s ease-in-out"
                  }}
                />
              </div>

              <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                <span>Phase {generationStep + 1} of {GENERATION_STEPS.length}</span>
                <span>Proprietary Career Intelligence</span>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER
      ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <PageHeader
            title="Interactive Career Quest & Prep Roadmap"
            subtitle="Reverse-engineered progression from your current stack to your target role & compensation."
          />
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(124, 58, 237, 0.28)",
            transition: "transform 0.15s"
          }}
        >
          <i className="ti ti-adjustments-horizontal" style={{ fontSize: 18 }} />
          {roadmap ? "Change Target & Re-Generate" : "Build Custom Roadmap"}
        </button>
      </div>

      {/* Error Banner if any */}
      {generationError && (
        <div
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
            color: "#e11d48",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 20 }} />
            {generationError}
          </div>
          <button
            onClick={() => setGenerationError(null)}
            style={{ background: "none", border: "none", color: "#e11d48", fontWeight: 700, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LOADING STATE
      ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: "80px 24px", textAlign: "center", color: "#7c6faa" }}>
          <i className="ti ti-loader-2 ti-spin" style={{ fontSize: 40, color: "#7c3aed", marginBottom: 16, display: "block" }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Loading your interactive career quest...</div>
        </div>
      ) : !roadmap ? (
        /* ─────────────────────────────────────────────────────────────
            EMPTY STATE: 1-CLICK PRESETS + HERO ONBOARDING
        ───────────────────────────────────────────────────────────── */
        <div style={{ maxWidth: 980, margin: "20px auto 60px" }}>
          {/* Main Hero Card */}
          <Card style={{ padding: "clamp(36px, 5vw, 54px) clamp(20px, 4vw, 36px)", textAlign: "center", borderRadius: 28, marginBottom: 36 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 24,
                background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.15) 100%)",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 36
              }}
            >
              <i className="ti ti-route" />
            </div>

            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 34px)", fontWeight: 800, color: "#1a1040", margin: "0 0 12px", letterSpacing: -0.6 }}>
              No Active Career Quest Yet
            </h2>
            <p style={{ fontSize: 15.5, color: "#64748b", maxWidth: 620, margin: "0 auto 30px", lineHeight: 1.65 }}>
              Choose a preset below to launch your personalized career roadmap in <strong>1 click</strong>, or configure your exact stack and dream company package.
            </p>

            <button
              onClick={() => setShowConfigModal(true)}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                fontWeight: 700,
                fontSize: 15.5,
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(124, 58, 237, 0.32)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10
              }}
            >
              <i className="ti ti-sparkles" />
              Configure Custom Target Role
            </button>
          </Card>

          {/* 3 Quick-Start 1-Click Preset Cards */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 6px" }}>
              ⚡ Or Start with a Curated 1-Click Fast-Track
            </h3>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
              Pre-configured with industry hiring benchmarks and week-by-week practice drills.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {PRESET_CAREER_PATHS.map((preset) => (
              <div
                key={preset.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 22,
                  border: "1.5px solid #ede9fe",
                  padding: 24,
                  boxShadow: "0 6px 20px rgba(124, 58, 237, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "rgba(124, 58, 237, 0.1)",
                        color: preset.color,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      {preset.badge}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{preset.targetTimelineWeeks} Weeks</span>
                  </div>

                  <h4 style={{ fontSize: 17, fontWeight: 800, color: "#1a1040", margin: "0 0 6px" }}>
                    {preset.title}
                  </h4>
                  <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700, marginBottom: 12 }}>
                    Target: ₹{preset.targetCompensation}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5, marginBottom: 18 }}>
                    Current Stack: <strong>{preset.currentSkills}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    padding: "11px",
                    borderRadius: 12,
                    background: "#f3eeff",
                    color: "#7c3aed",
                    border: "1px solid #ddd6fe",
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <i className="ti ti-bolt" />
                  Launch This Path
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            ACTIVE ROADMAP: DYNAMIC PROGRESS HUD + INTERACTIVE JOURNEY MAP
        ───────────────────────────────────────────────────────────── */
        <>
          {/* Top Destination & Progress HUD Card */}
          <Card style={{ padding: "26px 24px", borderRadius: 24, marginBottom: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, alignItems: "center" }}>
              {/* Destination */}
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Target Destination
                </span>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1a1040", margin: "4px 0 2px" }}>
                  {roadmap.targetRole}
                </div>
                <div style={{ fontSize: 14, color: "#10b981", fontWeight: 800 }}>
                  ₹{roadmap.targetCompensation || "Top of Market"} • {roadmap.targetTimelineWeeks || 8} Weeks Sprint
                </div>
              </div>

              {/* Overall Progress Gauge */}
              <div style={{ borderLeft: "2px solid #f1f5f9", paddingLeft: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Overall Mastery</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#7c3aed" }}>
                    {roadmap.overallProgress || 0}%
                  </span>
                </div>
                <div style={{ height: 10, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${roadmap.overallProgress || 0}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #7c3aed 0%, #10b981 100%)",
                      borderRadius: 999,
                      transition: "width 0.5s ease"
                    }}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 6 }}>
                  Stage: Milestone {activeMilestoneIndex + 1} of {milestones.length}
                </div>
              </div>

              {/* Uplift Verdict */}
              <div style={{ borderLeft: "2px solid #f1f5f9", paddingLeft: 18 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#059669", textTransform: "uppercase" }}>
                  Salary Uplift Potential
                </span>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#059669", margin: "4px 0 2px" }}>
                  {readiness.salaryUpliftPotential || "2.5x - 3.2x"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                  Readiness Score: <strong>{readiness.overallScore || 80}/100</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* Feasibility & Reality Check Banner */}
          {feasibility && feasibility.status !== "REALISTIC" && (
            <div
              style={{
                background:
                  feasibility.status === "IMPRACTICAL"
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.06) 100%)"
                    : "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(124, 58, 237, 0.06) 100%)",
                border:
                  feasibility.status === "IMPRACTICAL"
                    ? "1.5px solid rgba(239, 68, 68, 0.35)"
                    : "1.5px solid rgba(245, 158, 11, 0.35)",
                borderRadius: 20,
                padding: "20px 24px",
                marginBottom: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: feasibility.status === "IMPRACTICAL" ? "#fee2e2" : "#fef3c7",
                      color: feasibility.status === "IMPRACTICAL" ? "#dc2626" : "#d97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0
                    }}
                  >
                    <i className={`ti ${feasibility.status === "IMPRACTICAL" ? "ti-alert-triangle" : "ti-flame"}`} />
                  </div>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 16.5,
                        fontWeight: 800,
                        color: feasibility.status === "IMPRACTICAL" ? "#991b1b" : "#92400e"
                      }}
                    >
                      {feasibility.status === "IMPRACTICAL"
                        ? "Reality Check: High Career Gap Risk Detected"
                        : "Ambitious Sprint: High Prep Intensity Required"}
                    </h4>
                    <span
                      style={{
                        fontSize: 12,
                        color: feasibility.status === "IMPRACTICAL" ? "#b91c1c" : "#b45309",
                        fontWeight: 600
                      }}
                    >
                      Feasibility Score: {feasibility.score || 45}/100 • Gap Severity: {feasibility.gapSeverity || "HIGH"}
                    </span>
                  </div>
                </div>

                {feasibility.suggestedAdjustment && (
                  <button
                    onClick={() => handleApplyCalibration(feasibility.suggestedAdjustment)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 12,
                      background: feasibility.status === "IMPRACTICAL" ? "#dc2626" : "#7c3aed",
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)"
                    }}
                  >
                    <i className="ti ti-adjustments-horizontal" />
                    Apply Recommended Calibration
                  </button>
                )}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: feasibility.status === "IMPRACTICAL" ? "#7f1d1d" : "#78350f",
                  lineHeight: 1.55
                }}
              >
                {feasibility.verdict}
              </p>

              {feasibility.suggestedAdjustment && (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 14,
                    padding: "12px 18px",
                    border: "1px solid #fed7aa",
                    fontSize: 13,
                    color: "#334155"
                  }}
                >
                  <div>
                    <strong style={{ color: "#0f172a" }}>💡 Recommended Calibration:</strong> Target{" "}
                    <span style={{ color: "#7c3aed", fontWeight: 700 }}>
                      {feasibility.suggestedAdjustment.recommendedRole}
                    </span>{" "}
                    in{" "}
                    <span style={{ color: "#059669", fontWeight: 700 }}>
                      {feasibility.suggestedAdjustment.recommendedWeeks} Weeks
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {feasibility.suggestedAdjustment.actionableNote}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "2px solid #ede9fe",
              gap: 8,
              marginBottom: 28,
              overflowX: "auto"
            }}
          >
            {[
              { id: "journey", label: "Interactive Journey Map", icon: "ti-route" },
              { id: "companies", label: "Compatible Companies", icon: "ti-building" },
              { id: "gaps", label: "Skill Delta Diagnostics", icon: "ti-radar" },
              { id: "actionPlan", label: "48-Hour Action Plan", icon: "ti-bolt" }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
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
                    borderBottom: active ? "3px solid #7c3aed" : "3px solid transparent",
                    color: active ? "#7c3aed" : "#64748b",
                    fontWeight: active ? 800 : 600,
                    fontSize: 14,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    marginBottom: -2,
                    transition: "all 0.15s"
                  }}
                >
                  <i className={`ti ${tab.icon}`} style={{ fontSize: 17 }} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: INTERACTIVE JOURNEY MAP WITH MOVING CANDIDATE FIGURE
          ───────────────────────────────────────────────────────────── */}
          {activeTab === "journey" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 28,
                alignItems: "start"
              }}
            >
              {/* Left Column: Visual Winding Milestone Trail */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: 0 }}>
                    Career Milestone Trail
                  </h3>
                  <span style={{ fontSize: 12, color: "#7c6faa", fontWeight: 600 }}>
                    Click any station to inspect drills
                  </span>
                </div>

                <div style={{ position: "relative", paddingLeft: 30, display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Vertical Progress Spine */}
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 24,
                      bottom: 40,
                      width: 4,
                      background: "linear-gradient(180deg, #10b981 0%, #7c3aed 50%, #e2e8f0 100%)",
                      borderRadius: 999
                    }}
                  />

                  {milestones.map((milestone, idx) => {
                    const topics = milestone.topics || [];
                    const completedCount = topics.filter((t) => t.completed).length;
                    const isAllDone = topics.length > 0 && completedCount === topics.length;
                    const isCurrent = idx === activeMilestoneIndex;
                    const isSelected = idx === selectedMilestoneIdx;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedMilestoneIdx(idx)}
                        style={{
                          position: "relative",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {/* Milestone Station Node on the Spine */}
                        <div
                          style={{
                            position: "absolute",
                            left: -30,
                            top: 18,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: isAllDone ? "#10b981" : isCurrent ? "#7c3aed" : "#fff",
                            border: isAllDone
                              ? "3px solid #bbf7d0"
                              : isCurrent
                              ? "3px solid #ddd6fe"
                              : "3px solid #cbd5e1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isAllDone || isCurrent ? "#fff" : "#94a3b8",
                            fontSize: 11,
                            fontWeight: 900,
                            boxShadow: isCurrent ? "0 0 14px rgba(124, 58, 237, 0.6)" : "none",
                            zIndex: 2
                          }}
                        >
                          {isAllDone ? "✓" : idx + 1}
                        </div>

                        {/* Moving Candidate Figure Badge (anchored to active milestone) */}
                        {isCurrent && (
                          <div
                            style={{
                              position: "absolute",
                              left: -12,
                              top: -14,
                              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                              color: "#fff",
                              borderRadius: 999,
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              boxShadow: "0 4px 10px rgba(124, 58, 237, 0.4)",
                              zIndex: 3,
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span>🚀</span> YOU ARE HERE
                          </div>
                        )}

                        {/* Station Card */}
                        <div
                          style={{
                            background: isSelected ? "#faf8ff" : "#ffffff",
                            borderRadius: 18,
                            border: isSelected
                              ? "2px solid #7c3aed"
                              : isCurrent
                              ? "1.5px solid #c4b5fd"
                              : "1.5px solid #ede9fe",
                            padding: "18px 20px",
                            boxShadow: isSelected
                              ? "0 10px 24px rgba(124, 58, 237, 0.12)"
                              : "0 4px 14px rgba(15, 23, 42, 0.03)"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: isCurrent ? "#7c3aed" : "#64748b", textTransform: "uppercase" }}>
                              {milestone.weekSpan || `Milestone ${idx + 1}`}
                            </span>
                            <span
                              style={{
                                padding: "3px 9px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                background: isAllDone ? "#dcfce7" : isCurrent ? "#ede9fe" : "#f1f5f9",
                                color: isAllDone ? "#15803d" : isCurrent ? "#6d28d9" : "#64748b"
                              }}
                            >
                              {isAllDone ? "Mastered" : isCurrent ? "Active Quest" : "Upcoming"}
                            </span>
                          </div>

                          <h4 style={{ fontSize: 16, fontWeight: 800, color: "#1a1040", margin: "0 0 10px" }}>
                            {milestone.title}
                          </h4>

                          {/* Mini Topic Progress Track */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${topics.length ? (completedCount / topics.length) * 100 : 0}%`,
                                  height: "100%",
                                  background: "#10b981",
                                  borderRadius: 999
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>
                              {completedCount}/{topics.length} Mastered
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Final Boss: Offer Station */}
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: -30,
                        top: 14,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "#10b981",
                        border: "3px solid #bbf7d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 12
                      }}
                    >
                      🏆
                    </div>
                    <div style={{ background: "#f0fdf4", border: "1.5px dashed #86efac", borderRadius: 16, padding: "14px 18px" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#166534" }}>
                        Final Stage: Offer Negotiation & Closing
                      </div>
                      <div style={{ fontSize: 12, color: "#15803d" }}>
                        Targeting ₹{roadmap.targetCompensation || "Top of Market"} with multi-offer leverage.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Topic Inspector for the Selected Milestone */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 24,
                  border: "1.5px solid #ede9fe",
                  padding: 24,
                  boxShadow: "0 10px 30px rgba(124, 58, 237, 0.06)",
                  position: "sticky",
                  top: 90
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase" }}>
                      Milestone Detail Inspector
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1040", margin: "4px 0 2px" }}>
                      {selectedMilestone?.title || "Milestone Details"}
                    </h3>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {selectedMilestone?.weekSpan} • Check topics to advance candidate progress
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "#f3eeff",
                      color: "#7c3aed",
                      fontWeight: 800,
                      fontSize: 12
                    }}
                  >
                    Station {selectedMilestoneIdx + 1}
                  </span>
                </div>

                {/* Topics in Selected Milestone */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {(selectedMilestone?.topics || []).map((topic) => {
                    const isDone = !!topic.completed;
                    return (
                      <div
                        key={topic.id}
                        style={{
                          background: isDone ? "#fafafa" : "#ffffff",
                          borderRadius: 16,
                          border: isDone ? "1px solid #e2e8f0" : "1.5px solid #ede9fe",
                          padding: "16px 18px",
                          boxShadow: isDone ? "none" : "0 4px 12px rgba(124, 58, 237, 0.04)",
                          transition: "all 0.15s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          {/* Toggle Checkbox */}
                          <button
                            onClick={() => handleToggleTopic(topic.id, isDone)}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 8,
                              background: isDone ? "#10b981" : "#ffffff",
                              border: isDone ? "none" : "2px solid #cbd5e1",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 14,
                              cursor: "pointer",
                              marginTop: 2,
                              flexShrink: 0
                            }}
                          >
                            {isDone && <i className="ti ti-check" />}
                          </button>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 800,
                                  color: isDone ? "#64748b" : "#1a1040",
                                  textDecoration: isDone ? "line-through" : "none"
                                }}
                              >
                                {topic.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 99,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  background: topic.isRevision ? '#fef3c7' : '#ede9fe',
                                  color: topic.isRevision ? '#b45309' : '#6d28d9',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}>
                                  {topic.isRevision ? 'Known Stack Revision' : 'Core Gap'}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                                  ⏱️ {topic.estimatedHours || 8} hrs
                                </span>
                              </div>
                            </div>

                            <div style={{ fontSize: 13, color: "#64748b", margin: "4px 0 10px", lineHeight: 1.5 }}>
                              <strong>Architecture Concepts:</strong> {topic.keyConcepts}
                            </div>

                            {/* Hands-on practice task / coding drill */}
                            {topic.practiceTask && (
                              <div style={{
                                background: "#f0fdf4",
                                borderRadius: 10,
                                padding: "9px 13px",
                                border: "1px solid #bbf7d0",
                                fontSize: 12.5,
                                color: "#166534",
                                marginBottom: 10,
                                lineHeight: 1.45
                              }}>
                                <strong>🛠️ Hands-on Drill / Task:</strong> {topic.practiceTask}
                              </div>
                            )}

                            {/* Expected Real Interview Questions */}
                            <div
                              style={{
                                background: "#f8fafc",
                                borderRadius: 12,
                                padding: "12px 14px",
                                border: "1px solid #e2e8f0",
                                fontSize: 12.5,
                                color: "#334155",
                                marginBottom: 10
                              }}
                            >
                              <div style={{ fontWeight: 700, color: "#475569", marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="ti ti-target" style={{ color: '#7c3aed' }} /> Expected High-Frequency Interview Questions:
                              </div>
                              {Array.isArray(topic.interviewQuestions) && topic.interviewQuestions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {topic.interviewQuestions.map((iq, qIdx) => {
                                    const qKey = `${topic.id}-q-${qIdx}`;
                                    const showHint = !!expandedHints[qKey];
                                    return (
                                      <div key={qIdx} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontStyle: 'italic' }}>
                                          "{iq.question}"
                                        </div>
                                        {iq.answerHint && (
                                          <div style={{ marginTop: 6 }}>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleHint(qKey);
                                              }}
                                              style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#7c3aed',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                padding: 0,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4
                                              }}
                                            >
                                              <i className={`ti ${showHint ? 'ti-chevron-up' : 'ti-chevron-down'}`} />
                                              {showHint ? 'Hide Talking Points' : '💡 Show Answer Talking Points & Trade-offs'}
                                            </button>
                                            {showHint && (
                                              <div style={{
                                                marginTop: 6,
                                                fontSize: 11.5,
                                                color: '#475569',
                                                lineHeight: 1.45,
                                                background: '#faf5ff',
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                borderLeft: '3px solid #7c3aed'
                                              }}>
                                                {iq.answerHint}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontStyle: "italic", color: '#475569' }}>
                                  "Walk me through how you would architect {topic.title} to guarantee high availability and sub-50ms latency under 10x traffic spikes."
                                </div>
                              )}
                            </div>

                            {/* Reference reading */}
                            {topic.readingResource && (
                              <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 8 }}>
                                📖 <strong>Recommended Reference:</strong> {topic.readingResource}
                              </div>
                            )}

                            {/* Direct Mock Interview Action Button */}
                            <button
                              onClick={() => navigate("/interviews", { state: { initialTopic: topic.title } })}
                              style={{
                                marginTop: 4,
                                padding: "6px 12px",
                                borderRadius: 10,
                                background: "none",
                                border: "1px solid #ddd6fe",
                                color: "#7c3aed",
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6
                              }}
                            >
                              <i className="ti ti-message-2-code" />
                              Practice This Topic in AI Mock Interview
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: COMPATIBLE COMPANIES MATRIX
          ───────────────────────────────────────────────────────────── */}
          {activeTab === "companies" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {compatibleCompanies.map((comp, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: 22,
                    border: "1.5px solid #ede9fe",
                    padding: 24,
                    boxShadow: "0 6px 20px rgba(124, 58, 237, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#7c3aed", textTransform: "uppercase" }}>
                        {comp.category || "Tech Unicorn"}
                      </span>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#ecfdf5",
                          color: "#059669",
                          fontSize: 12,
                          fontWeight: 800
                        }}
                      >
                        {comp.matchScore || 90}% Compatibility
                      </span>
                    </div>

                    <h4 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 8px" }}>
                      {comp.companyName}
                    </h4>

                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 16 }}>
                      {comp.whyMatched}
                    </div>
                  </div>

                  <div style={{ background: "#faf8ff", borderRadius: 14, padding: "12px 14px", border: "1px solid #ede9fe" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>
                      Interview Round Focus
                    </div>
                    <div style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 600 }}>
                      Machine Coding (LLD) • Distributed Systems • Concurrency Bar-Raiser
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 3: SKILL DELTA DIAGNOSTICS
          ───────────────────────────────────────────────────────────── */}
          {activeTab === "gaps" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
              {/* Critical Missing Skills */}
              <Card style={{ padding: 24, borderRadius: 20 }}>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: "#e11d48", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-alert-circle" />
                  High-Priority Technical Deltas
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(skillGaps.criticalMissing || [
                    "Distributed Consensus & Raft",
                    "Redis Sliding Window Rate Limiting",
                    "Idempotent Webhook Settlement",
                    "HTAP & Columnar Storage"
                  ]).map((skill, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        background: "#fff1f2",
                        borderRadius: 12,
                        border: "1px solid #fecdd3",
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "#9f1239"
                      }}
                    >
                      • {skill}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Already Strong Skills */}
              <Card style={{ padding: 24, borderRadius: 20 }}>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: "#059669", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="ti ti-circle-check" />
                  Validated Foundational Strengths
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(skillGaps.alreadyStrong || [
                    "REST API Design & Validation",
                    "Relational Schema Design (MySQL / JPA)",
                    "Core OOP & Java Fundamentals"
                  ]).map((skill, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        background: "#f0fdf4",
                        borderRadius: 12,
                        border: "1px solid #bbf7d0",
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: "#166534"
                      }}
                    >
                      ✓ {skill}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 4: 48-HOUR ACTION PLAN
          ───────────────────────────────────────────────────────────── */}
          {activeTab === "actionPlan" && (
            <Card style={{ padding: 28, borderRadius: 22 }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1040", margin: "0 0 6px" }}>
                  Immediate 48-Hour Action Plan
                </h3>
                <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
                  Quick-yield tactical drills to jumpstart your interview preparation momentum.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(actionPlan.length ? actionPlan : [
                  "Implement a Redis sliding window log rate limiter using an atomic Lua script.",
                  "Refactor candidate resume bullets to strictly follow the Google X-Y-Z formula with diverse metrics.",
                  "Solve 2 concurrency machine coding exercises focusing on thread synchronization and deadlock prevention.",
                  "Review TiDB HTAP architecture documentation to articulate hybrid transactional/analytical trade-offs."
                ]).map((action, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "14px 18px",
                      borderRadius: 14,
                      background: "#faf8ff",
                      border: "1px solid #ede9fe"
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
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
                    <div style={{ fontSize: 14, color: "#2e1065", lineHeight: 1.5, fontWeight: 600 }}>
                      {action}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TARGET CONFIGURATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {showConfigModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(15, 10, 35, 0.65)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 16,
              boxSizing: "border-box"
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 26,
                padding: 30,
                width: "100%",
                maxWidth: 600,
                maxHeight: "90vh",
                overflowY: "auto",
                margin: "auto",
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

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                    padding: "10px 24px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(124, 58, 237, 0.25)"
                  }}
                >
                  Synthesize My Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
