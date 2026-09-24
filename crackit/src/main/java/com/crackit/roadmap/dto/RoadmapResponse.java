package com.crackit.roadmap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoadmapResponse {
    private String id;
    private String userId;
    private String currentRole;
    private Double yearsOfExperience;
    private String targetRole;
    private String targetCompensation;
    private Integer targetTimelineWeeks;
    private Integer overallScore;
    private Integer overallProgress;
    private Map<String, Object> roadmapData;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
