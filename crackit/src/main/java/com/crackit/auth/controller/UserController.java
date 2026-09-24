package com.crackit.auth.controller;

import com.crackit.auth.dto.UserProfileRequest;
import com.crackit.auth.dto.UserProfileResponse;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.payment.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/profile")
    public UserProfileResponse getProfile() {
        User user = getCurrentUser();
        return toResponse(user);
    }

    @PutMapping("/profile")
    public UserProfileResponse updateProfile(@RequestBody UserProfileRequest request) {
        User user = getCurrentUser();
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getLinkedinUrl() != null) user.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getGithubUrl() != null) user.setGithubUrl(request.getGithubUrl());
        if (request.getYearsExperience() != null) user.setYearsExperience(request.getYearsExperience());
        if (request.getCurrentCompany() != null) user.setCurrentCompany(request.getCurrentCompany());
        if (request.getCurrentRole() != null) user.setCurrentRole(request.getCurrentRole());
        if (request.getTargetRole() != null) user.setTargetRole(request.getTargetRole());
        if (request.getCurrentCtc() != null) user.setCurrentCtc(request.getCurrentCtc());
        if (request.getExpectedCtc() != null) user.setExpectedCtc(request.getExpectedCtc());
        if (request.getNoticePeriod() != null) user.setNoticePeriod(request.getNoticePeriod());
        if (request.getServingNotice() != null) user.setServingNotice(request.getServingNotice());
        if (request.getLastWorkingDay() != null) user.setLastWorkingDay(request.getLastWorkingDay());
        if (request.getPreferredWorkMode() != null) user.setPreferredWorkMode(request.getPreferredWorkMode());
        if (request.getPreferredLocations() != null) user.setPreferredLocations(request.getPreferredLocations());
        if (request.getEducation() != null) user.setEducation(request.getEducation());
        userRepository.save(user);
        return toResponse(user);
    }

    private UserProfileResponse toResponse(User user) {
        boolean proActive = subscriptionService.isProActive(user);
        int currentUsage = user.getAiUsageCount() != null ? user.getAiUsageCount() : 0;

        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .location(user.getLocation())
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .yearsExperience(user.getYearsExperience())
                .currentCompany(user.getCurrentCompany())
                .currentRole(user.getCurrentRole())
                .targetRole(user.getTargetRole())
                .currentCtc(user.getCurrentCtc())
                .expectedCtc(user.getExpectedCtc())
                .noticePeriod(user.getNoticePeriod())
                .servingNotice(user.getServingNotice())
                .lastWorkingDay(user.getLastWorkingDay())
                .preferredWorkMode(user.getPreferredWorkMode())
                .preferredLocations(user.getPreferredLocations())
                .education(user.getEducation())
                .subscriptionTier(user.getSubscriptionTier())
                .subscriptionStatus(user.getSubscriptionStatus())
                .subscriptionExpiresAt(user.getSubscriptionExpiresAt())
                .aiUsageCount(currentUsage)
                .aiUsageLimit(proActive ? -1 : SubscriptionService.FREE_AI_LIMIT)
                .isPro(proActive)
                .role(user.getRole() != null ? user.getRole().name() : "ROLE_USER")
                .build();
    }
}