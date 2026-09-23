package com.crackit.tracker.service;

import com.crackit.ai.entity.TailoredResume;
import com.crackit.ai.repository.TailoredResumeRepository;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.jobs.entity.Job;
import com.crackit.jobs.repository.JobRepository;
import com.crackit.tracker.dto.*;
import com.crackit.tracker.entity.JobApplication;
import com.crackit.tracker.enums.ApplicationStatus;
import com.crackit.tracker.repository.JobApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final TailoredResumeRepository tailoredResumeRepository;

    // Save a job (initial status = SAVED)
    public JobApplicationResponse saveJob(JobApplicationRequest request) {
        User user = getLoggedInUser();

        jobApplicationRepository.findByUserIdAndJobId(user.getId(), request.getJobId())
                .ifPresent(a -> { throw new RuntimeException("You have already saved this job"); });

        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found"));

        JobApplication application = JobApplication.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .job(job)
                .status(ApplicationStatus.SAVED)
                .notes(request.getNotes())
                .contactPerson(request.getContactPerson())
                .appliedDate(request.getAppliedDate())
                .build();

        return mapToResponse(jobApplicationRepository.save(application));
    }

    // Update status (APPLIED, CONTACTED, INTERVIEW, OFFER, REJECTED)
    public JobApplicationResponse updateStatus(String applicationId, UpdateStatusRequest request) {
        User user = getLoggedInUser();

        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!application.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        application.setStatus(request.getStatus());

        if (request.getNotes() != null) application.setNotes(request.getNotes());
        if (request.getContactPerson() != null) application.setContactPerson(request.getContactPerson());
        if (request.getAppliedDate() != null) application.setAppliedDate(request.getAppliedDate());

        return mapToResponse(jobApplicationRepository.save(application));
    }

    // Get all applications for logged-in user
    public List<JobApplicationResponse> getAllApplications() {
        User user = getLoggedInUser();
        return jobApplicationRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get single application by id
    public JobApplicationResponse getApplication(String applicationId) {
        User user = getLoggedInUser();
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!application.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        return mapToResponse(application);
    }

    // Dashboard — counts per status + full list
    public DashboardResponse getDashboard() {
        User user = getLoggedInUser();
        List<JobApplication> applications = jobApplicationRepository.findByUserId(user.getId());

        Map<String, Long> statusCounts = applications.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStatus().name(),
                        Collectors.counting()
                ));

        // ensure all statuses appear even if count is 0
        for (ApplicationStatus status : ApplicationStatus.values()) {
            statusCounts.putIfAbsent(status.name(), 0L);
        }

        List<JobApplicationResponse> responses = applications.stream()
                .map(this::mapToResponse)
                .toList();

        return DashboardResponse.builder()
                .statusCounts(statusCounts)
                .applications(responses)
                .build();
    }

    private JobApplicationResponse mapToResponse(JobApplication application) {
        Integer matchScore = tailoredResumeRepository
                .findTopByJobIdOrderByCreatedAtDesc(application.getJob().getId())
                .map(TailoredResume::getMatchScore)
                .orElse(null);

        return JobApplicationResponse.builder()
                .id(application.getId())
                .jobId(application.getJob().getId())
                .companyName(application.getJob().getCompanyName())
                .jobTitle(application.getJob().getTitle())
                .status(application.getStatus())
                .appliedDate(application.getAppliedDate())
                .notes(application.getNotes())
                .contactPerson(application.getContactPerson())
                .matchScore(matchScore)
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
    private User getLoggedInUser() {
        String email = AuthUtil.getLoggedInUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}