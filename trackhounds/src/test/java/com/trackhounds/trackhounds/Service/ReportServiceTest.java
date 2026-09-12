package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
 * The per-judge summary and the hunt summary sheet.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReportServiceTest {

  @Autowired
  private ReportService reportService;
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
    judgeRepository.save(new JudgeEntity(1, "PIN", "Judge One"));
    judgeRepository.save(new JudgeEntity(2, "", "Judge Two"));
    judgeRepository.save(new JudgeEntity(3, "", "Judge Three"));
  }

  private void dualHunt() {
    HuntEntity hunt = new HuntEntity("Summary hunt", "2026", StakeType.DUAL, 5);
    hunt.setHuntDays(2);
    huntRepository.save(hunt);
    dogService.createDogs(List.of(
        new DogEntity("1", "Alpha", StakeType.ALL_AGE, "Owner A", "S", "D"),
        new DogEntity("2", "Bravo", StakeType.ALL_AGE, "Owner B", "S", "D"),
        new DogEntity("101", "Charlie", StakeType.DERBY, "Owner C", "S", "D"),
        new DogEntity("102", "Delta", StakeType.DERBY, "Owner D", "S", "D")));
    // Day 1: judge 1 records two crosses, judge 2 one. Day 2: judge 1 one cross.
    dogService.createScore(new ScoreDto(1, "08:00:00", 1, "08:10:00", new String[] { "1", "101" }, new int[] { 35, 35 }, 5));
    dogService.createScore(new ScoreDto(1, "08:00:00", 1, "08:40:00", new String[] { "2", "1", "102" }, new int[] { 35, 30, 35 }, 5));
    dogService.createScore(new ScoreDto(1, "08:00:00", 2, "09:00:00", new String[] { "1" }, new int[] { 35 }, 5));
    dogService.createScore(new ScoreDto(2, "08:00:00", 1, "08:20:00", new String[] { "2", "101" }, new int[] { 35, 35 }, 5));
    Scratch scratch = new Scratch();
    scratch.setDogNumber("102");
    scratch.setDay(2);
    scratch.setTime(LocalTime.of(9, 30));
    scratch.setJudgeNumber(2);
    scratch.setReason("Injured");
    dogService.scratchDog(scratch);
  }

  @Test
  void judgeSummaryCountsCrossesAndDogsPerDay() {
    dualHunt();
    List<Map<String, Object>> rows = reportService.getJudgeSummary();
    assertEquals(3, rows.size(), "every judge is listed, even without entries");

    Map<String, Object> one = rows.get(0);
    assertEquals(1, one.get("judgeNumber"));
    assertEquals("Judge One", one.get("judgeName"));
    assertEquals(Map.of("1", 2, "2", 1), one.get("crossesByDay"));
    assertEquals(Map.of("1", 5, "2", 2), one.get("scoresByDay"));
    assertEquals(3, one.get("totalCrosses"));
    assertEquals(7, one.get("totalScores"));
    assertEquals(0, one.get("scratches"));

    Map<String, Object> two = rows.get(1);
    assertEquals(Map.of("1", 1, "2", 0), two.get("crossesByDay"));
    assertEquals(1, two.get("scratches"));

    Map<String, Object> three = rows.get(2);
    assertEquals(0, three.get("totalCrosses"));
    assertEquals(0, three.get("totalScores"));
  }

  @Test
  void judgeSummaryOnlyHasColumnsForTheHuntsDays() {
    dualHunt();
    @SuppressWarnings("unchecked")
    Map<String, Integer> byDay = (Map<String, Integer>) reportService.getJudgeSummary().get(0).get("crossesByDay");
    assertEquals(2, byDay.size());
  }

  @Test
  @SuppressWarnings("unchecked")
  void huntSummaryDescribesTheWholeHunt() {
    dualHunt();
    Map<String, Object> summary = reportService.getHuntSummary();

    Map<String, Object> hunt = (Map<String, Object>) summary.get("hunt");
    assertEquals("Summary hunt", hunt.get("title"));
    assertEquals(StakeType.DUAL, hunt.get("stake"));
    assertEquals(2, hunt.get("huntDays"));

    Map<String, Object> counts = (Map<String, Object>) summary.get("counts");
    assertEquals(4, counts.get("dogs"));
    assertEquals(2, counts.get("allAgeDogs"));
    assertEquals(2, counts.get("derbyDogs"));
    assertEquals(1, counts.get("scratchedDogs"));
    assertEquals(3, counts.get("judges"));
    assertEquals(4, counts.get("crosses"));
    assertEquals(8, counts.get("scores"));

    List<Map<String, Object>> days = (List<Map<String, Object>>) summary.get("days");
    assertEquals(2, days.size());
    assertEquals(LocalTime.of(8, 0), days.get(0).get("startTime"));
    assertEquals(3, days.get(0).get("crosses"));
    assertEquals(6, days.get(0).get("scores"));
    assertEquals(4, days.get(0).get("dogsScored"));
    assertEquals(1, days.get(1).get("scratches"));

    // Dual stake: placings per stake, dogs without points are not placed.
    List<Map<String, Object>> placings = (List<Map<String, Object>>) summary.get("placings");
    List<Map<String, Object>> allAge = placings.stream().filter(p -> p.get("stake") == StakeType.ALL_AGE).toList();
    List<Map<String, Object>> derby = placings.stream().filter(p -> p.get("stake") == StakeType.DERBY).toList();
    assertEquals(2, allAge.size());
    assertEquals("1", allAge.get(0).get("dogNumber"), "dog 1 leads all-age: 35 + 30 + 35 on day 1");
    assertEquals(1, allAge.get(0).get("place"));
    assertEquals(2, allAge.get(1).get("place"));
    assertEquals(2, derby.size());
    assertEquals("101", derby.get(0).get("dogNumber"));
    assertEquals(true, derby.get(1).get("scratched"), "scratched dogs keep their place and are flagged");

    List<Map<String, Object>> scratches = (List<Map<String, Object>>) summary.get("scratches");
    assertEquals(1, scratches.size());
    assertEquals("102", scratches.get(0).get("dogNumber"));
    assertEquals("Delta", scratches.get(0).get("dogName"));
  }

  @Test
  @SuppressWarnings("unchecked")
  void singleStakeHuntPlacesDogsOverall() {
    huntRepository.save(new HuntEntity("All age hunt", "2026", StakeType.ALL_AGE, 5));
    dogService.createDogs(List.of(new DogEntity("7", "Seven", StakeType.ALL_AGE, "O", "S", "D")));
    dogService.createScore(new ScoreDto(1, "08:00:00", 1, "08:10:00", new String[] { "7" }, new int[] { 35 }, 5));
    List<Map<String, Object>> placings = (List<Map<String, Object>>) reportService.getHuntSummary().get("placings");
    assertEquals(1, placings.size());
    assertEquals(StakeType.ALL_AGE, placings.get(0).get("stake"));
    assertEquals(38, placings.get(0).get("totalPoints"), "35 speed and drive plus 3 endurance on day 1");
  }

  @Test
  void huntSummaryNeedsAHunt() {
    TrackHoundsAPIException ex = assertThrows(TrackHoundsAPIException.class, () -> reportService.getHuntSummary());
    assertTrue(ex.getMessage().contains("No hunt"));
  }
}
