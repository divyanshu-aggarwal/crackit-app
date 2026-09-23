package com.crackit.resume.repository;

import com.crackit.resume.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExperienceRepository extends JpaRepository<Experience, String> {
    List<Experience> findByUserId(String userId);
    void deleteAllByUserId(String userId);
}