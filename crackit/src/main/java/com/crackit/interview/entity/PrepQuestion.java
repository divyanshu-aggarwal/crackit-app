package com.crackit.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "prep_questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrepQuestion {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "interview_prep_id", length = 36, nullable = false)
    private String interviewPrepId;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String question;

    @Column(length = 50)
    private String type; // Technical, Behavioral, Situational

    @Column(columnDefinition = "LONGTEXT")
    private String suggestedAnswer;

    @Column(name = "is_practiced")
    private Boolean isPracticed;

    @Column(name = "difficulty", length = 20)
    private String difficulty; // Easy, Medium, Hard

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}