package com.crackit.resume.repository;

import com.crackit.resume.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByUserId(String userId);
    void deleteAllByUserId(String userId);
}