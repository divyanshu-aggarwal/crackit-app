package com.crackit.interview.controller;

import com.crackit.interview.dto.InterviewSummaryResponse;
import com.crackit.interview.service.InterviewPrepService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewsController {
    private final InterviewPrepService interviewPrepService;

    @GetMapping
    public List<InterviewSummaryResponse> getMyInterviews() {
        return interviewPrepService.getMyInterviews();
    }
}