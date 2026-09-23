package com.crackit.resume.entity;

import com.crackit.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Column(length = 50)
    private String category;

    @Column(name = "proficiency_level", length = 20)
    private String proficiencyLevel;

    @Column(name = "years_used")
    private Integer yearsUsed;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}