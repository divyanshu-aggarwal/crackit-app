package com.crackit.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_prep")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewPrep {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "job_id", length = 36, nullable = false)
    private String jobId;

    @Column(name = "overall_progress")
    private Integer overallProgress;

    @Column(columnDefinition = "LONGTEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private com.crackit.interview.enums.PrepStatus status = com.crackit.interview.enums.PrepStatus.COMPLETED;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}