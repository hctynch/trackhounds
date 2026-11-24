package com.trackhounds.trackhounds.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trackhounds.trackhounds.Entity.Score;

/**
 * Repository for Individual Scores
 */
public interface ScoreRepository extends JpaRepository<Score, Long> {

    /**
     * Find all scores ordered by day ascending, then time ascending
     * 
     * @return List of scores
     */
    List<Score> findAllByOrderByDayAscTimeAsc();

    /**
     * Find all scores for a given dog, ordered by day and time
     * 
     * @param dogNumber Number of the dog
     * @return List of scores ordered chronologically
     */
    List<Score> findByDogNumberOrderByDayAscTimeAsc(String dogNumber);

    /**
     * Find all scores for a given judge, ordered by day and time
     * 
     * @param judgeNumber Number of the judge
     * @return List of scores ordered chronologically
     */
    List<Score> findByJudgeNumberOrderByDayAscTimeAsc(int judgeNumber);

    /**
     * Find all scores for a given dog on a specific day, ordered by time
     * 
     * @param dogNumber Number of the dog
     * @param day       Day of the hunt (1-4)
     * @return List of scores ordered by time
     */
    List<Score> findByDogNumberAndDayOrderByTimeAsc(String dogNumber, int day);

    /**
     * Find all scores for a given judge on a specific day, ordered by time
     * 
     * @param judgeNumber Number of the judge
     * @param day         Day of the hunt (1-4)
     * @return List of scores ordered by time
     */
    List<Score> findByJudgeNumberAndDayOrderByTimeAsc(int judgeNumber, int day);

    /**
     * Find all scores for a given day, ordered by time
     * 
     * @param day Day of the hunt (1-4)
     * @return List of scores ordered by time
     */
    List<Score> findByDayOrderByTimeAsc(int day);

    /**
     * The dogs of one cross in crossing order
     *
     * @param crossId Id of the cross
     * @return List of scores, first dog across first
     */
    List<Score> findByCrossIdOrderByCrossPositionAscIdAsc(Long crossId);

    /**
     * How many scores a cross still has
     *
     * @param crossId Id of the cross
     * @return number of scores
     */
    long countByCrossId(Long crossId);
}
