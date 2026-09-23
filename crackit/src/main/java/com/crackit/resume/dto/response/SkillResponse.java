package com.crackit.resume.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SkillResponse {

    private String id;

    private String skillName;

    private String category;

    private String proficiencyLevel;

    private Integer yearsUsed;
}