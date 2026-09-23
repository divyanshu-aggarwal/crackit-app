package com.crackit.jobs.service;

import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.jobs.dto.JobRequest;
import com.crackit.jobs.dto.JobResponse;
import com.crackit.jobs.entity.Job;
import com.crackit.jobs.mapper.JobMapper;
import com.crackit.jobs.repository.JobRepository;
import com.crackit.tracker.entity.JobApplication;
import com.crackit.tracker.enums.ApplicationStatus;
import com.crackit.tracker.repository.JobApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobMapper jobMapper;
    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;


    @CacheEvict(value = "jobDetails", allEntries = true)
    public JobResponse createJob(JobRequest request) {
        User user = getLoggedInUser();

        Job job = Job.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .companyName(request.getCompanyName())
                .title(request.getTitle())
                .location(request.getLocation())
                .experienceRequired(request.getExperienceRequired())
                .salaryRange(request.getSalaryRange())
                .source(request.getSource())
                .applyUrl(request.getApplyUrl())
                .jdText(request.getJdText())
                .postedDate(request.getPostedDate())
                .build();

        Job savedJob = jobRepository.save(job);

        // auto create tracker entry
        JobApplication application = JobApplication.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .job(savedJob)
                .status(ApplicationStatus.SAVED)
                .build();

        jobApplicationRepository.save(application);

        return jobMapper.mapJob(savedJob);
    }

    public List<JobResponse> getAllJobs() {
        User user = getLoggedInUser();
        return jobRepository.findByUserId(user.getId())
                .stream()
                .map(jobMapper::mapJob)
                .toList();
    }

    @Cacheable(value = "jobDetails", key = "#jobId")
    public JobResponse getJobById(String jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        return jobMapper.mapJob(job);
    }

    private User getLoggedInUser() {
        String email = AuthUtil.getLoggedInUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}