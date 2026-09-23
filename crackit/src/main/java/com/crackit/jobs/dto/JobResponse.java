package com.crackit.jobs.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobResponse {

    private String id;
    private String userId;
    private String companyName;
    private String title;
    private String location;
    private String experienceRequired;
    private String salaryRange;
    private String source;
    private String applyUrl;
    private String jdText;
    private LocalDateTime postedDate;
    private LocalDateTime createdAt;
}