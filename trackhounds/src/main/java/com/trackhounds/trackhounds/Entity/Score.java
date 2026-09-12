package com.trackhounds.trackhounds.Entity;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One dog's points from one cross. Owned by the dog's {@link DailyScore} for
 * that day, which decides the scoring interval ({@code timeBucket}) the cross
 * falls into and whether it {@code counted} (the highest cross of the dog in
 * that interval).
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Score {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private int points;

  private LocalTime time;

  private boolean counted = false;

  private int judgeNumber;

  /** Dog number: a string of digits; leading zeros are significant ("0" and "00" differ). */
  private String dogNumber;

  private int day;

  /** Scoring interval of the day this cross falls into, counted from the day's start time. */
  private int timeBucket;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "daily_score_id")
  @JsonBackReference("daily-score-scores")
  private DailyScore dailyScore;

  public Score(int points, LocalTime time, boolean counted, int judgeNumber, String dogNumber, int day) {
    this.points = points;
    this.time = time;
    this.counted = counted;
    this.judgeNumber = judgeNumber;
    this.dogNumber = dogNumber;
    this.day = day;
  }

  public Score(int points, LocalTime time, boolean counted, int judgeNumber, int dogNumber, int day) {
    this(points, time, counted, judgeNumber, String.valueOf(dogNumber), day);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (!(o instanceof Score))
      return false;
    Score score = (Score) o;
    // Boxed ids: compare values, never references. Unsaved scores are only equal to themselves.
    return id != null && id.equals(score.id);
  }

  @Override
  public int hashCode() {
    // Constant per class: the id is assigned on save, so it cannot take part in the hash.
    return Score.class.hashCode();
  }
}
