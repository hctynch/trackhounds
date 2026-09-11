package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;
import com.trackhounds.trackhounds.Repository.ScoreRepository;
import com.trackhounds.trackhounds.Repository.ScratchRepository;

import jakarta.transaction.Transactional;

/**
 * Defects found and fixed during the iteration 6 logic review (see
 * docs/LOGIC_REVIEW.md). Each test pins the corrected behaviour.
 */
@SpringBootTest
@ActiveProfiles("test")
class DogServiceReviewTest {

  @Autowired
  private DogService dogService;
  @Autowired
  private DogRepository dogRepository;
  @Autowired
  private JudgeRepository judgeRepository;
  @Autowired
  private DaysRepository daysRepository;
  @Autowired
  private HuntRepository huntRepository;
  @Autowired
  private ScoreRepository scoreRepository;
  @Autowired
  private ScratchRepository scratchRepository;

  @BeforeEach
  void setUp() {
    dogService.clear();
    daysRepository.deleteAll();
    judgeRepository.deleteAll();
    huntRepository.deleteAll();
    judgeRepository.save(new JudgeEntity(1, "PIN", "Judge One"));
    huntRepository.save(new HuntEntity("Review hunt", "2026", StakeType.ALL_AGE, 5));
  }

  private void registerDogs(int... numbers) {
    dogService.createDogs(java.util.Arrays.stream(numbers)
        .mapToObj(n -> new DogEntity(n, "Dog " + n, StakeType.ALL_AGE, "Owner", "Sire", "Dam"))
        .toList());
  }

  private ScoreDto cross(int day, String start, String time, int[] dogs, int[] points) {
    return new ScoreDto(day, start, 1, time, dogs, points, 5);
  }

