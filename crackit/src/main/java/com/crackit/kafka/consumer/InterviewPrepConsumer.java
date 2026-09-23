package com.crackit.kafka.consumer;

import com.crackit.ai.client.AiServiceClient;
import com.crackit.interview.entity.InterviewPrep;
import com.crackit.interview.entity.PrepQuestion;
import com.crackit.interview.entity.PrepTopic;
import com.crackit.interview.enums.PrepStatus;
import com.crackit.interview.repository.InterviewPrepRepository;
import com.crackit.interview.repository.PrepQuestionRepository;
import com.crackit.interview.repository.PrepTopicRepository;
import com.crackit.kafka.config.KafkaTopicConfig;
import com.crackit.kafka.event.InterviewPrepRequestEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = true)
public class InterviewPrepConsumer {

    private final AiServiceClient aiServiceClient;
    private final InterviewPrepRepository interviewPrepRepository;
    private final PrepTopicRepository prepTopicRepository;
    private final PrepQuestionRepository prepQuestionRepository;

    @Transactional
    @RetryableTopic(
            attempts = "3",
            backoff = @Backoff(delay = 2000, multiplier = 2.0, maxDelay = 10000),
            dltTopicSuffix = "-dlt"
    )
    @KafkaListener(
            topics = KafkaTopicConfig.INTERVIEW_PREP_TOPIC,
            groupId = "crackit-ai-worker-group"
    )
    public void consumeInterviewPrepRequest(InterviewPrepRequestEvent event,
                                           @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                                           @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                                           @Header(KafkaHeaders.OFFSET) long offset) {
        log.info("[KAFKA CONSUMER] Processing eventId: {}, jobId: {} [topic: {}, partition: {}, offset: {}]",
                event.getEventId(), event.getJobId(), topic, partition, offset);

        InterviewPrep prep = interviewPrepRepository.findById(event.getPrepId()).orElse(null);
        if (prep == null) {
            log.warn("[KAFKA CONSUMER] InterviewPrep entity not found for prepId: {}. Skipping.", event.getPrepId());
            return;
        }

        // 1. Mark IN_PROGRESS
        prep.setStatus(PrepStatus.IN_PROGRESS);
        prep.setErrorMessage(null);
        interviewPrepRepository.save(prep);

        // 2. Invoke Gemini AI via Python AI Microservice
        Map<String, Object> result = aiServiceClient.generateInterviewPrep(event.getPayload());

        // 3. Clear any existing topics & questions if regenerating
        prepTopicRepository.findByInterviewPrepIdOrderByPriorityAsc(prep.getId())
                .forEach(prepTopicRepository::delete);
        prepQuestionRepository.findByInterviewPrepIdOrderByTypeAsc(prep.getId())
                .forEach(prepQuestionRepository::delete);

        // 4. Save newly generated topics
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topics = (List<Map<String, Object>>) result.get("topics");
        if (topics != null) {
            int priority = 1;
            for (Map<String, Object> t : topics) {
                PrepTopic topicEntity = PrepTopic.builder()
                        .id(UUID.randomUUID().toString())
                        .interviewPrepId(prep.getId())
                        .topic((String) t.get("topic"))
                        .category((String) t.get("category"))
                        .description((String) t.get("description"))
                        .isCompleted(false)
                        .priority(priority++)
                        .build();
                prepTopicRepository.save(topicEntity);
            }
        }

        // 5. Save newly generated questions
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) result.get("questions");
        if (questions != null) {
            for (Map<String, Object> q : questions) {
                PrepQuestion questionEntity = PrepQuestion.builder()
                        .id(UUID.randomUUID().toString())
                        .interviewPrepId(prep.getId())
                        .question((String) q.get("question"))
                        .type((String) q.get("type"))
                        .difficulty((String) q.get("difficulty"))
                        .suggestedAnswer((String) q.get("suggestedAnswer"))
                        .isPracticed(false)
                        .build();
                prepQuestionRepository.save(questionEntity);
            }
        }

        // 6. Mark COMPLETED
        prep.setStatus(PrepStatus.COMPLETED);
        prep.setOverallProgress(0);
        interviewPrepRepository.save(prep);

        log.info("[KAFKA CONSUMER] Successfully generated interview prep for jobId: {}, prepId: {}",
                event.getJobId(), prep.getId());
    }

    @DltHandler
    public void handleDeadLetter(InterviewPrepRequestEvent event,
                                 @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                                 @Header(KafkaHeaders.OFFSET) long offset,
                                 Exception exception) {
        log.error("[KAFKA DLT] Event failed after retries. Routing to DLT - eventId: {}, prepId: {}, topic: {}, offset: {}. Error: {}",
                event.getEventId(), event.getPrepId(), topic, offset,
                exception != null ? exception.getMessage() : "Unknown");

        interviewPrepRepository.findById(event.getPrepId()).ifPresent(prep -> {
            prep.setStatus(PrepStatus.FAILED);
            prep.setErrorMessage("AI generation failed after 3 retries: " +
                    (exception != null ? exception.getMessage() : "Timeout / quota error"));
            interviewPrepRepository.save(prep);
        });
    }
}
