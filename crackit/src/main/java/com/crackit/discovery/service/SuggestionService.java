package com.crackit.discovery.service;

import com.crackit.discovery.client.GeoDbClient;
import com.crackit.discovery.repository.DiscoveredJobRepository;
import com.crackit.discovery.repository.JobSuggestionDictionaryRepository;
import com.crackit.jobs.repository.JobRepository;
import com.crackit.resume.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final JobRepository jobRepository;
    private final SkillRepository skillRepository;
    private final DiscoveredJobRepository discoveredJobRepository;
    private final GeoDbClient geoDbClient;
    private final JobSuggestionDictionaryRepository dictionaryRepository;

    public List<String> keywordSuggestions(String q) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }

        String query = q.trim().toLowerCase();

        record Suggestion(String value, int priority) {}

        List<Suggestion> raw = new ArrayList<>();

        // Highest priority → user resume skills
        skillRepository.findTopSkillNames(q)
                .forEach(s -> raw.add(new Suggestion(s, 1)));

        // Saved jobs
        jobRepository.findTopTitles(q)
                .forEach(s -> raw.add(new Suggestion(s, 2)));

        dictionaryRepository.findSuggestions(q)
                .forEach(s -> raw.add(new Suggestion(s, 3)));

        // Discovered jobs
        discoveredJobRepository.findTopTitles(q)
                .forEach(s -> raw.add(new Suggestion(s, 4)));

        return raw.stream()
                .filter(s -> s.value() != null)
                .map(s -> new Suggestion(s.value().trim(), s.priority()))
                .filter(s -> !s.value().isBlank())

                // remove noisy titles
                .filter(s -> s.value().length() <= 45)
                .filter(s -> !s.value().contains("/"))
                .filter(s -> !s.value().contains("("))
                .filter(s -> !s.value().toLowerCase().contains("contract"))
                .filter(s -> !s.value().toLowerCase().contains("month"))

                // dedupe while keeping best priority
                .collect(Collectors.toMap(
                        s -> s.value().toLowerCase(),
                        s -> s,
                        (a, b) -> a.priority() <= b.priority() ? a : b
                ))
                .values()
                .stream()

                // ranking
                .sorted((a, b) -> {
                    boolean aStarts = a.value().toLowerCase().startsWith(query);
                    boolean bStarts = b.value().toLowerCase().startsWith(query);

                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;

                    if (a.priority() != b.priority()) {
                        return Integer.compare(a.priority(), b.priority());
                    }

                    return Integer.compare(a.value().length(), b.value().length());
                })

                .map(Suggestion::value)
                .limit(8)
                .toList();
    }

    public List<String> locationSuggestions(String q) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }

        List<String> suggestions = new ArrayList<>();

        suggestions.addAll(jobRepository.findTopLocations(q));
        suggestions.addAll(discoveredJobRepository.findTopLocations(q));
        suggestions.addAll(geoDbClient.searchCities(q));

        if ("remote".contains(q.toLowerCase())) {
            suggestions.add("Remote");
        }

        return suggestions.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .limit(10)
                .toList();
    }
}