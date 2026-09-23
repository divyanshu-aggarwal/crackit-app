package com.crackit.interview.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class InterviewSummaryResponse {
    private String prepId;
    private String jobId;
    private String jobTitle;
    private String companyName;
    private String location;
    private Integer overallProgress;
    private Integer totalTopics;
    private Integer completedTopics;
    private Integer totalQuestions;
    private Integer practicedQuestions;
    private Boolean prepGenerated;
    private LocalDateTime updatedAt;
}