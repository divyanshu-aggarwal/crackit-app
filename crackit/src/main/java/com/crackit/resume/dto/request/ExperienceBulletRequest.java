package com.crackit.resume.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExperienceBulletRequest {
    private String experienceId;
    private String bulletText;
    private String technologies;
    private Integer priorityScore;
}