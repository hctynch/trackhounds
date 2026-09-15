package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;

import jakarta.transaction.Transactional;

/**
 * The row sets behind the report builder.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReportDatasetServiceTest {

  @Autowired
  private ReportDatasetService datasets;
  @Autowired
  private DogService dogService;
  @Autowired
  private JudgeRepository judgeRepository;
  @Autowired
  private DaysRepository daysRepository;
  @Autowired
  private HuntRepository huntRepository;

  @BeforeEach
  void setUp() {
    dogService.clear();
    daysRepository.deleteAll();
    judgeRepository.deleteAll();
    huntRepository.deleteAll();
    judgeRepository.save(new JudgeEntity(1, "PIN1", "Judge One"));
    judgeRepository.save(new JudgeEntity(2, "", "Judge Two"));
  }

  /** A two-day dual hunt: 1 and 2 all age, 101 and 102 derby; 102 scratched on day 2. */
  private void dualHunt() {
    HuntEntity hunt = new HuntEntity("Dataset hunt", "2026", StakeType.DUAL, 5);
    hunt.setHuntDays(2);
    huntRepository.save(hunt);
    dogService.createDogs(List.of(
        new DogEntity("1", "Alpha", StakeType.ALL_AGE, "Owner A", "S", "D"),
        new DogEntity("2", "Bravo", StakeType.ALL_AGE, "Owner B", "S", "D"),
        new DogEntity("101", "Charlie", StakeType.DERBY, "Owner C", "S", "D"),
        new DogEntity("102", "Delta", StakeType.DERBY, "Owner D", "S", "D")));
    dogService.createScore(new ScoreDto(1, "08:00:00", 1, "08:10:00", new String[] { "1", "101" }, new int[] { 35, 35 }, 5));
    dogService.createScore(new ScoreDto(1, "08:00:00", 1, "08:40:00", new String[] { "2", "1", "102" }, new int[] { 35, 30, 35 }, 5));
    dogService.createScore(new ScoreDto(2, "08:00:00", 2, "08:20:00", new String[] { "2", "101" }, new int[] { 35, 30 }, 5));
    Scratch scratch = new Scratch();
    scratch.setDogNumber("102");
    scratch.setDay(2);
    scratch.setTime(LocalTime.of(9, 30));
    scratch.setJudgeNumber(2);
    scratch.setReason("Injured");
    dogService.scratchDog(scratch);
  }

  @SuppressWarnings("unchecked")
  private static List<Map<String, Object>> rows(Map<String, Object> dataset) {
    return (List<Map<String, Object>>) dataset.get("rows");
  }

  @SuppressWarnings("unchecked")
  private static List<String> columnKeys(Map<String, Object> dataset) {
    return ((List<Map<String, Object>>) dataset.get("columns")).stream().map(c -> (String) c.get("key")).toList();
  }

  @Test
  void dogsAreRankedOverallWithEveryColumnFilledIn() {
    dualHunt();
    Map<String, Object> dataset = datasets.dataset("dogs", null, null, null, null, null);
    assertEquals(true, dataset.get("dual"));
    assertEquals(2, dataset.get("huntDays"));
    List<String> keys = columnKeys(dataset);
    assertTrue(keys.contains("sdDay2"));
    assertFalse(keys.contains("sdDay3"), "day columns follow the hunt's day count");
    assertFalse(keys.contains("daySpeedAndDrive"), "no selected-day columns without a day");

    List<Map<String, Object>> rows = rows(dataset);
    assertEquals(4, rows.size());
    Map<String, Object> first = rows.get(0);
    // Dog 2: 35 day 1 (+3) and 35 day 2 (+7) = 80; dog 101: 35 (+3) and 30 (+6) = 74; dog 1: 65 on day 1 (+6) = 71.
    assertEquals("2", first.get("number"));
    assertEquals(1, first.get("place"));
    assertEquals(35, first.get("sdDay1"));
    assertEquals(35, first.get("sdDay2"));
    assertEquals(3, first.get("enduranceDay1"));
    assertEquals(7, first.get("enduranceDay2"));
    assertEquals(42, first.get("totalDay2"));
    assertEquals(70, first.get("speedAndDrive"));
    assertEquals(10, first.get("endurance"));
    assertEquals(80, first.get("total"));
    assertEquals(2, first.get("lastCrossDay"));
    assertEquals(LocalTime.of(8, 20), first.get("lastCrossTime"));
    assertEquals("101", rows.get(1).get("number"));
    assertEquals(74, rows.get(1).get("total"));
    assertEquals("1", rows.get(2).get("number"));
    assertEquals(71, rows.get(2).get("total"));
    assertEquals(true, rows.get(3).get("scratched"));
  }

  @Test
  void dogsForOneDayAndStakeUseTheDaysRankingAndCarryThatDaysNumbers() {
    dualHunt();
    Map<String, Object> dataset = datasets.dataset("dogs", 1, StakeType.ALL_AGE, null, null, null);
    List<Map<String, Object>> rows = rows(dataset);
    assertEquals(2, rows.size(), "only all age dogs");
    assertEquals("1", rows.get(0).get("number"), "dog 1 leads day 1 with 65");
    assertEquals(65, rows.get(0).get("daySpeedAndDrive"));
    assertEquals(6, rows.get(0).get("dayEndurance"));
    assertEquals(71, rows.get(0).get("dayTotal"));
    assertEquals(2, rows.get(1).get("place"));
    assertTrue(columnKeys(dataset).contains("dayTotal"));

    // Limit applies after ranking.
    assertEquals(1, rows(datasets.dataset("dogs", 1, null, 1, null, null)).size());
    // A dog without a score on the day comes last with no place.
    List<Map<String, Object>> day2 = rows(datasets.dataset("dogs", 2, null, null, null, null));
    assertEquals(4, day2.size());
    assertNull(day2.get(3).get("place"));
  }

  @Test
  void scoresJoinDogAndJudgeAndFilter() {
    dualHunt();
    List<Map<String, Object>> all = rows(datasets.dataset("scores", null, null, null, null, null));
    assertEquals(7, all.size());
    Map<String, Object> row = all.get(0);
    assertEquals(1, row.get("day"));
    assertEquals("1", row.get("dogNumber"));
    assertEquals("Alpha", row.get("dogName"));
    assertEquals("Judge One", row.get("judgeName"));
    assertEquals(StakeType.ALL_AGE, row.get("stake"));
    assertEquals(35, row.get("points"));
    assertEquals(true, row.get("counted"));
    assertEquals(3, row.get("interval"));

    assertEquals(2, rows(datasets.dataset("scores", 2, null, null, null, null)).size());
    assertEquals(3, rows(datasets.dataset("scores", null, StakeType.DERBY, null, null, null)).size());
    assertEquals(2, rows(datasets.dataset("scores", null, null, null, "1", null)).size());
    assertEquals(2, rows(datasets.dataset("scores", null, null, null, null, 2)).size());
    assertEquals(1, rows(datasets.dataset("scores", null, null, 1, null, null)).size());
  }

  @Test
  void scratchesAndJudgesDatasets() {
    dualHunt();
    List<Map<String, Object>> scratches = rows(datasets.dataset("scratches", null, null, null, null, null));
    assertEquals(1, scratches.size());
    assertEquals("Delta", scratches.get(0).get("dogName"));
    assertEquals("Judge Two", scratches.get(0).get("judgeName"));
    assertEquals(StakeType.DERBY, scratches.get(0).get("stake"));
    assertEquals(0, rows(datasets.dataset("scratches", 1, null, null, null, null)).size());

    Map<String, Object> judges = datasets.dataset("judges", null, null, null, null, null);
    assertTrue(columnKeys(judges).contains("crossesDay2"));
    assertFalse(columnKeys(judges).contains("crossesDay3"));
    List<Map<String, Object>> rows = rows(judges);
    assertEquals(2, rows.size());
    assertEquals(2, rows.get(0).get("crossesDay1"));
    assertEquals(5, rows.get(0).get("totalScores"));
    assertEquals("PIN1", rows.get(0).get("memberPin"));
    assertEquals(1, rows.get(1).get("scratches"));
  }

  @Test
  void unknownDatasetAndBadDayAreRejected() {
    dualHunt();
    assertThrows(TrackHoundsAPIException.class, () -> datasets.dataset("crosses", null, null, null, null, null));
    assertThrows(TrackHoundsAPIException.class, () -> datasets.dataset("dogs", 3, null, null, null, null));
  }

  @Test
  void datasetsWorkWithoutAHunt() {
    assertEquals(0, rows(datasets.dataset("dogs", null, null, null, null, null)).size());
    assertEquals(4, datasets.dataset("dogs", null, null, null, null, null).get("huntDays"));
  }
}
