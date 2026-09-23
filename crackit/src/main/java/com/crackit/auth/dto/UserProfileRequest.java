package com.crackit.auth.dto;

import lombok.Data;

@Data
public class UserProfileRequest {
    private String fullName;
    private String phone;
    private String location;
    private String linkedinUrl;
    private String githubUrl;
    private Integer yearsExperience;
    private String currentCompany;
    private String currentRole;
}