package com.crackit.resume.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectResponse {

    private String id;

    private String title;

    private String description;

    private String techStack;

    private String githubUrl;

    private String impactMetrics;
}