  @Test
  @Transactional
  void editDogRejectsAnEmptySubmittedName() {
    registerDogs(1);
    DogEntity edit = new DogEntity(1, "  ", StakeType.ALL_AGE, "Owner", "Sire", "Dam");
    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class, () -> dogService.editDog(edit));
    assertAll(
        () -> assertTrue(failure.getFields().containsKey("name")),
        () -> assertEquals("Dog 1", dogRepository.findById(1).orElseThrow().getName()));
  }

  @Test
  @Transactional
  void createDogsRejectsTheSameNumberTwiceInOneBatch() {
    List<DogEntity> batch = List.of(
        new DogEntity(7, "First", StakeType.ALL_AGE, "Owner", "Sire", "Dam"),
        new DogEntity(7, "Second", StakeType.ALL_AGE, "Owner", "Sire", "Dam"));
    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(batch));
    assertAll(
        () -> assertTrue(failure.getFields().containsKey("number2")),
        () -> assertEquals(0, dogRepository.count()));
  }

  @Test
  @Transactional
  void crossRejectsUnknownAndDuplicatedDogsWithoutSavingAnything() {
    registerDogs(1, 2);
    ScoreDto unknown = cross(1, "07:00:00", "07:10:00", new int[] { 1, 99 }, new int[] { 35, 30 });
    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class, () -> dogService.createScore(unknown));
    assertAll("unknown dog",
        () -> assertEquals("Dog 99 is not registered in this hunt.", failure.getFields().get("dogNumbers1")),
        () -> assertEquals(0, scoreRepository.count()),
        () -> assertTrue(daysRepository.findById(1).isEmpty()));

    ScoreDto duplicated = cross(1, "07:00:00", "07:10:00", new int[] { 1, 2, 1 }, new int[] { 35, 30, 25 });
    TrackHoundsAPIException second = assertThrows(TrackHoundsAPIException.class, () -> dogService.createScore(duplicated));
    assertAll("duplicated dog",
        () -> assertEquals("Dog 1 is listed twice in this cross.", second.getFields().get("dogNumbers2")),
        () -> assertEquals(0, scoreRepository.count()));
  }

  @Test
  @Transactional
  void theDaysStoredStartTimeIsUsedForEveryLaterCross() {
    registerDogs(1);
    dogService.createScore(cross(1, "07:00:00", "07:12:00", new int[] { 1 }, new int[] { 35 }));
    // A later cross sends a different start time; it must be ignored so that 07:14
    // lands in the same 5-minute bucket as 07:12 (measured from 07:00).
    dogService.createScore(cross(1, "07:10:00", "07:14:00", new int[] { 1 }, new int[] { 30 }));

    DogEntity dog = dogService.getDogByNumber(1);
    assertAll(
        () -> assertEquals(LocalTime.of(7, 0), daysRepository.findById(1).orElseThrow().getStartTime()),
        () -> assertEquals(2, dog.getScores().get(0).getTimeBucketScores().size()),
        () -> assertEquals(1, dog.getScores().get(0).getHighestScores().size()),
        () -> assertEquals(35, dog.getScores().get(0).getDailyScore()),
        () -> assertEquals(38, dog.getPoints()));

    // And a cross before the stored start is rejected even if the request claims an earlier start.
    ScoreDto early = cross(1, "06:00:00", "06:50:00", new int[] { 1 }, new int[] { 35 });
    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class, () -> dogService.createScore(early));
    assertTrue(failure.getFields().get("crossTime").contains("07:00"));
  }

  @Test
  @Transactional
  void enduranceIsWholePointsPerDayOnServerAndInDailyResults() {
    registerDogs(1);
    dogService.createScore(cross(1, "07:00:00", "07:10:00", new int[] { 1 }, new int[] { 25 }));
    dogService.createScore(cross(3, "07:00:00", "07:10:00", new int[] { 1 }, new int[] { 25 }));

    // Day 1: 25 + 2, day 3: 25 + 7. Fractional maths would have given 27.5 + 32.5 = 60.
    assertEquals(59, dogService.getDogByNumber(1).getPoints());

    Map<String, Object> day3 = dogService.getDogScoresByDay(3).get(0);
    assertAll(
        () -> assertEquals(25, day3.get("totalPoints")),
        () -> assertEquals(7, day3.get("endurance")),
        () -> assertEquals(32, day3.get("dayTotal")));
  }

  @Test
  @Transactional
  void deletingTheLastScratchClearsTheDogsFlag() {
    registerDogs(1);
    Scratch scratch = new Scratch();
    scratch.setDogNumber(1);
    scratch.setJudgeNumber(1);
    scratch.setTime(LocalTime.of(9, 10));
    scratch.setReason("Injured");
    dogService.scratchDog(scratch);
    assertTrue(dogRepository.findById(1).orElseThrow().isScratched());

    Long id = scratchRepository.findAll().get(0).getId();
    dogService.deleteScratch(id);
    assertAll(
        () -> assertEquals(0, scratchRepository.count()),
        () -> assertFalse(dogRepository.findById(1).orElseThrow().isScratched()));
  }

  @Test
  void scoreEqualityComparesIdValuesNotReferences() {
    Score a = new Score(35, LocalTime.of(7, 0), true, 1, 1, 1);
    Score b = new Score(30, LocalTime.of(8, 0), false, 1, 2, 1);
    a.setId(Long.valueOf(1000));
    b.setId(Long.valueOf(1000));
    Score unsaved = new Score(35, LocalTime.of(7, 0), true, 1, 1, 1);
    assertAll(
        () -> assertEquals(a, b),
        () -> assertEquals(a.hashCode(), b.hashCode()),
        () -> assertNotEquals(a, unsaved),
        () -> assertEquals(unsaved, unsaved));
  }

  @Test
  void judgeEqualityDoesNotNeedAPin() {
    JudgeEntity withPin = new JudgeEntity(4, "1234", "Ann");
    JudgeEntity withoutPin = new JudgeEntity(4, null, "Ann");
    assertAll(
        () -> assertEquals(withPin, withoutPin),
        () -> assertEquals(withPin.hashCode(), withoutPin.hashCode()),
        () -> assertNotEquals(withPin, new JudgeEntity(5, "1234", "Ann")));
  }
}
