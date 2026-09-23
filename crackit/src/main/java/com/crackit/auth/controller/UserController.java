package com.crackit.auth.controller;

import com.crackit.auth.dto.UserProfileRequest;
import com.crackit.auth.dto.UserProfileResponse;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

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
        userRepository.save(user);
        return toResponse(user);
    }

    private UserProfileResponse toResponse(User user) {
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
                .build();
    }
}