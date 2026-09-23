package com.crackit.interview.repository;

import com.crackit.interview.entity.PrepQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrepQuestionRepository extends JpaRepository<PrepQuestion, String> {
    List<PrepQuestion> findByInterviewPrepIdOrderByTypeAsc(String interviewPrepId);
}