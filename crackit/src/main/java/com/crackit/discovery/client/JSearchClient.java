package com.crackit.discovery.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class JSearchClient {

    private final RestTemplate restTemplate;

    @Value("${jsearch.api.key}")
    private String apiKey;

    private static final String BASE = "https://jsearch.p.rapidapi.com/search";

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> search(String keyword, String location) {
        try {
            String query = keyword + " in " + location;
            String url = UriComponentsBuilder
                    .fromHttpUrl(BASE)
                    .queryParam("query", query)
                    .queryParam("page", "1")
                    .queryParam("num_pages", "1")
                    .queryParam("date_posted", "month")
                    .build()
                    .toUriString();

            log.info("JSearch URL: {}", url);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-RapidAPI-Key", apiKey);
            headers.set("X-RapidAPI-Host", "jsearch.p.rapidapi.com");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

            List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().getOrDefault("data", List.of());
            if (!data.isEmpty()) {
                log.info("JSearch sample job fields: {}", data.get(0).keySet());
                log.info("JSearch sample job: {}", data.get(0));
            }
            return data;
        } catch (Exception e) {
            log.error("JSearch search failed: {}", e.getMessage());
            return List.of();
        }
    }
}