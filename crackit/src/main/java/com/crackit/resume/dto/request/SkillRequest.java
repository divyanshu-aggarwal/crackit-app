package com.crackit.resume.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SkillRequest {
    private String skillName;
    private String category;
    private String proficiencyLevel;
    private Integer yearsUsed;
}