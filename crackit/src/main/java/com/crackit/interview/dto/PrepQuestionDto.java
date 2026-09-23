package com.crackit.interview.dto;

import lombok.Data;

@Data
public class PrepQuestionDto {
    private String id;
    private String question;
    private String type;
    private String suggestedAnswer;
    private Boolean isPracticed;
    private String difficulty;
}