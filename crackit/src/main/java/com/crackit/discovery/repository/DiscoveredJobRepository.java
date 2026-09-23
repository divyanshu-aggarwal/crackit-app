package com.crackit.discovery.repository;

import com.crackit.discovery.entity.DiscoveredJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DiscoveredJobRepository extends JpaRepository<DiscoveredJob, String> {
    Optional<DiscoveredJob> findByExternalId(String externalId);

    @Query("SELECT d FROM DiscoveredJob d WHERE " +
            "LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<DiscoveredJob> searchByKeyword(@Param("keyword") String keyword);

    List<DiscoveredJob> findTop20ByOrderByFetchedAtDesc();

    @Query("SELECT d FROM DiscoveredJob d WHERE " +
            "LOWER(d.title) LIKE LOWER(CONCAT('%', :role, '%')) AND " +
            "LOWER(d.location) LIKE LOWER(CONCAT('%', :location, '%'))")
    List<DiscoveredJob> findByRoleAndLocation(
            @Param("role") String role,
            @Param("location") String location
    );

    @Query("SELECT d FROM DiscoveredJob d WHERE " +
            "d.fetchedAt > :since AND (" +
            "LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<DiscoveredJob> searchFreshByKeyword(
            @Param("keyword") String keyword,
            @Param("since") LocalDateTime since
    );

    List<DiscoveredJob> findByFetchedAtBefore(LocalDateTime cutoff);

    @Query("""
    select distinct d.title
    from DiscoveredJob d
    where lower(d.title) like lower(concat('%', :q, '%'))
""")
    List<String> findTopTitles(@Param("q") String q);

    @Query("""
    select distinct d.location
    from DiscoveredJob d
    where lower(d.location) like lower(concat('%', :q, '%'))
""")
    List<String> findTopLocations(@Param("q") String q);

    @Query("""
    SELECT d FROM DiscoveredJob d
    WHERE LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
       OR LOWER(d.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
    ORDER BY d.fetchedAt DESC
""")
    List<DiscoveredJob> cacheFallback(
            @Param("keyword") String keyword
    );
}