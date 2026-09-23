package com.crackit.discovery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_suggestion_dictionary")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobSuggestionDictionary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String value;

    @Column(nullable = false)
    private String category; // ROLE, SKILL, DOMAIN

    private Integer priority;
}