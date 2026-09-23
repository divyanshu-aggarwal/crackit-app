package com.crackit.interview.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ChatResponse {
    private String reply;
    private List<ChatMessageDto> history;
}