package com.crackit.interview.service;

import com.crackit.ai.client.AiServiceClient;
import com.crackit.ai.entity.JdAnalysis;
import com.crackit.ai.repository.JdAnalysisRepository;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.interview.dto.*;
import com.crackit.interview.entity.*;
import com.crackit.interview.repository.*;
import com.crackit.jobs.entity.Job;
import com.crackit.jobs.repository.JobRepository;
import com.crackit.resume.entity.Experience;
import com.crackit.resume.entity.Skill;
import com.crackit.resume.repository.ExperienceRepository;
import com.crackit.resume.repository.SkillRepository;
import com.crackit.tracker.entity.JobApplication;
import com.crackit.tracker.enums.ApplicationStatus;
import com.crackit.tracker.repository.JobApplicationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crackit.interview.enums.PrepStatus;
import com.crackit.kafka.event.InterviewPrepRequestEvent;
import com.crackit.kafka.producer.InterviewPrepProducer;
import org.springframework.beans.factory.annotation.Value;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewPrepService {

    private final InterviewPrepRepository interviewPrepRepository;
    private final PrepTopicRepository prepTopicRepository;
    private final PrepQuestionRepository prepQuestionRepository;
    private final JdAnalysisRepository jdAnalysisRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;
    private final JobApplicationRepository jobApplicationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final Optional<InterviewPrepProducer> interviewPrepProducer;
    private final com.crackit.payment.service.SubscriptionService subscriptionService;

    @Value("${kafka.enabled:true}")
    private boolean kafkaEnabled;

    private User getLoggedInUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public InterviewPrepResponse generatePrep(String jobId) {
        User user = getLoggedInUser();
        subscriptionService.checkAndIncrementAiQuota(user);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        JdAnalysis analysis = jdAnalysisRepository.findTopByJobIdOrderByCreatedAtDesc(jobId)
                .orElseThrow(() -> new RuntimeException("JD Analysis not found — analyse JD first"));

        List<Skill> skills = skillRepository.findByUserId(user.getId());
        List<Experience> experiences = experienceRepository.findByUserId(user.getId());

        // Build payload for Python
        Map<String, Object> payload = new HashMap<>();
        payload.put("jobTitle", job.getTitle());
        payload.put("companyName", job.getCompanyName());
        payload.put("requiredSkills", fromJson(analysis.getRequiredSkills()));
        payload.put("preferredSkills", fromJson(analysis.getPreferredSkills()));
        payload.put("importantTopics", fromJson(analysis.getImportantTopics()));
        payload.put("experienceLevel", analysis.getExperienceLevel());
        payload.put("aiSummary", analysis.getAiSummary());
        payload.put("userSkills", skills.stream().map(Skill::getSkillName).toList());
        payload.put("userExperiences", experiences.stream().map(e ->
                e.getRole() + " at " + e.getCompanyName()).toList());

        // Find or create prep record
        InterviewPrep prep = interviewPrepRepository.findByJobIdAndUserId(jobId, user.getId())
                .orElseGet(() -> InterviewPrep.builder()
                        .id(UUID.randomUUID().toString())
                        .userId(user.getId())
                        .jobId(jobId)
                        .overallProgress(0)
                        .build());

        // If Kafka is enabled and producer is present, execute asynchronously via Kafka!
        if (kafkaEnabled && interviewPrepProducer.isPresent()) {
            prep.setStatus(PrepStatus.PENDING);
            prep.setErrorMessage(null);
            interviewPrepRepository.save(prep);

            InterviewPrepRequestEvent event = InterviewPrepRequestEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .prepId(prep.getId())
                    .jobId(jobId)
                    .userId(user.getId())
                    .payload(payload)
                    .createdAt(Instant.now())
                    .build();

            interviewPrepProducer.get().sendInterviewPrepRequest(event);
            return buildResponse(prep);
        }

        // Synchronous fallback (e.g. if Kafka is disabled)
        prep.setStatus(PrepStatus.IN_PROGRESS);
        prep.setErrorMessage(null);
        interviewPrepRepository.save(prep);

        Map<String, Object> result = aiServiceClient.generateInterviewPrep(payload);

        // Delete existing topics & questions if regenerating
        prepTopicRepository.findByInterviewPrepIdOrderByPriorityAsc(prep.getId())
                .forEach(prepTopicRepository::delete);
        prepQuestionRepository.findByInterviewPrepIdOrderByTypeAsc(prep.getId())
                .forEach(prepQuestionRepository::delete);

        // Save topics
        List<Map<String, Object>> topics = (List<Map<String, Object>>) result.get("topics");
        if (topics != null) {
            int priority = 1;
            for (Map<String, Object> t : topics) {
                PrepTopic topic = PrepTopic.builder()
                        .id(UUID.randomUUID().toString())
                        .interviewPrepId(prep.getId())
                        .topic((String) t.get("topic"))
                        .category((String) t.get("category"))
                        .description((String) t.get("description"))
                        .isCompleted(false)
                        .priority(priority++)
                        .build();
                prepTopicRepository.save(topic);
            }
        }

        // Save questions
        List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
        if (questions != null) {
            for (Map<String, Object> q : questions) {
                PrepQuestion question = PrepQuestion.builder()
                        .id(UUID.randomUUID().toString())
                        .interviewPrepId(prep.getId())
                        .question((String) q.get("question"))
                        .type((String) q.get("type"))
                        .suggestedAnswer((String) q.get("suggestedAnswer"))
                        .isPracticed(false)
                        .difficulty((String) q.get("difficulty"))
                        .build();
                prepQuestionRepository.save(question);
            }
        }

        prep.setStatus(PrepStatus.COMPLETED);
        prep.setOverallProgress(0);
        interviewPrepRepository.save(prep);

        return buildResponse(prep);
    }

    public InterviewPrepResponse getPrep(String jobId) {
        User user = getLoggedInUser();
        InterviewPrep prep = interviewPrepRepository.findByJobIdAndUserId(jobId, user.getId())
                .orElse(null);
        if (prep == null) return null;
        return buildResponse(prep);
    }

    public PrepTopicDto updateTopic(String topicId, UpdateTopicRequest request) {
        PrepTopic topic = prepTopicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));
        if (request.getTopic() != null) topic.setTopic(request.getTopic());
        if (request.getCategory() != null) topic.setCategory(request.getCategory());
        if (request.getDescription() != null) topic.setDescription(request.getDescription());
        if (request.getNotes() != null) topic.setNotes(request.getNotes());
        if (request.getIsCompleted() != null) {
            topic.setIsCompleted(request.getIsCompleted());
            updateProgress(topic.getInterviewPrepId());
        }
        if (request.getPriority() != null) topic.setPriority(request.getPriority());
        prepTopicRepository.save(topic);
        return toTopicDto(topic);
    }

    public PrepQuestionDto updateQuestion(String questionId, UpdateQuestionRequest request) {
        PrepQuestion question = prepQuestionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        if (request.getSuggestedAnswer() != null) question.setSuggestedAnswer(request.getSuggestedAnswer());
        if (request.getIsPracticed() != null) question.setIsPracticed(request.getIsPracticed());
        prepQuestionRepository.save(question);
        return toQuestionDto(question);
    }

    public InterviewPrepResponse updateNotes(String jobId, UpdateNotesRequest request) {
        User user = getLoggedInUser();
        InterviewPrep prep = interviewPrepRepository.findByJobIdAndUserId(jobId, user.getId())
                .orElseThrow(() -> new RuntimeException("Prep not found"));
        prep.setNotes(request.getNotes());
        interviewPrepRepository.save(prep);
        return buildResponse(prep);
    }

    public PrepTopicDto addTopic(String jobId, UpdateTopicRequest request) {
        User user = getLoggedInUser();
        InterviewPrep prep = interviewPrepRepository.findByJobIdAndUserId(jobId, user.getId())
                .orElseThrow(() -> new RuntimeException("Prep not found"));
        PrepTopic topic = PrepTopic.builder()
                .id(UUID.randomUUID().toString())
                .interviewPrepId(prep.getId())
                .topic(request.getTopic())
                .category(request.getCategory())
                .description(request.getDescription())
                .isCompleted(false)
                .priority(request.getPriority() != null ? request.getPriority() : 3)
                .build();
        prepTopicRepository.save(topic);
        return toTopicDto(topic);
    }

    public void deleteTopic(String topicId) {
        prepTopicRepository.deleteById(topicId);
    }

    private void updateProgress(String prepId) {
        List<PrepTopic> topics = prepTopicRepository.findByInterviewPrepIdOrderByPriorityAsc(prepId);
        if (topics.isEmpty()) return;
        long completed = topics.stream().filter(t -> Boolean.TRUE.equals(t.getIsCompleted())).count();
        int progress = (int) ((completed * 100) / topics.size());
        InterviewPrep prep = interviewPrepRepository.findById(prepId).orElse(null);
        if (prep != null) {
            prep.setOverallProgress(progress);
            interviewPrepRepository.save(prep);
        }
    }

    private InterviewPrepResponse buildResponse(InterviewPrep prep) {
        InterviewPrepResponse response = new InterviewPrepResponse();
        response.setId(prep.getId());
        response.setJobId(prep.getJobId());
        response.setOverallProgress(prep.getOverallProgress());
        response.setNotes(prep.getNotes());
        response.setStatus(prep.getStatus());
        response.setErrorMessage(prep.getErrorMessage());
        response.setTopics(prepTopicRepository.findByInterviewPrepIdOrderByPriorityAsc(prep.getId())
                .stream().map(this::toTopicDto).toList());
        response.setQuestions(prepQuestionRepository.findByInterviewPrepIdOrderByTypeAsc(prep.getId())
                .stream().map(this::toQuestionDto).toList());
        return response;
    }

    private PrepTopicDto toTopicDto(PrepTopic t) {
        PrepTopicDto dto = new PrepTopicDto();
        dto.setId(t.getId());
        dto.setTopic(t.getTopic());
        dto.setCategory(t.getCategory());
        dto.setDescription(t.getDescription());
        dto.setNotes(t.getNotes());
        dto.setIsCompleted(t.getIsCompleted());
        dto.setPriority(t.getPriority());
        return dto;
    }

    private PrepQuestionDto toQuestionDto(PrepQuestion q) {
        PrepQuestionDto dto = new PrepQuestionDto();
        dto.setId(q.getId());
        dto.setQuestion(q.getQuestion());
        dto.setType(q.getType());
        dto.setSuggestedAnswer(q.getSuggestedAnswer());
        dto.setIsPracticed(q.getIsPracticed());
        dto.setDifficulty(q.getDifficulty());
        return dto;
    }

    private List<String> fromJson(String json) {
        if (json == null) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    public List<InterviewSummaryResponse> getMyInterviews() {
        User user = getLoggedInUser();

        List<JobApplication> interviewApps = jobApplicationRepository
                .findByUserIdAndStatus(user.getId(), ApplicationStatus.INTERVIEW);

        return interviewApps.stream().map(app -> {
            Job job = app.getJob(); // directly from the entity
            if (job == null) return null;

            Optional<InterviewPrep> prep = interviewPrepRepository
                    .findByJobIdAndUserId(job.getId(), user.getId());

            if (prep.isPresent()) {
                List<PrepTopic> topics = prepTopicRepository
                        .findByInterviewPrepIdOrderByPriorityAsc(prep.get().getId());
                List<PrepQuestion> questions = prepQuestionRepository
                        .findByInterviewPrepIdOrderByTypeAsc(prep.get().getId());

                long completedTopics = topics.stream()
                        .filter(t -> Boolean.TRUE.equals(t.getIsCompleted())).count();
                long practicedQuestions = questions.stream()
                        .filter(q -> Boolean.TRUE.equals(q.getIsPracticed())).count();

                return InterviewSummaryResponse.builder()
                        .prepId(prep.get().getId())
                        .jobId(job.getId())
                        .jobTitle(job.getTitle())
                        .companyName(job.getCompanyName())
                        .location(job.getLocation())
                        .overallProgress(prep.get().getOverallProgress())
                        .totalTopics(topics.size())
                        .completedTopics((int) completedTopics)
                        .totalQuestions(questions.size())
                        .practicedQuestions((int) practicedQuestions)
                        .prepGenerated(true)
                        .updatedAt(prep.get().getUpdatedAt())
                        .build();
            } else {
                return InterviewSummaryResponse.builder()
                        .prepId(null)
                        .jobId(job.getId())
                        .jobTitle(job.getTitle())
                        .companyName(job.getCompanyName())
                        .location(job.getLocation())
                        .overallProgress(0)
                        .totalTopics(0)
                        .completedTopics(0)
                        .totalQuestions(0)
                        .practicedQuestions(0)
                        .prepGenerated(false)
                        .updatedAt(null)
                        .build();
            }
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    public ChatResponse chat(String jobId, String message) {
        User user = getLoggedInUser();

        // load context
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        JdAnalysis analysis = jdAnalysisRepository
                .findTopByJobIdOrderByCreatedAtDesc(jobId).orElse(null);

        InterviewPrep prep = interviewPrepRepository
                .findByJobIdAndUserId(jobId, user.getId()).orElse(null);

        List<PrepTopic> topics = prep != null
                ? prepTopicRepository.findByInterviewPrepIdOrderByPriorityAsc(prep.getId())
                : List.of();

        // load chat history
        List<ChatMessage> history = chatMessageRepository
                .findByJobIdAndUserIdOrderByCreatedAtAsc(jobId, user.getId());

        // build history for AI
        List<Map<String, String>> historyForAi = history.stream()
                .map(m -> Map.of("role", m.getRole(), "content", m.getContent()))
                .collect(Collectors.toList());

        // build payload for Python
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", message);
        payload.put("history", historyForAi);
        payload.put("jobTitle", job.getTitle());
        payload.put("companyName", job.getCompanyName());
        payload.put("requiredSkills", analysis != null ? fromJson(analysis.getRequiredSkills()) : List.of());
        payload.put("experienceLevel", analysis != null ? analysis.getExperienceLevel() : "");
        payload.put("aiSummary", analysis != null ? analysis.getAiSummary() : "");
        payload.put("topics", topics.stream().map(t -> t.getTopic()).collect(Collectors.toList()));
        payload.put("userFullName", user.getFullName());

        // call Python
        Map<String, Object> result = aiServiceClient.interviewChat(payload);
        String reply = (String) result.get("reply");

        // save user message
        chatMessageRepository.save(ChatMessage.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .jobId(jobId)
                .role("user")
                .content(message)
                .build());

        // save assistant reply
        chatMessageRepository.save(ChatMessage.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .jobId(jobId)
                .role("assistant")
                .content(reply)
                .build());

        // return reply + full history
        List<ChatMessageDto> fullHistory = chatMessageRepository
                .findByJobIdAndUserIdOrderByCreatedAtAsc(jobId, user.getId())
                .stream()
                .map(m -> ChatMessageDto.builder()
                        .role(m.getRole())
                        .content(m.getContent())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ChatResponse.builder()
                .reply(reply)
                .history(fullHistory)
                .build();
    }

    public List<ChatMessageDto> getChatHistory(String jobId) {
        User user = getLoggedInUser();
        return chatMessageRepository
                .findByJobIdAndUserIdOrderByCreatedAtAsc(jobId, user.getId())
                .stream()
                .map(m -> ChatMessageDto.builder()
                        .role(m.getRole())
                        .content(m.getContent())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void clearHistory(String jobId) {
        String email = AuthUtil.getLoggedInUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        chatMessageRepository.deleteByJobIdAndUserId(jobId, user.getId());
    }

}