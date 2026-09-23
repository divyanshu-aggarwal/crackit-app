package com.crackit.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String token;

    private String userId;

    private String fullName;

    private String email;

    private String role;

    private String avatarUrl;

    private String authProvider;

    private String message;
}