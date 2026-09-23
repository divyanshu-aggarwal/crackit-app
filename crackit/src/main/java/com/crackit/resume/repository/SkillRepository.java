package com.crackit.resume.repository;

import com.crackit.resume.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SkillRepository extends JpaRepository<Skill, String> {
    List<Skill> findByUserId(String userId);
    void deleteAllByUserId(String userId);

    @Query("""
    select distinct s.skillName
    from Skill s
    where lower(s.skillName) like lower(concat('%', :q, '%'))
""")
    List<String> findTopSkillNames(@Param("q") String q);
}