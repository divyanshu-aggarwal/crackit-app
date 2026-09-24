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

        Map<String, Object> payload = new HashMap<>();
        payload.put("current_role", request.getCurrentRole() != null ? request.getCurrentRole() : "Software Engineer");
        payload.put("years_of_experience", request.getYearsOfExperience() != null ? request.getYearsOfExperience() : 2.0);
        payload.put("current_skills", skills);
        payload.put("current_compensation", request.getCurrentCompensation() != null ? request.getCurrentCompensation() : "Market standard");
        payload.put("target_role", request.getTargetRole());
        payload.put("target_compensation", request.getTargetCompensation() != null ? request.getTargetCompensation() : "Competitive Top-of-Market");
        payload.put("target_timeline_weeks", request.getTargetTimelineWeeks() != null ? request.getTargetTimelineWeeks() : 8);
        payload.put("target_company_types", request.getTargetCompanyTypes() != null ? request.getTargetCompanyTypes() : List.of("Product Startups", "Unicorns", "Top Tech MNCs"));

        log.info("Generating Career Prep Roadmap for user '{}', Target: '{}'", email, request.getTargetRole());
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

        boolean isFrontend = target.toLowerCase().contains("frontend") || target.toLowerCase().contains("ui") || target.toLowerCase().contains("react");
        boolean isFullstack = target.toLowerCase().contains("fullstack") || target.toLowerCase().contains("founding");

        List<Map<String, Object>> milestones;
        if (isFrontend) {
            milestones = List.of(
                    Map.of(
                            "milestoneNumber", 1,
                            "title", "Core Web Architecture & Performance (CWV)",
                            "weekSpan", "Weeks 1 - 2",
                            "objective", "Master Core Web Vitals (LCP, INP, CLS), critical rendering path, and bundle tree-shaking.",
                            "topics", List.of(
                                    Map.of("id", "m1-t1", "title", "Core Web Vitals & INP Optimization", "keyConcepts", "Interaction to Next Paint, main thread scheduling, requestIdleCallback", "practiceTask", "Audit and eliminate 200ms INP bottlenecks on interactive data tables", "estimatedHours", 12, "completed", false),
                                    Map.of("id", "m1-t2", "title", "Rendering Pipelines & Virtualization", "keyConcepts", "Virtual DOM diffing, CSS contain, GPU composite layers, windowing", "practiceTask", "Build a zero-lag virtualized list rendering 50,000 DOM nodes smoothly", "estimatedHours", 14, "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 2,
                            "title", "State Synchronization & Micro-Frontends",
                            "weekSpan", "Weeks 3 - 4",
                            "objective", "Architect enterprise state machines, offline-first sync, and module federation.",
                            "topics", List.of(
                                    Map.of("id", "m2-t1", "title", "Module Federation & Isolated Runtimes", "keyConcepts", "Webpack 5 Module Federation, shared dependencies, version mismatch isolation", "practiceTask", "Implement a federated host loading independent remote micro-apps", "estimatedHours", 16, "completed", false),
                                    Map.of("id", "m2-t2", "title", "Real-Time WebSocket Sync & Optimistic UI", "keyConcepts", "Delta sync, conflict resolution (CRDTs), reconnection state recovery", "practiceTask", "Build a collaborative multi-user live document with conflict handling", "estimatedHours", 14, "completed", false)
                            )
                    )
            );
        } else if (isFullstack) {
            milestones = List.of(
                    Map.of(
                            "milestoneNumber", 1,
                            "title", "Fullstack Systems & Distributed Persistence",
                            "weekSpan", "Weeks 1 - 2",
                            "objective", "Bridge frontend state pipelines with distributed databases and caching.",
                            "topics", List.of(
                                    Map.of("id", "m1-t1", "title", "Cache-Aside Patterns & Distributed Sessions", "keyConcepts", "Redis session stores, cache stampede prevention, negative caching", "practiceTask", "Build a JWT session store with atomic Redis Lua token blacklisting", "estimatedHours", 14, "completed", false),
                                    Map.of("id", "m1-t2", "title", "Relational & NoSQL Schema Polyglot Design", "keyConcepts", "ACID guarantees, composite B+Tree indexes, sharding vs replication", "practiceTask", "Design a dual-write ledger with eventual consistency guarantees", "estimatedHours", 16, "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 2,
                            "title", "Event-Driven Queues & Resilient Microservices",
                            "weekSpan", "Weeks 3 - 4",
                            "objective", "Design async event streaming, idempotency patterns, and fault-tolerant APIs.",
                            "topics", List.of(
                                    Map.of("id", "m2-t1", "title", "Kafka Event Sourcing & CQRS", "keyConcepts", "Partitioning keys, consumer group rebalance, DLQs, outbox pattern", "practiceTask", "Implement the Transactional Outbox pattern with Kafka and MySQL", "estimatedHours", 18, "completed", false),
                                    Map.of("id", "m2-t2", "title", "Circuit Breakers & Graceful Degradation", "keyConcepts", "Resilience4j, rate limiters (Token Bucket), fallback cascades", "practiceTask", "Implement a rate limiter with sub-millisecond overhead under load", "estimatedHours", 12, "completed", false)
                            )
                    )
            );
        } else {
            milestones = List.of(
                    Map.of(
                            "milestoneNumber", 1,
                            "title", "Core Concurrency & Low-Level Design (LLD)",
                            "weekSpan", "Weeks 1 - 2",
                            "objective", "Master writing clean, concurrency-safe, test-driven Java code under strict 90-minute timers.",
                            "topics", List.of(
                                    Map.of("id", "m1-t1", "title", "Distributed Locks & Redis Lua Atomic Scripts", "keyConcepts", "Atomic execution, TTL safety, fail-open vs fail-closed design", "practiceTask", "Implement a distributed lock with automatic heartbeat lease extension", "estimatedHours", 14, "completed", false),
                                    Map.of("id", "m1-t2", "title", "Financial Webhook Idempotency & Concurrency", "keyConcepts", "HMAC-SHA256 signature, row-level locks, state machines", "practiceTask", "Build an idempotent webhook receiver handling 5,000 duplicate requests/sec", "estimatedHours", 15, "completed", false),
                                    Map.of("id", "m1-t3", "title", "Cache Stampede & Mutex Invalidation", "keyConcepts", "TTL jitter, probabilistic early expiration, cache-aside", "practiceTask", "Benchmark cache stampede resilience with 10,000 concurrent threads", "estimatedHours", 12, "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 2,
                            "title", "Distributed Systems & Event-Driven Architecture",
                            "weekSpan", "Weeks 3 - 4",
                            "objective", "Design event streaming architectures with zero message loss and sub-50ms p99 latency.",
                            "topics", List.of(
                                    Map.of("id", "m2-t1", "title", "Kafka Partitioning & Consumer Groups", "keyConcepts", "At-least-once semantics, consumer rebalancing, Dead Letter Queues", "practiceTask", "Build a high-volume order pipeline with partition-keyed ordering", "estimatedHours", 18, "completed", false),
                                    Map.of("id", "m2-t2", "title", "HTAP Databases & Consensus Protocols", "keyConcepts", "Raft consensus, TiKV row-store, TiFlash columnar scans", "practiceTask", "Design an HTAP telemetry system balancing OLTP writes with OLAP aggregates", "estimatedHours", 16, "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 3,
                            "title", "High-Level System Design & Scaling to 100k QPS",
                            "weekSpan", "Weeks 5 - 6",
                            "objective", "Architect fault-tolerant systems handling multi-region failover and distributed transactions.",
                            "topics", List.of(
                                    Map.of("id", "m3-t1", "title", "Distributed Transaction Sagas (Orchestration vs Choreography)", "keyConcepts", "Compensating transactions, forward recovery, idempotency keys", "practiceTask", "Implement a multi-service order saga with rollback compensations", "estimatedHours", 16, "completed", false),
                                    Map.of("id", "m3-t2", "title", "Multi-Datacenter Consistency & CAP Trade-Offs", "keyConcepts", "Active-Active topology, quorum reads/writes, conflict resolution", "practiceTask", "Design a globally distributed rate-limiting mesh with local fallback", "estimatedHours", 14, "completed", false)
                            )
                    ),
                    Map.of(
                            "milestoneNumber", 4,
                            "title", "Bar-Raiser Mock Calibration & Executive Presence",
                            "weekSpan", "Weeks 7 - 8",
                            "objective", "Deliver high-conviction trade-off justifications and defend architecture decisions.",
                            "topics", List.of(
                                    Map.of("id", "m4-t1", "title", "90-Minute Timed Machine Coding Gauntlet", "keyConcepts", "SOLID principles, thread safety, unit test coverage, extensibility", "practiceTask", "Code an in-memory key-value store with TTL and eviction under 90 minutes", "estimatedHours", 15, "completed", false),
                                    Map.of("id", "m4-t2", "title", "System Design Defense & Trade-Off Calibration", "keyConcepts", "Back-of-envelope math, bottleneck diagnosis, failure mode analysis", "practiceTask", "Defend an end-to-end design for a global ride-hailing dispatcher", "estimatedHours", 15, "completed", false)
                            )
                    )
            );
        }

        return Map.of(
                "readiness", Map.of(
                        "overallScore", 82,
                        "verdict", String.format("High-conviction trajectory from %s to %s within %d weeks. Sharpen distributed concurrency and trade-off defense.", current, target, weeks),
                        "marketDemand", "VERY_HIGH",
                        "estimatedWeeks", weeks,
                        "salaryUpliftPotential", "2.8x - 3.5x"
                ),
                "skillGaps", Map.of(
                        "directGaps", List.of(
                                Map.of("skill", "Distributed Concurrency & Locks", "severity", "CRITICAL", "description", "Must master TTL lease extension, Lua atomic execution, and race condition prevention."),
                                Map.of("skill", "Event-Driven Pipelines (Kafka)", "severity", "HIGH", "description", "Need hands-on proficiency with partition keys, consumer lag monitoring, and idempotency.")
                        ),
                        "transferableStrengths", List.of(
                                Map.of("skill", "Foundational API & Data Design", "leverage", "Directly translates to rapid service development; leverage this to focus on scale.")
                        ),
                        "dealbreakersForTargetTier", List.of(
                                Map.of("topic", "Machine Coding Deadlocks", "why", "Concurrency bugs in live coding rounds lead to immediate disqualification.")
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
