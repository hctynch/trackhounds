package com.trackhounds.trackhounds.Entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.ElementCollection;
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
   * Collection of the dogs scores
   */
  @ElementCollection
  private Set<Score> scores = new HashSet<>();
  /**
   * Day of DailyScores
   */
  private int day;

  /**
   * Default constructor for DailyScore
   * 
   * @param day Day of Scores
   */
  public DailyScore(int day) {
    setDay(day);
  }

}
