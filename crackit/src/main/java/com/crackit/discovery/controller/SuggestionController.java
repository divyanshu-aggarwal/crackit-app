package com.crackit.discovery.controller;

import com.crackit.discovery.service.SuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;

    @GetMapping("/keywords")
    public List<String> keywordSuggestions(@RequestParam String q) {
        return suggestionService.keywordSuggestions(q);
    }

    @GetMapping("/locations")
    public List<String> locationSuggestions(@RequestParam String q) {
        return suggestionService.locationSuggestions(q);
    }
}