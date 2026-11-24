package com.trackhounds.trackhounds.Entity;

import com.trackhounds.trackhounds.Enums.StakeType;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity class for Hunt's. This class is used to store the information of a
 * hunt in the database.
 * 
 */
@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "hunt_entity")
public class HuntEntity {
    /**
     * The id of the hunt.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /**
     * The title of the hunt.
     */
    private String title;
    /**
     * The dates of the hunt.
     */
    private String dates;
    /**
     * The stake type of the hunt.
     */
    private StakeType stake;
    /**
     * The interval of the hunt.
     */
    /**
     * Scoring interval in minutes. Counted from the day's start time, only a
     * dog's highest cross within each interval is scored.
     */
    private int huntInterval;
    /**
     * Points deducted for each following dog in a cross (the first dog gets the
     * first-dog points entered with the cross). Normally 5, but set per hunt.
     */
    @org.hibernate.annotations.ColumnDefault("5")
    private int pointStep = 5;
    /** Points the first dog of a cross receives by default. Set per hunt, normally 35. */
    @org.hibernate.annotations.ColumnDefault("35")
    private int firstDogPoints = 35;
    /** Number of hunt days (1 to 4). Day selectors and reports only offer these days. */
    @org.hibernate.annotations.ColumnDefault("4")
    private int huntDays = 4;
    /** City the hunt is held in. Printed with the state on the hunt summary and in report headers. */
    private String city;
    /** State the hunt is held in. */
    private String state;
    /** President of the club or association running the hunt. Printed on the hunt summary. */
    private String president;
    /** Master of Hounds for the hunt. Printed on the hunt summary. */
    private String masterOfHounds;
    /**
     * Pack scoring: the points proposed for a cross count down from the first-dog
     * points to {@link #packMinimumPoints} and every dog after that also receives
     * the minimum (35, 30, 25, 20, 15, 15, 15, ...). Off, the points keep counting
     * down to zero.
     */
    @org.hibernate.annotations.ColumnDefault("false")
    private boolean packScoring = false;
    /** The lowest points a dog in a cross receives under pack scoring. Normally 15. */
    @org.hibernate.annotations.ColumnDefault("15")
    private int packMinimumPoints = 15;
    /**
     * The stake type range of the hunt.
     */
    private StakeType[] stakeTypeRange = new StakeType[4];
    /**
     * The stake range of the hunt.
     */
    private int[] stakeRange = new int[4];

    /**
     * Constructor for the HuntEntity class.
     * 
     * @param title    Title of the hunt.
     * @param dates    Dates of the hunt.
     * @param stake    Stake type of the hunt.
     * @param interval Interval of the hunt.
     */
    public HuntEntity(String title, String dates, StakeType stake, int interval) {
        this.title = title;
        this.dates = dates;
        this.stake = stake;
        this.huntInterval = interval;
        this.stakeRange = new int[] { 0, 0, 0, 0 };
        this.stakeTypeRange = new StakeType[] { StakeType.ALL_AGE, StakeType.ALL_AGE, StakeType.ALL_AGE,
                StakeType.ALL_AGE };
    }

    /**
     * The lowest points a cross proposes for a dog: the pack minimum under pack
     * scoring, otherwise zero (points never go negative).
     */
    public int lowestCrossPoints() {
        return packScoring ? Math.max(0, packMinimumPoints) : 0;
    }

}
