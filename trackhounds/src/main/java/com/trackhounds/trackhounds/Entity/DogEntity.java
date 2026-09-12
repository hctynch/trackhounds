package com.trackhounds.trackhounds.Entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.trackhounds.trackhounds.Enums.StakeType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "dogs")
@AllArgsConstructor
@NoArgsConstructor
/**
 * Entity class for a Dog. Stores valuable information and a reference to their
 * scores.
 */
public class DogEntity {

  /**
   * Number of the dog, unique id
   */
  @Id
  private int number;

  /**
   * Name of the dog
   */
  private String name;

  /**
   * Stake of the dog
   */
  private StakeType stake;

  /**
   * Owners name or some owner reference
   */
  private String owner;

  /**
   * Sire name of the dog
   */
  private String sire;

  /**
   * Dam name of the dog
   */
  private String dam;

  /**
   * Shows whether or not the dog is scratched
   */
  private boolean scratched = false;

  /**
   * List of Daily Scores for the dog
   */
  @OneToMany(mappedBy = "dog", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
  @OrderColumn(name = "score_order")
  @JsonManagedReference
  private List<DailyScore> scores = new ArrayList<>();

  /**
   * Points of the dog
   */
  private int points = 0;

  /**
   * Default constructor for a dog
   * 
   * @param number Number of dog
   * @param name   Name of dog
   * @param stake  Stake of dog
   * @param owner  Owner of dog
   * @param sire   Sire of dog
   * @param dam    Dam of dog
   */
  public DogEntity(int number, String name, StakeType stake, String owner, String sire, String dam) {
    setNumber(number);
    setName(name);
    setStake(stake);
    setOwner(owner);
    setSire(sire);
    setDam(dam);
  }

  @Override
  public int hashCode() {
    // Must agree with equals, which compares the number only.
    return Integer.hashCode(number);
  }

  /**
   * The dog's daily score for a hunt day, looked up by day rather than by list
   * position so days can be scored in any order.
   *
   * @param day hunt day (1-based)
   * @return the daily score, if the dog has one for that day
   */
  public java.util.Optional<DailyScore> dailyScoreFor(int day) {
    if (scores == null) {
      return java.util.Optional.empty();
    }
    return scores.stream()
        .filter(dailyScore -> dailyScore != null && dailyScore.getDay() != null && dailyScore.getDay().getDay() == day)
        .findFirst();
  }

  @Override
  public boolean equals(Object obj) {
    if (obj == null)
      return false;
    if (!(obj instanceof DogEntity))
      return false;
    DogEntity other = (DogEntity) obj;
    if (number != other.number)
      return false;
    return true;
  }

}
