package com.trackhounds.trackhounds.Entity;

import java.time.LocalTime;

import jakarta.persistence.Entity;
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
 * Days class for individual days.
 */
public class Days {

    /**
     * Unique Id
     */
    @Id
    private int day;

    /**
     * Start time of the day
     */
    private LocalTime startTime;

}
