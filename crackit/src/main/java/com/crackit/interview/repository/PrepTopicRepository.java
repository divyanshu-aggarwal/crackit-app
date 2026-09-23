package com.crackit.interview.repository;

import com.crackit.interview.entity.PrepTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrepTopicRepository extends JpaRepository<PrepTopic, String> {
    List<PrepTopic> findByInterviewPrepIdOrderByPriorityAsc(String interviewPrepId);
}