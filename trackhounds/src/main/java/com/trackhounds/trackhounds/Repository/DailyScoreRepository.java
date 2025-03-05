package com.trackhounds.trackhounds.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.DailyScore;

/**
 * Repository for DailyScores
 */
public interface DailyScoreRepository extends JpaRepository<DailyScore, Integer> {
    List<DailyScore> findAllByDayDay(int day);
}
