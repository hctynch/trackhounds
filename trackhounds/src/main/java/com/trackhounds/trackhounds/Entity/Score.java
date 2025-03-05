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
/**
 * Score class for individual scores.
 */
public class Score {

  /**
   * Unique Id
   */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  /**
   * Points awarded
   */
  private int points;
  /**
   * Time of the score
   */
  private LocalTime time;
  /**
   * Whether or not to count based off interval
   */
  private boolean counted = false;

  /**
   * The number of the judge that awarded the score
   */
  private int judgeNumber;

  /**
   * Default constructor for a score
   * 
   * @param points Points awarded
   * @param time   Time of the cross
   */
  public Score(int points, LocalTime time, boolean counted, int judgeNumber) {
    setPoints(points);
    setTime(time);
    setCounted(counted);
    setJudgeNumber(judgeNumber);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (!(o instanceof Score))
      return false;
    Score score = (Score) o;
    return id == score.id;
  }

}
