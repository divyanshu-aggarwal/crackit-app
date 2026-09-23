package com.crackit.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewPrepRequestEvent implements Serializable {
    private String eventId;
    private String prepId;
    private String jobId;
    private String userId;
    private Map<String, Object> payload;
    private Instant createdAt;
}
