package com.crackit.interview.repository;

import com.crackit.interview.entity.InterviewPrep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewPrepRepository extends JpaRepository<InterviewPrep, String> {
    Optional<InterviewPrep> findByJobIdAndUserId(String jobId, String userId);
    List<InterviewPrep> findByUserId(String userId);
}