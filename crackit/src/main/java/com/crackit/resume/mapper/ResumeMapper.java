package com.crackit.resume.mapper;

import com.crackit.resume.dto.response.*;
import com.crackit.resume.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ResumeMapper {

    public SkillResponse mapSkill(Skill skill) {

        return SkillResponse.builder()
                .id(skill.getId())
                .skillName(skill.getSkillName())
                .category(skill.getCategory())
                .proficiencyLevel(skill.getProficiencyLevel())
                .yearsUsed(skill.getYearsUsed())
                .build();
    }

    public ExperienceResponse mapExperience(
            Experience experience,
            List<ExperienceBulletResponse> bullets
    ) {
        return ExperienceResponse.builder()
                .id(experience.getId())
                .companyName(experience.getCompanyName())
                .role(experience.getRole())
                .startDate(experience.getStartDate())
                .endDate(experience.getEndDate())
                .currentCompany(experience.getCurrentCompany())
                .description(experience.getDescription())
                .bullets(bullets)
                .build();
    }

    public ProjectResponse mapProject(Project project) {

        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .techStack(project.getTechStack())
                .githubUrl(project.getGithubUrl())
                .impactMetrics(project.getImpactMetrics())
                .build();
    }

    public MasterResumeResponse mapMasterResume(MasterResume resume) {

        return MasterResumeResponse.builder()
                .id(resume.getId())
                .summary(resume.getSummary())
                .rawResumeText(resume.getRawResumeText())
                .build();
    }

    public ExperienceBulletResponse mapExperienceBullet(ExperienceBullet bullet) {

        return ExperienceBulletResponse.builder()
                .id(bullet.getId())
                .experienceId(bullet.getExperience().getId())
                .bulletText(bullet.getBulletText())
                .technologies(bullet.getTechnologies())
                .priorityScore(bullet.getPriorityScore())
                .build();
    }
}