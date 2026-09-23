package com.crackit.jobs.controller;

import com.crackit.jobs.dto.JobRequest;
import com.crackit.jobs.dto.JobResponse;
import com.crackit.jobs.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    public JobResponse createJob(@RequestBody JobRequest request) {
        return jobService.createJob(request);
    }

    @GetMapping
    public List<JobResponse> getAllJobs() {
        return jobService.getAllJobs();
    }

    @GetMapping("/{jobId}")
    public JobResponse getJobById(@PathVariable String jobId) {
        return jobService.getJobById(jobId);
    }
}