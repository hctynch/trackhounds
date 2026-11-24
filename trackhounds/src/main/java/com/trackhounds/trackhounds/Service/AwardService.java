package com.trackhounds.trackhounds.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trackhounds.trackhounds.Entity.Award;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.AwardRepository;
import com.trackhounds.trackhounds.Repository.DogRepository;

import lombok.AllArgsConstructor;

/**
 * Special awards: distinctions a hunt gives to a dog outside the scoring,
 * such as "Best Mouth" or "Classiest Hound". An award is a title and a dog,
 * with an optional remark; the same title can go to more than one dog (one per
 * stake in a dual hunt, for instance) but not twice to the same dog.
 */
@Service
@Transactional
@AllArgsConstructor
public class AwardService {

  private final AwardRepository awardRepository;
  private final DogRepository dogRepository;

  /**
   * Every award with the dog it went to, by title, then dog number.
   *
   * @return one row per award: id, title, notes, and the dog's number, name,
   *         stake, owner, sire, dam and scratched flag
   */
  public List<Map<String, Object>> getAwards() {
    Map<String, DogEntity> dogs = new HashMap<>();
    for (DogEntity dog : dogRepository.findAll()) {
      dogs.put(dog.getNumber(), dog);
    }
    List<Award> awards = new ArrayList<>(awardRepository.findAll());
    awards.sort(Comparator.comparing((Award award) -> award.getTitle() == null ? "" : award.getTitle(), String.CASE_INSENSITIVE_ORDER)
        .thenComparing(Award::getDogNumber, Comparator.nullsLast(DogEntity.NUMBER_ORDER))
        .thenComparing(Award::getId));
    List<Map<String, Object>> rows = new ArrayList<>();
    for (Award award : awards) {
      rows.add(describe(award, dogs.get(award.getDogNumber())));
    }
    return rows;
  }

  /**
   * Give an award to a dog.
   *
   * @param award title, dog number and optional notes
   * @return the award as stored, with the dog's details
   * @throws TrackHoundsAPIException if the title is empty, the dog is not
   *                                 registered, or the dog already has this award
   */
  public Map<String, Object> createAward(Award award) {
    Award stored = new Award();
    apply(stored, award, null);
    return describe(awardRepository.save(stored), dogRepository.findById(stored.getDogNumber()).orElse(null));
  }

  /**
   * Change an award's title, dog or notes.
   *
   * @param id    id of the award
   * @param award the new values
   * @return the award as stored, with the dog's details
   * @throws TrackHoundsAPIException if the award does not exist or a value is
   *                                 refused (the same checks as a new award)
   */
  public Map<String, Object> updateAward(Long id, Award award) {
    Award stored = awardRepository.findById(id == null ? -1L : id)
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "Award does not exist.",
            Map.of("award", "This award no longer exists. It may have been removed.")));
    apply(stored, award, stored.getId());
    return describe(awardRepository.save(stored), dogRepository.findById(stored.getDogNumber()).orElse(null));
  }

  /**
   * Remove an award. Removing one that is already gone is not an error.
   *
   * @param id id of the award
   */
  public void deleteAward(Long id) {
    if (id != null && awardRepository.existsById(id)) {
      awardRepository.deleteById(id);
    }
  }

  /** Check the submitted values and copy them onto the stored award. */
  private void apply(Award stored, Award submitted, Long ownId) {
    String title = tidy(submitted == null ? null : submitted.getTitle());
    String dogNumber = tidy(submitted == null ? null : submitted.getDogNumber());
    Map<String, String> errs = new HashMap<>();
    if (title == null) {
      errs.put("title", "Name the award, for example Best Mouth.");
    }
    if (dogNumber == null) {
      errs.put("dogNumber", "Enter the dog's number.");
    } else if (!dogRepository.existsById(dogNumber)) {
      errs.put("dogNumber", String.format("Dog %s is not registered in this hunt.", dogNumber));
    } else if (title != null) {
      boolean repeated = awardRepository.findByDogNumber(dogNumber).stream()
          .anyMatch(other -> !other.getId().equals(ownId) && title.equalsIgnoreCase(other.getTitle()));
      if (repeated) {
        errs.put("dogNumber", String.format("Dog %s already has the award %s.", dogNumber, title));
      }
    }
    if (!errs.isEmpty()) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);
    }
    stored.setTitle(title);
    stored.setDogNumber(dogNumber);
    stored.setNotes(tidy(submitted.getNotes()));
  }

  private static String tidy(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private static Map<String, Object> describe(Award award, DogEntity dog) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("id", award.getId());
    row.put("title", award.getTitle());
    row.put("notes", award.getNotes());
    row.put("dogNumber", award.getDogNumber());
    row.put("dogName", dog == null ? null : dog.getName());
    row.put("stake", dog == null ? null : dog.getStake());
    row.put("owner", dog == null ? null : dog.getOwner());
    row.put("sire", dog == null ? null : dog.getSire());
    row.put("dam", dog == null ? null : dog.getDam());
    row.put("scratched", dog != null && dog.isScratched());
    return row;
  }
}
