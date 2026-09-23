package com.crackit.resume.repository;

import com.crackit.resume.entity.ExperienceBullet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExperienceBulletRepository extends JpaRepository<ExperienceBullet, String> {
    List<ExperienceBullet> findByExperienceId(String experienceId);
    void deleteAllByExperienceId(String experienceId);
}