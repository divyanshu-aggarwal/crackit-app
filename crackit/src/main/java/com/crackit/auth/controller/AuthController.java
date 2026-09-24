package com.crackit.auth.controller;

import com.crackit.auth.dto.AuthResponse;
import com.crackit.auth.dto.LoginRequest;
import com.crackit.auth.dto.SignupRequest;
import com.crackit.auth.service.AuthService;
import com.crackit.common.ratelimit.annotation.RateLimit;
import com.crackit.common.ratelimit.enums.RateLimitType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @RateLimit(key = "auth_signup", limit = 5, durationSeconds = 60, type = RateLimitType.IP)
    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @RateLimit(key = "auth_login", limit = 10, durationSeconds = 60, type = RateLimitType.IP)
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @RateLimit(key = "auth_google", limit = 10, durationSeconds = 60, type = RateLimitType.IP)
    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody com.crackit.auth.dto.GoogleAuthRequest request) {
        return authService.googleLogin(request);
    }
}