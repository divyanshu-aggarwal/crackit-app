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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
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
    private final ObjectMapper objectMapper;

    // ── Master Resume ─────────────────────────────────────

    public MasterResumeResponse createMasterResume(MasterResumeRequest request) {
        User user = getLoggedInUser();
        MasterResume resume = MasterResume.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .summary(request.getSummary())
                .education(request.getEducation())
                .rawResumeText(request.getRawResumeText())
                .build();
        return resumeMapper.mapMasterResume(masterResumeRepository.save(resume));
    }

    public MasterResumeResponse updateMasterResume(MasterResumeRequest request) {
        User user = getLoggedInUser();
        MasterResume resume = masterResumeRepository.findByUserId(user.getId())
                .stream().findFirst()
                .orElse(MasterResume.builder().id(UUID.randomUUID().toString()).user(user).build());
        if (request.getSummary() != null) resume.setSummary(request.getSummary());
        if (request.getEducation() != null) {
            resume.setEducation(request.getEducation());
            user.setEducation(request.getEducation());
            userRepository.save(user);
        }
        if (request.getRawResumeText() != null) resume.setRawResumeText(request.getRawResumeText());
        return resumeMapper.mapMasterResume(masterResumeRepository.save(resume));
    }

    // ── Upload & Parse ────────────────────────────────────
    @Transactional
    public Map<String, Object> uploadAndParseResume(MultipartFile file) {
        User user = getLoggedInUser();

        try {
            Map<String, Object> parsed = aiServiceClient.parseResume(file.getBytes(), file.getOriginalFilename());

            // upsert master resume summary & education
            String summary = (String) parsed.getOrDefault("summary", "");
            Object parsedEdu = parsed.get("education");
            String eduStr = "";
            if (parsedEdu instanceof List<?> list && !list.isEmpty()) {
                try {
                    eduStr = objectMapper.writeValueAsString(list);
                } catch (Exception ignored) {}
            } else if (parsedEdu instanceof String s) {
                eduStr = s;
            }

            MasterResume resume = masterResumeRepository.findByUserId(user.getId())
                    .stream().findFirst()
                    .orElse(MasterResume.builder().id(UUID.randomUUID().toString()).user(user).build());
            if (summary != null && !summary.isBlank()) resume.setSummary(summary);
            if (!eduStr.isBlank()) {
                resume.setEducation(eduStr);
                user.setEducation(eduStr);
                userRepository.save(user);
            }
            masterResumeRepository.save(resume);

            // clear existing and repopulate skills
            skillRepository.deleteAllByUserId(user.getId());
            List<?> skills = (List<?>) parsed.getOrDefault("skills", List.of());
            if (skills != null) {
                for (Object sObj : skills) {
                    String sName = "";
                    String sCat = "Other";
                    String sProf = "Advanced";
                    int sYears = 0;
                    if (sObj instanceof Map<?, ?> sm) {
                        Object nVal = sm.get("skillName") != null ? sm.get("skillName") : sm.get("name");
                        sName = nVal != null ? String.valueOf(nVal) : "";
                        Object cVal = sm.get("category");
                        sCat = cVal != null ? String.valueOf(cVal) : "Other";
                        Object pVal = sm.get("proficiencyLevel");
                        sProf = pVal != null ? String.valueOf(pVal) : "Advanced";
                        Object y = sm.get("yearsUsed");
                        if (y instanceof Number num) {
                            sYears = num.intValue();
                        } else if (y instanceof String str) {
                            try { sYears = Integer.parseInt(str.replaceAll("[^0-9]", "")); } catch (Exception ignored) {}
                        }
                    } else if (sObj instanceof String str && !str.isBlank()) {
                        sName = str.trim();
                    }
                    if (!sName.isBlank() && !"null".equalsIgnoreCase(sName)) {
                        skillRepository.save(Skill.builder()
                                .id(UUID.randomUUID().toString())
                                .user(user)
                                .skillName(sName)
                                .category(sCat != null && !"null".equalsIgnoreCase(sCat) ? sCat : "Other")
                                .proficiencyLevel(sProf != null && !"null".equalsIgnoreCase(sProf) ? sProf : "Advanced")
                                .yearsUsed(sYears)
                                .build());
                    }
                }
            }

            // clear existing and repopulate experiences + bullets
            List<Experience> oldExps = experienceRepository.findByUserId(user.getId());
            for (Experience e : oldExps) {
                experienceBulletRepository.deleteAllByExperienceId(e.getId());
            }
            experienceRepository.deleteAllByUserId(user.getId());

            List<?> experiences = (List<?>) parsed.getOrDefault("experiences", List.of());
            if (experiences != null) {
                for (Object eObj : experiences) {
                    if (eObj instanceof Map<?, ?> e) {
                        Object compVal = e.get("companyName") != null ? e.get("companyName") : e.get("company");
                        String comp = compVal != null ? String.valueOf(compVal) : "Experience";
                        Object roleVal = e.get("role") != null ? e.get("role") : e.get("title");
                        String role = roleVal != null ? String.valueOf(roleVal) : "Software Engineer";
                        Object descVal = e.get("description");
                        String desc = descVal != null ? String.valueOf(descVal) : "";

                        Experience exp = experienceRepository.save(Experience.builder()
                                .id(UUID.randomUUID().toString())
                                .user(user)
                                .companyName(comp != null && !"null".equalsIgnoreCase(comp) ? comp : "Experience")
                                .role(role != null && !"null".equalsIgnoreCase(role) ? role : "Software Engineer")
                                .startDate(parseDate((String) e.get("startDate")))
                                .endDate(parseDate((String) e.get("endDate")))
                                .currentCompany(Boolean.TRUE.equals(e.get("currentCompany")))
                                .description(desc != null && !"null".equalsIgnoreCase(desc) ? desc : "")
                                .build());

                        Object bulletsObj = e.get("bullets");
                        if (bulletsObj instanceof List<?> bullets) {
                            for (Object bObj : bullets) {
                                String bText = "";
                                String bTech = "";
                                if (bObj instanceof Map<?, ?> bMap) {
                                    Object bt = bMap.get("bulletText") != null ? bMap.get("bulletText") : bMap.get("text");
                                    bText = bt != null ? String.valueOf(bt) : "";
                                    Object tc = bMap.get("technologies");
                                    bTech = tc != null ? String.valueOf(tc) : "";
                                } else if (bObj instanceof String str) {
                                    bText = str;
                                }
                                if (bText != null && !bText.isBlank() && !"null".equalsIgnoreCase(bText)) {
                                    experienceBulletRepository.save(ExperienceBullet.builder()
                                            .id(UUID.randomUUID().toString())
                                            .experience(exp)
                                            .bulletText(bText)
                                            .technologies(bTech != null && !"null".equalsIgnoreCase(bTech) ? bTech : "")
                                            .build());
                                }
                            }
                        }
                    }
                }
            }

            // clear existing and repopulate projects
            projectRepository.deleteAllByUserId(user.getId());
            List<?> projects = (List<?>) parsed.getOrDefault("projects", List.of());
            if (projects != null) {
                for (Object pObj : projects) {
                    if (pObj instanceof Map<?, ?> p) {
                        Object tVal = p.get("title") != null ? p.get("title") : p.get("name");
                        String title = tVal != null ? String.valueOf(tVal) : "";
                        Object dVal = p.get("description");
                        String desc = dVal != null ? String.valueOf(dVal) : "";
                        Object tsVal = p.get("techStack");
                        String tech = tsVal != null ? String.valueOf(tsVal) : "";
                        Object ghVal = p.get("githubUrl");
                        String gh = ghVal != null ? String.valueOf(ghVal) : "";
                        Object imVal = p.get("impactMetrics");
                        String impact = imVal != null ? String.valueOf(imVal) : "";

                        if ((desc.isBlank() || "null".equalsIgnoreCase(desc)) && p.get("bullets") instanceof List<?> projBullets) {
                            List<String> bTexts = new ArrayList<>();
                            for (Object pb : projBullets) {
                                if (pb instanceof Map<?, ?> pbMap) {
                                    Object bt = pbMap.get("bulletText") != null ? pbMap.get("bulletText") : pbMap.get("text");
                                    if (bt != null && !String.valueOf(bt).isBlank() && !"null".equalsIgnoreCase(String.valueOf(bt))) {
                                        bTexts.add("• " + String.valueOf(bt));
                                    }
                                } else if (pb instanceof String pbs && !pbs.isBlank()) {
                                    bTexts.add("• " + pbs);
                                }
                            }
                            desc = String.join("\n", bTexts);
                        }

                        if (!title.isBlank() && !"null".equalsIgnoreCase(title)) {
                            projectRepository.save(Project.builder()
                                    .id(UUID.randomUUID().toString())
                                    .user(user)
                                    .title(title)
                                    .description(desc != null && !"null".equalsIgnoreCase(desc) ? desc : "")
                                    .techStack(tech != null && !"null".equalsIgnoreCase(tech) ? tech : "")
                                    .githubUrl(gh != null && !"null".equalsIgnoreCase(gh) ? gh : "")
                                    .impactMetrics(impact != null && !"null".equalsIgnoreCase(impact) ? impact : "")
                                    .build());
                        }
                    }
                }
            }

            return getFullResume();

        } catch (Exception e) {
            log.error("Failed to parse resume: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to parse resume: " + e.getMessage(), e);
        }
    }

    // ── PDF Generation ────────────────────────────────────

    public byte[] generateResumePdf(String photoBase64) {
        User user = getLoggedInUser();

        MasterResume masterResume = masterResumeRepository.findByUserId(user.getId())
                .stream().findFirst()
                .orElse(null);

        String summary = masterResume != null && masterResume.getSummary() != null ? masterResume.getSummary() : "";
        List<Skill> skills = skillRepository.findByUserId(user.getId());
        List<Experience> experiences = experienceRepository.findByUserId(user.getId());
        List<Project> projects = projectRepository.findByUserId(user.getId());

        Map<String, Object> payload = buildPdfPayload(user, summary, skills, experiences, projects, photoBase64);
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
        payload.put("linkedinUrl", user.getLinkedinUrl() != null ? user.getLinkedinUrl() : "");
        payload.put("githubUrl", user.getGithubUrl() != null ? user.getGithubUrl() : "");
        payload.put("summary", summary != null ? summary : "");
        payload.put("photoBase64", photoBase64 != null ? photoBase64 : "");

        MasterResume mr = masterResumeRepository.findByUserId(user.getId()).stream().findFirst().orElse(null);
        String eduRaw = mr != null && mr.getEducation() != null && !mr.getEducation().isBlank()
                ? mr.getEducation()
                : user.getEducation();
        if (eduRaw != null && !eduRaw.isBlank()) {
            try {
                Object eduParsed = objectMapper.readValue(eduRaw, Object.class);
                payload.put("education", eduParsed);
            } catch (Exception ignored) {
                payload.put("education", eduRaw);
            }
        }

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
        MasterResume mr = masterResumeRepository.findByUserId(user.getId()).stream().findFirst().orElse(null);
        String education = mr != null && mr.getEducation() != null ? mr.getEducation() : (user.getEducation() != null ? user.getEducation() : "");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("masterResume", mr != null ? List.of(resumeMapper.mapMasterResume(mr)) : List.of());
        res.put("education", education);
        res.put("skills", skillRepository.findByUserId(user.getId())
                .stream().map(resumeMapper::mapSkill).toList());
        res.put("experiences", experienceRepository.findByUserId(user.getId())
                .stream().map(experience -> {
                    var bullets = experienceBulletRepository.findByExperienceId(experience.getId())
                            .stream().map(resumeMapper::mapExperienceBullet).toList();
                    return resumeMapper.mapExperience(experience, bullets);
                }).toList());
        res.put("projects", projectRepository.findByUserId(user.getId())
                .stream().map(resumeMapper::mapProject).toList());
        return res;
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