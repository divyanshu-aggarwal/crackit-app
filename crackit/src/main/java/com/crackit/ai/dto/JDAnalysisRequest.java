package com.crackit.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
public class JDAnalysisRequest {
    private String jdText;
    private String summary;
    private List<Map<String, Object>> skills;
    private List<Map<String, Object>> experiences;
    private List<Map<String, Object>> projects;
}