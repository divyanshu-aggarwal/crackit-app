package com.crackit.common.ratelimit.aspect;

import com.crackit.common.exception.RateLimitExceededException;
import com.crackit.common.ratelimit.annotation.RateLimit;
import com.crackit.common.ratelimit.dto.RateLimitResult;
import com.crackit.common.ratelimit.enums.RateLimitType;
import com.crackit.common.ratelimit.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimiterService rateLimiterService;

    @Around("@annotation(rateLimit)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
        HttpServletResponse response = attributes != null ? attributes.getResponse() : null;

        String clientIp = request != null ? extractClientIp(request) : "unknown";
        String userEmail = extractAuthenticatedUser();

        String identifier = resolveIdentifier(rateLimit.type(), clientIp, userEmail);

        RateLimitResult result = rateLimiterService.tryAcquire(
                rateLimit.key(),
                identifier,
                rateLimit.limit(),
                rateLimit.durationSeconds()
        );

        if (response != null) {
            response.setHeader("X-RateLimit-Limit", String.valueOf(result.limit()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, result.remaining())));
            response.setHeader("X-RateLimit-Reset", String.valueOf((System.currentTimeMillis() / 1000) + result.windowSeconds()));
        }

        if (!result.allowed()) {
            if (response != null) {
                response.setHeader("Retry-After", String.valueOf(result.retryAfterSeconds()));
            }
            log.warn("Rate limit exceeded for key '{}', identifier '{}'. Limit: {}, Retry-After: {}s",
                    rateLimit.key(), identifier, result.limit(), result.retryAfterSeconds());
            throw new RateLimitExceededException(result.limit(), result.windowSeconds(), result.retryAfterSeconds());
        }

        return joinPoint.proceed();
    }

    private String resolveIdentifier(RateLimitType type, String clientIp, String userEmail) {
        return switch (type) {
            case IP -> clientIp;
            case USER -> {
                if (userEmail == null) {
                    throw new AccessDeniedException("Authenticated user context required for rate limiting");
                }
                yield userEmail;
            }
            case USER_OR_IP -> (userEmail != null) ? "user:" + userEmail : "ip:" + clientIp;
        };
    }

    public static String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xForwardedFor) && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // First IP in proxy list is original client
            String[] parts = xForwardedFor.split(",");
            if (parts.length > 0 && StringUtils.hasText(parts[0])) {
                return parts[0].trim();
            }
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(xRealIp) && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp.trim();
        }

        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (StringUtils.hasText(cfConnectingIp) && !"unknown".equalsIgnoreCase(cfConnectingIp)) {
            return cfConnectingIp.trim();
        }

        return request.getRemoteAddr() != null ? request.getRemoteAddr().trim() : "127.0.0.1";
    }

    private String extractAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return authentication.getName();
        }
        return null;
    }
}
