package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.Award;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.AwardRepository;
import com.trackhounds.trackhounds.Repository.CrossRepository;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;
import com.trackhounds.trackhounds.Repository.ScoreRepository;

import jakarta.transaction.Transactional;

/**
 * Crosses as things of their own (listed, corrected and deleted as a whole),
 * the pack-scoring ladder, and times typed without a colon: the changes asked
 * for after the first test hunt (docs/FIRST_NOTES.md).
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CrossServiceTest {

  @Autowired
  private DogService dogService;
  @Autowired
  private JudgeRepository judgeRepository;
  @Autowired
  private DaysRepository daysRepository;
  @Autowired
  private HuntRepository huntRepository;
  @Autowired
  private ScoreRepository scoreRepository;
  @Autowired
  private CrossRepository crossRepository;
  @Autowired
  private AwardRepository awardRepository;

  @BeforeEach
  void setUp() {
    dogService.clear();
    daysRepository.deleteAll();
    judgeRepository.deleteAll();
    huntRepository.deleteAll();
    judgeRepository.save(new JudgeEntity(1, "", "Judge One"));
    judgeRepository.save(new JudgeEntity(2, "", "Judge Two"));
    huntRepository.save(new HuntEntity("Cross hunt", "2026", StakeType.ALL_AGE, 5));
  }

  private void registerDogs(int... numbers) {
    dogService.createDogs(java.util.Arrays.stream(numbers)
        .mapToObj(n -> new DogEntity(n, "Dog " + n, StakeType.ALL_AGE, "Owner", "Sire", "Dam"))
        .toList());
  }

  private static ScoreDto cross(int day, int judge, String time, int[] dogs, int[] points) {
    return new ScoreDto(day, "07:00", judge, time, dogs, points, 5);
  }

  @SuppressWarnings("unchecked")
  private static List<Map<String, Object>> scoresOf(Map<String, Object> cross) {
    return (List<Map<String, Object>>) cross.get("scores");
  }

  private static List<String> dogsOf(Map<String, Object> cross) {
    return scoresOf(cross).stream().map(score -> (String) score.get("dogNumber")).toList();
  }

  private Long onlyCrossId() {
    return (Long) dogService.getCrosses(null).get(0).get("id");
  }

  @Test
  void aCrossIsStoredWithItsDogsInCrossingOrder() {
    registerDogs(5, 6, 7);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 7, 5, 6 }, new int[] { 35, 30, 25 }));

    List<Map<String, Object>> crosses = dogService.getCrosses(null);
    assertEquals(1, crosses.size());
    Map<String, Object> stored = crosses.get(0);
    assertAll("the cross and its dogs",
        () -> assertEquals(1, stored.get("day")),
        () -> assertEquals(LocalTime.of(7, 10), stored.get("time")),
        () -> assertEquals(1, stored.get("judgeNumber")),
        () -> assertEquals("Judge One", stored.get("judgeName")),
        () -> assertEquals(List.of("7", "5", "6"), dogsOf(stored)),
        () -> assertEquals(List.of(1, 2, 3), scoresOf(stored).stream().map(score -> score.get("position")).toList()),
        () -> assertEquals(List.of(35, 30, 25), scoresOf(stored).stream().map(score -> score.get("points")).toList()),
        () -> assertEquals("Dog 7", scoresOf(stored).get(0).get("dogName")),
        () -> assertEquals(true, scoresOf(stored).get(0).get("counted")),
        () -> assertEquals(3, scoresOf(stored).get(0).get("interval")));
    assertEquals(stored, dogService.getCross((Long) stored.get("id")), "one cross reads like its row in the list");
  }

  @Test
  void crossesAreListedInHuntOrderAndTheHighestIdIsTheLastEntered() {
    registerDogs(5, 6);
    // Typed in this order: a late cross first, then an earlier one from another judge's card, then day 2.
    dogService.createScore(cross(1, 1, "09:30", new int[] { 5 }, new int[] { 35 }));
    dogService.createScore(cross(1, 2, "07:15", new int[] { 6, 5 }, new int[] { 35, 30 }));
    dogService.createScore(cross(2, 1, "07:05", new int[] { 6 }, new int[] { 35 }));

    List<Map<String, Object>> all = dogService.getCrosses(null);
    assertAll("by day, then cross time",
        () -> assertEquals(List.of("1 07:15", "1 09:30", "2 07:05"), all.stream().map(c -> c.get("day") + " " + c.get("time")).toList()),
        () -> assertEquals(2, dogService.getCrosses(1).size()),
        () -> assertEquals(1, dogService.getCrosses(2).size()),
        () -> assertEquals(0, dogService.getCrosses(3).size()));
    Map<String, Object> lastEntered = all.stream().max((a, b) -> Long.compare((Long) a.get("id"), (Long) b.get("id"))).orElseThrow();
    assertEquals("2 07:05", lastEntered.get("day") + " " + lastEntered.get("time"), "ids follow the order of entry, not the cross time");
  }

  @Test
  void twoCrossesByTheSameJudgeAtTheSameTimeStayApart() {
    registerDogs(5, 6);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5 }, new int[] { 35 }));
    dogService.createScore(cross(1, 1, "07:10", new int[] { 6 }, new int[] { 35 }));
    assertEquals(2, dogService.getCrosses(null).size());
  }

  @Test
  void correctingACrossReplacesItsScoresAndRecalculatesTheStandings() {
    registerDogs(5, 6, 7);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5, 6 }, new int[] { 35, 30 }));
    Long id = onlyCrossId();
    assertEquals(38, dogService.getDogByNumber("5").getPoints());

    // Dog 6 was written down by mistake: it was dog 7, the time was 07:20 and judge 2 saw it.
    Map<String, Object> corrected = dogService.updateCross(id, cross(1, 2, "0720", new int[] { 5, 7 }, new int[] { 35, 30 }));

    assertAll("the same cross, with the corrected values",
        () -> assertEquals(id, corrected.get("id")),
        () -> assertEquals(LocalTime.of(7, 20), corrected.get("time")),
        () -> assertEquals(2, corrected.get("judgeNumber")),
        () -> assertEquals(List.of("5", "7"), dogsOf(corrected)),
        () -> assertEquals(1, crossRepository.count()),
        () -> assertEquals(2, scoreRepository.count()));
    assertAll("standings follow",
        () -> assertEquals(38, dogService.getDogByNumber("5").getPoints()),
        () -> assertEquals(0, dogService.getDogByNumber("6").getPoints()),
        () -> assertEquals(33, dogService.getDogByNumber("7").getPoints()),
        () -> assertEquals(0, dogService.getScoresByDogNumber("6").size()),
        () -> assertEquals(List.of("5", "7"), dogService.getDogScoresByDay(1).stream().map(row -> (String) row.get("dogNumber")).sorted().toList(),
            "a dog whose only cross of the day was taken away is no longer a scored dog of that day"));
    Score moved = dogService.getScoresByDogNumber("7").get(0);
    assertAll("the new score belongs to the cross",
        () -> assertEquals(id, moved.getCrossId()),
        () -> assertEquals(1, moved.getCrossPosition()),
        () -> assertEquals(2, moved.getJudgeNumber()),
        () -> assertEquals(4, moved.getTimeBucket(), "07:20 is the fifth 5-minute interval from 07:00"));
  }

  @Test
  void correctingACrossCanMoveItToAnotherDay() {
    registerDogs(5);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5 }, new int[] { 35 }));
    Long id = onlyCrossId();

    dogService.updateCross(id, new ScoreDto(3, "0630", 1, "0710", new int[] { 5 }, new int[] { 35 }, 5));

    DogEntity dog = dogService.getDogByNumber("5");
    assertAll(
        () -> assertEquals(3, dogService.getCross(id).get("day")),
        () -> assertEquals(LocalTime.of(6, 30), dogService.getStartTime(3), "the first cross of day 3 sets its start time"),
        () -> assertEquals(35 + 10, dog.getPoints(), "day 3 adds 30 percent endurance"),
        () -> assertEquals(0, dogService.getDogScoresByDay(1).size()),
        () -> assertEquals(1, dogService.getDogScoresByDay(3).size()));
  }

  @Test
  void aRefusedCorrectionChangesNothing() {
    registerDogs(5, 6);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5, 6 }, new int[] { 35, 30 }));
    Long id = onlyCrossId();

    TrackHoundsAPIException unknownDog = assertThrows(TrackHoundsAPIException.class,
        () -> dogService.updateCross(id, cross(1, 1, "07:10", new int[] { 5, 99 }, new int[] { 35, 30 })));
    TrackHoundsAPIException tooEarly = assertThrows(TrackHoundsAPIException.class,
        () -> dogService.updateCross(id, cross(1, 1, "06:50", new int[] { 5 }, new int[] { 35 })));
    TrackHoundsAPIException missing = assertThrows(TrackHoundsAPIException.class,
        () -> dogService.updateCross(9999L, cross(1, 1, "07:10", new int[] { 5 }, new int[] { 35 })));

    assertAll(
        () -> assertEquals("Dog 99 is not registered in this hunt.", unknownDog.getFields().get("dogNumbers1")),
        () -> assertTrue(tooEarly.getFields().get("crossTime").contains("07:00")),
        () -> assertEquals(HttpStatus.NOT_FOUND, missing.getStatus()),
        () -> assertEquals(List.of("5", "6"), dogsOf(dogService.getCross(id))),
        () -> assertEquals(38, dogService.getDogByNumber("5").getPoints()),
        () -> assertEquals(33, dogService.getDogByNumber("6").getPoints()));
  }

  @Test
  void deletingACrossRemovesEveryScoreInIt() {
    registerDogs(5, 6);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5, 6 }, new int[] { 35, 30 }));
    dogService.createScore(cross(1, 1, "07:40", new int[] { 6 }, new int[] { 35 }));
    Long first = (Long) dogService.getCrosses(null).get(0).get("id");

    dogService.deleteCross(first);

    assertAll(
        () -> assertEquals(1, dogService.getCrosses(null).size()),
        () -> assertEquals(1, scoreRepository.count()),
        () -> assertEquals(0, dogService.getDogByNumber("5").getPoints()),
        () -> assertEquals(38, dogService.getDogByNumber("6").getPoints()),
        () -> assertEquals(HttpStatus.NOT_FOUND,
            assertThrows(TrackHoundsAPIException.class, () -> dogService.deleteCross(first)).getStatus()));
  }

  @Test
  void removingTheLastScoreOfACrossRemovesTheCross() {
    registerDogs(5, 6);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5, 6 }, new int[] { 35, 30 }));
    Long id = onlyCrossId();
    List<Score> scores = scoreRepository.findByCrossIdOrderByCrossPositionAscIdAsc(id);

    dogService.removeScore("5", scores.get(0).getId());
    assertEquals(List.of("6"), dogsOf(dogService.getCross(id)), "the cross stays while a dog is left in it");

    dogService.removeScore("6", scores.get(1).getId());
    assertEquals(0, crossRepository.count());
  }

  @Test
  void deletingADogTakesItsAwardsAndItsEmptyCrossesWithIt() {
    registerDogs(5, 6);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5, 6 }, new int[] { 35, 30 }));
    dogService.createScore(cross(1, 1, "07:40", new int[] { 5 }, new int[] { 35 }));
    awardRepository.save(new Award("Best Mouth", "5", null));
    awardRepository.save(new Award("Classiest Hound", "6", null));

    dogService.deleteDog("5");

    List<Map<String, Object>> crosses = dogService.getCrosses(null);
    assertAll(
        () -> assertEquals(1, crosses.size(), "the cross that only held dog 5 is gone"),
        () -> assertEquals(List.of("6"), dogsOf(crosses.get(0))),
        () -> assertEquals(1, awardRepository.count()),
        () -> assertEquals("6", awardRepository.findAll().get(0).getDogNumber()));
  }

  @Test
  void renumberingADogKeepsItInItsCrossesAndKeepsItsAwards() {
    registerDogs(5, 6);
    dogService.createScore(cross(1, 1, "07:10", new int[] { 5, 6 }, new int[] { 35, 30 }));
    awardRepository.save(new Award("Best Mouth", "5", null));

    dogService.renumberDog("5", "50");

    assertAll(
        () -> assertEquals(List.of("50", "6"), dogsOf(dogService.getCrosses(null).get(0))),
        () -> assertEquals("Dog 5", scoresOf(dogService.getCrosses(null).get(0)).get(0).get("dogName")),
        () -> assertEquals("50", awardRepository.findAll().get(0).getDogNumber()));
  }

  @Test
  void standardScoringCountsDownToZeroAndNeverBelow() {
    registerDogs(1, 2, 3, 4, 5, 6, 7, 8, 9);
    List<Map<String, Object>> info = dogService.getCrossInfo(new int[] { 1, 2, 3, 4, 5, 6, 7, 8, 9 }, 35, 5, StakeType.ALL_AGE);
    assertEquals(List.of(35, 30, 25, 20, 15, 10, 5, 0, 0), info.stream().map(row -> row.get("points")).toList());
  }

  @Test
  void packScoringStopsAtTheMinimumAndEveryLaterDogGetsIt() {
    HuntEntity hunt = huntRepository.findAll().get(0);
    hunt.setPackScoring(true);
    huntRepository.save(hunt);
    registerDogs(1, 2, 3, 4, 5, 6, 7, 8);

    List<Map<String, Object>> info = dogService.getCrossInfo(new int[] { 1, 2, 3, 4, 5, 6, 7, 8 }, 35, 5, StakeType.ALL_AGE);
    assertEquals(List.of(35, 30, 25, 20, 15, 15, 15, 15), info.stream().map(row -> row.get("points")).toList());

    // The minimum is a hunt setting, and a dog that is not registered still takes its place.
    hunt.setPackMinimumPoints(20);
    huntRepository.save(hunt);
    List<Map<String, Object>> withUnknown = dogService.getCrossInfo(new int[] { 1, 99, 2, 3, 4 }, 35, 5, StakeType.ALL_AGE);
    assertAll(
        () -> assertEquals(35, withUnknown.get(0).get("points")),
        () -> assertTrue(withUnknown.get(1).containsKey("error")),
        () -> assertEquals(25, withUnknown.get(2).get("points")),
        () -> assertEquals(20, withUnknown.get(3).get("points")),
        () -> assertEquals(20, withUnknown.get(4).get("points")));
  }

  @Test
  void packScoringKeepsOneLadderPerStakeInADualHunt() {
    HuntEntity hunt = huntRepository.findAll().get(0);
    hunt.setStake(StakeType.DUAL);
    hunt.setPackScoring(true);
    huntRepository.save(hunt);
    registerDogs(1, 2, 3, 4, 5, 6);
    dogService.createDogs(List.of(
        new DogEntity(101, "Derby 101", StakeType.DERBY, "Owner", "Sire", "Dam"),
        new DogEntity(102, "Derby 102", StakeType.DERBY, "Owner", "Sire", "Dam")));

    List<Map<String, Object>> info = dogService.getCrossInfo(new int[] { 1, 101, 2, 3, 4, 5, 6, 102 }, 35, 5, StakeType.DUAL);
    assertEquals(List.of(35, 35, 30, 25, 20, 15, 15, 30), info.stream().map(row -> row.get("points")).toList(),
        "all age: 35 down to 15 and 15 again; derby: its own 35 and 30");
  }

  @Test
  void timesCanBeTypedWithoutAColon() {
    assertAll("accepted",
        () -> assertEquals(LocalTime.of(6, 0), DogService.parseTime("0600")),
        () -> assertEquals(LocalTime.of(6, 5), DogService.parseTime("605")),
        () -> assertEquals(LocalTime.of(13, 0), DogService.parseTime("1300")),
        () -> assertEquals(LocalTime.of(23, 59), DogService.parseTime(" 2359 ")),
        () -> assertEquals(LocalTime.of(6, 5), DogService.parseTime("6:05")),
        () -> assertEquals(LocalTime.of(6, 5), DogService.parseTime("06:05")),
        () -> assertEquals(LocalTime.of(6, 5, 30), DogService.parseTime("06:05:30")));
    for (String bad : new String[] { "", "6", "60", "2400", "0660", "6:5", "abc", "12345", null }) {
      assertThrows(IllegalArgumentException.class, () -> DogService.parseTime(bad), "should be refused: " + bad);
    }

    registerDogs(5);
    dogService.createScore(new ScoreDto(1, "0600", 1, "0612", new int[] { 5 }, new int[] { 35 }, 5));
    assertAll("a cross entered without colons",
        () -> assertEquals(LocalTime.of(6, 0), dogService.getStartTime(1)),
        () -> assertEquals(LocalTime.of(6, 12), dogService.getCrosses(null).get(0).get("time")));

    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class,
        () -> dogService.createScore(new ScoreDto(1, "0600", 1, "0661", new int[] { 5 }, new int[] { 35 }, 5)));
    assertTrue(failure.getFields().get("crossTime").contains("0600 or 06:00"));
    assertFalse(failure.getFields().containsKey("startTime"));
  }
}
