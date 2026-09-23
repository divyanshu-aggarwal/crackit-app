package com.crackit.interview.dto;

import lombok.Data;

@Data
public class UpdateTopicRequest {
    private String topic;
    private String category;
    private String description;
    private String notes;
    private Boolean isCompleted;
    private Integer priority;
}