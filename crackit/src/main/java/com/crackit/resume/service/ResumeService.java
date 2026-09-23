package com.crackit.resume.service;

import com.crackit.ai.client.AiServiceClient;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.resume.dto.request.*;
import com.crackit.resume.dto.response.*;
import com.crackit.resume.entity.*;
import com.crackit.resume.mapper.ResumeMapper;
import com.crackit.resume.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final UserRepository userRepository;
    private final MasterResumeRepository masterResumeRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;
    private final ExperienceBulletRepository experienceBulletRepository;
    private final ProjectRepository projectRepository;
    private final ResumeMapper resumeMapper;
    private final AiServiceClient aiServiceClient;

    // ── Master Resume ─────────────────────────────────────

    public MasterResumeResponse createMasterResume(MasterResumeRequest request) {
        User user = getLoggedInUser();
        MasterResume resume = MasterResume.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .summary(request.getSummary())
                .rawResumeText(request.getRawResumeText())
                .build();
        return resumeMapper.mapMasterResume(masterResumeRepository.save(resume));
    }

    public MasterResumeResponse updateMasterResume(MasterResumeRequest request) {
        User user = getLoggedInUser();
        MasterResume resume = masterResumeRepository.findByUserId(user.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No master resume found"));
        resume.setSummary(request.getSummary());
        if (request.getRawResumeText() != null) resume.setRawResumeText(request.getRawResumeText());
        return resumeMapper.mapMasterResume(masterResumeRepository.save(resume));
    }

    // ── Upload & Parse ────────────────────────────────────
    @Transactional
    public Map<String, Object> uploadAndParseResume(MultipartFile file) {
        User user = getLoggedInUser();

        try {
            Map<String, Object> parsed = aiServiceClient.parseResume(file.getBytes(), file.getOriginalFilename());

            // upsert master resume summary
            String summary = (String) parsed.getOrDefault("summary", "");
            MasterResume resume = masterResumeRepository.findByUserId(user.getId())
                    .stream().findFirst()
                    .orElse(MasterResume.builder().id(UUID.randomUUID().toString()).user(user).build());
            resume.setSummary(summary);
            masterResumeRepository.save(resume);

            // clear existing and repopulate skills
            skillRepository.deleteAllByUserId(user.getId());
            List<Map<String, Object>> skills = (List<Map<String, Object>>) parsed.getOrDefault("skills", List.of());
            for (Map<String, Object> s : skills) {
                skillRepository.save(Skill.builder()
                        .id(UUID.randomUUID().toString())
                        .user(user)
                        .skillName((String) s.getOrDefault("skillName", ""))
                        .category((String) s.getOrDefault("category", ""))
                        .proficiencyLevel((String) s.getOrDefault("proficiencyLevel", ""))
                        .yearsUsed(s.get("yearsUsed") instanceof Integer i ? i : 0)
                        .build());
            }

            // clear existing and repopulate experiences + bullets
            List<Experience> oldExps = experienceRepository.findByUserId(user.getId());
            for (Experience e : oldExps) {
                experienceBulletRepository.deleteAllByExperienceId(e.getId());
            }
            experienceRepository.deleteAllByUserId(user.getId());

            List<Map<String, Object>> experiences = (List<Map<String, Object>>) parsed.getOrDefault("experiences", List.of());
            for (Map<String, Object> e : experiences) {
                Experience exp = experienceRepository.save(Experience.builder()
                        .id(UUID.randomUUID().toString())
                        .user(user)
                        .companyName((String) e.getOrDefault("companyName", ""))
                        .role((String) e.getOrDefault("role", ""))
                        .startDate(parseDate((String) e.get("startDate")))
                        .endDate(parseDate((String) e.get("endDate")))
                        .currentCompany(Boolean.TRUE.equals(e.get("currentCompany")))
                        .description((String) e.getOrDefault("description", ""))
                        .build());

                List<Map<String, Object>> bullets = (List<Map<String, Object>>) e.getOrDefault("bullets", List.of());
                for (Map<String, Object> b : bullets) {
                    experienceBulletRepository.save(ExperienceBullet.builder()
                            .id(UUID.randomUUID().toString())
                            .experience(exp)
                            .bulletText((String) b.getOrDefault("bulletText", ""))
                            .technologies((String) b.getOrDefault("technologies", ""))
                            .build());
                }
            }

            // clear existing and repopulate projects
            projectRepository.deleteAllByUserId(user.getId());
            List<Map<String, Object>> projects = (List<Map<String, Object>>) parsed.getOrDefault("projects", List.of());
            for (Map<String, Object> p : projects) {
                projectRepository.save(Project.builder()
                        .id(UUID.randomUUID().toString())
                        .user(user)
                        .title((String) p.getOrDefault("title", ""))
                        .description((String) p.getOrDefault("description", ""))
                        .techStack((String) p.getOrDefault("techStack", ""))
                        .githubUrl((String) p.getOrDefault("githubUrl", ""))
                        .impactMetrics((String) p.getOrDefault("impactMetrics", ""))
                        .build());
            }

            return getFullResume();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse resume: " + e.getMessage());
        }
    }

    // ── PDF Generation ────────────────────────────────────

    public byte[] generateResumePdf(String photoBase64) {
        User user = getLoggedInUser();

        MasterResume masterResume = masterResumeRepository.findByUserId(user.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No master resume found"));

        List<Skill> skills = skillRepository.findByUserId(user.getId());
        List<Experience> experiences = experienceRepository.findByUserId(user.getId());
        List<Project> projects = projectRepository.findByUserId(user.getId());

        Map<String, Object> payload = buildPdfPayload(user, masterResume.getSummary(), skills, experiences, projects, photoBase64);
        return aiServiceClient.generateResumePdf(payload);
    }

    private Map<String, Object> buildPdfPayload(
            User user, String summary,
            List<Skill> skills, List<Experience> experiences,
            List<Project> projects, String photoBase64) {

        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("fullName", user.getFullName() != null ? user.getFullName() : "guest");
        payload.put("email", user.getEmail());
        payload.put("phone", user.getPhone() != null ? user.getPhone() : "");
        payload.put("location", user.getLocation() != null ? user.getLocation() : "");
        payload.put("linkedinUrl", "");
        payload.put("githubUrl", "");
        payload.put("summary", summary != null ? summary : "");
        payload.put("photoBase64", photoBase64 != null ? photoBase64 : "");

        payload.put("skills", skills.stream().map(s -> Map.of(
                "skillName", s.getSkillName(),
                "category", s.getCategory() != null ? s.getCategory() : ""
        )).toList());

        payload.put("experiences", experiences.stream().map(e -> {
            var bullets = experienceBulletRepository.findByExperienceId(e.getId());

            Map<String, Object> exp = new LinkedHashMap<>();
            exp.put("companyName", e.getCompanyName());
            exp.put("role", e.getRole());
            exp.put("startDate", e.getStartDate() != null ? e.getStartDate().toString() : "");
            exp.put("endDate", e.getEndDate() != null ? e.getEndDate().toString() : "");
            exp.put("currentCompany", Boolean.TRUE.equals(e.getCurrentCompany()));
            exp.put("bullets", bullets.stream().map(b -> Map.of(
                    "bulletText", b.getBulletText(),
                    "technologies", b.getTechnologies() != null ? b.getTechnologies() : ""
            )).toList());

            return exp;
        }).toList());

        payload.put("projects", projects.stream().map(p -> Map.of(
                "title", p.getTitle(),
                "description", p.getDescription() != null ? p.getDescription() : "",
                "techStack", p.getTechStack() != null ? p.getTechStack() : "",
                "impactMetrics", p.getImpactMetrics() != null ? p.getImpactMetrics() : ""
        )).toList());

        return payload;
    }

    // ── Full Resume ───────────────────────────────────────

    public Map<String, Object> getFullResume() {
        User user = getLoggedInUser();
        return Map.of(
                "masterResume", masterResumeRepository.findByUserId(user.getId())
                        .stream().map(resumeMapper::mapMasterResume).toList(),
                "skills", skillRepository.findByUserId(user.getId())
                        .stream().map(resumeMapper::mapSkill).toList(),
                "experiences", experienceRepository.findByUserId(user.getId())
                        .stream().map(experience -> {
                            var bullets = experienceBulletRepository.findByExperienceId(experience.getId())
                                    .stream().map(resumeMapper::mapExperienceBullet).toList();
                            return resumeMapper.mapExperience(experience, bullets);
                        }).toList(),
                "projects", projectRepository.findByUserId(user.getId())
                        .stream().map(resumeMapper::mapProject).toList()
        );
    }

    // ── Skills CRUD ───────────────────────────────────────

    public SkillResponse addSkill(SkillRequest request) {
        User user = getLoggedInUser();
        Skill skill = Skill.builder()
                .id(UUID.randomUUID().toString()).user(user)
                .skillName(request.getSkillName()).category(request.getCategory())
                .proficiencyLevel(request.getProficiencyLevel()).yearsUsed(request.getYearsUsed())
                .build();
        return resumeMapper.mapSkill(skillRepository.save(skill));
    }

    public SkillResponse updateSkill(String id, SkillRequest request) {
        Skill skill = skillRepository.findById(id).orElseThrow(() -> new RuntimeException("Skill not found"));
        skill.setSkillName(request.getSkillName());
        skill.setCategory(request.getCategory());
        skill.setProficiencyLevel(request.getProficiencyLevel());
        skill.setYearsUsed(request.getYearsUsed());
        return resumeMapper.mapSkill(skillRepository.save(skill));
    }

    public void deleteSkill(String id) {
        skillRepository.deleteById(id);
    }

    // ── Experience CRUD ───────────────────────────────────

    public ExperienceResponse addExperience(ExperienceRequest request) {
        User user = getLoggedInUser();
        Experience exp = Experience.builder()
                .id(UUID.randomUUID().toString()).user(user)
                .companyName(request.getCompanyName()).role(request.getRole())
                .startDate(request.getStartDate()).endDate(request.getEndDate())
                .currentCompany(request.getCurrentCompany()).description(request.getDescription())
                .build();
        return resumeMapper.mapExperience(experienceRepository.save(exp), List.of());
    }

    public ExperienceResponse updateExperience(String id, ExperienceRequest request) {
        Experience exp = experienceRepository.findById(id).orElseThrow(() -> new RuntimeException("Experience not found"));
        exp.setCompanyName(request.getCompanyName());
        exp.setRole(request.getRole());
        exp.setStartDate(request.getStartDate());
        exp.setEndDate(request.getEndDate());
        exp.setCurrentCompany(request.getCurrentCompany());
        exp.setDescription(request.getDescription());
        exp.setLocation(request.getLocation());
        var bullets = experienceBulletRepository.findByExperienceId(id)
                .stream().map(resumeMapper::mapExperienceBullet).toList();
        return resumeMapper.mapExperience(experienceRepository.save(exp), bullets);
    }

    public void deleteExperience(String id) {
        experienceBulletRepository.deleteAllByExperienceId(id);
        experienceRepository.deleteById(id);
    }

    // ── Bullet CRUD ───────────────────────────────────────

    public ExperienceBulletResponse addExperienceBullet(ExperienceBulletRequest request) {
        User user = getLoggedInUser();
        Experience experience = experienceRepository.findById(request.getExperienceId())
                .orElseThrow(() -> new RuntimeException("Experience not found"));
        if (!experience.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Unauthorized");
        ExperienceBullet bullet = ExperienceBullet.builder()
                .id(UUID.randomUUID().toString()).experience(experience)
                .bulletText(request.getBulletText()).technologies(request.getTechnologies())
                .priorityScore(request.getPriorityScore())
                .build();
        return resumeMapper.mapExperienceBullet(experienceBulletRepository.save(bullet));
    }

    public ExperienceBulletResponse updateBullet(String id, ExperienceBulletRequest request) {
        ExperienceBullet bullet = experienceBulletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bullet not found"));
        bullet.setBulletText(request.getBulletText());
        bullet.setTechnologies(request.getTechnologies());
        bullet.setPriorityScore(request.getPriorityScore());
        return resumeMapper.mapExperienceBullet(experienceBulletRepository.save(bullet));
    }

    public void deleteBullet(String id) {
        experienceBulletRepository.deleteById(id);
    }

    // ── Project CRUD ──────────────────────────────────────

    public ProjectResponse addProject(ProjectRequest request) {
        User user = getLoggedInUser();
        Project project = Project.builder()
                .id(UUID.randomUUID().toString()).user(user)
                .title(request.getTitle()).description(request.getDescription())
                .techStack(request.getTechStack()).githubUrl(request.getGithubUrl())
                .impactMetrics(request.getImpactMetrics())
                .build();
        return resumeMapper.mapProject(projectRepository.save(project));
    }

    public ProjectResponse updateProject(String id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        project.setTechStack(request.getTechStack());
        project.setGithubUrl(request.getGithubUrl());
        project.setImpactMetrics(request.getImpactMetrics());
        return resumeMapper.mapProject(projectRepository.save(project));
    }

    public void deleteProject(String id) {
        projectRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────

    private java.time.LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return java.time.LocalDate.parse(dateStr.length() > 10 ? dateStr.substring(0, 10) : dateStr);
        } catch (Exception e) {
            return null;
        }
    }

    private User getLoggedInUser() {
        String email = AuthUtil.getLoggedInUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}