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
        () -> assertEquals("Dog 1", dogRepository.findById("1").orElseThrow().getName()));
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
    assertTrue(dogRepository.findById("1").orElseThrow().isScratched());

    Long id = scratchRepository.findAll().get(0).getId();
    dogService.deleteScratch(id);
    assertAll(
        () -> assertEquals(0, scratchRepository.count()),
        () -> assertFalse(dogRepository.findById("1").orElseThrow().isScratched()));
  }

  @Test
  @Transactional
  void theHuntsScoringIntervalDecidesTheBucketsNotTheCross() {
    registerDogs(1);
    // The hunt's interval is 5 minutes. A cross claiming a 60-minute interval must not
    // merge 07:12 and 07:24 into one bucket: they are in buckets 2 and 4.
    dogService.createScore(new ScoreDto(1, "07:00:00", 1, "07:12:00", new int[] { 1 }, new int[] { 35 }, 60));
    dogService.createScore(new ScoreDto(1, "07:00:00", 1, "07:24:00", new int[] { 1 }, new int[] { 30 }, 60));
    DogEntity dog = dogService.getDogByNumber(1);
    assertAll(
        () -> assertEquals(2, dog.getScores().get(0).getHighestScores().size()),
        () -> assertEquals(65, dog.getScores().get(0).getDailyScore()));
  }

  @Test
  @Transactional
  void standingsAndCrossInfoCarryTheScratchedFlag() {
    registerDogs(1, 2);
    dogService.createScore(cross(1, "07:00:00", "07:10:00", new int[] { 1, 2 }, new int[] { 35, 30 }));
    Scratch scratch = new Scratch();
    scratch.setDogNumber(2);
    scratch.setJudgeNumber(1);
    scratch.setTime(LocalTime.of(8, 0));
    scratch.setReason("Withdrawn");
    dogService.scratchDog(scratch);

    Map<String, Object> dayRow = dogService.getDogScoresByDay(1).stream()
        .filter(row -> row.get("dogNumber").equals("2")).findFirst().orElseThrow();
    Map<String, Object> overallRow = dogService.getTopScoringDogsOverall(10).stream()
        .filter(row -> row.get("dogNumber").equals("2")).findFirst().orElseThrow();
    Map<String, Object> crossRow = dogService.getCrossInfo(new int[] { 2 }, 35, 5, StakeType.ALL_AGE).get(0);
    assertAll(
        () -> assertEquals(true, dayRow.get("scratched")),
        () -> assertEquals(true, overallRow.get("scratched")),
        () -> assertEquals(true, crossRow.get("scratched")),
        () -> assertEquals(5, huntRepository.findAll().get(0).getPointStep()));
  }

  @Test
  @Transactional
  void changingTheStartTimeResortsTheDaysCrosses() {
    registerDogs(1);
    // Start 07:00, interval 5: 07:04 is bucket 0 and 07:06 is bucket 1, so both count.
    dogService.createScore(cross(1, "07:00:00", "07:04:00", new int[] { 1 }, new int[] { 35 }));
    dogService.createScore(cross(1, "07:00:00", "07:06:00", new int[] { 1 }, new int[] { 30 }));
    assertEquals(65, dogService.getDogByNumber(1).getScores().get(0).getDailyScore());

    // Move the start to 07:02: both crosses fall into bucket 0 and only the 35 counts.
    dogService.changeStartTime(1, LocalTime.of(7, 2));
    DogEntity dog = dogService.getDogByNumber(1);
    assertAll(
        () -> assertEquals(LocalTime.of(7, 2), dogService.getStartTime(1)),
        () -> assertEquals(1, dog.getScores().get(0).getHighestScores().size()),
        () -> assertEquals(35, dog.getScores().get(0).getDailyScore()),
        () -> assertEquals(38, dog.getPoints()),
        () -> assertEquals(2, scoreRepository.findByDayOrderByTimeAsc(1).size()),
        () -> assertEquals(1, scoreRepository.findByDayOrderByTimeAsc(1).stream().filter(Score::isCounted).count()));

    // A start time after the first cross is refused.
    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class,
        () -> dogService.changeStartTime(1, LocalTime.of(7, 5)));
    assertTrue(failure.getFields().get("startTime").contains("07:04"));
  }

  @Test
  @Transactional
  void scratchesRecordADayWithinTheHunt() {
    registerDogs(1);
    HuntEntity hunt = huntRepository.findAll().get(0);
    hunt.setHuntDays(2);
    huntRepository.save(hunt);

    Scratch late = new Scratch();
    late.setDogNumber(1);
    late.setJudgeNumber(1);
    late.setDay(3);
    late.setTime(LocalTime.of(9, 0));
    late.setReason("Injured");
    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class, () -> dogService.scratchDog(late));
    assertEquals("Day must be between 1 and 2.", failure.getFields().get("day"));

    late.setDay(2);
    dogService.scratchDog(late);
    assertEquals(2, scratchRepository.findAll().get(0).getDay());
  }

  @Test
  @Transactional
  void daysCanBeScoredInAnyOrderWithoutFillerDays() {
    registerDogs(1);
    dogService.createScore(cross(3, "07:00:00", "07:10:00", new int[] { 1 }, new int[] { 35 }));
    dogService.createScore(cross(1, "07:00:00", "07:10:00", new int[] { 1 }, new int[] { 25 }));
    DogEntity dog = dogService.getDogByNumber(1);
    assertAll(
        () -> assertEquals(2, dog.getScores().size()),
        () -> assertTrue(dog.dailyScoreFor(2).isEmpty()),
        () -> assertEquals(35, dog.dailyScoreFor(3).orElseThrow().getDailyScore()),
        () -> assertEquals(25, dog.dailyScoreFor(1).orElseThrow().getDailyScore()),
        () -> assertEquals(35 + 10 + 25 + 2, dog.getPoints()),
        () -> assertEquals(1, dogService.getDogScoresByDay(3).size()),
        () -> assertEquals(0, dogService.getDogScoresByDay(2).size()));
  }

  @Test
  @Transactional
  void readingDogsDoesNotWrite() {
    registerDogs(1);
    dogService.createScore(cross(1, "07:00:00", "07:10:00", new int[] { 1 }, new int[] { 35 }));
    // Simulate stale stored points: a pure read must return what is stored, not recalculate and save.
    DogEntity stored = dogRepository.findById("1").orElseThrow();
    stored.setPoints(999);
    dogRepository.save(stored);
    assertAll(
        () -> assertEquals(999, dogService.getDogs().get(0).getPoints()),
        () -> assertEquals(999, dogService.getDogByNumber(1).getPoints()),
        () -> assertEquals(999, dogRepository.findById("1").orElseThrow().getPoints()));
  }

  @Test
  @Transactional
  void dogNumbersAreDigitStringsWithSignificantLeadingZeros() {
    dogService.createDogs(List.of(
        new DogEntity("0", "Zero", StakeType.ALL_AGE, "Owner", "Sire", "Dam"),
        new DogEntity("00", "Double zero", StakeType.ALL_AGE, "Owner", "Sire", "Dam"),
        new DogEntity("1", "One", StakeType.ALL_AGE, "Owner", "Sire", "Dam"),
        new DogEntity("01", "Oh one", StakeType.ALL_AGE, "Owner", "Sire", "Dam")));
    List<DogEntity> dogs = dogService.getDogs();
    assertAll(
        () -> assertEquals(4, dogs.size()),
        () -> assertEquals("Double zero", dogService.getDogByNumber("00").getName()),
        () -> assertEquals("Zero", dogService.getDogByNumber("0").getName()),
        () -> assertEquals(List.of("0", "00", "1", "01"), dogs.stream().map(DogEntity::getNumber).toList()));

    // Scores keep the exact number too.
    dogService.createScore(new ScoreDto(1, "07:00:00", 1, "07:10:00", new String[] { "00", "0" }, new int[] { 35, 30 }, 5));
    assertAll(
        () -> assertEquals(38, dogService.getDogByNumber("00").getPoints()),
        () -> assertEquals(33, dogService.getDogByNumber("0").getPoints()),
        () -> assertEquals(1, dogService.getScoresByDogNumber("00").size()));

    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class,
        () -> dogService.createDogs(List.of(new DogEntity("12A", "Bad", StakeType.ALL_AGE, "Owner", "Sire", "Dam"))));
    assertTrue(failure.getFields().get("number1").contains("digits only"));
  }

  @Test
  @Transactional
  void renumberingADogMovesItsScoresAndScratches() {
    registerDogs(5, 6);
    dogService.createScore(cross(1, "07:00:00", "07:10:00", new int[] { 5, 6 }, new int[] { 35, 30 }));
    dogService.createScore(cross(2, "07:00:00", "07:20:00", new int[] { 6, 5 }, new int[] { 35, 30 }));
    Scratch scratch = new Scratch();
    scratch.setDogNumber("5");
    scratch.setDay(2);
    scratch.setTime(LocalTime.of(9, 0));
    scratch.setJudgeNumber(1);
    scratch.setReason("Other");
    dogService.scratchDog(scratch);
    int pointsBefore = dogService.getDogByNumber("5").getPoints();
    Long scoreId = dogService.getScoresByDogNumber("5").get(0).getId();

    DogEntity moved = dogService.renumberDog("5", "005");

    assertAll(
        () -> assertEquals("005", moved.getNumber()),
        () -> assertEquals("Dog 5", moved.getName()),
        () -> assertTrue(moved.isScratched()),
        () -> assertEquals(pointsBefore, moved.getPoints()),
        () -> assertFalse(dogRepository.existsById("5")),
        () -> assertEquals(2, dogService.getScoresByDogNumber("005").size()),
        () -> assertEquals(scoreId, dogService.getScoresByDogNumber("005").get(0).getId(), "score rows keep their ids"),
        () -> assertEquals(2, moved.getScores().size(), "both daily scores follow the dog"),
        () -> assertEquals("005", dogService.getScratches().get(0).getDogNumber()),
        () -> assertEquals(0, scoreRepository.findByDogNumberOrderByDayAscTimeAsc("5").size()));

    // Standings and cross info see the new number, and the old one is free again.
    assertTrue(dogService.getTopScoringDogsOverall(2).stream().anyMatch(row -> "005".equals(row.get("dogNumber")) && Integer.valueOf(pointsBefore).equals(row.get("totalPoints"))));
    assertEquals(List.of("005", "6"), dogService.getDogs().stream().map(DogEntity::getNumber).toList());
    dogService.createDogs(List.of(new DogEntity("5", "New five", StakeType.ALL_AGE, "Owner", "Sire", "Dam")));
    assertEquals(0, dogService.getDogByNumber("5").getPoints());
  }

  @Test
  @Transactional
  void renumberingRejectsTakenAndInvalidNumbers() {
    registerDogs(5, 6);
    TrackHoundsAPIException taken = assertThrows(TrackHoundsAPIException.class, () -> dogService.renumberDog("5", "6"));
    TrackHoundsAPIException invalid = assertThrows(TrackHoundsAPIException.class, () -> dogService.renumberDog("5", "5A"));
    TrackHoundsAPIException missing = assertThrows(TrackHoundsAPIException.class, () -> dogService.renumberDog("9", "10"));
    assertAll(
        () -> assertTrue(taken.getFields().get("number").contains("already exists")),
        () -> assertTrue(invalid.getFields().get("number").contains("digits only")),
        () -> assertEquals(org.springframework.http.HttpStatus.NOT_FOUND, missing.getStatus()),
        () -> assertEquals("5", dogService.renumberDog("5", " 5 ").getNumber(), "same number is a no-op"));
  }

  @Test
  @Transactional
  void huntSettingsHaveSensibleDefaults() {
    HuntEntity hunt = huntRepository.findAll().get(0);
    assertAll(
        () -> assertEquals(5, hunt.getPointStep()),
        () -> assertEquals(35, hunt.getFirstDogPoints()),
        () -> assertEquals(4, hunt.getHuntDays()));
  }

  @Test
  @Transactional
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
  @Transactional
  void judgeEqualityDoesNotNeedAPin() {
    JudgeEntity withPin = new JudgeEntity(4, "1234", "Ann");
    JudgeEntity withoutPin = new JudgeEntity(4, null, "Ann");
    assertAll(
        () -> assertEquals(withPin, withoutPin),
        () -> assertEquals(withPin.hashCode(), withoutPin.hashCode()),
        () -> assertNotEquals(withPin, new JudgeEntity(5, "1234", "Ann")));
  }
}
