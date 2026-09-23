package com.crackit.ai.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Builder
public class SavedTailoredResumeResponse {

    private String id;
    private String jobId;
    private String jdAnalysisId;
    private String tailoredSummary;
    private List<String> tailoredSkills;
    private List<Map<String, Object>> tailoredExperiences;
    private List<Map<String, Object>> tailoredProjects;
    private List<String> atsKeywordsUsed;
    private Integer matchScore;
    private LocalDateTime createdAt;
}