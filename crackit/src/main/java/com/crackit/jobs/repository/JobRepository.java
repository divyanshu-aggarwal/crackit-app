package com.crackit.jobs.repository;

import com.crackit.jobs.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, String> {

    List<Job> findByUserId(String userId);
    @Query("""
    select distinct j.title
    from Job j
    where lower(j.title) like lower(concat('%', :q, '%'))
""")
    List<String> findTopTitles(@Param("q") String q);

    @Query("""
    select distinct j.location
    from Job j
    where lower(j.location) like lower(concat('%', :q, '%'))
""")
    List<String> findTopLocations(@Param("q") String q);
}