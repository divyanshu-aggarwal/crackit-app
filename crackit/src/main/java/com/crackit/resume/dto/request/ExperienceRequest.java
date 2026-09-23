package com.crackit.resume.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ExperienceRequest {
    private String companyName;
    private String role;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean currentCompany;
    private String description;
    private String location;
}