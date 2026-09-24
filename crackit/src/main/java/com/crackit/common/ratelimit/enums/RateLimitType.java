package com.crackit.common.ratelimit.enums;

public enum RateLimitType {
    /**
     * Rate limit strictly by client IP address.
     * Essential for unauthenticated endpoints (login, signup, OTP) to prevent credential stuffing.
     */
    IP,

    /**
     * Rate limit strictly by authenticated user email / ID.
     * Throws an exception if request is unauthenticated.
     */
    USER,

    /**
     * Rate limit by user email if logged in, otherwise fall back to client IP.
     * Ideal for endpoints accessible to both anonymous guests and registered users.
     */
    USER_OR_IP
}
