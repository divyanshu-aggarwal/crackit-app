package com.crackit.interview.dto;

import lombok.Data;

@Data
public class PrepTopicDto {
    private String id;
    private String topic;
    private String category;
    private String description;
    private String notes;
    private Boolean isCompleted;
    private Integer priority;
}