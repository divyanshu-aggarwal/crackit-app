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
        Map<String, Object> roadmapData = aiServiceClient.generateRoadmap(payload);

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
}
