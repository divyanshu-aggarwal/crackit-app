package com.crackit.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "prep_topics")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrepTopic {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "interview_prep_id", length = 36, nullable = false)
    private String interviewPrepId;

    @Column(nullable = false, length = 200)
    private String topic;

    @Column(length = 50)
    private String category; // Technical, Behavioral, System Design, etc.

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String notes;

    @Column(name = "is_completed")
    private Boolean isCompleted;

    @Column(name = "priority")
    private Integer priority; // 1=High, 2=Medium, 3=Low

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}