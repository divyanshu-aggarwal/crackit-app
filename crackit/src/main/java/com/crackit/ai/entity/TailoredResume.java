package com.crackit.ai.entity;

import com.crackit.auth.entity.User;
import com.crackit.jobs.entity.Job;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tailored_resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TailoredResume {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jd_analysis_id", nullable = false)
    private JdAnalysis jdAnalysis;

    @Column(name = "tailored_summary", columnDefinition = "TEXT")
    private String tailoredSummary;

    @Column(name = "tailored_skills", columnDefinition = "JSON")
    private String tailoredSkills;

    @Column(name = "tailored_experience", columnDefinition = "JSON")
    private String tailoredExperience;

    @Column(name = "tailored_projects", columnDefinition = "JSON")
    private String tailoredProjects;

    @Column(name = "ats_keywords_used", columnDefinition = "JSON")
    private String atsKeywordsUsed;

    @Column(name = "match_score")
    private Integer matchScore;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}