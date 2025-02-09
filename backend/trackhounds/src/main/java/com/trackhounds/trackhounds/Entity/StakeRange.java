package com.trackhounds.trackhounds.Entity;

import com.trackhounds.trackhounds.Enums.StakeType;

/**
 * Entity class for StakeRange. This class is used to store the stake ranges.
 */
public class StakeRange {
    private int[] ranges = new int[4];
    private StakeType[] stakeTypes = new StakeType[4];

    public StakeRange(int[] ranges, StakeType[] stakeTypes) {
        this.ranges = ranges;
        this.stakeTypes = stakeTypes;
    }

    public int[] getRanges() {
        return ranges;
    }

    public void setRanges(int[] ranges) {
        this.ranges = ranges;
    }

    public StakeType[] getStakeTypes() {
        return stakeTypes;
    }

    public void setStakeTypes(StakeType[] stakeTypes) {
        this.stakeTypes = stakeTypes;
    }

}
