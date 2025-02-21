package com.trackhounds.trackhounds.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.DailyScore;

/**
 * Repository for DailyScores
 */
public interface DailyScoreRepository extends JpaRepository<DailyScore, Long> {

}
