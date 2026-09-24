package com.crackit.ratelimit;

import com.crackit.common.exception.GlobalExceptionHandler;
import com.crackit.common.exception.RateLimitExceededException;
import com.crackit.common.ratelimit.annotation.RateLimit;
import com.crackit.common.ratelimit.aspect.RateLimitAspect;
import com.crackit.common.ratelimit.dto.RateLimitResult;
import com.crackit.common.ratelimit.enums.RateLimitType;
import com.crackit.common.ratelimit.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.annotation.Annotation;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimiterTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private RedisScript<List> slidingWindowScript;

    @Mock
    private ProceedingJoinPoint proceedingJoinPoint;

    @InjectMocks
    private RateLimiterService rateLimiterService;

    private RateLimitAspect rateLimitAspect;
    private final GlobalExceptionHandler globalExceptionHandler = new GlobalExceptionHandler();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(rateLimiterService, "slidingWindowScript", slidingWindowScript);
        rateLimitAspect = new RateLimitAspect(rateLimiterService);
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    @DisplayName("RateLimiterService: Returns allowed=true with remaining tokens when within limit")
    void testRateLimiterService_Allowed() {
        when(stringRedisTemplate.execute(
                eq(slidingWindowScript),
                anyList(),
                anyString(),
                anyString(),
                anyString(),
                anyString()
        )).thenReturn(List.of(1L, 4L, 0L));

        RateLimitResult result = rateLimiterService.tryAcquire("test_action", "127.0.0.1", 5, 60);

        assertTrue(result.allowed());
        assertEquals(4L, result.remaining());
        assertEquals(0L, result.retryAfterSeconds());
        assertEquals(5L, result.limit());
        assertEquals(60L, result.windowSeconds());
    }

    @Test
    @DisplayName("RateLimiterService: Returns allowed=false with exact retry-after when limit reached")
    void testRateLimiterService_Exceeded() {
        when(stringRedisTemplate.execute(
                eq(slidingWindowScript),
                anyList(),
                anyString(),
                anyString(),
                anyString(),
                anyString()
        )).thenReturn(List.of(0L, 0L, 34L));

        RateLimitResult result = rateLimiterService.tryAcquire("auth_login", "192.168.1.100", 5, 60);

        assertFalse(result.allowed());
        assertEquals(0L, result.remaining());
        assertEquals(34L, result.retryAfterSeconds());
        assertEquals(5L, result.limit());
    }

    @Test
    @DisplayName("RateLimiterService: Fails open when Redis connection crashes")
    void testRateLimiterService_FailOpenOnRedisError() {
        when(stringRedisTemplate.execute(
                eq(slidingWindowScript),
                anyList(),
                anyString(),
                anyString(),
                anyString(),
                anyString()
        )).thenThrow(new RedisConnectionFailureException("Redis connection timed out"));

        RateLimitResult result = rateLimiterService.tryAcquire("ai_tailor", "user@test.com", 10, 60);

        assertTrue(result.allowed(), "Should fail-open to preserve system availability during Redis outage");
        assertEquals(9L, result.remaining());
    }

    @Test
    @DisplayName("RateLimitAspect: Allows invocation and injects rate limit headers")
    void testAspect_AllowsAndSetsHeaders() throws Throwable {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.195");
        MockHttpServletResponse response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

        when(stringRedisTemplate.execute(any(), anyList(), any(), any(), any(), any()))
                .thenReturn(List.of(1L, 2L, 0L));
        when(proceedingJoinPoint.proceed()).thenReturn("success-response");

        RateLimit rateLimit = createRateLimit("test_key", 5, 60, RateLimitType.IP);

        Object aspectResult = rateLimitAspect.enforceRateLimit(proceedingJoinPoint, rateLimit);

        assertEquals("success-response", aspectResult);
        assertEquals("5", response.getHeader("X-RateLimit-Limit"));
        assertEquals("2", response.getHeader("X-RateLimit-Remaining"));
        assertNotNull(response.getHeader("X-RateLimit-Reset"));
    }

    @Test
    @DisplayName("RateLimitAspect: Rejects burst attack, sets Retry-After, and throws RateLimitExceededException")
    void testAspect_BlocksAndThrows() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.195");
        MockHttpServletResponse response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

        when(stringRedisTemplate.execute(any(), anyList(), any(), any(), any(), any()))
                .thenReturn(List.of(0L, 0L, 42L));

        RateLimit rateLimit = createRateLimit("auth_login", 5, 60, RateLimitType.IP);

        RateLimitExceededException exception = assertThrows(
                RateLimitExceededException.class,
                () -> rateLimitAspect.enforceRateLimit(proceedingJoinPoint, rateLimit)
        );

        assertEquals(5L, exception.getLimit());
        assertEquals(60L, exception.getWindowSeconds());
        assertEquals(42L, exception.getRetryAfterSeconds());
        assertEquals("42", response.getHeader("Retry-After"));
    }

    @Test
    @DisplayName("RateLimitAspect: Correctly extracts real client IP behind load balancers (X-Forwarded-For)")
    void testClientIpExtraction_Proxies() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.10, 10.0.0.1, 172.16.0.2");
        request.setRemoteAddr("10.0.0.1");

        String ip = RateLimitAspect.extractClientIp(request);
        assertEquals("203.0.113.10", ip);
    }

    @Test
    @DisplayName("RateLimitAspect: USER rate limit throws AccessDeniedException if unauthenticated")
    void testAspect_UserTypeRequiresAuth() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, new MockHttpServletResponse()));

        RateLimit rateLimit = createRateLimit("user_quota", 10, 60, RateLimitType.USER);

        assertThrows(AccessDeniedException.class, () ->
                rateLimitAspect.enforceRateLimit(proceedingJoinPoint, rateLimit)
        );
    }

    @Test
    @DisplayName("RateLimitAspect: Authenticated user uses user email for rate limiting")
    void testAspect_AuthenticatedUser() throws Throwable {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("vip@crackit.com", "pass")
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, new MockHttpServletResponse()));

        when(stringRedisTemplate.execute(any(), anyList(), any(), any(), any(), any()))
                .thenReturn(List.of(1L, 9L, 0L));
        when(proceedingJoinPoint.proceed()).thenReturn("user-success");

        RateLimit rateLimit = createRateLimit("ai_chat", 10, 60, RateLimitType.USER_OR_IP);

        Object result = rateLimitAspect.enforceRateLimit(proceedingJoinPoint, rateLimit);
        assertEquals("user-success", result);
    }

    @Test
    @DisplayName("GlobalExceptionHandler: Returns HTTP 429 Too Many Requests with headers and JSON body")
    void testGlobalExceptionHandler_RateLimitResponse() {
        RateLimitExceededException ex = new RateLimitExceededException(5, 60, 45);

        ResponseEntity<?> response = globalExceptionHandler.handleRateLimitExceededException(ex);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
        assertEquals("45", response.getHeaders().getFirst("Retry-After"));
        assertEquals("5", response.getHeaders().getFirst("X-RateLimit-Limit"));
        assertEquals("0", response.getHeaders().getFirst("X-RateLimit-Remaining"));

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("RATE_LIMIT_EXCEEDED", body.get("error"));
        assertEquals(5L, body.get("limit"));
        assertEquals(60L, body.get("windowSeconds"));
        assertEquals(45L, body.get("retryAfterSeconds"));
    }

    private RateLimit createRateLimit(String key, int limit, int durationSeconds, RateLimitType type) {
        return new RateLimit() {
            @Override
            public Class<? extends Annotation> annotationType() {
                return RateLimit.class;
            }

            @Override
            public String key() {
                return key;
            }

            @Override
            public int limit() {
                return limit;
            }

            @Override
            public int durationSeconds() {
                return durationSeconds;
            }

            @Override
            public RateLimitType type() {
                return type;
            }
        };
    }
}
