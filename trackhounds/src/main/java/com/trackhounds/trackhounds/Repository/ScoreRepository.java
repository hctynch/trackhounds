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

    /**
     * Find all scores for a given dog
     * 
     * @param dogNumber Number of the dog
     * @return List of scores
     */
    List<Score> findByDogNumber(int dogNumber);

    /**
     * Find all scores for a given judge
     * 
     * @param judgeNumber Number of the judge
     * @return List of scores
     */
    List<Score> findByJudgeNumber(int judgeNumber);

    /**
     * Find all scores for a given dog on a specific day
     * 
     * @param dogNumber Number of the dog
     * @param day       Day of the hunt (1-4)
     * @return List of scores
     */
    List<Score> findByDogNumberAndDay(int dogNumber, int day);

    /**
     * Find all scores for a given judge on a specific day
     * 
     * @param judgeNumber Number of the judge
     * @param day         Day of the hunt (1-4)
     * @return List of scores
     */
    List<Score> findByJudgeNumberAndDay(int judgeNumber, int day);

    /**
     * Find all scores for a given day
     * 
     * @param day Day of the hunt (1-4)
     * @return List of scores
     */
    List<Score> findByDay(int day);
}
