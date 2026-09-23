package com.crackit.ai.repository;

import com.crackit.ai.entity.JdAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JdAnalysisRepository extends JpaRepository<JdAnalysis, String> {

    List<JdAnalysis> findByJobId(String jobId);

    Optional<JdAnalysis> findTopByJobIdOrderByCreatedAtDesc(String jobId);
}