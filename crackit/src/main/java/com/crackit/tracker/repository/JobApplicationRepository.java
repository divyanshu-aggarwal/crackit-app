package com.crackit.tracker.repository;

import com.crackit.tracker.entity.JobApplication;
import com.crackit.tracker.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, String> {

    List<JobApplication> findByUserId(String userId);

    Optional<JobApplication> findByUserIdAndJobId(String userId, String jobId);

    List<JobApplication> findByUserIdAndStatus(String userId, ApplicationStatus status);
}