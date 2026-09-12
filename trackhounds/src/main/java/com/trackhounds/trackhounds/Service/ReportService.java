package com.trackhounds.trackhounds.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trackhounds.trackhounds.Entity.Days;
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

import lombok.AllArgsConstructor;

/**
 * Read-only summaries for the printed sheets that are not plain lists of
 * scores: what each judge recorded, and the one-page hunt summary.
 *
 * A "cross" is one judge's entry at one time on one day; the dogs in it are
 * stored as separate {@link Score} rows, so crosses are counted as distinct
 * (day, judge, time) combinations.
 */
@Service
@Transactional
@AllArgsConstructor
public class ReportService {

  /** How many placings the hunt summary lists per stake. */
  static final int PLACINGS = 5;

  private final HuntRepository huntRepository;
  private final DogRepository dogRepository;
  private final JudgeRepository judgeRepository;
  private final ScoreRepository scoreRepository;
  private final ScratchRepository scratchRepository;
  private final DaysRepository daysRepository;
  private final DogService dogService;

  /**
   * One row per judge: crosses and dogs scored per day, totals, and the
   * scratches the judge recorded. Judges without any entry are included so the
   * sheet shows who did not score.
   */
  public List<Map<String, Object>> getJudgeSummary() {
    int dayCount = huntRepository.findAll().stream().findFirst().map(HuntEntity::getHuntDays).orElse(HuntService.MAX_DAYS);
    List<Score> scores = scoreRepository.findAllByOrderByDayAscTimeAsc();
    List<Scratch> scratches = scratchRepository.findAll();
    List<JudgeEntity> judges = new ArrayList<>(judgeRepository.findAll());
    judges.sort(Comparator.comparingInt(JudgeEntity::getNumber));

    List<Map<String, Object>> rows = new ArrayList<>();
    for (JudgeEntity judge : judges) {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("judgeNumber", judge.getNumber());
      row.put("judgeName", judge.getName());
      Map<String, Integer> crossesByDay = new LinkedHashMap<>();
      Map<String, Integer> scoresByDay = new LinkedHashMap<>();
      int totalCrosses = 0;
      int totalScores = 0;
      for (int day = 1; day <= dayCount; day++) {
        Set<String> crossTimes = new HashSet<>();
        int scored = 0;
        for (Score score : scores) {
          if (score.getJudgeNumber() != judge.getNumber() || score.getDay() != day)
            continue;
          scored++;
          crossTimes.add(String.valueOf(score.getTime()));
        }
        crossesByDay.put(String.valueOf(day), crossTimes.size());
        scoresByDay.put(String.valueOf(day), scored);
        totalCrosses += crossTimes.size();
        totalScores += scored;
      }
      row.put("crossesByDay", crossesByDay);
      row.put("scoresByDay", scoresByDay);
      row.put("totalCrosses", totalCrosses);
      row.put("totalScores", totalScores);
      row.put("scratches", (int) scratches.stream().filter(s -> s.getJudgeNumber() == judge.getNumber()).count());
      rows.add(row);
    }
    return rows;
  }

