package com.crackit.discovery.repository;

import com.crackit.discovery.entity.JobSuggestionDictionary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobSuggestionDictionaryRepository
        extends JpaRepository<JobSuggestionDictionary, String> {

    @Query("""
        select d.value
        from JobSuggestionDictionary d
        where lower(d.value) like lower(concat('%', :q, '%'))
        order by d.priority asc
    """)
    List<String> findSuggestions(@Param("q") String q);
}