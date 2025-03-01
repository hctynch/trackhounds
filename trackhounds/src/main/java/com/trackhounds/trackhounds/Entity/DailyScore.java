package com.trackhounds.trackhounds.Entity;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
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
  @OneToMany(mappedBy = "dailyScore", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<TimeBucketScore> timeBucketScores = new ArrayList<>();

  /**
   * List of highest scores
   */
  @OneToMany(mappedBy = "dailyScore", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<HighestScore> highestScores = new ArrayList<>();

  /**
   * Day of DailyScores
   */
  @ManyToOne(optional = false)
  private Days day;

  /**
   * Number of the dog
   */
  private int number;

  /**
   * Default constructor for DailyScore
   * 
   * @param day Day of Scores
   */
  public DailyScore(Days day, int number) {
    setDay(day);
    setNumber(number);
  }

  /**
   * Add a score to the appropriate time bucket
   * 
   * @param score     Score to add
   * @param startTime Start time of the time bucket
   * @param interval  Interval duration in minutes
   */
  public void addScore(Score score, LocalTime startTime, int interval) {
    int bucket = interval == 0 ? 0
        : (int) java.time.Duration.between(startTime, score.getTime()).toMinutes() / interval;
    TimeBucketScore timeBucketScore = new TimeBucketScore(null, bucket, score, this);
    timeBucketScores.add(timeBucketScore);

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
    } else {
      score.setCounted(false);
    }
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
