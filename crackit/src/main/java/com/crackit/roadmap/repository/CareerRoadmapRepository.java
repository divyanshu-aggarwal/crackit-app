package com.crackit.roadmap.repository;

import com.crackit.roadmap.entity.CareerRoadmap;
import com.crackit.roadmap.enums.RoadmapStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CareerRoadmapRepository extends JpaRepository<CareerRoadmap, String> {

    Optional<CareerRoadmap> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, RoadmapStatus status);

    List<CareerRoadmap> findByUserIdOrderByCreatedAtDesc(String userId);
}
