package com.crackit.ai.service;

import com.crackit.ai.client.AiServiceClient;
import com.crackit.ai.dto.JDAnalysisRequest;
import com.crackit.ai.dto.JDAnalysisResponse;
import com.crackit.ai.dto.SavedJdAnalysisResponse;
import com.crackit.ai.entity.JdAnalysis;
import com.crackit.ai.entity.TailoredResume;
import com.crackit.ai.repository.JdAnalysisRepository;
import com.crackit.ai.repository.TailoredResumeRepository;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.jobs.entity.Job;
import com.crackit.jobs.repository.JobRepository;
import com.crackit.resume.entity.Skill;
import com.crackit.resume.repository.SkillRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.crackit.resume.entity.*;
import com.crackit.resume.repository.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiIntegrationService {

    private final JobRepository jobRepository;
    private final AiServiceClient aiServiceClient;
    private final JdAnalysisRepository jdAnalysisRepository;
    private final SkillRepository skillRepository;
    private final ObjectMapper objectMapper;
    private final MasterResumeRepository masterResumeRepository;
    private final ExperienceRepository experienceRepository;
    private final ExperienceBulletRepository experienceBulletRepository;
    private final ProjectRepository projectRepository;
    private final TailoredResumeRepository tailoredResumeRepository;
    private final UserRepository userRepository;

    public SavedJdAnalysisResponse analyzeJob(String jobId) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (job.getJdText() == null || job.getJdText().isBlank()) {
            throw new RuntimeException("Job description is empty");
        }

        User user = job.getUser();

        MasterResume masterResume = masterResumeRepository.findByUserId(user.getId())
                .stream().findFirst().orElse(null);

        List<Skill> skills = skillRepository.findByUserId(user.getId());
        List<Experience> experiences = experienceRepository.findByUserId(user.getId());
        List<Project> projects = projectRepository.findByUserId(user.getId());

        JDAnalysisRequest request = new JDAnalysisRequest(
                job.getJdText(),
                masterResume != null ? masterResume.getSummary() : "",
                skills.stream().map(s -> Map.<String, Object>of(
                        "skillName", s.getSkillName(),
                        "category", s.getCategory() != null ? s.getCategory() : "",
                        "proficiencyLevel", s.getProficiencyLevel() != null ? s.getProficiencyLevel() : "",
                        "yearsUsed", s.getYearsUsed() != null ? s.getYearsUsed() : 0
                )).toList(),
                experiences.stream().map(e -> {
                    List<ExperienceBullet> bullets = experienceBulletRepository.findByExperienceId(e.getId());
                    return Map.<String, Object>of(
                            "companyName", e.getCompanyName(),
                            "role", e.getRole(),
                            "description", e.getDescription() != null ? e.getDescription() : "",
                            "bullets", bullets.stream().map(b -> Map.<String, Object>of(
                                    "bulletText", b.getBulletText(),
                                    "technologies", b.getTechnologies() != null ? b.getTechnologies() : ""
                            )).toList()
                    );
                }).toList(),
                projects.stream().map(p -> Map.<String, Object>of(
                        "title", p.getTitle(),
                        "description", p.getDescription() != null ? p.getDescription() : "",
                        "techStack", p.getTechStack() != null ? p.getTechStack() : "",
                        "impactMetrics", p.getImpactMetrics() != null ? p.getImpactMetrics() : ""
                )).toList()
        );

        JDAnalysisResponse aiResponse = aiServiceClient.analyzeJd(request);

        JdAnalysis analysis = JdAnalysis.builder()
                .id(UUID.randomUUID().toString())
                .job(job)
                .requiredSkills(toJson(aiResponse.getRequiredSkills()))
                .preferredSkills(toJson(aiResponse.getPreferredSkills()))
                .importantTopics(toJson(aiResponse.getImportantTopics()))
                .atsKeywords(toJson(aiResponse.getAtsKeywords()))
                .experienceLevel(aiResponse.getExperienceLevel())
                .matchScore(aiResponse.getMatchScore())
                .aiSummary(aiResponse.getSummary())
                .build();

        return mapToResponse(jdAnalysisRepository.save(analysis));
    }

    public SavedJdAnalysisResponse getLatestAnalysisForJob(String jobId) {
        return jdAnalysisRepository.findByJobId(jobId)
                .stream()
                .reduce((first, second) -> second)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("No analysis found for this job"));
    }

    private SavedJdAnalysisResponse mapToResponse(JdAnalysis analysis) {
        return SavedJdAnalysisResponse.builder()
                .id(analysis.getId())
                .jobId(analysis.getJob().getId())
                .requiredSkills(fromJson(analysis.getRequiredSkills()))
                .preferredSkills(fromJson(analysis.getPreferredSkills()))
                .importantTopics(fromJson(analysis.getImportantTopics()))
                .atsKeywords(fromJson(analysis.getAtsKeywords()))
                .experienceLevel(analysis.getExperienceLevel())
                .matchScore(analysis.getMatchScore())
                .aiSummary(analysis.getAiSummary())
                .createdAt(analysis.getCreatedAt())
                .build();
    }

    private String toJson(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values != null ? values : List.of());
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> fromJson(String json) {
        try {
            if (json == null || json.isBlank()) return List.of();
            return objectMapper.readValue(json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    public byte[] generateTailoredResumePdf(String jobId) {
        User user = getLoggedInUser();

        TailoredResume tailored = tailoredResumeRepository
                .findTopByJobIdOrderByCreatedAtDesc(jobId)
                .orElseThrow(() -> new RuntimeException("No tailored resume found"));

        List<Map<String, Object>> experiences = fromJsonMap(tailored.getTailoredExperience());

        // cross-reference dates from original experiences
        List<Experience> originalExperiences = experienceRepository.findByUserId(user.getId());
        Map<String, Experience> expByCompany = originalExperiences.stream()
                .collect(Collectors.toMap(
                        e -> e.getCompanyName().toLowerCase(),
                        e -> e,
                        (a, b) -> a
                ));

        List<Map<String, Object>> experiencesWithDates = experiences.stream().map(exp -> {
            String company = ((String) exp.getOrDefault("companyName", "")).toLowerCase();
            Experience original = expByCompany.get(company);
            if (original != null) {
                Map<String, Object> merged = new java.util.HashMap<>(exp);
                merged.put("startDate", original.getStartDate() != null ? original.getStartDate().toString() : "");
                merged.put("endDate", original.getEndDate() != null ? original.getEndDate().toString() : "");
                merged.put("currentCompany", original.getCurrentCompany() != null ? original.getCurrentCompany() : false);
                merged.put("location", original.getLocation() != null ? original.getLocation() : "");
                return merged;
            }
            return exp;
        }).toList();
        List<Map<String, Object>> projects = fromJsonMap(tailored.getTailoredProjects());
        List<String> skills = fromJson(tailored.getTailoredSkills());
        // cross-reference user's skills to get categories
        List<Skill> userSkills = skillRepository.findByUserId(user.getId());
        Map<String, String> skillCategoryMap = userSkills.stream()
                .collect(Collectors.toMap(
                        s -> s.getSkillName().toLowerCase(),
                        Skill::getCategory,
                        (a, b) -> a
                ));

        Map<String, Object> payload = Map.of(
                "fullName", user.getFullName() != null ? user.getFullName() : "guest",
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "location", user.getLocation() !=null ? user.getLocation() : "",
                "linkedinUrl", user.getLinkedinUrl() !=null ? user.getLinkedinUrl() : "",
                "githubUrl", user.getGithubUrl() !=null ? user.getGithubUrl() : "",
                "summary", tailored.getTailoredSummary() != null ? tailored.getTailoredSummary() : "",
                "skills", skills.stream().map(s -> Map.of(
                        "skillName", s,
                        "category", skillCategoryMap.getOrDefault(s.toLowerCase(), "Other")
                )).toList(),
                "experiences", experiencesWithDates,
                "projects", projects
        );

        return aiServiceClient.generateResumePdf(payload);
    }

    private List<Map<String, Object>> fromJsonMap(String json) {
        try {
            if (json == null || json.isBlank()) return List.of();
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private User getLoggedInUser() {
        String email = AuthUtil.getLoggedInUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public JDAnalysisResponse quickScan(String jdText) {
        User user = getLoggedInUser();

        MasterResume masterResume = masterResumeRepository.findByUserId(user.getId())
                .stream().findFirst().orElse(null);

        List<Skill> skills = skillRepository.findByUserId(user.getId());
        List<Experience> experiences = experienceRepository.findByUserId(user.getId());
        List<Project> projects = projectRepository.findByUserId(user.getId());

        JDAnalysisRequest request = new JDAnalysisRequest(
                jdText,
                masterResume != null ? masterResume.getSummary() : "",
                skills.stream().map(s -> Map.<String, Object>of(
                        "skillName", s.getSkillName(),
                        "category", s.getCategory() != null ? s.getCategory() : "",
                        "proficiencyLevel", s.getProficiencyLevel() != null ? s.getProficiencyLevel() : "",
                        "yearsUsed", s.getYearsUsed() != null ? s.getYearsUsed() : 0
                )).toList(),
                experiences.stream().map(e -> {
                    List<ExperienceBullet> bullets = experienceBulletRepository.findByExperienceId(e.getId());
                    return Map.<String, Object>of(
                            "companyName", e.getCompanyName(),
                            "role", e.getRole(),
                            "description", e.getDescription() != null ? e.getDescription() : "",
                            "bullets", bullets.stream().map(b -> Map.<String, Object>of(
                                    "bulletText", b.getBulletText(),
                                    "technologies", b.getTechnologies() != null ? b.getTechnologies() : ""
                            )).toList()
                    );
                }).toList(),
                projects.stream().map(p -> Map.<String, Object>of(
                        "title", p.getTitle(),
                        "description", p.getDescription() != null ? p.getDescription() : "",
                        "techStack", p.getTechStack() != null ? p.getTechStack() : "",
                        "impactMetrics", p.getImpactMetrics() != null ? p.getImpactMetrics() : ""
                )).toList()
        );

        return aiServiceClient.analyzeJd(request);
    }
}