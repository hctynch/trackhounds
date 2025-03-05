package com.trackhounds.trackhounds.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.Score;

/**
 * Repository for Individual Scores
 */
public interface ScoreRepository extends JpaRepository<Score, Long> {

    /**
     * Find all scores ordered by time descending
     * 
     * @return List of scores
     */
    List<Score> findAllByOrderByTimeDesc();
}
