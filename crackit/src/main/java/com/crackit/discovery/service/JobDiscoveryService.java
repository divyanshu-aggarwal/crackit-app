package com.crackit.discovery.service;

import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.common.util.AuthUtil;
import com.crackit.discovery.client.AdzunaClient;
import com.crackit.discovery.client.JSearchClient;
import com.crackit.discovery.dto.DiscoveredJobDto;
import com.crackit.discovery.entity.DiscoveredJob;
import com.crackit.discovery.repository.DiscoveredJobRepository;
import com.crackit.resume.entity.Experience;
import com.crackit.resume.entity.Skill;
import com.crackit.resume.repository.ExperienceRepository;
import com.crackit.resume.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobDiscoveryService {

    private final AdzunaClient adzunaClient;
    private final JSearchClient jSearchClient;
    private final DiscoveredJobRepository discoveredJobRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;

    // ─── Scheduled fetch every hour for common roles ─────────────────────────
    @Scheduled(fixedDelay = 3600000)
    public void scheduledFetch() {
        log.info("Running scheduled job discovery fetch...");
        List<String> commonRoles = List.of(
                "Java Backend Engineer",
                "Software Engineer",
                "Backend Developer",
                "Full Stack Developer",
                "Python Developer"
        );
        for (String role : commonRoles) {
            fetchAndStore(role, "India");
        }
        log.info("Scheduled fetch complete");
    }

    // ─── Recommended — fully dynamic from user profile ───────────────────────
    public List<DiscoveredJobDto> getRecommended() {
        String email = AuthUtil.getLoggedInUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String location = user.getLocation() != null ? user.getLocation() : "India";

        // build keywords from user's actual data
        List<String> keywords = buildKeywords(user);
        log.info("Fetching recommended jobs for keywords: {}", keywords);

        // always fetch fresh for each keyword
        for (String keyword : keywords) {
            fetchAndStore(keyword, location);
        }

        // return jobs fetched in last 24 hours matching user's role
        String primaryRole = user.getCurrentRole() != null ? user.getCurrentRole() : "Software Engineer";
        LocalDateTime since = LocalDateTime.now().minusHours(24);

        List<DiscoveredJob> results = new ArrayList<>();

        // search by each keyword and merge
        for (String keyword : keywords) {
            List<DiscoveredJob> found = discoveredJobRepository.searchFreshByKeyword(keyword, since);
            for (DiscoveredJob job : found) {
                if (results.stream().noneMatch(r -> r.getId().equals(job.getId()))) {
                    results.add(job);
                }
            }
        }

        log.info("Returning {} recommended jobs", Math.min(results.size(), 20));

        return results.stream()
                .sorted(Comparator.comparing(j -> j.getSource().equals("JSEARCH") ? 0 : 1))
                .limit(20)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ─── Manual search ────────────────────────────────────────────────────────
    public List<DiscoveredJobDto> search(String keyword, String location) {
        fetchAndStore(keyword, location);
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        return discoveredJobRepository
                .searchFreshByKeyword(keyword, since)
                .stream()
                .sorted(Comparator.comparing(j -> j.getSource().equals("JSEARCH") ? 0 : 1))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ─── Build keywords from user's actual profile data ──────────────────────
    private List<String> buildKeywords(User user) {
        List<String> keywords = new ArrayList<>();

        // 1. Current role — highest priority
        if (user.getCurrentRole() != null && !user.getCurrentRole().isBlank()) {
            keywords.add(user.getCurrentRole());
        }

        // 2. Current experience role
        List<Experience> experiences = experienceRepository.findByUserId(user.getId());
        experiences.stream()
                .filter(e -> Boolean.TRUE.equals(e.getCurrentCompany()))
                .findFirst()
                .ifPresent(e -> {
                    if (e.getRole() != null && !e.getRole().isBlank()
                            && !keywords.contains(e.getRole())) {
                        keywords.add(e.getRole());
                    }
                });

        // 3. Expert/Advanced skills as search keywords
        List<Skill> skills = skillRepository.findByUserId(user.getId());
        skills.stream()
                .filter(s -> s.getProficiencyLevel() != null &&
                        (s.getProficiencyLevel().equalsIgnoreCase("Expert") ||
                                s.getProficiencyLevel().equalsIgnoreCase("Advanced")))
                .limit(2)
                .forEach(s -> {
                    String skillKeyword = s.getSkillName() + " Developer";
                    if (!keywords.contains(skillKeyword)) {
                        keywords.add(skillKeyword);
                    }
                });

        // fallback if nothing found
        if (keywords.isEmpty()) {
            keywords.add("Software Engineer");
        }

        return keywords.stream().distinct().limit(4).collect(Collectors.toList());
    }

    // ─── Core fetch + save + deduplicate ─────────────────────────────────────
    private void fetchAndStore(String keyword, String location) {
        List<Map<String, Object>> adzunaResults = adzunaClient.search(keyword, location, 1);
        log.info("Adzuna returned {} results for keyword: {}", adzunaResults.size(), keyword);

        List<Map<String, Object>> jsearchResults = jSearchClient.search(keyword, location);
        log.info("JSearch returned {} results for keyword: {}", jsearchResults.size(), keyword);

        int saved = 0;

        for (Map<String, Object> job : adzunaResults) {
            try {
                String externalId = "adzuna_" + job.get("id");
                if (discoveredJobRepository.findByExternalId(externalId).isPresent()) continue;

                DiscoveredJob dj = DiscoveredJob.builder()
                        .id(UUID.randomUUID().toString())
                        .externalId(externalId)
                        .source("ADZUNA")
                        .title(getString(job, "title"))
                        .company(getCompanyName(job))
                        .location(getAdzunaLocation(job))
                        .description(getString(job, "description"))
                        .url(getString(job, "redirect_url"))
                        .salaryMin(getDouble(job, "salary_min"))
                        .salaryMax(getDouble(job, "salary_max"))
                        .build();

                discoveredJobRepository.save(dj);
                saved++;
            } catch (Exception e) {
                log.warn("Failed to save Adzuna job: {}", e.getMessage());
            }
        }

        for (Map<String, Object> job : jsearchResults) {
            try {
                String externalId = "jsearch_" + job.get("job_id");
                if (discoveredJobRepository.findByExternalId(externalId).isPresent()) continue;

                String city = getString(job, "job_city");
                String state = getString(job, "job_state");
                String country = getString(job, "job_country");
                String jobLocation = Stream.of(city, state, country)
                        .filter(s -> !s.isBlank())
                        .collect(Collectors.joining(", "));

                // parse posted date
                LocalDateTime postedAt = null;
                String postedStr = getString(job, "job_posted_at_datetime_utc");
                if (!postedStr.isBlank()) {
                    try {
                        postedAt = LocalDateTime.parse(postedStr.replace("Z", ""));
                    } catch (Exception ignored) {}
                }

                DiscoveredJob dj = DiscoveredJob.builder()
                        .id(UUID.randomUUID().toString())
                        .externalId(externalId)
                        .source("JSEARCH")
                        .title(getString(job, "job_title"))
                        .company(getString(job, "employer_name"))
                        .location(jobLocation)
                        .description(getString(job, "job_description"))
                        .url(getString(job, "job_apply_link"))
                        .remote(Boolean.TRUE.equals(job.get("job_is_remote")))
                        .jobType(getString(job, "job_employment_type"))
                        .salaryMin(getDouble(job, "job_min_salary"))
                        .salaryMax(getDouble(job, "job_max_salary"))
                        .postedAt(postedAt)
                        .build();

                discoveredJobRepository.save(dj);
                saved++;
            } catch (Exception e) {
                log.warn("Failed to save JSearch job: {}", e.getMessage());
            }
        }

        log.info("Saved {} new jobs for keyword: {}", saved, keyword);
    }

    // ─── Cleanup old jobs — runs daily at midnight ───────────────────────────
    @Scheduled(cron = "0 0 0 * * *")
    public void cleanupOldJobs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        List<DiscoveredJob> old = discoveredJobRepository.findByFetchedAtBefore(cutoff);
        discoveredJobRepository.deleteAll(old);
        log.info("Cleaned up {} old discovered jobs", old.size());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        try { return Double.parseDouble(val.toString()); }
        catch (Exception e) { return null; }
    }

    @SuppressWarnings("unchecked")
    private String getCompanyName(Map<String, Object> job) {
        Object company = job.get("company");
        if (company instanceof Map)
            return ((Map<String, Object>) company).getOrDefault("display_name", "").toString();
        return company != null ? company.toString() : "";
    }

    @SuppressWarnings("unchecked")
    private String getAdzunaLocation(Map<String, Object> job) {
        Object location = job.get("location");
        if (location instanceof Map)
            return ((Map<String, Object>) location).getOrDefault("display_name", "").toString();
        return "";
    }

    private DiscoveredJobDto toDto(DiscoveredJob job) {
        return DiscoveredJobDto.builder()
                .id(job.getId())
                .externalId(job.getExternalId())
                .source(job.getSource())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .description(job.getDescription())
                .url(job.getUrl())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .remote(job.getRemote())
                .jobType(job.getJobType())
                .fetchedAt(job.getFetchedAt())
                .postedAt(job.getPostedAt())  // add this line
                .build();
    }

    public List<DiscoveredJobDto> getCached() {
        String email = AuthUtil.getLoggedInUserEmail();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = user.getCurrentRole() != null && !user.getCurrentRole().isBlank()
                ? user.getCurrentRole()
                : "Software Engineer";

        LocalDateTime since = LocalDateTime.now().minusHours(24);

        List<DiscoveredJob> freshJobs =
                discoveredJobRepository.searchFreshByKeyword(role, since);

        List<DiscoveredJob> finalJobs = new ArrayList<>(freshJobs);

        if (finalJobs.size() < 6) {
            List<DiscoveredJob> olderJobs =
                    discoveredJobRepository.cacheFallback(role);

            Set<String> existingIds = finalJobs.stream()
                    .map(DiscoveredJob::getId)
                    .collect(Collectors.toSet());

            olderJobs.stream()
                    .filter(job -> !existingIds.contains(job.getId()))
                    .forEach(finalJobs::add);
        }

        return finalJobs.stream()
                .sorted(
                        Comparator
                                .comparing(
                                        (DiscoveredJob j) -> j.getPostedAt() != null
                                                ? j.getPostedAt()
                                                : j.getFetchedAt(),
                                        Comparator.nullsLast(Comparator.reverseOrder())
                                )
                                .thenComparing(j -> "JSEARCH".equals(j.getSource()) ? 0 : 1)
                )
                .limit(6)
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}