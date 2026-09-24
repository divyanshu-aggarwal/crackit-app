package com.crackit.roadmap.service;

import com.crackit.ai.client.AiServiceClient;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.resume.entity.Skill;
import com.crackit.resume.repository.SkillRepository;
import com.crackit.roadmap.dto.GenerateRoadmapRequest;
import com.crackit.roadmap.dto.RoadmapResponse;
import com.crackit.roadmap.entity.CareerRoadmap;
import com.crackit.roadmap.enums.RoadmapStatus;
import com.crackit.roadmap.repository.CareerRoadmapRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoadmapService {

    private final CareerRoadmapRepository roadmapRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public RoadmapResponse generateRoadmap(GenerateRoadmapRequest request) {
        String email = AuthUtil.getLoggedInUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If currentSkills not provided in request, infer from candidate's master skills profile
        List<String> skills = request.getCurrentSkills();
        if (skills == null || skills.isEmpty()) {
            List<Skill> userSkills = skillRepository.findByUserId(user.getId());
            skills = userSkills.stream().map(Skill::getSkillName).toList();
        }

        String effectiveCurrentRole = (request.getCurrentRole() != null && !request.getCurrentRole().isBlank())
                ? request.getCurrentRole()
                : (user.getCurrentRole() != null && !user.getCurrentRole().isBlank() ? user.getCurrentRole() : "Software Engineer");

        Double effectiveYoe = request.getYearsOfExperience() != null
                ? request.getYearsOfExperience()
                : (user.getYearsExperience() != null ? user.getYearsExperience().doubleValue() : 2.0);

        String effectiveCurrentComp = (request.getCurrentCompensation() != null && !request.getCurrentCompensation().isBlank())
                ? request.getCurrentCompensation()
                : (user.getCurrentCtc() != null && !user.getCurrentCtc().isBlank() ? user.getCurrentCtc() : "Market standard");

        String effectiveTargetRole = (request.getTargetRole() != null && !request.getTargetRole().isBlank())
                ? request.getTargetRole()
                : (user.getTargetRole() != null && !user.getTargetRole().isBlank() ? user.getTargetRole() : "Senior Software Engineer");

        String effectiveTargetComp = (request.getTargetCompensation() != null && !request.getTargetCompensation().isBlank())
                ? request.getTargetCompensation()
                : (user.getExpectedCtc() != null && !user.getExpectedCtc().isBlank() ? user.getExpectedCtc() : "Competitive Top-of-Market");

        Map<String, Object> payload = new HashMap<>();
        payload.put("current_role", effectiveCurrentRole);
        payload.put("years_of_experience", effectiveYoe);
        payload.put("current_skills", skills);
        payload.put("current_compensation", effectiveCurrentComp);
        payload.put("target_role", effectiveTargetRole);
        payload.put("target_compensation", effectiveTargetComp);
        payload.put("target_timeline_weeks", request.getTargetTimelineWeeks() != null ? request.getTargetTimelineWeeks() : 8);
        payload.put("target_company_types", request.getTargetCompanyTypes() != null ? request.getTargetCompanyTypes() : List.of("Product Startups", "Unicorns", "Top Tech MNCs"));

        log.info("Generating Career Prep Roadmap for user '{}', Target: '{}'", email, effectiveTargetRole);
        Map<String, Object> roadmapData;
        try {
            roadmapData = aiServiceClient.generateRoadmap(payload);
            if (roadmapData == null || roadmapData.isEmpty() || !roadmapData.containsKey("milestones")) {
                throw new RuntimeException("Empty or malformed roadmap returned by AI service");
            }
        } catch (Exception e) {
            log.warn("AI service call failed or timed out: {}. Generating high-fidelity calibrated roadmap.", e.getMessage());
            roadmapData = generateDynamicFallback(request, skills);
        }

        // Archive previous active roadmaps for this user
        roadmapRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), RoadmapStatus.ACTIVE)
                .ifPresent(prev -> {
                    prev.setStatus(RoadmapStatus.ARCHIVED);
                    roadmapRepository.save(prev);
                });

        Integer overallScore = 75;
        if (roadmapData.get("readiness") instanceof Map<?, ?> readiness) {
            Object scoreObj = readiness.get("overallScore");
            if (scoreObj instanceof Number number) {
                overallScore = number.intValue();
            }
        }

        String roadmapJson;
        try {
            roadmapJson = objectMapper.writeValueAsString(roadmapData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize roadmap data", e);
        }

        String companyTypesStr = request.getTargetCompanyTypes() != null
                ? String.join(", ", request.getTargetCompanyTypes())
                : "Product Startups, Unicorns";

        CareerRoadmap roadmap = CareerRoadmap.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .currentRole(request.getCurrentRole())
                .yearsOfExperience(request.getYearsOfExperience())
                .targetRole(request.getTargetRole())
                .targetCompensation(request.getTargetCompensation())
                .targetTimelineWeeks(request.getTargetTimelineWeeks() != null ? request.getTargetTimelineWeeks() : 8)
                .targetCompanyTypes(companyTypesStr)
                .overallScore(overallScore)
                .overallProgress(0)
                .roadmapJson(roadmapJson)
                .status(RoadmapStatus.ACTIVE)
                .build();

        CareerRoadmap saved = roadmapRepository.save(roadmap);
        return toResponse(saved, roadmapData);
    }

    @Transactional
    public RoadmapResponse saveCustomRoadmap(Map<String, Object> body) {
        String email = AuthUtil.getLoggedInUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> roadmapData = body;
        if (body.containsKey("roadmapData") && body.get("roadmapData") instanceof Map<?, ?> inner) {
            @SuppressWarnings("unchecked")
            Map<String, Object> casted = (Map<String, Object>) inner;
            roadmapData = casted;
        }

        String targetRole = (String) body.getOrDefault("targetRole", user.getTargetRole() != null ? user.getTargetRole() : "Senior Engineer");
        String targetComp = (String) body.getOrDefault("targetCompensation", user.getExpectedCtc() != null ? user.getExpectedCtc() : "35 LPA");
        Integer weeks = body.get("targetTimelineWeeks") instanceof Number n ? n.intValue() : 8;

        String roadmapJson;
        try {
            roadmapJson = objectMapper.writeValueAsString(roadmapData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize roadmap", e);
        }

        // Archive previous active
        roadmapRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), RoadmapStatus.ACTIVE)
                .ifPresent(prev -> {
                    prev.setStatus(RoadmapStatus.ARCHIVED);
                    roadmapRepository.save(prev);
                });

        CareerRoadmap roadmap = CareerRoadmap.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .currentRole(user.getCurrentRole())
                .yearsOfExperience(user.getYearsExperience() != null ? user.getYearsExperience().doubleValue() : 2.0)
                .targetRole(targetRole)
                .targetCompensation(targetComp)
                .targetTimelineWeeks(weeks)
                .overallScore(80)
                .overallProgress(0)
                .roadmapJson(roadmapJson)
                .status(RoadmapStatus.ACTIVE)
                .build();

        CareerRoadmap saved = roadmapRepository.save(roadmap);
        return toResponse(saved, roadmapData);
    }

    @Transactional(readOnly = true)
    public RoadmapResponse getCurrentRoadmap() {
        String email = AuthUtil.getLoggedInUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return roadmapRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), RoadmapStatus.ACTIVE)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public RoadmapResponse updateTopicProgress(String roadmapId, String topicId, boolean completed) {
        String email = AuthUtil.getLoggedInUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CareerRoadmap roadmap = roadmapRepository.findById(roadmapId)
                .orElseThrow(() -> new RuntimeException("Roadmap not found with id: " + roadmapId));

        if (!roadmap.getUserId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to roadmap");
        }

        Map<String, Object> roadmapData = parseJson(roadmap.getRoadmapJson());
        int totalTopics = 0;
        int completedTopics = 0;

        if (roadmapData.get("milestones") instanceof List<?> milestones) {
            for (Object mObj : milestones) {
                if (mObj instanceof Map<?, ?> milestone) {
                    if (milestone.get("topics") instanceof List<?> topics) {
                        for (Object tObj : topics) {
                            if (tObj instanceof Map<?, ?> topicMap) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> topic = (Map<String, Object>) topicMap;
                                totalTopics++;
                                if (topicId.equals(topic.get("id"))) {
                                    topic.put("completed", completed);
                                }
                                if (Boolean.TRUE.equals(topic.get("completed"))) {
                                    completedTopics++;
                                }
                            }
                        }
                    }
                }
            }
        }

        int newProgress = totalTopics > 0 ? (int) Math.round(((double) completedTopics / totalTopics) * 100) : 0;
        roadmap.setOverallProgress(newProgress);

        try {
            roadmap.setRoadmapJson(objectMapper.writeValueAsString(roadmapData));
        } catch (Exception e) {
            throw new RuntimeException("Failed to update roadmap progress", e);
        }

        CareerRoadmap saved = roadmapRepository.save(roadmap);
        return toResponse(saved, roadmapData);
    }

    public Map<String, Object> getSampleRoadmap() {
        // Pre-computed Staff-level interactive demo for the Landing Page
        return Map.of(
                "targetRole", "Senior Backend Engineer / Staff Architect",
                "targetCompensation", "₹35 - 45 LPA ($140k - $180k)",
                "targetTimelineWeeks", 8,
                "readiness", Map.of(
                        "overallScore", 78,
                        "verdict", "Strong architectural foundation; requires sharpening distributed concurrency & LLD machine coding.",
                        "marketDemand", "VERY_HIGH",
                        "salaryUpliftPotential", "2.5x - 3.2x"
                ),
                "skillGaps", Map.of(
                        "directGaps", List.of(
                                Map.of("skill", "Distributed Rate Limiting & Concurrency", "severity", "CRITICAL", "description", "Upgrading from basic filters to Redis Lua sliding window logs and token buckets."),
                                Map.of("skill", "Event-Driven Saga Orchestration", "severity", "HIGH", "description", "Handling dual-write consistency between relational DBs and Kafka.")
                        ),
                        "transferableStrengths", List.of(
                                Map.of("skill", "Spring Boot & REST API Design", "leverage", "Solid base for 90-min machine coding rounds.")
                        ),
                        "dealbreakersForTargetTier", List.of(
                                Map.of("topic", "Concurrency & Thread Safety under High QPS", "why", "Leading cause of rejection in Tier-1 LLD rounds.")
                        )
                ),
                "compatibleCompanies", List.of(
                        Map.of(
                                "companyName", "Razorpay / PhonePe",
                                "category", "Fintech Unicorn",
                                "matchScore", 92,
                                "whyMatched", "Heavy emphasis on transactional idempotency, distributed caching, and zero payment loss.",
                                "interviewRounds", List.of("90-min LLD Machine Coding", "High-Level Distributed Systems", "Bar-Raiser Cultural"),
                                "priorityTopics", List.of("Idempotent Webhooks", "Redis Lua Distributed Locks", "Database Sharding")
                        ),
                        Map.of(
                                "companyName", "Swiggy / Zepto",
                                "category", "High-Throughput Quick-Commerce",
                                "matchScore", 89,
                                "whyMatched", "Massive write concurrency, geospatial order dispatching, and sub-100ms API latency.",
                                "interviewRounds", List.of("Concurrency & Data Modeling", "Real-Time Tracking Architecture", "Managerial"),
                                "priorityTopics", List.of("Kafka Partitioning", "Redis GeoSets", "Cache-Aside Patterns")
                        )
                ),
                "milestones", List.of(
                        Map.of(
                                "milestoneNumber", 1,
                                "title", "Low-Level Design (LLD) & Concurrency Mastery",
                                "weekSpan", "Weeks 1 - 2",
                                "objective", "Master writing clean, concurrency-safe, test-driven Java code under a 90-minute timer.",
                                "topics", List.of(
                                        Map.of("id", "s-1", "title", "Thread Pools & Lock Contention", "keyConcepts", "ReentrantLock, synchronized, Atomic variables", "completed", true),
                                        Map.of("id", "s-2", "title", "Distributed Rate Limiter Implementation", "keyConcepts", "Redis Sorted Sets, Atomic Lua scripts, HTTP 429", "completed", true),
                                        Map.of("id", "s-3", "title", "Idempotent Webhook Processing Engine", "keyConcepts", "HMAC-SHA256 verification, distributed deduplication", "completed", false)
                                )
                        ),
                        Map.of(
                                "milestoneNumber", 2,
                                "title", "Distributed Data Systems & Scaling to 50k QPS",
                                "weekSpan", "Weeks 3 - 4",
                                "objective", "Design fault-tolerant storage, cache-aside strategies, and event streaming pipelines.",
                                "topics", List.of(
                                        Map.of("id", "s-4", "title", "Database Indexing & Query Execution Plans", "keyConcepts", "B+Tree indexing, composite index selectivity, EXPLAIN ANALYZE", "completed", false),
                                        Map.of("id", "s-5", "title", "Kafka Event-Driven Architecture", "keyConcepts", "Partitioning strategies, consumer lag, at-least-once delivery", "completed", false)
                                )
                        )
                )
        );
    }

    private RoadmapResponse toResponse(CareerRoadmap roadmap) {
        return toResponse(roadmap, parseJson(roadmap.getRoadmapJson()));
    }

    private RoadmapResponse toResponse(CareerRoadmap roadmap, Map<String, Object> data) {
        return RoadmapResponse.builder()
                .id(roadmap.getId())
                .userId(roadmap.getUserId())
                .currentRole(roadmap.getCurrentRole())
                .yearsOfExperience(roadmap.getYearsOfExperience())
                .targetRole(roadmap.getTargetRole())
                .targetCompensation(roadmap.getTargetCompensation())
                .targetTimelineWeeks(roadmap.getTargetTimelineWeeks())
                .overallScore(roadmap.getOverallScore())
                .overallProgress(roadmap.getOverallProgress())
                .roadmapData(data)
                .status(roadmap.getStatus().name())
                .createdAt(roadmap.getCreatedAt())
                .updatedAt(roadmap.getUpdatedAt())
                .build();
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Failed to parse roadmap JSON", e);
            return Collections.emptyMap();
        }
    }

    private Map<String, Object> generateDynamicFallback(GenerateRoadmapRequest request, List<String> skills) {
        String target = request.getTargetRole() != null ? request.getTargetRole() : "Senior Engineer";
        String current = request.getCurrentRole() != null ? request.getCurrentRole() : "Software Engineer";
        int weeks = request.getTargetTimelineWeeks() != null ? request.getTargetTimelineWeeks() : 8;
        String comp = request.getTargetCompensation() != null ? request.getTargetCompensation() : "₹32-45 LPA";
        String skillsLower = (skills != null ? String.join(" ", skills) : "").toLowerCase();

        boolean isFrontend = target.toLowerCase().contains("frontend") || target.toLowerCase().contains("ui") || target.toLowerCase().contains("react");

        List<Map<String, Object>> milestones;
        if (isFrontend) {
            milestones = List.of(
                    Map.of(
                            "milestoneNumber", 1,
                            "title", "Core Web Engine, Memory & Interaction to Next Paint (INP)",
                            "weekSpan", "Weeks 1 - 2",
                            "objective", "Master browser rendering pipelines, main thread scheduling, and Web Vitals.",
                            "topics", List.of(
                                    Map.of("id", "m1-t1", "stepNumber", 1, "title", "JavaScript Event Loop, Microtasks & Macrotasks", "isRevision", skillsLower.contains("javascript"), "keyConcepts", "Call stack, event loop, Promise resolution, MutationObserver vs requestAnimationFrame, starvation", "practiceTask", "Build a priority task scheduler queue with requestIdleCallback fallback", "estimatedHours", 10, "interviewQuestions", List.of(Map.of("question", "How does Promise.then() differ from setTimeout(0) in thread execution?", "answerHint", "Explain microtask queue draining before next event loop tick and macrotask scheduling."), Map.of("question", "What causes UI frame jank during high-frequency mouse movements?", "answerHint", "Long tasks blocking the main thread; explain requestAnimationFrame batching.")), "readingResource", "MDN - In-depth guide to Event Loop & Concurrency Model", "completed", false),
                                    Map.of("id", "m1-t2", "stepNumber", 2, "title", "Interaction to Next Paint (INP) & Main Thread Scheduling", "isRevision", false, "keyConcepts", "Long tasks (>50ms), scheduler.postTask API, yielding with isInputPending, web workers", "practiceTask", "Audit and eliminate 200ms INP bottlenecks on interactive 10,000-row data tables", "estimatedHours", 12, "interviewQuestions", List.of(Map.of("question", "How does INP differ from FID, and how do you optimize it?", "answerHint", "INP measures all interactions throughout page lifetime, not just first click; yield to main thread with scheduler.yield()."), Map.of("question", "When should you offload state calculations to a Web Worker?", "answerHint", "When compute exceeds 16ms per frame; discuss structured clone overhead vs SharedArrayBuffer.")), "readingResource", "web.dev - Optimize Interaction to Next Paint (INP)", "completed", false),
                                    Map.of("id", "m1-t3", "stepNumber", 3, "title", "DOM Virtualization & Composite Layer GPU Acceleration", "isRevision", skillsLower.contains("react"), "keyConcepts", "GPU compositing layers, CSS will-change, DOM recycling, windowing scroll offsets", "practiceTask", "Build a zero-lag virtualized list rendering 50,000 DOM nodes smoothly at 60fps", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "Why does updating DOM node styles trigger forced synchronous layout?", "answerHint", "Reading layout geometry after writing causes immediate layout recalculation (layout thrashing)."), Map.of("question", "Explain CSS contain property and its rendering performance benefits.", "answerHint", "contain: layout paint isolates subtree recalculation from the document root.")), "readingResource", "Google Web Fundamentals - Avoid Large, Complex Layouts and Layout Thrashing", "completed", false),
                                    Map.of("id", "m1-t4", "stepNumber", 4, "title", "Tree-Shaking, Code Splitting & Bundle Performance", "isRevision", false, "keyConcepts", "ESM static analysis, dynamic import(), Rollup/Vite chunks, Brotli compression, module preload", "practiceTask", "Profile Webpack/Vite bundle and reduce first load JS bundle size by 65%", "estimatedHours", 10, "interviewQuestions", List.of(Map.of("question", "Why cannot CommonJS require() be reliably tree-shaken by bundlers?", "answerHint", "require() is dynamic and conditional at runtime; ESM import is statically declared at compile time."), Map.of("question", "What is modulepreload link tag and how does it prevent waterfall downloads?", "answerHint", "Fetches and parses ES module dependency trees in parallel before script execution.")), "readingResource", "web.dev - Reduce JavaScript payloads with code splitting", "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 2,
                            "title", "Enterprise State Architecture & Micro-Frontends",
                            "weekSpan", "Weeks 3 - 4",
                            "objective", "Architect enterprise state machines, module federation, and offline recovery.",
                            "topics", List.of(
                                    Map.of("id", "m2-t1", "stepNumber", 5, "title", "Finite State Machines & Predictable State Engines", "isRevision", false, "keyConcepts", "XState, state charts, actor model, avoiding impossible states, hierarchical state", "practiceTask", "Implement an enterprise multi-step checkout state machine with recovery", "estimatedHours", 12, "interviewQuestions", List.of(Map.of("question", "Why choose a Finite State Machine over simple Boolean flag states?", "answerHint", "Eliminates unreachable states and edge-case race conditions."), Map.of("question", "Explain the Actor model pattern in UI state management.", "answerHint", "Actors encapsulate state and communicate exclusively through asynchronous messages.")), "readingResource", "David Khourshid - Welcome to the World of Statecharts", "completed", false),
                                    Map.of("id", "m2-t2", "stepNumber", 6, "title", "Module Federation & Isolated Micro-App Runtimes", "isRevision", false, "keyConcepts", "Webpack 5 Module Federation, shared singletons, version mismatch isolation, runtime container orchestration", "practiceTask", "Implement a federated host loading independent remote micro-apps with shared React singleton", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "How does Module Federation handle two micro-apps requiring different major versions of a library?", "answerHint", "Explain singleton configuration vs isolated scopes in ModuleFederationPlugin."), Map.of("question", "What happens when a remote micro-app fails to load over the network?", "answerHint", "Implement circuit breaker boundary and graceful UI degradation.")), "readingResource", "Webpack Docs - Module Federation Architecture", "completed", false),
                                    Map.of("id", "m2-t3", "stepNumber", 7, "title", "Optimistic UI Updates & Delta Synchronization", "isRevision", false, "keyConcepts", "Rollback buffers, optimistic response IDs, conflict detection, reconnect replay", "practiceTask", "Build a high-velocity collaborative task list with instantaneous optimistic writes", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "How do you roll back optimistic UI mutations without screen flashing?", "answerHint", "Keep pristine snapshots before applying optimistic delta; revert on rejection."), Map.of("question", "Explain idempotent mutation keys in client-server communication.", "answerHint", "UUID client mutation keys prevent duplicate action execution on reconnect.")), "readingResource", "Martin Fowler - LMAX Architecture and Optimistic UI Patterns", "completed", false),
                                    Map.of("id", "m2-t4", "stepNumber", 8, "title", "Web Workers & Heavy Background Compute", "isRevision", false, "keyConcepts", "SharedWorker, ServiceWorker caching, Comlink RPC bridge, Transferable Objects", "practiceTask", "Process 50MB CSV data parsing inside a dedicated worker with sub-5ms UI responsiveness", "estimatedHours", 12, "interviewQuestions", List.of(Map.of("question", "What are Transferable Objects in postMessage() and why are they zero-copy?", "answerHint", "Memory ownership transfers directly to the worker thread without memory serialization."), Map.of("question", "How does a SharedWorker coordinate state across multiple browser tabs?", "answerHint", "Multiple browsing contexts connect via MessagePorts to a single shared execution context.")), "readingResource", "MDN - Transferable Objects and Worker Performance", "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 3,
                            "title", "Real-Time Collaboration & CRDTs",
                            "weekSpan", "Weeks 5 - 6",
                            "objective", "Build conflict-free real-time collaborative applications with offline resilience.",
                            "topics", List.of(
                                    Map.of("id", "m3-t1", "stepNumber", 9, "title", "WebSocket Resilient State Reconnection & Heartbeats", "isRevision", false, "keyConcepts", "Exponential backoff, jitter, message deduplication, missed event sequence replay", "practiceTask", "Build a production-grade resilient WebSocket client with automatic state resynchronization", "estimatedHours", 12, "interviewQuestions", List.of(Map.of("question", "How do you prevent thundering herd when a WebSocket server cluster restarts?", "answerHint", "Apply exponential backoff combined with randomized decorrelated jitter."), Map.of("question", "How do you ensure no messages are lost during client network handover (Wi-Fi to 5G)?", "answerHint", "Use sequence-numbered message buffers and ACK protocols.")), "readingResource", "RFC 6455 - The WebSocket Protocol Specification", "completed", false),
                                    Map.of("id", "m3-t2", "stepNumber", 10, "title", "Conflict-Free Replicated Data Types (CRDTs) & Yjs", "isRevision", false, "keyConcepts", "State-based vs operation-based CRDTs, Yjs delta encoding, eventual consistency in UI", "practiceTask", "Implement a collaborative multi-user live document with zero conflict loss", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "What is the mathematical difference between Operational Transformation (OT) and CRDTs?", "answerHint", "OT requires a centralized coordination server to transform operations; CRDTs are commutative and associative."), Map.of("question", "How does Yjs prevent tombstone memory bloat in long-lived text sessions?", "answerHint", "Block merging and garbage collection algorithms.")), "readingResource", "Martin Kleppmann - Conflict-Free Replicated Data Types", "completed", false),
                                    Map.of("id", "m3-t3", "stepNumber", 11, "title", "IndexedDB Offline-First Caching & Workbox", "isRevision", false, "keyConcepts", "Service Worker lifecycle, Cache-First vs Stale-While-Revalidate, IndexedDB transactions", "practiceTask", "Build an offline-first workspace that functions seamlessly in airplane mode", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "Explain the difference between Cache API and IndexedDB for offline storage.", "answerHint", "Cache API stores request/response pairs; IndexedDB is a structured transactional NoSQL store."), Map.of("question", "What happens when a new Service Worker is waiting to activate?", "answerHint", "Discuss skipWaiting() and lifecycle transitions without corrupting open tabs.")), "readingResource", "Google Chrome Developers - Offline Cookbook", "completed", false),
                                    Map.of("id", "m3-t4", "stepNumber", 12, "title", "Web Security: CSP, Cross-Origin Isolation & Token Storage", "isRevision", false, "keyConcepts", "Content Security Policy (CSP), HTTPOnly SameSite cookies, Subresource Integrity, Cross-Origin-Embedder-Policy", "practiceTask", "Harden a client-side banking portal to achieve zero XSS vulnerability", "estimatedHours", 10, "interviewQuestions", List.of(Map.of("question", "Why should authentication tokens never be stored in localStorage?", "answerHint", "Any successful XSS exploit can immediately read and exfiltrate localStorage tokens."), Map.of("question", "Explain how strict CSP nonce policies stop inline script injection.", "answerHint", "Scripts only execute if their nonce matches the cryptographically signed server response header.")), "readingResource", "OWASP - Single Page Application Security Guidelines", "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 4,
                            "title", "UI Architecture Bar-Raiser & Executive Calibration",
                            "weekSpan", "Weeks 7 - 8",
                            "objective", "Deliver high-conviction trade-off justifications and defend architecture decisions.",
                            "topics", List.of(
                                    Map.of("id", "m4-t1", "stepNumber", 13, "title", "90-Minute Timed Frontend Machine Coding Gauntlet", "isRevision", false, "keyConcepts", "Clean separation of concerns, accessibility (a11y ARIA), zero dependencies, edge case handling", "practiceTask", "Code an autocomplete search dropdown with keyboard navigation and debounce under 60 minutes", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "How do you make an autocomplete dropdown fully accessible to screen readers?", "answerHint", "Implement WAI-ARIA 1.2 Combobox pattern: aria-expanded, aria-activedescendant, role=listbox."), Map.of("question", "Explain debouncing vs throttling with leading and trailing execution edge cases.", "answerHint", "Throttle limits execution frequency; debounce delays execution until quiet period.")), "readingResource", "WAI-ARIA Authoring Practices Guide - Combobox Pattern", "completed", false),
                                    Map.of("id", "m4-t2", "stepNumber", 14, "title", "Design System Architecture & Headless Component Primitives", "isRevision", false, "keyConcepts", "Headless UI patterns, polymorphic components (as prop), CSS variables theming, zero-runtime styling", "practiceTask", "Architect a production-grade design system component library with theme tokens", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "What are the engineering advantages of Headless UI libraries over styled UI kits?", "answerHint", "Separates complex state and accessibility logic from visual styling; enables full branding customization."), Map.of("question", "Explain how CSS variables enable zero-rerender dark mode switching.", "answerHint", "Toggling root HTML attributes swaps token values directly on GPU layers without React tree rerender.")), "readingResource", "Robin Rendle - System Design for Front-End Engineers", "completed", false),
                                    Map.of("id", "m4-t3", "stepNumber", 15, "title", "Front-End System Design: High-Scale Collaborative Canvas (Figma/Miro)", "isRevision", false, "keyConcepts", "Canvas vs SVG, spatial indexing (R-Tree/QuadTree), view frustum culling, delta sync", "practiceTask", "Design the end-to-end architecture for a live collaborative whiteboarding platform", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "Why does DOM-based rendering fail when visualizing 100,000 interactive canvas nodes?", "answerHint", "DOM tree layout recalculation and memory overhead; use HTML5 Canvas or WebGL with spatial index culling."), Map.of("question", "How do you handle panning and zooming without recalculating all element boundaries?", "answerHint", "Use transformation matrix multiplication on the root viewport context.")), "readingResource", "Figma Engineering Blog - WebGL and Collaborative Real-Time Architecture", "completed", false),
                                    Map.of("id", "m4-t4", "stepNumber", 16, "title", "Staff-Level Architectural Trade-Off Defense & Hiring Rubrics", "isRevision", false, "keyConcepts", "SSR vs SSG vs ISR vs Client Hydration, streaming HTML with Suspense, defending decisions", "practiceTask", "Conduct full bar-raiser mock interview defending architecture against Staff Engineers", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "How does React 18 Selective Hydration solve the all-or-nothing hydration bottleneck?", "answerHint", "Suspense boundaries allow streaming HTML chunks and prioritize user-interacted sections for hydration."), Map.of("question", "Defend why your team should migrate or NOT migrate to Next.js App Router.", "answerHint", "Articulate realistic trade-offs: server action ergonomics vs deployment lock-in and debugging complexity.")), "readingResource", "Dan Abramov - The Two Reacts: Architecture and Mental Models", "completed", false)
                            )
                    )
            );
        } else {
            // Backend / Systems (16 Progressive Topics)
            milestones = List.of(
                    Map.of(
                            "milestoneNumber", 1,
                            "title", "Core Language Mechanics, Memory Model & Concurrency Deep Dive",
                            "weekSpan", "Weeks 1 - 2",
                            "objective", "Master thread safety, Java memory model, lock-free structures, and low-level mechanics.",
                            "topics", List.of(
                                    Map.of("id", "m1-t1", "stepNumber", 1, "title", "Java Memory Model (JMM), Happens-Before & Volatile Semantics", "isRevision", skillsLower.contains("java"), "keyConcepts", "CPU cache coherence (MESI), CPU instruction reordering, memory barriers, volatile read/write semantics", "practiceTask", "Build a high-performance thread-safe double-checked singleton and verify zero race conditions under 1,000 threads", "estimatedHours", 12, "interviewQuestions", List.of(Map.of("question", "Why does Double-Checked Locking fail in Java without the volatile keyword?", "answerHint", "Instruction reordering allows the reference to be assigned before constructor execution finishes; volatile enforces happens-before relationship."), Map.of("question", "Explain the difference between write barriers and read barriers at the CPU level.", "answerHint", "Write barriers flush CPU store buffers; read barriers invalidate stale CPU cache lines.")), "readingResource", "JSR-133: Java Memory Model and Thread Specification", "completed", false),
                                    Map.of("id", "m1-t2", "stepNumber", 2, "title", "Thread Pools, Work-Stealing & ExecutorService Lifecycle", "isRevision", skillsLower.contains("java") || skillsLower.contains("spring"), "keyConcepts", "ThreadPoolExecutor core/max sizing, task queuing (LinkedBlockingQueue vs SynchronousQueue), rejection policies, WorkStealingPool", "practiceTask", "Implement a custom ThreadPool with bounded queues, dynamic worker scaling, and custom saturation rejection telemetry", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "Why does Executors.newFixedThreadPool() risk OutOfMemoryError in production?", "answerHint", "It uses an unbounded LinkedBlockingQueue which grows indefinitely under sustained spikes."), Map.of("question", "How does ForkJoinPool work-stealing algorithm prevent thread idle time?", "answerHint", "Idle worker threads steal tasks from the tail of deque queues owned by busy threads.")), "readingResource", "Brian Goetz - Java Concurrency in Practice (Chapter 8)", "completed", false),
                                    Map.of("id", "m1-t3", "stepNumber", 3, "title", "Lock-Free Programming, CAS & Atomic Variables", "isRevision", false, "keyConcepts", "Hardware CMPXCHG instruction, ABA problem, AtomicStampedReference, LongAdder cell striping under high contention", "practiceTask", "Implement a high-throughput lock-free ring buffer (Disruptor pattern) benchmarking 10 million ops/sec", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "Why does LongAdder significantly outperform AtomicLong under high write concurrency?", "answerHint", "LongAdder distributes updates across internal Cell array cells to eliminate bus lock contention."), Map.of("question", "What is the ABA problem in CAS operations and how is it mitigated?", "answerHint", "A value changes from A to B and back to A; resolved using version stamps via AtomicStampedReference.")), "readingResource", "LMAX Disruptor Architecture Paper - Martin Fowler & Mike Barker", "completed", false),
                                    Map.of("id", "m1-t4", "stepNumber", 4, "title", "JVM Garbage Collection Internals & Latency Profiling", "isRevision", skillsLower.contains("java"), "keyConcepts", "Generational hypothesis, G1GC mixed collection, ZGC colored pointers & load barriers, escape analysis", "practiceTask", "Profile a Spring Boot service with async profiler, identify memory allocation hotspots, and reduce GC pauses under 5ms", "estimatedHours", 12, "interviewQuestions", List.of(Map.of("question", "How does ZGC achieve sub-millisecond maximum pause times even on multi-terabyte heaps?", "answerHint", "Performs marking, relocation, and compaction concurrently with application threads using colored pointers and load barriers."), Map.of("question", "Explain what happens during a Stop-The-World (STW) pause in G1GC.", "answerHint", "All application mutator threads are brought to safepoints to ensure heap reference consistency.")), "readingResource", "OpenJDK ZGC Architecture Guide & JVM Safepoint Internals", "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 2,
                            "title", "Low-Level Design (LLD), Machine Coding & Clean Architecture",
                            "weekSpan", "Weeks 3 - 4",
                            "objective", "Master writing clean, concurrency-safe, test-driven Java code under strict 90-minute timers.",
                            "topics", List.of(
                                    Map.of("id", "m2-t1", "stepNumber", 5, "title", "SOLID Principles & Clean Domain Modeling (LLD)", "isRevision", skillsLower.contains("oop") || skillsLower.contains("design patterns"), "keyConcepts", "Single Responsibility, Open-Closed via Strategy/Factory, Interface Segregation, Domain-Driven Design aggregates", "practiceTask", "Refactor a monolithic invoice service into a clean extensible strategy-driven architecture with 100% unit tests", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "How do you enforce Open-Closed Principle when adding new payment providers (Razorpay, Stripe)?", "answerHint", "Define a PaymentGateway SPI interface and register implementations via Spring dependency injection registry."), Map.of("question", "Explain Dependency Inversion Principle vs Dependency Injection.", "answerHint", "DIP is the architectural principle that high-level modules should depend on abstractions; DI is the creational pattern realizing it.")), "readingResource", "Robert C. Martin - Clean Architecture: A Craftsman's Guide", "completed", false),
                                    Map.of("id", "m2-t2", "stepNumber", 6, "title", "Thread-Safe In-Memory Key-Value Store with TTL & Eviction", "isRevision", false, "keyConcepts", "ConcurrentHashMap segmented locking, doubly-linked list for O(1) LRU/LFU, active vs passive TTL expiration", "practiceTask", "Build an in-memory key-value cache with LRU eviction and thread-safe background expiry in 90 minutes", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "How do you design O(1) eviction for Least Frequently Used (LFU) cache?", "answerHint", "Use two hash maps: one mapping keys to nodes, and another mapping frequencies to doubly-linked lists."), Map.of("question", "How does ConcurrentHashMap achieve high concurrency without locking the entire table?", "answerHint", "Uses CAS for bucket insertions and synchronizes only on the head node of a hash bucket.")), "readingResource", "Doug Lea - ConcurrentHashMap Internals & Segment Locking", "completed", false),
                                    Map.of("id", "m2-t3", "stepNumber", 7, "title", "Distributed Sliding-Window Rate Limiter (Token Bucket / Lua)", "isRevision", skillsLower.contains("redis"), "keyConcepts", "Token Bucket vs Leaky Bucket vs Sliding Window Log, Redis Lua atomic script execution, HTTP 429 Retry-After", "practiceTask", "Implement a distributed sliding-window rate limiter using Redis Lua handling 10,000 requests/sec with zero drift", "estimatedHours", 15, "interviewQuestions", List.of(Map.of("question", "Why does a naive Redis GET then INCR rate-limiting approach cause race conditions?", "answerHint", "Non-atomic check-then-act allows multiple concurrent threads to exceed threshold; solve with atomic Lua script execution."), Map.of("question", "Compare Token Bucket vs Sliding Window Counter for bursty traffic.", "answerHint", "Token Bucket allows configured bursts while enforcing steady rate; Sliding Window Counter strictly smooths request density.")), "readingResource", "Stripe Engineering Blog - Scaling rate limiters with Redis and token buckets", "completed", false),
                                    Map.of("id", "m2-t4", "stepNumber", 8, "title", "Idempotent Financial Webhook Processing & State Machines", "isRevision", skillsLower.contains("rest") || skillsLower.contains("spring"), "keyConcepts", "HMAC-SHA256 signature verification, idempotency keys, SELECT FOR UPDATE row locks, finite state machine transitions", "practiceTask", "Build an idempotent webhook processing engine handling 5,000 duplicate requests/sec with zero double-credits", "estimatedHours", 15, "interviewQuestions", List.of(Map.of("question", "How do you guarantee that a webhook callback arriving simultaneously from 3 network retries executes only once?", "answerHint", "Insert unique idempotency key with unique constraint; use optimistic locking or row-level lock on account record."), Map.of("question", "What is the difference between at-least-once and exactly-once processing in payment state transitions?", "answerHint", "At-least-once accepts duplicates and relies on deterministic state transitions to ensure idempotent state mutation.")), "readingResource", "Brandur Leach - Designing Robust and Idempotent APIs with Transactional Outboxes", "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 3,
                            "title", "Database Internals, Query Optimization & Distributed Caching",
                            "weekSpan", "Weeks 5 - 6",
                            "objective", "Design fault-tolerant storage, cache-aside strategies, and event streaming pipelines.",
                            "topics", List.of(
                                    Map.of("id", "m3-t1", "stepNumber", 9, "title", "B+Tree Indexes, Composite Index Selectivity & EXPLAIN ANALYZE", "isRevision", skillsLower.contains("mysql") || skillsLower.contains("sql"), "keyConcepts", "B+Tree node splits, leftmost prefix rule, index covering scans, temporary table elimination, cardinality", "practiceTask", "Analyze slow queries on a 10-million row database, optimize composite indexes, and reduce latency from 800ms to 4ms", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "Why does placing a low-cardinality column (like gender) first in a composite index hurt performance?", "answerHint", "Leftmost prefix rule requires high selectivity at leading columns to eliminate maximum rows during B+Tree traversal."), Map.of("question", "Explain what 'Using filesort' and 'Using index' mean in MySQL EXPLAIN plan output.", "answerHint", "'Using filesort' indicates external sorting outside index; 'Using index' means covering index satisfied query without table row lookup.")), "readingResource", "Markus Winand - Use The Index, Luke! A Guide to Database Performance", "completed", false),
                                    Map.of("id", "m3-t2", "stepNumber", 10, "title", "Transaction Isolation Levels, MVCC & Deadlock Prevention", "isRevision", skillsLower.contains("mysql") || skillsLower.contains("sql"), "keyConcepts", "Read Committed vs Repeatable Read, Multi-Version Concurrency Control (MVCC) undo logs, gap locks, next-key locks", "practiceTask", "Simulate phantom reads and deadlocks under concurrent transactions and write deadlock-free update procedures", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "How does MySQL InnoDB prevent phantom reads in Repeatable Read isolation level?", "answerHint", "Uses next-key locks (combining record lock and gap lock) to prevent other transactions from inserting into scanned range."), Map.of("question", "What causes a deadlock during concurrent UPDATE statements on secondary indexes?", "answerHint", "Transactions acquire locks on secondary index and primary clustered index in opposite orders; fix by acquiring locks in deterministic sequence.")), "readingResource", "MySQL 8.0 Reference Manual - InnoDB Multi-Versioning & Locking Details", "completed", false),
                                    Map.of("id", "m3-t3", "stepNumber", 11, "title", "Cache-Aside Patterns, Mutex Invalidation & Cache Stampede", "isRevision", skillsLower.contains("redis"), "keyConcepts", "Cache-Aside vs Write-Through, cache stampede (thundering herd), probabilistic early expiration (XFetch), TTL jitter", "practiceTask", "Implement a resilient Redis cache-aside layer with distributed mutex locks and benchmark under 10,000 concurrent threads", "estimatedHours", 14, "interviewQuestions", List.of(Map.of("question", "What is cache stampede and how does probabilistic early expiration solve it?", "answerHint", "When a hot key expires, thousands of threads query the database simultaneously; XFetch algorithm recomputes cache before actual expiry."), Map.of("question", "Should you delete or update a cache entry when database writes succeed?", "answerHint", "Delete cache entry to avoid race conditions with concurrent database read-write threads.")), "readingResource", "VLDB Research Paper - Optimal Probabilistic Cache Expiration (XFetch Algorithm)", "completed", false),
                                    Map.of("id", "m3-t4", "stepNumber", 12, "title", "Database Sharding, Consistent Hashing & Read-Replicas", "isRevision", false, "keyConcepts", "Horizontal sharding keys, virtual nodes in consistent hashing, replication lag mitigation, dual-write challenges", "practiceTask", "Design a sharded customer database routing queries across 4 database instances with consistent hash ring", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "How do you avoid hot-spotting when sharding by customer_id or created_at timestamp?", "answerHint", "Timestamp sharding routes all current writes to the latest shard; combine tenant_id with hash prefix to distribute writes."), Map.of("question", "How do you handle read-your-own-writes consistency when using asynchronous read-replicas?", "answerHint", "Route queries from recently writing users to primary master database for the duration of replication lag window.")), "readingResource", "AWS DynamoDB Architecture & Consistent Hashing Papers", "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 4,
                            "title", "Event-Driven Systems, High-Level Architecture (HLD) & Scale",
                            "weekSpan", "Weeks 7 - 8",
                            "objective", "Architect fault-tolerant systems handling multi-region failover and distributed transactions.",
                            "topics", List.of(
                                    Map.of("id", "m4-t1", "stepNumber", 13, "title", "Apache Kafka Architecture: Partitions, Offsets & Consumer Lag", "isRevision", skillsLower.contains("kafka"), "keyConcepts", "Commit log internals, partition key distribution, at-least-once delivery, consumer group cooperative rebalance", "practiceTask", "Build a high-volume event processing pipeline with partition-keyed ordering, dead letter queues (DLQs), and auto-recovery", "estimatedHours", 18, "interviewQuestions", List.of(Map.of("question", "What happens when a Kafka consumer triggers a group rebalance in a high-throughput cluster?", "answerHint", "Partitions are revoked and reassigned; Cooperative Sticky Assignor minimizes stop-the-world partition transfer."), Map.of("question", "How do you guarantee strictly ordered message processing across multiple partitions in Kafka?", "answerHint", "Messages within a single partition are ordered; route related events with identical partition keys.")), "readingResource", "Jay Kreps - Questioning the Lambda Architecture & The Log", "completed", false),
                                    Map.of("id", "m4-t2", "stepNumber", 14, "title", "Transactional Outbox Pattern & Change Data Capture (CDC)", "isRevision", false, "keyConcepts", "Dual-write failure modes, outbox table in local DB transaction, Debezium CDC via MySQL binlog, zero message loss", "practiceTask", "Implement the Transactional Outbox pattern with MySQL and Kafka with zero dual-write inconsistency", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "Why is executing a database commit and then publishing to Kafka in the same method dangerous?", "answerHint", "Application crashes after DB commit but before Kafka send cause silent message loss (dual-write problem)."), Map.of("question", "How does Debezium read changes from MySQL without impacting application query latency?", "answerHint", "Streams committed changes directly from the MySQL binary log asynchronously without query locks.")), "readingResource", "Microservices.io - Transactional Outbox Pattern by Chris Richardson", "completed", false),
                                    Map.of("id", "m4-t3", "stepNumber", 15, "title", "Distributed Transactions: Saga Orchestration & Resilience4j", "isRevision", false, "keyConcepts", "Two-Phase Commit (2PC) bottlenecks, Saga orchestration vs choreography, compensating transactions, Circuit Breakers", "practiceTask", "Implement a multi-service order saga with rollback compensations and Resilience4j circuit breakers", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "Why is Two-Phase Commit (2PC) rarely used in cloud-scale microservice architectures?", "answerHint", "2PC is blocking and holds locks across all participants; network partitions cause coordinator stall and cascading timeouts."), Map.of("question", "How do you design a compensating transaction when an intermediate step cannot be physically undone?", "answerHint", "Use forward recovery with alerts or design semantic reversals (e.g. refunding money rather than canceling shipped items).")), "readingResource", "Caitie McCaffrey - Applying the Saga Pattern to Distributed Microservices", "completed", false),
                                    Map.of("id", "m4-t4", "stepNumber", 16, "title", "Multi-Region System Design, CAP Trade-Offs & Bar-Raiser Defense", "isRevision", false, "keyConcepts", "Active-Active multi-datacenter topology, conflict resolution (CRDT/LWW), back-of-the-envelope math, live failure defense", "practiceTask", "Defend an end-to-end design for a global ride-hailing or payment dispatcher against Staff Engineers", "estimatedHours", 16, "interviewQuestions", List.of(Map.of("question", "Design a globally distributed payment platform handling 50,000 TPS with sub-100ms response time.", "answerHint", "Structure back-of-envelope math, choose AP vs CP boundary per service, discuss ledger reconciliation and active-active DB clustering."), Map.of("question", "How do you resolve conflicting concurrent writes to the same account across US and EU data centers?", "answerHint", "Discuss vector clocks, CRDTs, or pinning account writes to a primary geographic home shard.")), "readingResource", "Designing Data-Intensive Applications (DDIA) - Martin Kleppmann (Chapters 7-9)", "completed", false)
                            )
                    )
            );
        }

        return Map.of(
                "feasibility", Map.of(
                        "status", "REALISTIC",
                        "score", 84,
                        "verdict", String.format("High-conviction trajectory from %s to %s within %d weeks. Follow the 16 progressive milestones.", current, target, weeks),
                        "gapSeverity", "MODERATE",
                        "reasons", List.of(
                                "Target role demands verifiable depth in low-level concurrency, storage indexing, and event-driven distributed systems.",
                                String.format("A %d-week timeline is realistic with 15-20 hours/week dedicated to hands-on machine coding and system design defense.", weeks)
                        ),
                        "suggestedAdjustment", Map.of(
                                "recommendedRole", target,
                                "recommendedWeeks", weeks,
                                "actionableNote", "Master the first 8 topics (concurrency and LLD) before taking live system design interviews."
                        )
                ),
                "readiness", Map.of(
                        "overallScore", 84,
                        "verdict", String.format("Concrete trajectory from %s to %s within %d weeks. Sharpen distributed concurrency and trade-off defense.", current, target, weeks),
                        "marketDemand", "VERY_HIGH",
                        "estimatedWeeks", weeks,
                        "salaryUpliftPotential", comp.contains("LPA") ? comp : "2.5x - 3.2x"
                ),
                "skillGaps", Map.of(
                        "directGaps", List.of(
                                Map.of("skill", "Low-Level Design & Concurrency", "severity", "CRITICAL", "description", "Must master Java Memory Model, lock-free algorithms, and timed 90-min machine coding."),
                                Map.of("skill", "Event-Driven Systems (Kafka)", "severity", "HIGH", "description", "Need hands-on proficiency with partition keys, consumer lag monitoring, and transactional outboxes.")
                        ),
                        "transferableStrengths", List.of(
                                Map.of("skill", "Core Service Development", "leverage", "Solid base for 90-min machine coding rounds; leverage this to focus on scale and concurrency.")
                        ),
                        "dealbreakersForTargetTier", List.of(
                                Map.of("topic", "Machine Coding Deadlocks & Race Conditions", "why", "Concurrency bugs in live coding rounds lead to immediate disqualification.")
                        )
                ),
                "milestones", milestones,
                "compatibleCompanies", List.of(
                        Map.of("companyName", "Razorpay / PhonePe", "category", "Fintech Unicorn", "matchScore", 95, "whyMatched", "Values zero financial transaction loss and deep JVM/concurrency mastery.", "interviewRounds", List.of("Machine Coding (90m)", "System Design (HLD)", "Bar-Raiser"), "priorityTopics", List.of("Distributed Locks", "Idempotency", "Kafka")),
                        Map.of("companyName", "Swiggy / Zepto", "category", "Quick-Commerce Unicorn", "matchScore", 91, "whyMatched", "Requires sub-50ms distributed rate limiting and high-write pipelines.", "interviewRounds", List.of("Concurrency Drill", "Distributed Architecture", "Hiring Manager"), "priorityTopics", List.of("Redis GeoSets", "Cache Invalidation", "EDA")),
                        Map.of("companyName", "Uber / Atlassian", "category", "Global Tech Tier-1", "matchScore", 88, "whyMatched", "Focuses on event-driven architecture and multi-datacenter consistency.", "interviewRounds", List.of("Machine Coding", "System Design", "Values & Culture"), "priorityTopics", List.of("Event Sourcing", "Consensus", "Resilience"))
                ),
                "actionPlanFirst48Hours", List.of(
                        "Review the critical skill gaps and benchmark your current concurrency knowledge.",
                        "Set up a local testing harness with Redis and test atomic distributed locks with Redis Lua scripts.",
                        "Solve 1 timed 90-minute machine coding challenge focusing on thread safety and SOLID design."
                )
        );
    }
}
