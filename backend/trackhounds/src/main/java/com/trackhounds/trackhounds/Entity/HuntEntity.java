package com.trackhounds.trackhounds.Entity;

import com.trackhounds.trackhounds.Enums.StakeType;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
/**
 * Entity class for Hunt's. This class is used to store the information of a
 * hunt in the database.
 * 
 */
public class HuntEntity {
    /**
     * The id of the hunt.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
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
    private int interval;
    /**
     * The stake range of the hunt.
     */
    private StakeRange stakeRange;

    public HuntEntity(String title, String dates, StakeType stake, int interval) {
        this.title = title;
        this.dates = dates;
        this.stake = stake;
        this.interval = interval;
        this.stakeRange = new StakeRange(new int[] { 999, 999, 999, 999 },
                new StakeType[] { StakeType.ALL_AGE, StakeType.ALL_AGE,
                        StakeType.ALL_AGE, StakeType.ALL_AGE });
    }

}
