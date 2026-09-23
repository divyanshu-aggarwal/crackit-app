package com.crackit.interview.dto;

import lombok.Data;
import java.util.List;

@Data
public class InterviewPrepResponse {
    private String id;
    private String jobId;
    private Integer overallProgress;
    private String notes;
    private com.crackit.interview.enums.PrepStatus status;
    private String errorMessage;
    private List<PrepTopicDto> topics;
    private List<PrepQuestionDto> questions;
}