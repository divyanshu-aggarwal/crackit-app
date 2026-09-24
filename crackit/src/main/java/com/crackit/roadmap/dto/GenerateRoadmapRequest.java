package com.crackit.roadmap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateRoadmapRequest {
    private String currentRole;
    private Double yearsOfExperience;
    private List<String> currentSkills;
    private String currentCompensation;
    private String targetRole;
    private String targetCompensation;
    private Integer targetTimelineWeeks;
    private List<String> targetCompanyTypes;
}
