package com.trackhounds.trackhounds.Dto;

import com.trackhounds.trackhounds.Enums.StakeType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for cross information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrossInfoRequest {
    /**
     * Array of dog numbers in the cross
     */
    private String[] dogNumbers;

    /**
     * Starting points for the first dog
     */
    private int startingPoints;

    /**
     * Interval between consecutive dogs
     */
    private int interval;

    /**
     * Stake type for the hunt (ALL_AGE, DERBY, or DUAL)
     */
    private StakeType stakeType;

    /** Convenience for callers that still hold numeric dog numbers. */
    public CrossInfoRequest(int[] dogNumbers, int startingPoints, int interval, StakeType stakeType) {
        this.dogNumbers = new String[dogNumbers == null ? 0 : dogNumbers.length];
        for (int i = 0; i < this.dogNumbers.length; i++) {
            this.dogNumbers[i] = String.valueOf(dogNumbers[i]);
        }
        this.startingPoints = startingPoints;
        this.interval = interval;
        this.stakeType = stakeType;
    }
}