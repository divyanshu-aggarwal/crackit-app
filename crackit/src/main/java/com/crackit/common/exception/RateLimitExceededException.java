package com.crackit.common.exception;

import lombok.Getter;

/**
 * Thrown when an incoming request exceeds the configured sliding window quota.
 * Caught by GlobalExceptionHandler to return HTTP 429 Too Many Requests with Retry-After header.
 */
@Getter
public class RateLimitExceededException extends RuntimeException {

    private final long limit;
    private final long windowSeconds;
    private final long retryAfterSeconds;

    public RateLimitExceededException(long limit, long windowSeconds, long retryAfterSeconds) {
        super(String.format("Rate limit exceeded. Maximum %d requests allowed every %ds. Please retry in %ds.",
                limit, windowSeconds, retryAfterSeconds));
        this.limit = limit;
        this.windowSeconds = windowSeconds;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
