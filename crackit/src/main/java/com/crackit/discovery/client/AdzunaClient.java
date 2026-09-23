package com.crackit.discovery.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdzunaClient {

    private final RestTemplate restTemplate;

    @Value("${adzuna.app.id}")
    private String appId;

    @Value("${adzuna.app.key}")
    private String appKey;

    private static final String BASE = "https://api.adzuna.com/v1/api/jobs";

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> search(String keyword, String location, int page) {
        try {
            String country = "in";
            String url = UriComponentsBuilder
                    .fromHttpUrl(BASE + "/" + country + "/search/" + page)
                    .queryParam("app_id", appId)
                    .queryParam("app_key", appKey)
                    .queryParam("what", keyword)
                    .queryParam("where", location)
                    .queryParam("results_per_page", 20)
                    .build()
                    .toUriString();

            log.info("Adzuna URL: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, Map.class
            );

            log.info("Adzuna response: {}", response.getBody());

            if (response.getBody() == null) return List.of();
            return (List<Map<String, Object>>) response.getBody()
                    .getOrDefault("results", List.of());

        } catch (Exception e) {
            log.error("Adzuna search failed: {}", e.getMessage(), e);
            return List.of();
        }
    }
}