package com.trackhounds.trackhounds.Entity;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.trackhounds.trackhounds.Enums.StakeType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A dog entered in the hunt. The number is the identity and is a string of
 * digits: leading zeros are significant, so "0" and "00" are two different
 * dogs. Numbers order by value first, then by length ("0", "00", "1", "01").
 */
@Entity
@Getter
@Setter
@Table(name = "dogs")
@NoArgsConstructor
public class DogEntity {

  private static final Pattern NUMBER = Pattern.compile("[0-9]{1,6}");

  /** Orders dog numbers by value, then by length, then textually. */
  public static final Comparator<String> NUMBER_ORDER = Comparator
      .<String>comparingLong(number -> numericValue(number))
      .thenComparingInt(String::length)
      .thenComparing(Comparator.naturalOrder());

  @Id
  private String number;

  private String name;

  private StakeType stake;

  private String owner;

  private String sire;

  private String dam;

  private boolean scratched = false;

  @OneToMany(mappedBy = "dog", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
  @OrderColumn(name = "score_order")
  @JsonManagedReference
  private List<DailyScore> scores = new ArrayList<>();

  private int points = 0;

  public DogEntity(String number, String name, StakeType stake, String owner, String sire, String dam) {
    this.number = number;
    this.name = name;
    this.stake = stake;
    this.owner = owner;
    this.sire = sire;
    this.dam = dam;
  }

  public DogEntity(int number, String name, StakeType stake, String owner, String sire, String dam) {
    this(String.valueOf(number), name, stake, owner, sire, dam);
  }

  /** Whether a string is an acceptable dog number (digits only, at most six). */
  public static boolean isValidNumber(String number) {
    return number != null && NUMBER.matcher(number).matches();
  }

  /** The number's value (leading zeros ignored); -1 when it is not numeric. */
  public static long numericValue(String number) {
    if (number == null || number.isBlank()) {
      return -1;
    }
    try {
      return Long.parseLong(number.trim());
    } catch (NumberFormatException e) {
      return -1;
    }
  }

  /** The dog's number as a value, for comparing with the hunt's number ranges. */
  public long numericValue() {
    return numericValue(number);
  }

  /**
   * The dog's daily score for a hunt day, looked up by day rather than by list
   * position so days can be scored in any order.
   *
   * @param day hunt day (1-based)
   * @return the daily score, if the dog has one for that day
   */
  public Optional<DailyScore> dailyScoreFor(int day) {
    if (scores == null) {
      return Optional.empty();
    }
    return scores.stream()
        .filter(dailyScore -> dailyScore != null && dailyScore.getDay() != null && dailyScore.getDay().getDay() == day)
        .findFirst();
  }

  @Override
  public int hashCode() {
    // Must agree with equals, which compares the number only.
    return number == null ? 0 : number.hashCode();
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (!(obj instanceof DogEntity))
      return false;
    DogEntity other = (DogEntity) obj;
    return number != null && number.equals(other.number);
  }
}
