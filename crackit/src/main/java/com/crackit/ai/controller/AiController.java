package com.crackit.ai.controller;

import com.crackit.ai.dto.JDAnalysisResponse;
import com.crackit.ai.dto.SavedJdAnalysisResponse;
import com.crackit.ai.dto.SavedTailoredResumeResponse;
import com.crackit.ai.service.AiIntegrationService;
import com.crackit.ai.service.ResumeTailoringService;
import com.crackit.common.ratelimit.annotation.RateLimit;
import com.crackit.common.ratelimit.enums.RateLimitType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiIntegrationService aiIntegrationService;
    private final ResumeTailoringService resumeTailoringService;

    @RateLimit(key = "ai_job_analyze", limit = 10, durationSeconds = 60, type = RateLimitType.USER_OR_IP)
    @PostMapping("/jobs/{jobId}/analyze")
    public SavedJdAnalysisResponse analyzeJob(@PathVariable String jobId) {
        return aiIntegrationService.analyzeJob(jobId);
    }

    @GetMapping("/jobs/{jobId}/analysis")
    public SavedJdAnalysisResponse getLatestAnalysisForJob(@PathVariable String jobId) {
        return aiIntegrationService.getLatestAnalysisForJob(jobId);
    }

    @RateLimit(key = "ai_tailor_resume", limit = 10, durationSeconds = 60, type = RateLimitType.USER_OR_IP)
    @PostMapping("/jobs/{jobId}/tailor-resume")
    public SavedTailoredResumeResponse tailorResume(@PathVariable String jobId) {
        return resumeTailoringService.tailorResume(jobId);
    }

    @GetMapping("/jobs/{jobId}/tailored-resume")
    public SavedTailoredResumeResponse getLatestTailoredResume(@PathVariable String jobId) {
        return resumeTailoringService.getLatestTailoredResume(jobId);
    }

    @GetMapping("/jobs/{jobId}/tailored-resume/download")
    public ResponseEntity<byte[]> downloadTailoredResume(@PathVariable String jobId) {
        byte[] pdf = aiIntegrationService.generateTailoredResumePdf(jobId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tailored-resume.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @RateLimit(key = "ai_quick_scan", limit = 5, durationSeconds = 60, type = RateLimitType.USER_OR_IP)
    @PostMapping("/quick-scan")
    public JDAnalysisResponse quickScan(@RequestBody Map<String, String> body) {
        String jdText = body.get("jdText");
        if (jdText == null || jdText.isBlank())
            throw new RuntimeException("JD text is required");
        return aiIntegrationService.quickScan(jdText);
    }
}