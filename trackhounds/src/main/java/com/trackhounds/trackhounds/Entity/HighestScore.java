package com.trackhounds.trackhounds.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
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
 * Entity class for the highest score of a dog in a time bucket.
 */
public class HighestScore {
    /**
     * Unique Id
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /**
     * Time bucket of the highest score
     */
    private int timeBucket;
    /**
     * Score of the highest score
     */
    @ManyToOne
    private Score score;
    /**
     * Reference to the DailyScore
     */
    @ManyToOne
    @JsonBackReference
    private DailyScore dailyScore;
}