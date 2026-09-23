package com.crackit.resume.controller;

import com.crackit.resume.dto.request.*;
import com.crackit.resume.dto.response.*;
import com.crackit.resume.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/master")
    public MasterResumeResponse createMasterResume(@RequestBody MasterResumeRequest request) {
        return resumeService.createMasterResume(request);
    }

    @PutMapping("/master")
    public MasterResumeResponse updateMasterResume(@RequestBody MasterResumeRequest request) {
        return resumeService.updateMasterResume(request);
    }

    @PostMapping("/upload")
    public Map<String, Object> uploadResume(@RequestParam("file") MultipartFile file) {
        return resumeService.uploadAndParseResume(file);
    }

    @GetMapping
    public Map<String, Object> getFullResume() {
        return resumeService.getFullResume();
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadResume() {
        byte[] pdf = resumeService.generateResumePdf(null);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=resume.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // Skills
    @PostMapping("/skills")
    public SkillResponse addSkill(@RequestBody SkillRequest request) {
        return resumeService.addSkill(request);
    }

    @PutMapping("/skills/{id}")
    public SkillResponse updateSkill(@PathVariable String id, @RequestBody SkillRequest request) {
        return resumeService.updateSkill(id, request);
    }

    @DeleteMapping("/skills/{id}")
    public void deleteSkill(@PathVariable String id) {
        resumeService.deleteSkill(id);
    }

    // Experiences
    @PostMapping("/experiences")
    public ExperienceResponse addExperience(@RequestBody ExperienceRequest request) {
        return resumeService.addExperience(request);
    }

    @PutMapping("/experiences/{id}")
    public ExperienceResponse updateExperience(@PathVariable String id, @RequestBody ExperienceRequest request) {
        return resumeService.updateExperience(id, request);
    }

    @DeleteMapping("/experiences/{id}")
    public void deleteExperience(@PathVariable String id) {
        resumeService.deleteExperience(id);
    }

    // Bullets
    @PostMapping("/experience-bullets") 
    public ExperienceBulletResponse addExperienceBullet(@RequestBody ExperienceBulletRequest request) {
        return resumeService.addExperienceBullet(request);
    }

    @PutMapping("/experience-bullets/{id}")
    public ExperienceBulletResponse updateBullet(@PathVariable String id, @RequestBody ExperienceBulletRequest request) {
        return resumeService.updateBullet(id, request);
    }

    @DeleteMapping("/experience-bullets/{id}")
    public void deleteBullet(@PathVariable String id) {
        resumeService.deleteBullet(id);
    }

    // Projects
    @PostMapping("/projects")
    public ProjectResponse addProject(@RequestBody ProjectRequest request) {
        return resumeService.addProject(request);
    }

    @PutMapping("/projects/{id}")
    public ProjectResponse updateProject(@PathVariable String id, @RequestBody ProjectRequest request) {
        return resumeService.updateProject(id, request);
    }

    @DeleteMapping("/projects/{id}")
    public void deleteProject(@PathVariable String id) {
        resumeService.deleteProject(id);
    }
}