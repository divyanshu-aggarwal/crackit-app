package com.crackit.roadmap.controller;

import com.crackit.common.ratelimit.annotation.RateLimit;
import com.crackit.common.ratelimit.enums.RateLimitType;
import com.crackit.roadmap.dto.GenerateRoadmapRequest;
import com.crackit.roadmap.dto.RoadmapResponse;
import com.crackit.roadmap.service.RoadmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/roadmap")
@RequiredArgsConstructor
public class RoadmapController {

    private final RoadmapService roadmapService;

    @RateLimit(key = "roadmap_generate", limit = 5, durationSeconds = 60, type = RateLimitType.USER)
    @PostMapping("/generate")
    public ResponseEntity<RoadmapResponse> generateRoadmap(@RequestBody GenerateRoadmapRequest request) {
        return ResponseEntity.ok(roadmapService.generateRoadmap(request));
    }

    @GetMapping("/current")
    public ResponseEntity<RoadmapResponse> getCurrentRoadmap() {
        RoadmapResponse response = roadmapService.getCurrentRoadmap();
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{roadmapId}/topics/{topicId}/progress")
    public ResponseEntity<RoadmapResponse> updateTopicProgress(
            @PathVariable String roadmapId,
            @PathVariable String topicId,
            @RequestParam boolean completed
    ) {
        return ResponseEntity.ok(roadmapService.updateTopicProgress(roadmapId, topicId, completed));
    }

    @GetMapping("/sample")
    public ResponseEntity<Map<String, Object>> getSampleRoadmap() {
        return ResponseEntity.ok(roadmapService.getSampleRoadmap());
    }
}
