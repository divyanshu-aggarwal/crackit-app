package com.crackit.common.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Proactive keep-alive scheduler to prevent free-tier hosting (Render) from spinning down
 * due to 15-minute inactivity timeouts.
 *
 * Render spins down web services if no incoming HTTP traffic traverses the public router
 * for 15 minutes. By initiating an outbound HTTP request every 10 minutes to its own
 * public URL (injected by Render as RENDER_EXTERNAL_URL) and to the Python AI service,
 * inbound network traffic is registered at the Render edge proxy, keeping instances warm.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "keepalive.enabled", havingValue = "true", matchIfMissing = true)
public class KeepAliveScheduler {

    private final RestTemplate restTemplate;

    @Value("${keepalive.backend-url:${RENDER_EXTERNAL_URL:}}")
    private String backendUrl;

    @Value("${ai.service.url:http://localhost:8000/api/ai}")
    private String aiServiceUrl;

    // Runs every 10 minutes (600,000 ms) with an initial delay of 2 minutes (120,000 ms)
    @Scheduled(fixedDelay = 600000, initialDelay = 120000)
    public void pingServicesToPreventInactivity() {
        // 1. Ping self via public domain (if running in deployed environment)
        if (backendUrl != null && !backendUrl.isBlank() && !backendUrl.contains("localhost")) {
            try {
                String targetHealthUrl = backendUrl.endsWith("/") ? backendUrl + "api/health" : backendUrl + "/api/health";
                log.info("Executing keep-alive ping to Backend URL: {}", targetHealthUrl);
                restTemplate.getForObject(targetHealthUrl, String.class);
            } catch (Exception e) {
                log.warn("Backend keep-alive ping failed (non-critical): {}", e.getMessage());
            }
        }

        // 2. Ping FastAPI AI service to keep it warm as well
        if (aiServiceUrl != null && !aiServiceUrl.isBlank() && !aiServiceUrl.contains("localhost")) {
            try {
                String baseAiUrl = aiServiceUrl.replaceAll("/api/ai/?$", "");
                String aiHealthUrl = baseAiUrl + "/health";
                log.info("Executing keep-alive ping to AI Service URL: {}", aiHealthUrl);
                restTemplate.getForObject(aiHealthUrl, String.class);
            } catch (Exception e) {
                log.warn("AI service keep-alive ping failed (non-critical): {}", e.getMessage());
            }
        }
    }
}
