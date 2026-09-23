package com.crackit.kafka.producer;

import com.crackit.kafka.config.KafkaTopicConfig;
import com.crackit.kafka.event.InterviewPrepRequestEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = true)
public class InterviewPrepProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public CompletableFuture<SendResult<String, Object>> sendInterviewPrepRequest(InterviewPrepRequestEvent event) {
        String correlationId = UUID.randomUUID().toString();
        log.info("[KAFKA PRODUCER] Publishing InterviewPrepRequestEvent - eventId: {}, jobId: {}, correlationId: {}",
                event.getEventId(), event.getJobId(), correlationId);

        ProducerRecord<String, Object> record = new ProducerRecord<>(
                KafkaTopicConfig.INTERVIEW_PREP_TOPIC,
                event.getJobId(), // Partition key: ensures requests for the same job are ordered
                event
        );
        record.headers().add(new RecordHeader("X-Correlation-Id", correlationId.getBytes(StandardCharsets.UTF_8)));

        CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(record);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("[KAFKA PRODUCER] Failed to deliver eventId: {} to topic: {}",
                        event.getEventId(), KafkaTopicConfig.INTERVIEW_PREP_TOPIC, ex);
            } else {
                log.info("[KAFKA PRODUCER] Delivered eventId: {} to topic: {} [partition: {}, offset: {}]",
                        event.getEventId(),
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });

        return future;
    }
}
