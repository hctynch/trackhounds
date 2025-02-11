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
    private int huntInterval;
    /**
     * The stake type range of the hunt.
     */
    private StakeType[] stakeTypeRange = new StakeType[4];
    /**
     * The stake range of the hunt.
     */
    private int[] stakeRange = new int[3];

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
        this.stakeRange = new int[] { 999, 999, 999 };
        this.stakeTypeRange = new StakeType[] { StakeType.ALL_AGE, StakeType.ALL_AGE, StakeType.ALL_AGE,
                StakeType.ALL_AGE };
    }

}
