package com.crackit.discovery.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class DiscoveredJobDto {
    private String id;
    private String externalId;
    private String source;
    private String title;
    private String company;
    private String location;
    private String description;
    private String url;
    private Double salaryMin;
    private Double salaryMax;
    private Boolean remote;
    private String jobType;
    private LocalDateTime fetchedAt;
    private LocalDateTime postedAt;
}