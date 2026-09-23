package com.crackit.jobs.mapper;

import com.crackit.jobs.dto.JobResponse;
import com.crackit.jobs.entity.Job;
import org.springframework.stereotype.Component;

@Component
public class JobMapper {

    public JobResponse mapJob(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .userId(job.getUser().getId())
                .companyName(job.getCompanyName())
                .title(job.getTitle())
                .location(job.getLocation())
                .experienceRequired(job.getExperienceRequired())
                .salaryRange(job.getSalaryRange())
                .source(job.getSource())
                .applyUrl(job.getApplyUrl())
                .jdText(job.getJdText())
                .postedDate(job.getPostedDate())
                .createdAt(job.getCreatedAt())
                .build();
    }
}