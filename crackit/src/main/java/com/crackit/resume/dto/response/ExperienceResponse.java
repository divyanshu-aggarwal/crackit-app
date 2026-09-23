package com.crackit.resume.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class ExperienceResponse {

    private String id;
    private String companyName;
    private String role;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean currentCompany;
    private String description;
    private String location;
    private List<ExperienceBulletResponse> bullets;
}