package com.crackit.auth.dto;

import com.crackit.payment.enums.SubscriptionTier;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private String id;
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String linkedinUrl;
    private String githubUrl;
    private Integer yearsExperience;
    private String currentCompany;
    private String currentRole;

    private SubscriptionTier subscriptionTier;
    private String subscriptionStatus;
    private LocalDateTime subscriptionExpiresAt;
    private Integer aiUsageCount;
    private Integer aiUsageLimit;
    private Boolean isPro;
    private String role;
}