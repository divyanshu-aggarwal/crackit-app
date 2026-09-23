package com.crackit.interview.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageDto {
    private String role;
    private String content;
    private LocalDateTime createdAt;
}