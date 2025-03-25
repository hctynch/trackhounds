package com.trackhounds.trackhounds.Entity;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
 * Entity Storing a Dogs daily Scores.
 */
public class DailyScore {
  /**
   * Unique Id
   */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * List of time bucket scores
   */
  @OneToMany(mappedBy = "dailyScore", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference
  private List<TimeBucketScore> timeBucketScores = new ArrayList<>();

  /**
   * List of highest scores
   */
  @OneToMany(mappedBy = "dailyScore", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @JsonManagedReference
  private List<HighestScore> highestScores = new ArrayList<>();

  /**
   * Day of DailyScores
   */
  @ManyToOne(optional = false)
  private Days day;

  /**
   * Dog associated with the DailyScore
   */
  @ManyToOne
  @JsonBackReference
  private DogEntity dog;

  /**
   * Time of the last cross
   */
  private LocalTime lastCross = LocalTime.of(0, 0);

  /**
   * Associated points for last cross
   */
  private int associatedPoints = 0;

  /**
   * Flag for 0 interval hunts
   */
  private boolean zeroInterval = false;

  /** Daily S&D Score */
  private int dailyScore = 0;

  /**
   * Default constructor for DailyScore
   * 
   * @param day Day of Scores
   */
  public DailyScore(Days day, DogEntity dog) {
    setDay(day);
    setDog(dog);
  }

  /**
   * Add a score to the appropriate time bucket
   * 
   * @param score     Score to add
   * @param startTime Start time of the time bucket
   * @param interval  Interval duration in minutes
   */
  public void addScore(Score score, LocalTime startTime, int interval) {
    if (interval == 0) {
      zeroInterval = true;
    }

    int bucket = interval == 0 ? 0
        : (int) java.time.Duration.between(startTime, score.getTime()).toMinutes() / interval;
    TimeBucketScore timeBucketScore = new TimeBucketScore(null, bucket, score, this);
    timeBucketScores.add(timeBucketScore);

    // For 0 interval hunts, all scores are counted
    if (interval == 0) {
      score.setCounted(true);
      highestScores.add(new HighestScore(null, 0, score, this));
      if (score.getTime().isAfter(lastCross)) {
        lastCross = score.getTime();
        associatedPoints = score.getPoints();
      }
    } else {
      // Normal behavior for non-zero interval hunts
      HighestScore highestScore = highestScores.stream()
          .filter(hs -> hs.getTimeBucket() == bucket)
          .findFirst()
          .orElse(null);
      if (highestScore == null || score.getPoints() > highestScore.getScore().getPoints()) {
        if (highestScore != null) {
          highestScore.getScore().setCounted(false);
          highestScores.remove(highestScore);
        }
        score.setCounted(true);
        highestScores.add(new HighestScore(null, bucket, score, this));
        if (score.getTime().isAfter(lastCross)) {
          lastCross = score.getTime();
          associatedPoints = score.getPoints();
        }
      } else {
        score.setCounted(false);
      }
    }
  }

  /**
   * Remove a score from the appropriate time bucket
   * 
   * @param score Score to remove
   * @return The removed score
   */
  public Score removeScore(Score score) {
    TimeBucketScore timeBucketScore = timeBucketScores.stream()
        .filter(tbs -> tbs.getScore().equals(score))
        .findFirst()
        .orElse(null);
    if (timeBucketScore == null) {
      return null;
    }

    timeBucketScores.remove(timeBucketScore);
    score.setCounted(false);

    HighestScore highestScore = highestScores.stream()
        .filter(hs -> hs.getScore().equals(score))
        .findFirst()
        .orElse(null);
    if (highestScore != null) {
      highestScores.remove(highestScore);
      if (highestScore.getScore().getTime().equals(lastCross)) {
        lastCross = LocalTime.of(0, 0);
        associatedPoints = 0;
        for (HighestScore hs : highestScores) {
          LocalTime scoreTime = hs.getScore().getTime();
          if (scoreTime.isAfter(lastCross)) {
            lastCross = scoreTime;
            associatedPoints = hs.getScore().getPoints();
          }
        }
      }
    }

    // Only find new highest score if not a 0 interval hunt
    if (!zeroInterval) {
      // Find the highest score in the same time bucket
      int bucket = timeBucketScore.getTimeBucket();
      TimeBucketScore newHighestScore = timeBucketScores.stream()
          .filter(tbs -> tbs.getTimeBucket() == bucket)
          .max((tbs1, tbs2) -> Integer.compare(tbs1.getScore().getPoints(), tbs2.getScore().getPoints()))
          .orElse(null);

      if (newHighestScore != null) {
        newHighestScore.getScore().setCounted(true);
        highestScores.add(new HighestScore(null, bucket, newHighestScore.getScore(), this));
      }
    }

    return score;
  }

  /**
   * Get the highest score in each time bucket
   * 
   * @return List of highest scores
   */
  public List<HighestScore> getHighestScores() {
    return highestScores;
  }
}
