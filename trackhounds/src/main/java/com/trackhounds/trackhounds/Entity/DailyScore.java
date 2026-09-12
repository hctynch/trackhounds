package com.trackhounds.trackhounds.Entity;

import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One dog's scoring for one hunt day: every cross of the day and which of them
 * count. A cross counts when it is the dog's highest within its scoring
 * interval (a {@code timeBucket} of {@code interval} minutes from the day's
 * start time); with an interval of 0 every cross counts.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class DailyScore {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** Speed and drive for the day: the sum of the counted crosses. */
  private int dailyScore = 0;

  @ManyToOne(optional = false)
  private Days day;

  @ManyToOne
  @JsonBackReference
  private DogEntity dog;

  @OneToMany(mappedBy = "dailyScore", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference("daily-score-scores")
  private List<Score> scores = new ArrayList<>();

  /** Time of the latest counted cross (tie-breaking in rankings). */
  private LocalTime lastCross = LocalTime.of(0, 0);

  /** Points of the latest counted cross (tie-breaking in rankings). */
  private int associatedPoints = 0;

  private boolean zeroInterval = false;

  public DailyScore(Days day, DogEntity dog) {
    this.day = day;
    this.dog = dog;
  }

  /**
   * Record a cross for this day and work out whether it counts.
   *
   * @param score     the cross
   * @param startTime start time of the day
   * @param interval  scoring interval in minutes (0 = every cross counts)
   */
  public void addScore(Score score, LocalTime startTime, int interval) {
    score.setDailyScore(this);
    score.setTimeBucket(bucketOf(score, startTime, interval));
    scores.add(score);
    recount(interval);
  }

  /**
   * Remove a cross from this day; the remaining crosses are re-evaluated.
   *
   * @param score the cross to remove
   */
  public void removeScore(Score score) {
    scores.remove(score);
    recount(zeroInterval ? 0 : -1);
  }

  /**
   * Re-sort every cross of this day into intervals measured from a new start
   * time. Used when the day's start time is corrected.
   *
   * @param startTime new start time of the day
   * @param interval  scoring interval in minutes
   */
  public void rebucket(LocalTime startTime, int interval) {
    for (Score score : scores) {
      score.setTimeBucket(bucketOf(score, startTime, interval));
    }
    recount(interval);
  }

  private static int bucketOf(Score score, LocalTime startTime, int interval) {
    if (interval == 0 || startTime == null || score.getTime() == null) {
      return 0;
    }
    return (int) Duration.between(startTime, score.getTime()).toMinutes() / interval;
  }

  /**
   * Decide which crosses count: the highest per interval (the earliest wins a
   * tie), or all of them when the interval is 0. Also refreshes the day's
   * speed and drive and the last counted cross.
   *
   * @param interval scoring interval; a negative value keeps the current
   *                 zero-interval setting
   */
  private void recount(int interval) {
    if (interval >= 0) {
      zeroInterval = interval == 0;
    }
    Map<Integer, Score> best = new LinkedHashMap<>();
    for (Score score : scores) {
      score.setCounted(false);
      if (zeroInterval) {
        best.put(best.size(), score);
      } else {
        Score current = best.get(score.getTimeBucket());
        if (current == null || score.getPoints() > current.getPoints()) {
          best.put(score.getTimeBucket(), score);
        }
      }
    }
    int total = 0;
    lastCross = LocalTime.of(0, 0);
    associatedPoints = 0;
    for (Score winner : best.values()) {
      winner.setCounted(true);
      total += winner.getPoints();
      if (winner.getTime() != null && winner.getTime().isAfter(lastCross)) {
        lastCross = winner.getTime();
        associatedPoints = winner.getPoints();
      }
    }
    dailyScore = total;
  }

  /** Every cross of the day with its interval (read-only view). */
  @JsonIgnore
  public List<TimeBucketScore> getTimeBucketScores() {
    return scores.stream().map(score -> new TimeBucketScore(score.getTimeBucket(), score)).toList();
  }

  /** The counted crosses of the day (read-only view). */
  @JsonIgnore
  public List<HighestScore> getHighestScores() {
    return scores.stream().filter(Score::isCounted).map(score -> new HighestScore(score.getTimeBucket(), score)).toList();
  }
}
