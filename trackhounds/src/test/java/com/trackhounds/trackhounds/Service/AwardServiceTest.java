package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Entity.Award;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.AwardRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;

import jakarta.transaction.Transactional;

/**
 * Special awards given to dogs ("Best Mouth", "Classiest Hound").
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AwardServiceTest {

  @Autowired
  private AwardService awardService;
  @Autowired
  private AwardRepository awardRepository;
  @Autowired
  private DogService dogService;
  @Autowired
  private HuntService huntService;
  @Autowired
  private HuntRepository huntRepository;

  @BeforeEach
  void setUp() {
    dogService.clear();
    huntRepository.deleteAll();
    dogService.createDogs(List.of(
        new DogEntity("12", "Rex", StakeType.ALL_AGE, "Ann Owner", "Sire", "Dam"),
        new DogEntity("7", "Belle", StakeType.DERBY, "Bo Owner", "Sire", "Dam")));
  }

  @Test
  void anAwardGoesToARegisteredDogAndIsListedWithTheDogsDetails() {
    Map<String, Object> created = awardService.createAward(new Award("  Best Mouth ", " 12 ", "  Voted by the judges  "));
    awardService.createAward(new Award("Classiest Hound", "7", " "));

    List<Map<String, Object>> awards = awardService.getAwards();
    assertAll(
        () -> assertEquals(2, awards.size()),
        () -> assertEquals("Best Mouth", created.get("title"), "values are stored trimmed"),
        () -> assertEquals("12", created.get("dogNumber")),
        () -> assertEquals("Voted by the judges", created.get("notes")),
        () -> assertEquals("Rex", created.get("dogName")),
        () -> assertEquals(StakeType.ALL_AGE, created.get("stake")),
        () -> assertEquals("Ann Owner", created.get("owner")),
        () -> assertEquals(List.of("Best Mouth", "Classiest Hound"), awards.stream().map(row -> row.get("title")).toList(), "by title"),
        () -> assertNull(awards.get(1).get("notes"), "an empty remark is stored as nothing"));
  }

  @Test
  void anAwardNeedsATitleAndARegisteredDog() {
    TrackHoundsAPIException empty = assertThrows(TrackHoundsAPIException.class, () -> awardService.createAward(new Award(" ", "", null)));
    TrackHoundsAPIException unknown = assertThrows(TrackHoundsAPIException.class, () -> awardService.createAward(new Award("Best Mouth", "99", null)));
    assertAll(
        () -> assertTrue(empty.getFields().containsKey("title")),
        () -> assertTrue(empty.getFields().containsKey("dogNumber")),
        () -> assertEquals("Dog 99 is not registered in this hunt.", unknown.getFields().get("dogNumber")),
        () -> assertEquals(0, awardRepository.count()));
  }

  @Test
  void theSameAwardCanGoToTwoDogsButNotTwiceToOne() {
    awardService.createAward(new Award("Best Mouth", "12", null));
    assertDoesNotThrow(() -> awardService.createAward(new Award("Best Mouth", "7", null)), "one per stake in a dual hunt");
    assertDoesNotThrow(() -> awardService.createAward(new Award("Classiest Hound", "12", null)), "a dog can hold two awards");
    TrackHoundsAPIException repeated = assertThrows(TrackHoundsAPIException.class,
        () -> awardService.createAward(new Award("best mouth", "12", null)));
    assertTrue(repeated.getFields().get("dogNumber").contains("already has"));
    assertEquals(3, awardRepository.count());
  }

  @Test
  void anAwardCanBeChangedAndRemoved() {
    Long id = (Long) awardService.createAward(new Award("Best Mouth", "12", null)).get("id");

    Map<String, Object> changed = awardService.updateAward(id, new Award("Best Mouth", "7", "Recount"));
    assertAll(
        () -> assertEquals(id, changed.get("id")),
        () -> assertEquals("7", changed.get("dogNumber")),
        () -> assertEquals("Belle", changed.get("dogName")),
        () -> assertEquals("Recount", changed.get("notes")),
        () -> assertDoesNotThrow(() -> awardService.updateAward(id, new Award("Best Mouth", "7", null)), "saving an award unchanged is not a repeat"));
    assertEquals(HttpStatus.NOT_FOUND,
        assertThrows(TrackHoundsAPIException.class, () -> awardService.updateAward(9999L, new Award("X", "7", null))).getStatus());

    awardService.deleteAward(id);
    assertEquals(0, awardRepository.count());
    assertDoesNotThrow(() -> awardService.deleteAward(id), "removing it twice is not an error");
  }

  @Test
  void aNewHuntStartsWithoutAwards() {
    huntService.createHunt(new HuntEntity("First", "2026", StakeType.ALL_AGE, 5));
    awardService.createAward(new Award("Best Mouth", "12", null));
    huntService.createHunt(new HuntEntity("Second", "2027", StakeType.ALL_AGE, 5));
    assertEquals(0, awardRepository.count());
  }
}
