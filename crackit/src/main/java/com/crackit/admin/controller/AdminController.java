package com.crackit.admin.controller;

import com.crackit.auth.repository.UserRepository;
import com.crackit.interview.repository.InterviewPrepRepository;
import com.crackit.tracker.repository.JobApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewPrepRepository interviewPrepRepository;

    @GetMapping("/system/metrics")
    public Map<String, Object> getSystemMetrics() {
        long totalUsers = userRepository.count();
        long totalApplications = jobApplicationRepository.count();
        long totalInterviewPreps = interviewPrepRepository.count();

        return Map.of(
                "totalUsers", totalUsers,
                "totalApplications", totalApplications,
                "totalInterviewPreps", totalInterviewPreps,
                "status", "HEALTHY",
                "securityMode", "RBAC_ACTIVE"
        );
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream().map(u -> Map.<String, Object>of(
                "id", u.getId(),
                "fullName", u.getFullName() != null ? u.getFullName() : "",
                "email", u.getEmail(),
                "role", u.getRole() != null ? u.getRole().name() : "ROLE_USER",
                "authProvider", u.getAuthProvider() != null ? u.getAuthProvider() : "LOCAL",
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        )).toList();
    }
}
