package com.crackit.discovery.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Component
@RequiredArgsConstructor
public class GeoDbClient {

    private final RestTemplate restTemplate;

    @Value("${geodb.api.key}")
    private String apiKey;

    @Value("${geodb.api.host}")
    private String host;

    private static final String BASE_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";

    @SuppressWarnings("unchecked")
    public List<String> searchCities(String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }

        String url = UriComponentsBuilder
                .fromHttpUrl(BASE_URL)
                .queryParam("namePrefix", query.trim())
                .queryParam("limit", 8)
                .queryParam("sort", "-population")
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-RapidAPI-Key", apiKey);
        headers.set("X-RapidAPI-Host", host);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        Map<String, Object> body = response.getBody();
        if (body == null || !(body.get("data") instanceof List<?> data)) {
            return List.of();
        }

        return data.stream()
                .filter(Map.class::isInstance)
                .map(item -> {
                    Map<String, Object> city = (Map<String, Object>) item;

                    String name = String.valueOf(city.getOrDefault("city", ""));
                    String region = String.valueOf(city.getOrDefault("region", ""));
                    String country = String.valueOf(city.getOrDefault("country", ""));

                    return List.of(name, region, country).stream()
                            .filter(v -> v != null && !v.isBlank() && !"null".equals(v))
                            .distinct()
                            .reduce((a, b) -> a + ", " + b)
                            .orElse("");
                })
                .filter(s -> !s.isBlank())
                .distinct()
                .limit(8)
                .toList();
    }
}