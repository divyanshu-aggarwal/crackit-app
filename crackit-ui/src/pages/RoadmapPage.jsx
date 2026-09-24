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
  const [roadmap, setRoadmap] = useState(() => {
    try {
      const saved = localStorage.getItem("crackit:active_roadmap");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [activeTab, setActiveTab] = useState("journey"); // "journey", "companies", "gaps", "actionPlan"
  const [journeyViewMode, setJourneyViewMode] = useState("syllabus"); // "syllabus" (all 16 topics in order) or "milestone" (trail)
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
    const cached = localStorage.getItem("crackit:active_roadmap");
    if (!cached) {
      setLoading(true);
    }
    try {
      const res = await api.get("/api/roadmap/current");
      if (res.status === 200 && res.data) {
        setRoadmap(res.data);
        try {
          localStorage.setItem("crackit:active_roadmap", JSON.stringify(res.data));
        } catch (e) {
          console.warn("Could not cache roadmap to localStorage", e);
        }
      } else {
        if (!cached) setRoadmap(null);
      }
    } catch (err) {
      console.error("Failed to load roadmap", err);
      if (!cached) setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  const buildClientFallbackRoadmap = (data) => {
    const target = data.targetRole || "Senior Engineer";
    const current = data.currentRole || "Software Engineer";
    const weeks = parseInt(data.targetTimelineWeeks) || 8;
    const skillsLower = (Array.isArray(data.currentSkills) ? data.currentSkills.join(" ") : String(data.currentSkills || "")).toLowerCase();
    const isFrontend = target.toLowerCase().includes("frontend") || target.toLowerCase().includes("ui") || target.toLowerCase().includes("react");

    const milestones = isFrontend
      ? [
          {
            milestoneNumber: 1,
            title: "Core Web Engine, Memory & Interaction to Next Paint (INP)",
            weekSpan: "Weeks 1 - 2",
            objective: "Master browser rendering pipelines, main thread scheduling, and Web Vitals.",
            topics: [
              {
                id: "m1-t1",
                stepNumber: 1,
                title: "JavaScript Event Loop, Microtasks & Macrotasks",
                isRevision: skillsLower.includes("javascript"),
                keyConcepts: "Call stack, event loop, Promise resolution, MutationObserver vs requestAnimationFrame, starvation",
                practiceTask: "Build a priority task scheduler queue with requestIdleCallback fallback",
                estimatedHours: 10,
                interviewQuestions: [
                  { question: "How does Promise.then() differ from setTimeout(0) in thread execution?", answerHint: "Microtask queue is drained before next tick; setTimeout goes to macrotask timer queue." },
                  { question: "What causes UI frame jank during high-frequency mouse movements?", answerHint: "Long tasks blocking the main thread; explain requestAnimationFrame batching." }
                ],
                readingResource: "MDN - In-depth guide to Event Loop & Concurrency Model",
                completed: false
              },
              {
                id: "m1-t2",
                stepNumber: 2,
                title: "Interaction to Next Paint (INP) & Main Thread Scheduling",
                isRevision: false,
                keyConcepts: "Long tasks (>50ms), scheduler.postTask API, yielding with isInputPending, web workers",
                practiceTask: "Audit and eliminate 200ms INP bottlenecks on interactive 10,000-row data tables",
                estimatedHours: 12,
                interviewQuestions: [
                  { question: "How does INP differ from FID, and how do you optimize it?", answerHint: "INP measures all interactions throughout page lifetime, not just first click; yield to main thread with scheduler.yield()." },
                  { question: "When should you offload state calculations to a Web Worker?", answerHint: "When compute exceeds 16ms per frame; discuss structured clone overhead vs SharedArrayBuffer." }
                ],
                readingResource: "web.dev - Optimize Interaction to Next Paint (INP)",
                completed: false
              },
              {
                id: "m1-t3",
                stepNumber: 3,
                title: "DOM Virtualization & Composite Layer GPU Acceleration",
                isRevision: skillsLower.includes("react"),
                keyConcepts: "GPU compositing layers, CSS will-change, DOM recycling, windowing scroll offsets",
                practiceTask: "Build a zero-lag virtualized list rendering 50,000 DOM nodes smoothly at 60fps",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "Why does updating DOM node styles trigger forced synchronous layout?", answerHint: "Reading layout geometry after writing causes immediate layout recalculation (layout thrashing)." },
                  { question: "Explain CSS contain property and its rendering performance benefits.", answerHint: "contain: layout paint isolates subtree recalculation from the document root." }
                ],
                readingResource: "Google Web Fundamentals - Avoid Large, Complex Layouts and Layout Thrashing",
                completed: false
              },
              {
                id: "m1-t4",
                stepNumber: 4,
                title: "Tree-Shaking, Code Splitting & Bundle Performance",
                isRevision: false,
                keyConcepts: "ESM static analysis, dynamic import(), Rollup/Vite chunks, Brotli compression, module preload",
                practiceTask: "Profile Webpack/Vite bundle and reduce first load JS bundle size by 65%",
                estimatedHours: 10,
                interviewQuestions: [
                  { question: "Why cannot CommonJS require() be reliably tree-shaken by bundlers?", answerHint: "require() is dynamic and conditional at runtime; ESM import is statically declared at compile time." },
                  { question: "What is modulepreload link tag and how does it prevent waterfall downloads?", answerHint: "Fetches and parses ES module dependency trees in parallel before script execution." }
                ],
                readingResource: "web.dev - Reduce JavaScript payloads with code splitting",
                completed: false
              }
            ]
          },
          {
            milestoneNumber: 2,
            title: "Enterprise State Architecture & Micro-Frontends",
            weekSpan: "Weeks 3 - 4",
            objective: "Architect enterprise state machines, module federation, and offline recovery.",
            topics: [
              {
                id: "m2-t1",
                stepNumber: 5,
                title: "Finite State Machines & Predictable State Engines",
                isRevision: false,
                keyConcepts: "XState, state charts, actor model, avoiding impossible states, hierarchical state",
                practiceTask: "Implement an enterprise multi-step checkout state machine with recovery",
                estimatedHours: 12,
                interviewQuestions: [
                  { question: "Why choose a Finite State Machine over simple Boolean flag states?", answerHint: "Eliminates unreachable states and edge-case race conditions." },
                  { question: "Explain the Actor model pattern in UI state management.", answerHint: "Actors encapsulate state and communicate exclusively through asynchronous messages." }
                ],
                readingResource: "David Khourshid - Welcome to the World of Statecharts",
                completed: false
              },
              {
                id: "m2-t2",
                stepNumber: 6,
                title: "Module Federation & Isolated Micro-App Runtimes",
                isRevision: false,
                keyConcepts: "Webpack 5 Module Federation, shared singletons, version mismatch isolation, runtime container orchestration",
                practiceTask: "Implement a federated host loading independent remote micro-apps with shared React singleton",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "How does Module Federation handle two micro-apps requiring different major versions of a library?", answerHint: "Explain singleton configuration vs isolated scopes in ModuleFederationPlugin." },
                  { question: "What happens when a remote micro-app fails to load over the network?", answerHint: "Implement circuit breaker boundary and graceful UI degradation." }
                ],
                readingResource: "Webpack Docs - Module Federation Architecture",
                completed: false
              },
              {
                id: "m2-t3",
                stepNumber: 7,
                title: "Optimistic UI Updates & Delta Synchronization",
                isRevision: false,
                keyConcepts: "Rollback buffers, optimistic response IDs, conflict detection, reconnect replay",
                practiceTask: "Build a high-velocity collaborative task list with instantaneous optimistic writes",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "How do you roll back optimistic UI mutations without screen flashing?", answerHint: "Keep pristine snapshots before applying optimistic delta; revert on rejection." },
                  { question: "Explain idempotent mutation keys in client-server communication.", answerHint: "UUID client mutation keys prevent duplicate action execution on reconnect." }
                ],
                readingResource: "Martin Fowler - LMAX Architecture and Optimistic UI Patterns",
                completed: false
              },
              {
                id: "m2-t4",
                stepNumber: 8,
                title: "Web Workers & Heavy Background Compute",
                isRevision: false,
                keyConcepts: "SharedWorker, ServiceWorker caching, Comlink RPC bridge, Transferable Objects",
                practiceTask: "Process 50MB CSV data parsing inside a dedicated worker with sub-5ms UI responsiveness",
                estimatedHours: 12,
                interviewQuestions: [
                  { question: "What are Transferable Objects in postMessage() and why are they zero-copy?", answerHint: "Memory ownership transfers directly to the worker thread without memory serialization." },
                  { question: "How does a SharedWorker coordinate state across multiple browser tabs?", answerHint: "Multiple browsing contexts connect via MessagePorts to a single shared execution context." }
                ],
                readingResource: "MDN - Transferable Objects and Worker Performance",
                completed: false
              }
            ]
          },
          {
            milestoneNumber: 3,
            title: "Real-Time Collaboration & CRDTs",
            weekSpan: "Weeks 5 - 6",
            objective: "Build conflict-free real-time collaborative applications with offline resilience.",
            topics: [
              {
                id: "m3-t1",
                stepNumber: 9,
                title: "WebSocket Resilient State Reconnection & Heartbeats",
                isRevision: false,
                keyConcepts: "Exponential backoff, jitter, message deduplication, missed event sequence replay",
                practiceTask: "Build a production-grade resilient WebSocket client with automatic state resynchronization",
                estimatedHours: 12,
                interviewQuestions: [
                  { question: "How do you prevent thundering herd when a WebSocket server cluster restarts?", answerHint: "Apply exponential backoff combined with randomized decorrelated jitter." },
                  { question: "How do you ensure no messages are lost during client network handover (Wi-Fi to 5G)?", answerHint: "Use sequence-numbered message buffers and ACK protocols." }
                ],
                readingResource: "RFC 6455 - The WebSocket Protocol Specification",
                completed: false
              },
              {
                id: "m3-t2",
                stepNumber: 10,
                title: "Conflict-Free Replicated Data Types (CRDTs) & Yjs",
                isRevision: false,
                keyConcepts: "State-based vs operation-based CRDTs, Yjs delta encoding, eventual consistency in UI",
                practiceTask: "Implement a collaborative multi-user live document with zero conflict loss",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "What is the mathematical difference between Operational Transformation (OT) and CRDTs?", answerHint: "OT requires a centralized coordination server to transform operations; CRDTs are commutative and associative." },
                  { question: "How does Yjs prevent tombstone memory bloat in long-lived text sessions?", answerHint: "Block merging and garbage collection algorithms." }
                ],
                readingResource: "Martin Kleppmann - Conflict-Free Replicated Data Types",
                completed: false
              },
              {
                id: "m3-t3",
                stepNumber: 11,
                title: "IndexedDB Offline-First Caching & Workbox",
                isRevision: false,
                keyConcepts: "Service Worker lifecycle, Cache-First vs Stale-While-Revalidate, IndexedDB transactions",
                practiceTask: "Build an offline-first workspace that functions seamlessly in airplane mode",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "Explain the difference between Cache API and IndexedDB for offline storage.", answerHint: "Cache API stores request/response pairs; IndexedDB is a structured transactional NoSQL store." },
                  { question: "What happens when a new Service Worker is waiting to activate?", answerHint: "Discuss skipWaiting() and lifecycle transitions without corrupting open tabs." }
                ],
                readingResource: "Google Chrome Developers - Offline Cookbook",
                completed: false
              },
              {
                id: "m3-t4",
                stepNumber: 12,
                title: "Web Security: CSP, Cross-Origin Isolation & Token Storage",
                isRevision: false,
                keyConcepts: "Content Security Policy (CSP), HTTPOnly SameSite cookies, Subresource Integrity, Cross-Origin-Embedder-Policy",
                practiceTask: "Harden a client-side banking portal to achieve zero XSS vulnerability",
                estimatedHours: 10,
                interviewQuestions: [
                  { question: "Why should authentication tokens never be stored in localStorage?", answerHint: "Any successful XSS exploit can immediately read and exfiltrate localStorage tokens." },
                  { question: "Explain how strict CSP nonce policies stop inline script injection.", answerHint: "Scripts only execute if their nonce matches the cryptographically signed server response header." }
                ],
                readingResource: "OWASP - Single Page Application Security Guidelines",
                completed: false
              }
            ]
          },
          {
            milestoneNumber: 4,
            title: "UI Architecture Bar-Raiser & Executive Calibration",
            weekSpan: "Weeks 7 - 8",
            objective: "Deliver high-conviction trade-off justifications and defend architecture decisions.",
            topics: [
              {
                id: "m4-t1",
                stepNumber: 13,
                title: "90-Minute Timed Frontend Machine Coding Gauntlet",
                isRevision: false,
                keyConcepts: "Clean separation of concerns, accessibility (a11y ARIA), zero dependencies, edge case handling",
                practiceTask: "Code an autocomplete search dropdown with keyboard navigation and debounce under 60 minutes",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "How do you make an autocomplete dropdown fully accessible to screen readers?", answerHint: "Implement WAI-ARIA 1.2 Combobox pattern: aria-expanded, aria-activedescendant, role=listbox." },
                  { question: "Explain debouncing vs throttling with leading and trailing execution edge cases.", answerHint: "Throttle limits execution frequency; debounce delays execution until quiet period." }
                ],
                readingResource: "WAI-ARIA Authoring Practices Guide - Combobox Pattern",
                completed: false
              },
              {
                id: "m4-t2",
                stepNumber: 14,
                title: "Design System Architecture & Headless Component Primitives",
                isRevision: false,
                keyConcepts: "Headless UI patterns, polymorphic components (as prop), CSS variables theming, zero-runtime styling",
                practiceTask: "Architect a production-grade design system component library with theme tokens",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "What are the engineering advantages of Headless UI libraries over styled UI kits?", answerHint: "Separates complex state and accessibility logic from visual styling; enables full branding customization." },
                  { question: "Explain how CSS variables enable zero-rerender dark mode switching.", answerHint: "Toggling root HTML attributes swaps token values directly on GPU layers without React tree rerender." }
                ],
                readingResource: "Robin Rendle - System Design for Front-End Engineers",
                completed: false
              },
              {
                id: "m4-t3",
                stepNumber: 15,
                title: "Front-End System Design: High-Scale Collaborative Canvas (Figma/Miro)",
                isRevision: false,
                keyConcepts: "Canvas vs SVG, spatial indexing (R-Tree/QuadTree), view frustum culling, delta sync",
                practiceTask: "Design the end-to-end architecture for a live collaborative whiteboarding platform",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "Why does DOM-based rendering fail when visualizing 100,000 interactive canvas nodes?", answerHint: "DOM tree layout recalculation and memory overhead; use HTML5 Canvas or WebGL with spatial index culling." },
                  { question: "How do you handle panning and zooming without recalculating all element boundaries?", answerHint: "Use transformation matrix multiplication on the root viewport context." }
                ],
                readingResource: "Figma Engineering Blog - WebGL and Collaborative Real-Time Architecture",
                completed: false
              },
              {
                id: "m4-t4",
                stepNumber: 16,
                title: "Staff-Level Architectural Trade-Off Defense & Hiring Rubrics",
                isRevision: false,
                keyConcepts: "SSR vs SSG vs ISR vs Client Hydration, streaming HTML with Suspense, defending decisions",
                practiceTask: "Conduct full bar-raiser mock interview defending architecture against Staff Engineers",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "How does React 18 Selective Hydration solve the all-or-nothing hydration bottleneck?", answerHint: "Suspense boundaries allow streaming HTML chunks and prioritize user-interacted sections for hydration." },
                  { question: "Defend why your team should migrate or NOT migrate to Next.js App Router.", answerHint: "Articulate realistic trade-offs: server action ergonomics vs deployment lock-in and debugging complexity." }
                ],
                readingResource: "Dan Abramov - The Two Reacts: Architecture and Mental Models",
                completed: false
              }
            ]
          }
        ]
      : [
          {
            milestoneNumber: 1,
            title: "Core Language Mechanics, Memory Model & Concurrency Deep Dive",
            weekSpan: "Weeks 1 - 2",
            objective: "Master thread safety, Java/JVM memory model, lock-free structures, and low-level mechanics.",
            topics: [
              {
                id: "m1-t1",
                stepNumber: 1,
                title: "Java Memory Model (JMM), Happens-Before & Volatile Semantics",
                isRevision: skillsLower.includes("java"),
                keyConcepts: "CPU cache coherence (MESI), CPU instruction reordering, memory barriers, volatile read/write semantics",
                practiceTask: "Build a high-performance thread-safe double-checked singleton and verify zero race conditions under 1,000 threads",
                estimatedHours: 12,
                interviewQuestions: [
                  { question: "Why does Double-Checked Locking fail without volatile in Java?", answerHint: "Instruction reordering allows the reference to be assigned before constructor execution finishes; volatile enforces happens-before relationship." },
                  { question: "Explain the difference between write barriers and read barriers at CPU level.", answerHint: "Write barriers flush CPU store buffers; read barriers invalidate stale CPU cache lines." }
                ],
                readingResource: "JSR-133: Java Memory Model and Thread Specification",
                completed: false
              },
              {
                id: "m1-t2",
                stepNumber: 2,
                title: "Thread Pools, Work-Stealing & ExecutorService Lifecycle",
                isRevision: skillsLower.includes("java") || skillsLower.includes("spring"),
                keyConcepts: "ThreadPoolExecutor core/max sizing, task queuing (LinkedBlockingQueue vs SynchronousQueue), rejection policies, WorkStealingPool",
                practiceTask: "Implement a custom ThreadPool with bounded queues, dynamic worker scaling, and custom saturation rejection telemetry",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "Why does Executors.newFixedThreadPool() risk OutOfMemoryError in production?", answerHint: "It uses an unbounded LinkedBlockingQueue which grows indefinitely under sustained spikes." },
                  { question: "How does ForkJoinPool work-stealing algorithm prevent thread idle time?", answerHint: "Idle worker threads steal tasks from the tail of deque queues owned by busy threads." }
                ],
                readingResource: "Brian Goetz - Java Concurrency in Practice (Chapter 8)",
                completed: false
              },
              {
                id: "m1-t3",
                stepNumber: 3,
                title: "Lock-Free Programming, CAS & Atomic Variables",
                isRevision: false,
                keyConcepts: "Hardware CMPXCHG instruction, ABA problem, AtomicStampedReference, LongAdder cell striping under high contention",
                practiceTask: "Implement a high-throughput lock-free ring buffer (Disruptor pattern) benchmarking 10 million ops/sec",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "Why does LongAdder significantly outperform AtomicLong under high write concurrency?", answerHint: "LongAdder distributes updates across internal Cell array cells to eliminate bus lock contention." },
                  { question: "What is the ABA problem in CAS operations and how is it mitigated?", answerHint: "A value changes from A to B and back to A; resolved using version stamps via AtomicStampedReference." }
                ],
                readingResource: "LMAX Disruptor Architecture Paper - Martin Fowler & Mike Barker",
                completed: false
              },
              {
                id: "m1-t4",
                stepNumber: 4,
                title: "JVM Garbage Collection Internals & Latency Profiling",
                isRevision: skillsLower.includes("java"),
                keyConcepts: "Generational hypothesis, G1GC mixed collection, ZGC colored pointers & load barriers, escape analysis",
                practiceTask: "Profile a Spring Boot service with async profiler, identify memory allocation hotspots, and reduce GC pauses under 5ms",
                estimatedHours: 12,
                interviewQuestions: [
                  { question: "How does ZGC achieve sub-millisecond maximum pause times even on multi-terabyte heaps?", answerHint: "Performs marking, relocation, and compaction concurrently with application threads using colored pointers and load barriers." },
                  { question: "Explain what happens during a Stop-The-World (STW) pause in G1GC.", answerHint: "All application mutator threads are brought to safepoints to ensure heap reference consistency." }
                ],
                readingResource: "OpenJDK ZGC Architecture Guide & JVM Safepoint Internals",
                completed: false
              }
            ]
          },
          {
            milestoneNumber: 2,
            title: "Low-Level Design (LLD), Machine Coding & Clean Architecture",
            weekSpan: "Weeks 3 - 4",
            objective: "Master writing clean, concurrency-safe, test-driven Java code under strict 90-minute timers.",
            topics: [
              {
                id: "m2-t1",
                stepNumber: 5,
                title: "SOLID Principles & Clean Domain Modeling (LLD)",
                isRevision: skillsLower.includes("oop") || skillsLower.includes("design"),
                keyConcepts: "Single Responsibility, Open-Closed via Strategy/Factory, Interface Segregation, Domain-Driven Design aggregates",
                practiceTask: "Refactor a monolithic invoice service into a clean extensible strategy-driven architecture with 100% unit tests",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "How do you enforce Open-Closed Principle when adding new payment providers (Razorpay, Stripe)?", answerHint: "Define a PaymentGateway SPI interface and register implementations via Spring dependency injection registry." },
                  { question: "Explain Dependency Inversion Principle vs Dependency Injection.", answerHint: "DIP is the architectural principle that high-level modules should depend on abstractions; DI is the creational pattern realizing it." }
                ],
                readingResource: "Robert C. Martin - Clean Architecture: A Craftsman's Guide",
                completed: false
              },
              {
                id: "m2-t2",
                stepNumber: 6,
                title: "Thread-Safe In-Memory Key-Value Store with TTL & Eviction",
                isRevision: false,
                keyConcepts: "ConcurrentHashMap segmented locking, doubly-linked list for O(1) LRU/LFU, active vs passive TTL expiration",
                practiceTask: "Build an in-memory key-value cache with LRU eviction and thread-safe background expiry in 90 minutes",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "How do you design O(1) eviction for Least Frequently Used (LFU) cache?", answerHint: "Use two hash maps: one mapping keys to nodes, and another mapping frequencies to doubly-linked lists." },
                  { question: "How does ConcurrentHashMap achieve high concurrency without locking the entire table?", answerHint: "Uses CAS for bucket insertions and synchronizes only on the head node of a hash bucket." }
                ],
                readingResource: "Doug Lea - ConcurrentHashMap Internals & Segment Locking",
                completed: false
              },
              {
                id: "m2-t3",
                stepNumber: 7,
                title: "Distributed Sliding-Window Rate Limiter (Token Bucket / Lua)",
                isRevision: skillsLower.includes("redis"),
                keyConcepts: "Token Bucket vs Leaky Bucket vs Sliding Window Log, Redis Lua atomic script execution, HTTP 429 Retry-After",
                practiceTask: "Implement a distributed sliding-window rate limiter using Redis Lua handling 10,000 requests/sec with zero drift",
                estimatedHours: 15,
                interviewQuestions: [
                  { question: "Why does a naive Redis GET then INCR rate-limiting approach cause race conditions?", answerHint: "Non-atomic check-then-act allows multiple concurrent threads to exceed threshold; solve with atomic Lua script execution." },
                  { question: "Compare Token Bucket vs Sliding Window Counter for bursty traffic.", answerHint: "Token Bucket allows configured bursts while enforcing steady rate; Sliding Window Counter strictly smooths request density." }
                ],
                readingResource: "Stripe Engineering Blog - Scaling rate limiters with Redis and token buckets",
                completed: false
              },
              {
                id: "m2-t4",
                stepNumber: 8,
                title: "Idempotent Financial Webhook Processing & State Machines",
                isRevision: skillsLower.includes("rest") || skillsLower.includes("spring"),
                keyConcepts: "HMAC-SHA256 signature verification, idempotency keys, SELECT FOR UPDATE row locks, finite state machine transitions",
                practiceTask: "Build an idempotent webhook processing engine handling 5,000 duplicate requests/sec with zero double-credits",
                estimatedHours: 15,
                interviewQuestions: [
                  { question: "How do you guarantee that a webhook callback arriving simultaneously from 3 network retries executes only once?", answerHint: "Insert unique idempotency key with unique constraint; use optimistic locking or row-level lock on account record." },
                  { question: "What is the difference between at-least-once and exactly-once processing in payment state transitions?", answerHint: "At-least-once accepts duplicates and relies on deterministic state transitions to ensure idempotent state mutation." }
                ],
                readingResource: "Brandur Leach - Designing Robust and Idempotent APIs with Transactional Outboxes",
                completed: false
              }
            ]
          },
          {
            milestoneNumber: 3,
            title: "Database Internals, Query Optimization & Distributed Caching",
            weekSpan: "Weeks 5 - 6",
            objective: "Design fault-tolerant storage, cache-aside strategies, and event streaming pipelines.",
            topics: [
              {
                id: "m3-t1",
                stepNumber: 9,
                title: "B+Tree Indexes, Composite Index Selectivity & EXPLAIN ANALYZE",
                isRevision: skillsLower.includes("sql") || skillsLower.includes("mysql") || skillsLower.includes("postgres"),
                keyConcepts: "B+Tree node splits, leftmost prefix rule, index covering scans, temporary table elimination, cardinality",
                practiceTask: "Analyze slow queries on a 10-million row database, optimize composite indexes, and reduce latency from 800ms to 4ms",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "Why does placing a low-cardinality column first in a composite index hurt performance?", answerHint: "Leftmost prefix rule requires high selectivity at leading columns to eliminate maximum rows during B+Tree traversal." },
                  { question: "Explain what 'Using filesort' and 'Using index' mean in MySQL EXPLAIN plan output.", answerHint: "'Using filesort' indicates external sorting outside index; 'Using index' means covering index satisfied query without table row lookup." }
                ],
                readingResource: "Markus Winand - Use The Index, Luke! A Guide to Database Performance",
                completed: false
              },
              {
                id: "m3-t2",
                stepNumber: 10,
                title: "Transaction Isolation Levels, MVCC & Deadlock Prevention",
                isRevision: skillsLower.includes("sql") || skillsLower.includes("mysql"),
                keyConcepts: "Read Committed vs Repeatable Read, Multi-Version Concurrency Control (MVCC) undo logs, gap locks, next-key locks",
                practiceTask: "Simulate phantom reads and deadlocks under concurrent transactions and write deadlock-free update procedures",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "How does MySQL InnoDB prevent phantom reads in Repeatable Read isolation level?", answerHint: "Uses next-key locks (combining record lock and gap lock) to prevent other transactions from inserting into scanned range." },
                  { question: "What causes a deadlock during concurrent UPDATE statements on secondary indexes?", answerHint: "Transactions acquire locks on secondary index and primary clustered index in opposite orders; fix by acquiring locks in deterministic sequence." }
                ],
                readingResource: "MySQL 8.0 Reference Manual - InnoDB Multi-Versioning & Locking Details",
                completed: false
              },
              {
                id: "m3-t3",
                stepNumber: 11,
                title: "Cache-Aside Patterns, Mutex Invalidation & Cache Stampede",
                isRevision: skillsLower.includes("redis"),
                keyConcepts: "Cache-Aside vs Write-Through, cache stampede (thundering herd), probabilistic early expiration (XFetch), TTL jitter",
                practiceTask: "Implement a resilient Redis cache-aside layer with distributed mutex locks and benchmark under 10,000 concurrent threads",
                estimatedHours: 14,
                interviewQuestions: [
                  { question: "What is cache stampede and how does probabilistic early expiration solve it?", answerHint: "When a hot key expires, thousands of threads query the database simultaneously; XFetch algorithm recomputes cache before actual expiry." },
                  { question: "Should you delete or update a cache entry when database writes succeed?", answerHint: "Delete cache entry to avoid race conditions with concurrent database read-write threads." }
                ],
                readingResource: "VLDB Research Paper - Optimal Probabilistic Cache Expiration (XFetch Algorithm)",
                completed: false
              },
              {
                id: "m3-t4",
                stepNumber: 12,
                title: "Database Sharding, Consistent Hashing & Read-Replicas",
                isRevision: false,
                keyConcepts: "Horizontal sharding keys, virtual nodes in consistent hashing, replication lag mitigation, dual-write challenges",
                practiceTask: "Design a sharded customer database routing queries across 4 database instances with consistent hash ring",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "How do you avoid hot-spotting when sharding by customer_id or created_at timestamp?", answerHint: "Timestamp sharding routes all current writes to the latest shard; combine tenant_id with hash prefix to distribute writes." },
                  { question: "How do you handle read-your-own-writes consistency when using asynchronous read-replicas?", answerHint: "Route queries from recently writing users to primary master database for the duration of replication lag window." }
                ],
                readingResource: "AWS DynamoDB Architecture & Consistent Hashing Papers",
                completed: false
              }
            ]
          },
          {
            milestoneNumber: 4,
            title: "Event-Driven Systems, High-Level Architecture (HLD) & Scale",
            weekSpan: "Weeks 7 - 8",
            objective: "Architect fault-tolerant systems handling multi-region failover and distributed transactions.",
            topics: [
              {
                id: "m4-t1",
                stepNumber: 13,
                title: "Apache Kafka Architecture: Partitions, Offsets & Consumer Lag",
                isRevision: skillsLower.includes("kafka"),
                keyConcepts: "Commit log internals, partition key distribution, at-least-once delivery, consumer group cooperative rebalance",
                practiceTask: "Build a high-volume event processing pipeline with partition-keyed ordering, dead letter queues (DLQs), and auto-recovery",
                estimatedHours: 18,
                interviewQuestions: [
                  { question: "What happens when a Kafka consumer triggers a group rebalance in a high-throughput cluster?", answerHint: "Partitions are revoked and reassigned; Cooperative Sticky Assignor minimizes stop-the-world partition transfer." },
                  { question: "How do you guarantee strictly ordered message processing across multiple partitions in Kafka?", answerHint: "Messages within a single partition are ordered; route related events with identical partition keys." }
                ],
                readingResource: "Jay Kreps - Questioning the Lambda Architecture & The Log",
                completed: false
              },
              {
                id: "m4-t2",
                stepNumber: 14,
                title: "Transactional Outbox Pattern & Change Data Capture (CDC)",
                isRevision: false,
                keyConcepts: "Dual-write failure modes, outbox table in local DB transaction, Debezium CDC via MySQL binlog, zero message loss",
                practiceTask: "Implement the Transactional Outbox pattern with MySQL and Kafka with zero dual-write inconsistency",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "Why is executing a database commit and then publishing to Kafka in the same method dangerous?", answerHint: "Application crashes after DB commit but before Kafka send cause silent message loss (dual-write problem)." },
                  { question: "How does Debezium read changes from MySQL without impacting application query latency?", answerHint: "Streams committed changes directly from the MySQL binary log asynchronously without query locks." }
                ],
                readingResource: "Microservices.io - Transactional Outbox Pattern by Chris Richardson",
                completed: false
              },
              {
                id: "m4-t3",
                stepNumber: 15,
                title: "Distributed Transactions: Saga Orchestration & Resilience4j",
                isRevision: false,
                keyConcepts: "Two-Phase Commit (2PC) bottlenecks, Saga orchestration vs choreography, compensating transactions, Circuit Breakers",
                practiceTask: "Implement a multi-service order saga with rollback compensations and Resilience4j circuit breakers",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "Why is Two-Phase Commit (2PC) rarely used in cloud-scale microservice architectures?", answerHint: "2PC is blocking and holds locks across all participants; network partitions cause coordinator stall and cascading timeouts." },
                  { question: "How do you design a compensating transaction when an intermediate step cannot be physically undone?", answerHint: "Use forward recovery with alerts or design semantic reversals (e.g. refunding money rather than canceling shipped items)." }
                ],
                readingResource: "Caitie McCaffrey - Applying the Saga Pattern to Distributed Microservices",
                completed: false
              },
              {
                id: "m4-t4",
                stepNumber: 16,
                title: "Multi-Region System Design, CAP Trade-Offs & Bar-Raiser Defense",
                isRevision: false,
                keyConcepts: "Active-Active multi-datacenter topology, conflict resolution (CRDT/LWW), back-of-the-envelope math, live failure defense",
                practiceTask: "Defend an end-to-end design for a global ride-hailing or payment dispatcher against Staff Engineers",
                estimatedHours: 16,
                interviewQuestions: [
                  { question: "Design a globally distributed payment platform handling 50,000 TPS with sub-100ms response time.", answerHint: "Structure back-of-envelope math, choose AP vs CP boundary per service, discuss ledger reconciliation and active-active DB clustering." },
                  { question: "How do you resolve conflicting concurrent writes to the same account across US and EU data centers?", answerHint: "Discuss vector clocks, CRDTs, or pinning account writes to a primary geographic home shard." }
                ],
                readingResource: "Designing Data-Intensive Applications (DDIA) - Martin Kleppmann (Chapters 7-9)",
                completed: false
              }
            ]
          }
        ];

    return {
      id: "quest-" + Date.now(),
      targetRole: target,
      targetCompensation: data.targetCompensation || "₹34 - 48 LPA",
      targetTimelineWeeks: weeks,
      overallScore: 84,
      overallProgress: 0,
      roadmapData: {
        feasibility: {
          status: "REALISTIC",
          score: 84,
          verdict: `High-conviction trajectory mapped to ${target}. Complete all 16 progressive milestones.`,
          gapSeverity: "MODERATE",
          reasons: [
            `Target role demands verifiable depth in low-level concurrency, storage indexing, and event-driven distributed systems.`,
            `A ${weeks}-week timeline is realistic with 15-20 hours/week dedicated to hands-on machine coding and system design defense.`
          ],
          suggestedAdjustment: {
            recommendedRole: target,
            recommendedWeeks: weeks,
            actionableNote: "Master the first 8 topics (concurrency and LLD) before taking live system design interviews."
          }
        },
        readiness: {
          overallScore: 84,
          verdict: `High-conviction trajectory mapped to ${target}. Focus on distributed systems and concurrency.`,
          marketDemand: "VERY_HIGH",
          estimatedWeeks: weeks,
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
      if (res.data) {
        setRoadmap(res.data);
        try {
          localStorage.setItem("crackit:active_roadmap", JSON.stringify(res.data));
        } catch (e) {
          console.warn("Could not cache to localStorage", e);
        }
      }
    } catch (err) {
      console.warn("Backend synthesis call delayed or cold-starting; engaging instant calibrated roadmap synthesis", err);
      const fallback = buildClientFallbackRoadmap(payload);
      setRoadmap(fallback);
      try {
        localStorage.setItem("crackit:active_roadmap", JSON.stringify(fallback));
      } catch (e) {
        console.warn("Could not cache fallback to localStorage", e);
      }
      try {
        api.post("/api/roadmap/save", fallback).then((saveRes) => {
          if (saveRes?.data) {
            setRoadmap(saveRes.data);
            try {
              localStorage.setItem("crackit:active_roadmap", JSON.stringify(saveRes.data));
            } catch (ignored) {}
          }
        }).catch(e => console.warn("Failed to persist fallback roadmap to backend", e));
      } catch (e) {}
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
    const nextCompleted = !currentCompleted;

    // Optimistically update local state & localStorage
    const updated = JSON.parse(JSON.stringify(roadmap));
    let totalTopics = 0;
    let completedTopics = 0;

    (updated.roadmapData?.milestones || []).forEach((m) => {
      (m.topics || []).forEach((t) => {
        if (t.id === topicId) {
          t.completed = nextCompleted;
        }
        totalTopics++;
        if (t.completed) completedTopics++;
      });
    });

    const newProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    updated.overallProgress = newProgress;

    setRoadmap(updated);
    try {
      localStorage.setItem("crackit:active_roadmap", JSON.stringify(updated));
    } catch (e) {}

    try {
      if (roadmap.id && !roadmap.id.startsWith("quest-")) {
        const res = await api.post(
          `/api/roadmap/${roadmap.id}/topics/${topicId}/progress?completed=${nextCompleted}`
        );
        if (res.data) {
          setRoadmap(res.data);
          try {
            localStorage.setItem("crackit:active_roadmap", JSON.stringify(res.data));
          } catch (e) {}
        }
      } else {
        const res = await api.post("/api/roadmap/save", updated);
        if (res.data) {
          setRoadmap(res.data);
          try {
            localStorage.setItem("crackit:active_roadmap", JSON.stringify(res.data));
          } catch (e) {}
        }
      }
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
            <div>
              {/* View Mode Toggle Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 24,
                  background: "#ffffff",
                  padding: "12px 18px",
                  borderRadius: 18,
                  border: "1.5px solid #ede9fe",
                  boxShadow: "0 2px 10px rgba(124, 58, 237, 0.04)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "rgba(124, 58, 237, 0.1)",
                      color: "#7c3aed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18
                    }}
                  >
                    <i className="ti ti-layout-list" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "#1a1040" }}>
                      Curriculum View Mode
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Switch between complete syllabus breakdown and interactive milestone trail
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    background: "#f5f3ff",
                    padding: 3,
                    borderRadius: 12,
                    border: "1px solid #ddd6fe"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setJourneyViewMode("syllabus")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: journeyViewMode === "syllabus" ? "#7c3aed" : "transparent",
                      color: journeyViewMode === "syllabus" ? "#ffffff" : "#6d28d9",
                      fontWeight: 800,
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: journeyViewMode === "syllabus" ? "0 2px 8px rgba(124, 58, 237, 0.3)" : "none",
                      transition: "all 0.15s"
                    }}
                  >
                    <i className="ti ti-books" />
                    Progressive Syllabus (All 16 Topics)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJourneyViewMode("milestone")}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: journeyViewMode === "milestone" ? "#7c3aed" : "transparent",
                      color: journeyViewMode === "milestone" ? "#ffffff" : "#6d28d9",
                      fontWeight: 800,
                      fontSize: 12.5,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: journeyViewMode === "milestone" ? "0 2px 8px rgba(124, 58, 237, 0.3)" : "none",
                      transition: "all 0.15s"
                    }}
                  >
                    <i className="ti ti-route" />
                    Milestone Trail & Station Figure
                  </button>
                </div>
              </div>

              {journeyViewMode === "syllabus" ? (
                /* ─── FULL 16-TOPIC PROGRESSIVE SYLLABUS VIEW ─── */
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  {milestones.map((m, mIdx) => {
                    const mTopics = m.topics || [];
                    const mDoneCount = mTopics.filter((t) => t.completed).length;
                    const isMComplete = mTopics.length > 0 && mDoneCount === mTopics.length;

                    return (
                      <div
                        key={mIdx}
                        style={{
                          background: "#ffffff",
                          borderRadius: 22,
                          border: isMComplete ? "1.5px solid #86efac" : "1.5px solid #ede9fe",
                          padding: "24px 26px",
                          boxShadow: "0 6px 20px rgba(124, 58, 237, 0.05)"
                        }}
                      >
                        {/* Milestone Phase Header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12,
                            paddingBottom: 16,
                            marginBottom: 20,
                            borderBottom: "1px solid #f1f5f9"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                              <span
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  background: isMComplete ? "#dcfce7" : "#ede9fe",
                                  color: isMComplete ? "#15803d" : "#6d28d9",
                                  textTransform: "uppercase"
                                }}
                              >
                                {m.weekSpan || `Phase ${mIdx + 1}`}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>
                                {mDoneCount}/{mTopics.length} Topics Mastered
                              </span>
                            </div>
                            <h3 style={{ fontSize: 19, fontWeight: 800, color: "#1a1040", margin: "0 0 4px" }}>
                              {m.title}
                            </h3>
                            {m.objective && (
                              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                                🎯 <strong>Objective:</strong> {m.objective}
                              </p>
                            )}
                          </div>

                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: isMComplete ? "#dcfce7" : "#f5f3ff",
                              color: isMComplete ? "#15803d" : "#7c3aed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 900,
                              fontSize: 15
                            }}
                          >
                            {isMComplete ? "✓" : mIdx + 1}
                          </div>
                        </div>

                        {/* Topics List within Phase */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {mTopics.map((topic, tIdx) => {
                            const isDone = !!topic.completed;
                            const globalStep = topic.stepNumber || mIdx * 4 + tIdx + 1;
                            return (
                              <div
                                key={topic.id || tIdx}
                                style={{
                                  background: isDone ? "#fafafa" : "#fcfbfe",
                                  borderRadius: 16,
                                  border: isDone ? "1px solid #e2e8f0" : "1.5px solid #ede9fe",
                                  padding: "18px 20px",
                                  transition: "all 0.15s"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                  {/* Completion Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTopic(topic.id, isDone)}
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 8,
                                      background: isDone ? "#10b981" : "#ffffff",
                                      border: isDone ? "none" : "2px solid #cbd5e1",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#fff",
                                      fontSize: 15,
                                      cursor: "pointer",
                                      marginTop: 2,
                                      flexShrink: 0,
                                      transition: "all 0.15s"
                                    }}
                                  >
                                    {isDone && <i className="ti ti-check" />}
                                  </button>

                                  <div style={{ flex: 1 }}>
                                    {/* Topic Meta Header */}
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        flexWrap: "wrap",
                                        marginBottom: 6
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span
                                          style={{
                                            padding: "2px 8px",
                                            borderRadius: 6,
                                            fontSize: 11,
                                            fontWeight: 900,
                                            background: "#1e1b4b",
                                            color: "#e0e7ff"
                                          }}
                                        >
                                          Step {globalStep}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: 16,
                                            fontWeight: 800,
                                            color: isDone ? "#64748b" : "#1a1040",
                                            textDecoration: isDone ? "line-through" : "none"
                                          }}
                                        >
                                          {topic.title}
                                        </span>
                                      </div>

                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span
                                          style={{
                                            padding: "2px 8px",
                                            borderRadius: 99,
                                            fontSize: 10.5,
                                            fontWeight: 800,
                                            background: topic.isRevision ? "#fef3c7" : "#ede9fe",
                                            color: topic.isRevision ? "#b45309" : "#6d28d9",
                                            textTransform: "uppercase"
                                          }}
                                        >
                                          {topic.isRevision ? "Known Stack Revision" : "Core Skill Delta"}
                                        </span>
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8" }}>
                                          ⏱️ {topic.estimatedHours || 12} hrs
                                        </span>
                                      </div>
                                    </div>

                                    {/* Key Architecture Concepts */}
                                    {topic.keyConcepts && (
                                      <div style={{ fontSize: 13, color: "#475569", margin: "6px 0 10px", lineHeight: 1.5 }}>
                                        <strong>Architecture Concepts:</strong> {topic.keyConcepts}
                                      </div>
                                    )}

                                    {/* Hands-on Drill / Task */}
                                    {topic.practiceTask && (
                                      <div
                                        style={{
                                          background: "#f0fdf4",
                                          borderRadius: 10,
                                          padding: "9px 13px",
                                          border: "1px solid #bbf7d0",
                                          fontSize: 12.5,
                                          color: "#166534",
                                          marginBottom: 10,
                                          lineHeight: 1.45
                                        }}
                                      >
                                        <strong>🛠️ Hands-on Drill:</strong> {topic.practiceTask}
                                      </div>
                                    )}

                                    {/* Expected Interview Questions with Revealable Talking Points */}
                                    {Array.isArray(topic.interviewQuestions) && topic.interviewQuestions.length > 0 && (
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
                                        <div
                                          style={{
                                            fontWeight: 700,
                                            color: "#475569",
                                            marginBottom: 8,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6
                                          }}
                                        >
                                          <i className="ti ti-target" style={{ color: "#7c3aed" }} />
                                          Expected High-Frequency Interview Questions:
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                          {topic.interviewQuestions.map((iq, qIdx) => {
                                            const qKey = `syl-${topic.id || tIdx}-q-${qIdx}`;
                                            const showHint = !!expandedHints[qKey];
                                            return (
                                              <div
                                                key={qIdx}
                                                style={{
                                                  background: "#fff",
                                                  borderRadius: 8,
                                                  padding: "8px 10px",
                                                  border: "1px solid #e2e8f0"
                                                }}
                                              >
                                                <div style={{ fontWeight: 600, color: "#1e293b", fontStyle: "italic" }}>
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
                                                        background: "none",
                                                        border: "none",
                                                        color: "#7c3aed",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        padding: 0,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4
                                                      }}
                                                    >
                                                      <i className={`ti ${showHint ? "ti-chevron-up" : "ti-chevron-down"}`} />
                                                      {showHint ? "Hide Talking Points" : "💡 Show Answer Talking Points & Trade-offs"}
                                                    </button>
                                                    {showHint && (
                                                      <div
                                                        style={{
                                                          marginTop: 6,
                                                          fontSize: 11.5,
                                                          color: "#475569",
                                                          lineHeight: 1.45,
                                                          background: "#faf5ff",
                                                          padding: "6px 10px",
                                                          borderRadius: 6,
                                                          borderLeft: "3px solid #7c3aed"
                                                        }}
                                                      >
                                                        {iq.answerHint}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Recommended Reference */}
                                    {topic.readingResource && (
                                      <div style={{ fontSize: 11.5, color: "#64748b", marginBottom: 10 }}>
                                        📖 <strong>Recommended Reference:</strong> {topic.readingResource}
                                      </div>
                                    )}

                                    {/* Action button: AI mock interview */}
                                    <button
                                      type="button"
                                      onClick={() => navigate("/interviews", { state: { initialTopic: topic.title } })}
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: 10,
                                        background: "#f5f3ff",
                                        border: "1px solid #ddd6fe",
                                        color: "#7c3aed",
                                        fontSize: 12,
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
                    );
                  })}
                </div>
              ) : (
                /* ─── MILESTONE TRAIL VIEW ─── */
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
