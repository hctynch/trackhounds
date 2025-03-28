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
    private int[] dogNumbers;

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
}