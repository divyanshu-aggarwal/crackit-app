package com.crackit.discovery.controller;

import com.crackit.discovery.dto.DiscoveredJobDto;
import com.crackit.discovery.service.JobDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/jobs/discover")
@RequiredArgsConstructor
public class JobDiscoveryController {

    private final JobDiscoveryService jobDiscoveryService;

    @GetMapping("/recommended")
    public List<DiscoveredJobDto> getRecommended() {
        return jobDiscoveryService.getRecommended();
    }

    @GetMapping("/search")
    public List<DiscoveredJobDto> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "India") String location
    ) {
        return jobDiscoveryService.search(keyword, location);
    }

    @GetMapping("/cached")
    public List<DiscoveredJobDto> getCached() {
        return jobDiscoveryService.getCached();
    }
}