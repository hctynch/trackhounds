package com.trackhounds.trackhounds.Entity;

import java.time.LocalTime;

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
@NoArgsConstructor
@AllArgsConstructor
public class Scratch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String dogNumber;

    private String dogName;
    /** Hunt day the scratch happened on (1 to the hunt's day count). */
    @org.hibernate.annotations.ColumnDefault("1")
    private int day = 1;

    private LocalTime time;

    private int judgeNumber;

    private String reason;

    public void setDogNumber(int dogNumber) {
        this.dogNumber = String.valueOf(dogNumber);
    }

    public void setDogNumber(String dogNumber) {
        this.dogNumber = dogNumber;
    }
}
