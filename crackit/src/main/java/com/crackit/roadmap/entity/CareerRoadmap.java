package com.crackit.roadmap.entity;

import com.crackit.roadmap.enums.RoadmapStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "career_roadmaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerRoadmap {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "current_role", length = 100)
    private String currentRole;

    @Column(name = "years_of_experience")
    private Double yearsOfExperience;

    @Column(name = "target_role", length = 100, nullable = false)
    private String targetRole;

    @Column(name = "target_compensation", length = 100)
    private String targetCompensation;

    @Column(name = "target_timeline_weeks")
    private Integer targetTimelineWeeks;

    @Column(name = "target_company_types", length = 255)
    private String targetCompanyTypes;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "overall_progress")
    @Builder.Default
    private Integer overallProgress = 0;

    @Lob
    @Column(name = "roadmap_json")
    private String roadmapJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private RoadmapStatus status = RoadmapStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
