package com.crackit.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@EnableCaching
public class RedisConfig implements CachingConfigurer {

    @Bean
    public RedisCacheConfiguration defaultCacheConfiguration(ObjectMapper objectMapper) {
        // Clone ObjectMapper to safely register Java 8 time module (LocalDate, LocalDateTime)
        ObjectMapper redisMapper = objectMapper.copy();
        redisMapper.registerModule(new JavaTimeModule());
        redisMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(redisMapper);

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10)) // Default TTL: 10 minutes
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer)
                );
    }

    @Bean
    public RedisCacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            RedisCacheConfiguration defaultCacheConfig
    ) {
        // Per-cache specific TTL overrides
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Job search queries: cache for 15 minutes
        cacheConfigurations.put("discoveredJobs", defaultCacheConfig.entryTtl(Duration.ofMinutes(15)));

        // Job details: cache for 30 minutes
        cacheConfigurations.put("jobDetails", defaultCacheConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultCacheConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean
    public org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper
    ) {
        ObjectMapper redisMapper = objectMapper.copy();
        redisMapper.registerModule(new JavaTimeModule());
        redisMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(redisMapper);

        org.springframework.data.redis.core.RedisTemplate<String, Object> template =
                new org.springframework.data.redis.core.RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * Graceful Degradation / Fault Tolerance:
     * If Redis is down, unreachable, or times out, Spring will NOT throw an HTTP 500 error.
     * It logs a warning and transparently falls back to querying the database directly.
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis GET failed for cache '{}', key '{}'. Falling back to database: {}",
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Redis PUT failed for cache '{}', key '{}': {}",
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis EVICT failed for cache '{}', key '{}': {}",
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Redis CLEAR failed for cache '{}': {}",
                        cache.getName(), exception.getMessage());
            }
        };
    }
}
