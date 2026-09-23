package com.crackit.auth.service;

import com.crackit.auth.dto.AuthResponse;
import com.crackit.auth.dto.GoogleAuthRequest;
import com.crackit.auth.dto.LoginRequest;
import com.crackit.auth.dto.SignupRequest;
import com.crackit.auth.entity.User;
import com.crackit.auth.enums.Role;
import com.crackit.auth.repository.UserRepository;
import com.crackit.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate;

    public AuthResponse signup(SignupRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .fullName(request.getEffectiveFullName())
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .authProvider("LOCAL")
                .yearsExperience(request.getYearsExperience())
                .currentCompany(request.getCurrentCompany())
                .currentRole(request.getCurrentRole())
                .build();

        User savedUser = userRepository.save(user);

        String roleName = savedUser.getRole() != null ? savedUser.getRole().name() : "ROLE_USER";
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), roleName);

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(roleName)
                .authProvider(savedUser.getAuthProvider())
                .avatarUrl(savedUser.getAvatarUrl())
                .message("Signup successful")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (!passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String roleName = user.getRole() != null ? user.getRole().name() : "ROLE_USER";
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), roleName);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleName)
                .authProvider(user.getAuthProvider())
                .avatarUrl(user.getAvatarUrl())
                .message("Login successful")
                .build();
    }

    @SuppressWarnings("unchecked")
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        String idToken = request.getIdToken();
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google ID token cannot be empty");
        }

        try {
            // Verify Google ID token using Google's OIDC TokenInfo endpoint
            String googleVerifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            Map<String, Object> tokenInfo = restTemplate.getForObject(googleVerifyUrl, Map.class);

            if (tokenInfo == null || !tokenInfo.containsKey("email")) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google ID token");
            }

            String emailVerified = String.valueOf(tokenInfo.get("email_verified"));
            if (!"true".equalsIgnoreCase(emailVerified)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is not verified");
            }

            String email = ((String) tokenInfo.get("email")).trim().toLowerCase();
            String name = (String) tokenInfo.get("name");
            String picture = (String) tokenInfo.get("picture");
            String googleSub = (String) tokenInfo.get("sub");

            // Find existing user by email or register new user
            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                user = User.builder()
                        .id(UUID.randomUUID().toString())
                        .fullName(name != null && !name.isBlank() ? name : "Google User")
                        .email(email)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random unguessable hash for OAuth users
                        .role(Role.ROLE_USER)
                        .authProvider("GOOGLE")
                        .avatarUrl(picture)
                        .googleId(googleSub)
                        .build();
                log.info("[AUTH] Registered new user via Google Sign-In: {}", email);
            } else {
                // Link Google account and update avatar if changed
                if (picture != null && !picture.isBlank()) {
                    user.setAvatarUrl(picture);
                }
                user.setGoogleId(googleSub);
                log.info("[AUTH] Existing user signed in via Google: {}", email);
            }

            User savedUser = userRepository.save(user);

            String roleName = savedUser.getRole() != null ? savedUser.getRole().name() : "ROLE_USER";
            String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), roleName);

            return AuthResponse.builder()
                    .token(token)
                    .userId(savedUser.getId())
                    .fullName(savedUser.getFullName())
                    .email(savedUser.getEmail())
                    .role(roleName)
                    .authProvider("GOOGLE")
                    .avatarUrl(savedUser.getAvatarUrl())
                    .message("Google authentication successful")
                    .build();

        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception ex) {
            log.error("[AUTH] Google authentication verification failed: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google authentication failed: " + ex.getMessage());
        }
    }
}