package com.crackit.common.ratelimit.service;

import com.crackit.common.ratelimit.dto.RateLimitResult;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final StringRedisTemplate stringRedisTemplate;

    private RedisScript<List> slidingWindowScript;

    @PostConstruct
    public void init() {
        DefaultRedisScript<List> script = new DefaultRedisScript<>();
        script.setLocation(new ClassPathResource("scripts/sliding_window_rate_limit.lua"));
        script.setResultType(List.class);
        this.slidingWindowScript = script;
    }

    /**
     * Evaluates whether a request for a given key is permitted within the sliding window.
     *
     * @param featureKey      e.g. "auth_login"
     * @param identifier      e.g. client IP or user email
     * @param limit           max requests allowed in window
     * @param durationSeconds sliding window duration in seconds
     * @return RateLimitResult indicating allowed/denied, remaining tokens, and retry-after
     */
    public RateLimitResult tryAcquire(String featureKey, String identifier, int limit, int durationSeconds) {
        String redisKey = String.format("ratelimit:%s:%s", featureKey, identifier);
        long nowMs = System.currentTimeMillis();
        long windowMs = durationSeconds * 1000L;
        String member = nowMs + "-" + UUID.randomUUID();

        try {
            List<?> scriptResult = stringRedisTemplate.execute(
                    slidingWindowScript,
                    Collections.singletonList(redisKey),
                    String.valueOf(nowMs),
                    String.valueOf(windowMs),
                    String.valueOf(limit),
                    member
            );

            if (scriptResult == null || scriptResult.size() < 3) {
                log.warn("Redis rate limiter script returned invalid result for key '{}'. Failing open.", redisKey);
                return RateLimitResult.failOpen(limit, durationSeconds);
            }

            long allowed = ((Number) scriptResult.get(0)).longValue();
            long remaining = ((Number) scriptResult.get(1)).longValue();
            long retryAfterSeconds = ((Number) scriptResult.get(2)).longValue();

            if (allowed == 1L) {
                return RateLimitResult.allowed(remaining, limit, durationSeconds);
            } else {
                return RateLimitResult.denied(retryAfterSeconds, limit, durationSeconds);
            }

        } catch (Exception e) {
            // Fail-open: Redis downtime should not take down core business services
            log.warn("Redis rate limiter execution failed for key '{}': {}. Failing open to maintain service availability.",
                    redisKey, e.getMessage());
            return RateLimitResult.failOpen(limit, durationSeconds);
        }
    }
}
