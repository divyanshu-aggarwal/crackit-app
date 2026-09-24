package com.crackit.common;

import com.crackit.common.controller.HealthController;
import com.crackit.common.scheduler.KeepAliveScheduler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HealthAndKeepAliveTest {

    @Mock
    private RestTemplate restTemplate;

    @Test
    @DisplayName("HealthController should return status UP and service name")
    void testHealthEndpointReturnsUp() {
        HealthController controller = new HealthController();
        ResponseEntity<Map<String, Object>> response = controller.health();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().get("status"));
        assertEquals("crackit-core-backend", response.getBody().get("service"));
        assertNotNull(response.getBody().get("timestamp"));
    }

    @Test
    @DisplayName("KeepAliveScheduler should ping external backend and AI URLs when configured")
    void testKeepAliveSchedulerPingsExternalUrls() {
        KeepAliveScheduler scheduler = new KeepAliveScheduler(restTemplate);
        ReflectionTestUtils.setField(scheduler, "backendUrl", "https://crackit-backend.onrender.com");
        ReflectionTestUtils.setField(scheduler, "aiServiceUrl", "https://crackit-ai-service.onrender.com/api/ai");

        scheduler.pingServicesToPreventInactivity();

        verify(restTemplate, times(1))
                .getForObject(eq("https://crackit-backend.onrender.com/api/health"), eq(String.class));
        verify(restTemplate, times(1))
                .getForObject(eq("https://crackit-ai-service.onrender.com/health"), eq(String.class));
    }

    @Test
    @DisplayName("KeepAliveScheduler should skip pinging when backend is localhost or blank")
    void testKeepAliveSchedulerSkipsLocalhost() {
        KeepAliveScheduler scheduler = new KeepAliveScheduler(restTemplate);
        ReflectionTestUtils.setField(scheduler, "backendUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(scheduler, "aiServiceUrl", "http://localhost:8000/api/ai");

        scheduler.pingServicesToPreventInactivity();

        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("KeepAliveScheduler should gracefully swallow exceptions without throwing")
    void testKeepAliveSchedulerGracefullyHandlesErrors() {
        KeepAliveScheduler scheduler = new KeepAliveScheduler(restTemplate);
        ReflectionTestUtils.setField(scheduler, "backendUrl", "https://crackit-backend.onrender.com");
        ReflectionTestUtils.setField(scheduler, "aiServiceUrl", "https://crackit-ai-service.onrender.com/api/ai");

        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection timed out (warming up dyno)"));

        assertDoesNotThrow(scheduler::pingServicesToPreventInactivity);
    }
}
