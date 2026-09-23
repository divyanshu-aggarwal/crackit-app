package com.crackit.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {

    private String fullName;
    private String name;

    @Email(message = "Valid email address is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @jakarta.validation.constraints.Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    public String getEffectiveFullName() {
        if (fullName != null && !fullName.isBlank()) return fullName.trim();
        if (name != null && !name.isBlank()) return name.trim();
        return "User";
    }

    private Integer yearsExperience;

    private String currentCompany;

    private String currentRole;
}