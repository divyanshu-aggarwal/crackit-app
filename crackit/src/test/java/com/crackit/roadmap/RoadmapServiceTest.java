package com.crackit.roadmap;

import com.crackit.ai.client.AiServiceClient;
import com.crackit.auth.entity.User;
import com.crackit.auth.repository.UserRepository;
import com.crackit.resume.entity.Skill;
import com.crackit.resume.repository.SkillRepository;
import com.crackit.roadmap.dto.GenerateRoadmapRequest;
import com.crackit.roadmap.dto.RoadmapResponse;
import com.crackit.roadmap.entity.CareerRoadmap;
import com.crackit.roadmap.enums.RoadmapStatus;
import com.crackit.roadmap.repository.CareerRoadmapRepository;
import com.crackit.roadmap.service.RoadmapService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoadmapServiceTest {

    @Mock
    private CareerRoadmapRepository roadmapRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private AiServiceClient aiServiceClient;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private RoadmapService roadmapService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-123")
                .email("candidate@crackit.com")
                .fullName("Test Candidate")
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("candidate@crackit.com", "pass")
        );
    }

    @Test
    @DisplayName("generateRoadmap: Successfully generates roadmap, infers skills, archives old roadmap")
    void testGenerateRoadmap_Success() {
        when(userRepository.findByEmail("candidate@crackit.com")).thenReturn(Optional.of(testUser));
        when(skillRepository.findByUserId("user-123")).thenReturn(List.of(
                Skill.builder().skillName("Java").build(),
                Skill.builder().skillName("Spring Boot").build()
        ));

        Map<String, Object> aiResponse = Map.of(
                "readiness", Map.of("overallScore", 82, "verdict", "Strong potential"),
                "milestones", List.of(
                        Map.of("milestoneNumber", 1, "title", "Core LLD", "topics", List.of(
                                Map.of("id", "t-1", "title", "Concurrency", "completed", false)
                        ))
                ),
                "compatibleCompanies", List.of(
                        Map.of("companyName", "Razorpay", "matchScore", 90)
                )
        );

        when(aiServiceClient.generateRoadmap(any())).thenReturn(aiResponse);

        CareerRoadmap existingRoadmap = CareerRoadmap.builder()
                .id("old-roadmap")
                .userId("user-123")
                .status(RoadmapStatus.ACTIVE)
                .build();

        when(roadmapRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc("user-123", RoadmapStatus.ACTIVE))
                .thenReturn(Optional.of(existingRoadmap));

        when(roadmapRepository.save(any(CareerRoadmap.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GenerateRoadmapRequest request = GenerateRoadmapRequest.builder()
                .currentRole("Backend SDE-1")
                .yearsOfExperience(2.0)
                .targetRole("Senior Backend Engineer")
                .targetCompensation("₹30 LPA")
                .targetTimelineWeeks(8)
                .build();

        RoadmapResponse response = roadmapService.generateRoadmap(request);

        assertNotNull(response);
        assertEquals("user-123", response.getUserId());
        assertEquals("Senior Backend Engineer", response.getTargetRole());
        assertEquals(82, response.getOverallScore());
        assertEquals(0, response.getOverallProgress());
        assertEquals(RoadmapStatus.ACTIVE.name(), response.getStatus());

        // Verify old roadmap was archived
        assertEquals(RoadmapStatus.ARCHIVED, existingRoadmap.getStatus());
        verify(roadmapRepository, times(2)).save(any(CareerRoadmap.class));
    }

    @Test
    @DisplayName("getCurrentRoadmap: Returns active roadmap for logged-in user")
    void testGetCurrentRoadmap() {
        when(userRepository.findByEmail("candidate@crackit.com")).thenReturn(Optional.of(testUser));

        CareerRoadmap roadmap = CareerRoadmap.builder()
                .id("roadmap-abc")
                .userId("user-123")
                .targetRole("Staff Engineer")
                .overallScore(85)
                .overallProgress(25)
                .roadmapJson("{\"milestones\":[]}")
                .status(RoadmapStatus.ACTIVE)
                .build();

        when(roadmapRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc("user-123", RoadmapStatus.ACTIVE))
                .thenReturn(Optional.of(roadmap));

        RoadmapResponse response = roadmapService.getCurrentRoadmap();

        assertNotNull(response);
        assertEquals("Staff Engineer", response.getTargetRole());
        assertEquals(85, response.getOverallScore());
        assertEquals(25, response.getOverallProgress());
    }

    @Test
    @DisplayName("updateTopicProgress: Marks topic completed and updates overall progress")
    void testUpdateTopicProgress() {
        when(userRepository.findByEmail("candidate@crackit.com")).thenReturn(Optional.of(testUser));

        String initialJson = """
        {
          "milestones": [
            {
              "milestoneNumber": 1,
              "topics": [
                {"id": "t-1", "title": "Topic 1", "completed": false},
                {"id": "t-2", "title": "Topic 2", "completed": false}
              ]
            }
          ]
        }
        """;

        CareerRoadmap roadmap = CareerRoadmap.builder()
                .id("roadmap-abc")
                .userId("user-123")
                .targetRole("Senior Engineer")
                .overallProgress(0)
                .roadmapJson(initialJson)
                .status(RoadmapStatus.ACTIVE)
                .build();

        when(roadmapRepository.findById("roadmap-abc")).thenReturn(Optional.of(roadmap));
        when(roadmapRepository.save(any(CareerRoadmap.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RoadmapResponse response = roadmapService.updateTopicProgress("roadmap-abc", "t-1", true);

        assertNotNull(response);
        assertEquals(50, response.getOverallProgress(), "1 of 2 topics completed should be 50%");
    }

    @Test
    @DisplayName("getSampleRoadmap: Returns non-empty interactive sample roadmap")
    void testGetSampleRoadmap() {
        Map<String, Object> sample = roadmapService.getSampleRoadmap();

        assertNotNull(sample);
        assertTrue(sample.containsKey("readiness"));
        assertTrue(sample.containsKey("milestones"));
        assertTrue(sample.containsKey("compatibleCompanies"));
        assertTrue(sample.containsKey("skillGaps"));
    }
}
