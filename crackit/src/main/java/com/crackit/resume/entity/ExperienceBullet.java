package com.crackit.resume.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "experience_bullets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExperienceBullet {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id", nullable = false)
    private Experience experience;

    @Column(name = "bullet_text", nullable = false, columnDefinition = "LONGTEXT")
    private String bulletText;

    @Column(columnDefinition = "TEXT")
    private String technologies;

    @Column(name = "priority_score")
    private Integer priorityScore;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}