package com.crackit.common.ratelimit.dto;

/**
 * Result data carrier returned by RateLimiterService evaluation.
 */
public record RateLimitResult(
        boolean allowed,
        long remaining,
        long retryAfterSeconds,
        long limit,
        long windowSeconds
) {
    public static RateLimitResult allowed(long remaining, long limit, long windowSeconds) {
        return new RateLimitResult(true, remaining, 0, limit, windowSeconds);
    }

    public static RateLimitResult denied(long retryAfterSeconds, long limit, long windowSeconds) {
        return new RateLimitResult(false, 0, retryAfterSeconds, limit, windowSeconds);
    }

    public static RateLimitResult failOpen(long limit, long windowSeconds) {
        return new RateLimitResult(true, limit - 1, 0, limit, windowSeconds);
    }
}
