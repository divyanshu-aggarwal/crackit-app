package com.crackit.resume.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectRequest {
    private String title;
    private String description;
    private String techStack;
    private String githubUrl;
    private String impactMetrics;
}