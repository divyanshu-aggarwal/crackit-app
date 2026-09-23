package com.crackit.tracker.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@Builder
public class DashboardResponse {
    private Map<String, Long> statusCounts;
    private List<JobApplicationResponse> applications;
}