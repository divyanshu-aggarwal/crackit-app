package com.crackit.interview.repository;

import com.crackit.interview.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findByJobIdAndUserIdOrderByCreatedAtAsc(String jobId, String userId);
    void deleteByJobIdAndUserId(String jobId, String userId);
}