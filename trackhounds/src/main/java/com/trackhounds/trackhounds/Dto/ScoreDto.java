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
    private String[] dogNumbers;
    /**
     * Scores of the score
     */
    private int[] scores;

    /**
     * Interval of the hunt
     */
    private int interval;

    /** Convenience for callers that still hold numeric dog numbers. */
    public ScoreDto(int day, String startTime, int judge, String crossTime, int[] dogNumbers, int[] scores, int interval) {
        this(day, startTime, judge, crossTime, toStrings(dogNumbers), scores, interval);
    }

    private static String[] toStrings(int[] numbers) {
        if (numbers == null) {
            return null;
        }
        String[] result = new String[numbers.length];
        for (int i = 0; i < numbers.length; i++) {
            result[i] = String.valueOf(numbers[i]);
        }
        return result;
    }

}
