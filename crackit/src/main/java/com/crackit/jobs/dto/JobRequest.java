package com.crackit.jobs.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class JobRequest {

    private String companyName;
    private String title;
    private String location;
    private String experienceRequired;
    private String salaryRange;
    private String source;
    private String applyUrl;
    private String jdText;
    private LocalDateTime postedDate;
}