  /**
   * Everything that belongs on the front page of the hunt's paperwork: the
   * hunt's settings, how many dogs and judges took part, what happened each
   * day, the top placings per stake, and the scratches.
   */
  public Map<String, Object> getHuntSummary() {
    HuntEntity hunt = huntRepository.findAll().stream().findFirst()
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "No hunt has been created yet.",
            Map.of("hunt", "Create a hunt from the Home page to get started.")));
    List<DogEntity> dogs = dogRepository.findAll();
    List<Score> scores = scoreRepository.findAllByOrderByDayAscTimeAsc();
    List<Scratch> scratches = new ArrayList<>(scratchRepository.findAll());
    scratches.sort(Comparator.comparingInt(Scratch::getDay).thenComparing(Scratch::getDogNumber, DogEntity.NUMBER_ORDER));

    Map<String, Object> summary = new LinkedHashMap<>();
    Map<String, Object> huntFacts = new LinkedHashMap<>();
    huntFacts.put("title", hunt.getTitle());
    huntFacts.put("dates", hunt.getDates());
    huntFacts.put("stake", hunt.getStake());
    huntFacts.put("huntDays", hunt.getHuntDays());
    huntFacts.put("huntInterval", hunt.getHuntInterval());
    huntFacts.put("firstDogPoints", hunt.getFirstDogPoints());
    huntFacts.put("pointStep", hunt.getPointStep());
    summary.put("hunt", huntFacts);

    Map<String, Object> counts = new LinkedHashMap<>();
    counts.put("dogs", dogs.size());
    counts.put("allAgeDogs", (int) dogs.stream().filter(d -> d.getStake() == StakeType.ALL_AGE).count());
    counts.put("derbyDogs", (int) dogs.stream().filter(d -> d.getStake() == StakeType.DERBY).count());
    counts.put("scratchedDogs", (int) dogs.stream().filter(DogEntity::isScratched).count());
    counts.put("judges", (int) judgeRepository.count());
    counts.put("crosses", countCrosses(scores));
    counts.put("scores", scores.size());
    summary.put("counts", counts);

    List<Map<String, Object>> days = new ArrayList<>();
    for (int day = 1; day <= hunt.getHuntDays(); day++) {
      final int d = day;
      List<Score> ofDay = scores.stream().filter(s -> s.getDay() == d).toList();
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("day", day);
      row.put("startTime", daysRepository.findById(day).map(Days::getStartTime).orElse(null));
      row.put("crosses", countCrosses(ofDay));
      row.put("scores", ofDay.size());
      row.put("dogsScored", (int) ofDay.stream().map(Score::getDogNumber).distinct().count());
      row.put("scratches", (int) scratches.stream().filter(s -> s.getDay() == d).count());
      days.add(row);
    }
    summary.put("days", days);

    List<Map<String, Object>> placings = new ArrayList<>();
    if (hunt.getStake() == StakeType.DUAL) {
      addPlacings(placings, StakeType.ALL_AGE, dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE, PLACINGS));
      addPlacings(placings, StakeType.DERBY, dogService.getTopScoringDogsByStakeType(StakeType.DERBY, PLACINGS));
    } else {
      addPlacings(placings, hunt.getStake(), dogService.getTopScoringDogsOverall(PLACINGS));
    }
    summary.put("placings", placings);

    List<Map<String, Object>> scratchRows = new ArrayList<>();
    for (Scratch scratch : scratches) {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("day", scratch.getDay());
      row.put("dogNumber", scratch.getDogNumber());
      row.put("dogName", scratch.getDogName());
      row.put("time", scratch.getTime());
      row.put("judgeNumber", scratch.getJudgeNumber());
      row.put("reason", scratch.getReason());
      scratchRows.add(row);
    }
    summary.put("scratches", scratchRows);
    return summary;
  }

  private static int countCrosses(List<Score> scores) {
    Set<String> keys = new HashSet<>();
    for (Score score : scores)
      keys.add(score.getDay() + "|" + score.getJudgeNumber() + "|" + score.getTime());
    return keys.size();
  }

  private static void addPlacings(List<Map<String, Object>> into, StakeType stake, List<Map<String, Object>> standings) {
    int place = 1;
    for (Map<String, Object> dog : standings) {
      Object points = dog.get("totalPoints");
      if (!(points instanceof Integer) || (Integer) points <= 0)
        break; // dogs without points are not placed
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("stake", stake);
      row.put("place", place++);
      row.put("dogNumber", dog.get("dogNumber"));
      row.put("dogName", dog.get("dogName"));
      row.put("owner", dog.get("owner"));
      row.put("totalPoints", points);
      row.put("scratched", dog.get("scratched"));
      into.add(row);
    }
  }
}
