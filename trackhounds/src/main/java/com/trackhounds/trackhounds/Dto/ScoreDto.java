package com.trackhounds.trackhounds.Dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
/**
 * Data Transfer Object for a Score
 */
public class ScoreDto {
    /**
     * day of the score
     */
    private int day;
    /**
     * Start time of the score
     */
    private String startTime;
    /**
     * Judge of the score
     */
    private int judge;
    /**
     * Cross time of the score
     */
    private String crossTime;
    /**
     * Dog numbers of the score
     */
    private int[] dogNumbers;
    /**
     * Scores of the score
     */
    private int[] scores;

    /**
     * Interval of the hunt
     */
    private int interval;

}
