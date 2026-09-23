package com.crackit.resume.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExperienceBulletResponse {

    private String id;

    private String experienceId;

    private String bulletText;

    private String technologies;

    private Integer priorityScore;
}