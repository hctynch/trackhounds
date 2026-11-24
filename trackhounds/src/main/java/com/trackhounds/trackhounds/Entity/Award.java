package com.trackhounds.trackhounds.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A special award given to a dog outside the scoring, such as "Best Mouth" or
 * "Classiest Hound". The title is free text because every hunt names its own.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Award {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** What the award is called. */
  private String title;

  /** The dog that received it. */
  private String dogNumber;

  /** Optional remark printed with the award. */
  private String notes;

  public Award(String title, String dogNumber, String notes) {
    this.title = title;
    this.dogNumber = dogNumber;
    this.notes = notes;
  }
}
