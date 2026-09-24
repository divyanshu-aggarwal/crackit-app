package com.crackit.interview.controller;

import com.crackit.common.ratelimit.annotation.RateLimit;
import com.crackit.common.ratelimit.enums.RateLimitType;
import com.crackit.interview.dto.*;
import com.crackit.interview.service.InterviewPrepService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/jobs")
@RequiredArgsConstructor
public class InterviewPrepController {

    private final InterviewPrepService interviewPrepService;

    @RateLimit(key = "interview_prep_generate", limit = 10, durationSeconds = 60, type = RateLimitType.USER_OR_IP)
    @PostMapping("/{jobId}/interview-prep")
    public InterviewPrepResponse generatePrep(@PathVariable String jobId) {
        return interviewPrepService.generatePrep(jobId);
    }

    @GetMapping("/{jobId}/interview-prep")
    public InterviewPrepResponse getPrep(@PathVariable String jobId) {
        return interviewPrepService.getPrep(jobId);
    }

    @PutMapping("/{jobId}/interview-prep/notes")
    public InterviewPrepResponse updateNotes(@PathVariable String jobId, @RequestBody UpdateNotesRequest request) {
        return interviewPrepService.updateNotes(jobId, request);
    }

    @PostMapping("/{jobId}/interview-prep/topics")
    public PrepTopicDto addTopic(@PathVariable String jobId, @RequestBody UpdateTopicRequest request) {
        return interviewPrepService.addTopic(jobId, request);
    }

    @PutMapping("/interview-prep/topics/{topicId}")
    public PrepTopicDto updateTopic(@PathVariable String topicId, @RequestBody UpdateTopicRequest request) {
        return interviewPrepService.updateTopic(topicId, request);
    }

    @DeleteMapping("/interview-prep/topics/{topicId}")
    public void deleteTopic(@PathVariable String topicId) {
        interviewPrepService.deleteTopic(topicId);
    }

    @PutMapping("/interview-prep/questions/{questionId}")
    public PrepQuestionDto updateQuestion(@PathVariable String questionId, @RequestBody UpdateQuestionRequest request) {
        return interviewPrepService.updateQuestion(questionId, request);
    }

    @RateLimit(key = "interview_chat", limit = 20, durationSeconds = 60, type = RateLimitType.USER_OR_IP)
    @PostMapping("/{jobId}/chat")
    public ChatResponse chat(@PathVariable String jobId, @RequestBody ChatRequest request) {
        return interviewPrepService.chat(jobId, request.getMessage());
    }


    @GetMapping("/{jobId}/chat/history")
    public List<ChatMessageDto> getChatHistory(@PathVariable String jobId) {
        return interviewPrepService.getChatHistory(jobId);
    }

    @DeleteMapping("/{jobId}/chat/history")
    public void clearChatHistory(@PathVariable String jobId) {
        interviewPrepService.clearHistory(jobId);
    }
}