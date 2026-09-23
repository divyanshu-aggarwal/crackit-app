package com.crackit.interview.dto;

import lombok.Data;

@Data
public class UpdateQuestionRequest {
    private String suggestedAnswer;
    private Boolean isPracticed;
}