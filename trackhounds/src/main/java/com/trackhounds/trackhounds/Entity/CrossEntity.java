package com.trackhounds.trackhounds.Entity;

import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One cross: what one judge recorded at one time on one day. The dogs in it
 * are {@link Score} rows that carry this cross's id and their place in it, so
 * a cross can be listed, edited and deleted as a whole. Ids grow in the order
 * crosses are entered, which is how "the last cross entered" is found.
 * <p>
 * The table is called {@code crosses} because {@code cross} is an SQL keyword.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "crosses")
public class CrossEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private int day;

  private LocalTime time;

  private int judgeNumber;

  public CrossEntity(int day, LocalTime time, int judgeNumber) {
    this.day = day;
    this.time = time;
    this.judgeNumber = judgeNumber;
  }
}
