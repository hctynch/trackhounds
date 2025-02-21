package com.trackhounds.trackhounds.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.Score;

/**
 * Repository for Individual Scores
 */
public interface ScoreRepository extends JpaRepository<Score, Long> {

}
