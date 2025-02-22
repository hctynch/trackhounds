package com.trackhounds.trackhounds.Entity;

import java.util.ArrayList;
import java.util.List;

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
  @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
  @OrderColumn(name = "score_order")
  private List<DailyScore> scores = new ArrayList<>();

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
    final int prime = 31;
    int result = 1;
    result = prime * result + number;
    result = prime * result + ((name == null) ? 0 : name.hashCode());
    result = prime * result + ((stake == null) ? 0 : stake.hashCode());
    result = prime * result + ((owner == null) ? 0 : owner.hashCode());
    result = prime * result + ((sire == null) ? 0 : sire.hashCode());
    result = prime * result + ((dam == null) ? 0 : dam.hashCode());
    result = prime * result + (scratched ? 1231 : 1237);
    result = prime * result + ((scores == null) ? 0 : scores.hashCode());
    return result;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (getClass() != obj.getClass())
      return false;
    DogEntity other = (DogEntity) obj;
    if (number != other.number)
      return false;
    if (name == null) {
      if (other.name != null)
        return false;
    } else if (!name.equals(other.name))
      return false;
    if (stake != other.stake)
      return false;
    if (owner == null) {
      if (other.owner != null)
        return false;
    } else if (!owner.equals(other.owner))
      return false;
    if (sire == null) {
      if (other.sire != null)
        return false;
    } else if (!sire.equals(other.sire))
      return false;
    if (dam == null) {
      if (other.dam != null)
        return false;
    } else if (!dam.equals(other.dam))
      return false;
    if (scratched != other.scratched)
      return false;
    return true;
  }

}
