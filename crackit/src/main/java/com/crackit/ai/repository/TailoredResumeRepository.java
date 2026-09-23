package com.crackit.ai.repository;

import com.crackit.ai.entity.TailoredResume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TailoredResumeRepository extends JpaRepository<TailoredResume, String> {

    Optional<TailoredResume> findTopByJobIdOrderByCreatedAtDesc(String jobId);
    List<TailoredResume> findByUserId(String userId);
}