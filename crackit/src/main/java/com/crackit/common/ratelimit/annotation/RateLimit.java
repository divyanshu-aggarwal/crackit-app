package com.crackit.common.ratelimit.annotation;

import com.crackit.common.ratelimit.enums.RateLimitType;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to enforce distributed sliding-window rate limiting on controller endpoints.
 * Backed by Redis Sorted Sets (ZSET) executed atomically via Lua script.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {

    /**
     * Unique identifier prefix for the rate limit namespace (e.g., "auth_login", "ai_tailor").
     */
    String key();

    /**
     * Maximum number of requests allowed within the sliding window duration.
     */
    int limit();

    /**
     * Duration of the sliding window in seconds. Default is 60 seconds (1 minute).
     */
    int durationSeconds() default 60;

    /**
     * Strategy for identifying the client: IP, USER, or USER_OR_IP.
     */
    RateLimitType type() default RateLimitType.USER_OR_IP;
}
