package com.crackit.auth.controller;

import com.crackit.auth.dto.AuthResponse;
import com.crackit.auth.dto.LoginRequest;
import com.crackit.auth.dto.SignupRequest;
import com.crackit.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody com.crackit.auth.dto.GoogleAuthRequest request) {
        return authService.googleLogin(request);
    }
}