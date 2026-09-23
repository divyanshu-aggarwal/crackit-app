package com.crackit.jobs.entity;

import com.crackit.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "company_name", nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 150)
    private String location;

    @Column(name = "experience_required", length = 50)
    private String experienceRequired;

    @Column(name = "salary_range", length = 100)
    private String salaryRange;

    @Column(length = 50)
    private String source;

    @Column(name = "apply_url", columnDefinition = "TEXT")
    private String applyUrl;

    @Column(name = "jd_text", columnDefinition = "LONGTEXT")
    private String jdText;

    @Column(name = "posted_date")
    private LocalDateTime postedDate;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}