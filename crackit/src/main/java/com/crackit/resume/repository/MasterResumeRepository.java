package com.crackit.resume.repository;

import com.crackit.resume.entity.MasterResume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MasterResumeRepository extends JpaRepository<MasterResume, String> {

    List<MasterResume> findByUserId(String userId);
}