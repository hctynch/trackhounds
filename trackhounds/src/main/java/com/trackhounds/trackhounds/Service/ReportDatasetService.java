package com.trackhounds.trackhounds.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trackhounds.trackhounds.Entity.DailyScore;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;
import com.trackhounds.trackhounds.Repository.ScoreRepository;
import com.trackhounds.trackhounds.Repository.ScratchRepository;

import lombok.AllArgsConstructor;

/**
 * The flat row sets the report builder composes sheets from. Every column is
 * filled in by the server so the UI never recomputes scoring maths; the
 * ranking of dogs uses {@link DogService}'s rule (points, then the tie-break)
 * so "top N" keeps the same order as the standings.
 *
 * A dataset answer carries its column catalogue (key, label, whether the
 * column is numeric, and an optional group for the header) and the rows, keyed
 * by those column keys. Day columns follow the hunt's day count.
 */
@Service
@Transactional
@AllArgsConstructor
public class ReportDatasetService {

  public static final Set<String> DATASETS = Set.of("dogs", "scores", "scratches", "judges");

  private final HuntRepository huntRepository;
  private final DogRepository dogRepository;
  private final JudgeRepository judgeRepository;
  private final ScoreRepository scoreRepository;
  private final ScratchRepository scratchRepository;
  private final DogService dogService;
  private final ReportService reportService;

  /**
   * One dataset, filtered.
   *
   * @param name   {@code dogs}, {@code scores}, {@code scratches} or {@code judges}
   * @param day    a day of the hunt, or null for the whole hunt
   * @param stake  {@code ALL_AGE} or {@code DERBY}, or null for every dog
   * @param limit  at most this many rows (after ranking), or null
   * @param dog    only this dog's rows (scores), or null
   * @param judge  only this judge's rows (scores, scratches), or null
   */
  public Map<String, Object> dataset(String name, Integer day, StakeType stake, Integer limit, String dog, Integer judge) {
    if (name == null || !DATASETS.contains(name)) {
      throw new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "There is no dataset called " + name + ".",
          Map.of("dataset", "One of: dogs, scores, scratches, judges."));
    }
    HuntEntity hunt = huntRepository.findAll().stream().findFirst().orElse(null);
    int dayCount = hunt == null ? HuntService.MAX_DAYS : hunt.getHuntDays();
    if (day != null && (day < 1 || day > dayCount)) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, String.format("Day must be between 1 and %d.", dayCount), Map.of("day", "Out of range."));
    }
    List<Map<String, Object>> columns;
    List<Map<String, Object>> rows;
    switch (name) {
      case "dogs" -> {
        columns = dogColumns(dayCount, day);
        rows = dogRows(dayCount, day, stake);
      }
      case "scores" -> {
        columns = scoreColumns();
        rows = scoreRows(day, stake, dog, judge);
      }
      case "scratches" -> {
        columns = scratchColumns();
        rows = scratchRows(day, stake, judge);
      }
      default -> {
        columns = judgeColumns(dayCount);
        rows = judgeRows();
      }
    }
    if (limit != null && limit > 0 && rows.size() > limit) {
      rows = new ArrayList<>(rows.subList(0, limit));
    }
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("dataset", name);
    result.put("day", day);
    result.put("stake", stake);
    result.put("limit", limit);
    result.put("huntDays", dayCount);
    result.put("dual", hunt != null && hunt.getStake() == StakeType.DUAL);
    result.put("columns", columns);
    result.put("rows", rows);
    return result;
  }

  // ------------------------------------------------------------------ dogs

  private static List<Map<String, Object>> dogColumns(int dayCount, Integer day) {
    List<Map<String, Object>> columns = new ArrayList<>();
    columns.add(column("place", "Place", true, null));
    columns.add(column("number", "Dog", true, null));
    columns.add(column("name", "Name", false, null));
    columns.add(column("stake", "Stake", false, null));
    columns.add(column("owner", "Owner", false, null));
    columns.add(column("sire", "Sire", false, null));
    columns.add(column("dam", "Dam", false, null));
    columns.add(column("scratched", "Scratched", false, null));
    if (day != null) {
      columns.add(column("daySpeedAndDrive", "S&D", true, "Day " + day));
      columns.add(column("dayEndurance", "Endurance", true, "Day " + day));
      columns.add(column("dayTotal", "Total", true, "Day " + day));
    }
    for (int d = 1; d <= dayCount; d++) {
      columns.add(column("sdDay" + d, "Day " + d, true, "Speed and drive"));
    }
    for (int d = 1; d <= dayCount; d++) {
      columns.add(column("enduranceDay" + d, "Day " + d, true, "Endurance"));
    }
    for (int d = 1; d <= dayCount; d++) {
      columns.add(column("totalDay" + d, "Day " + d, true, "Day total"));
    }
    columns.add(column("speedAndDrive", "Total S&D", true, null));
    columns.add(column("endurance", "Total endurance", true, null));
    columns.add(column("total", "Total points", true, null));
    columns.add(column("lastCrossDay", "Last cross day", true, null));
    columns.add(column("lastCrossTime", "Last cross time", false, null));
    return columns;
  }

  private List<Map<String, Object>> dogRows(int dayCount, Integer day, StakeType stake) {
    // Ranking order from the standings code, so the tie-break rule lives in one place.
    List<Map<String, Object>> ranked;
    if (day == null) {
      ranked = stake == null ? dogService.getTopScoringDogsOverall(Integer.MAX_VALUE) : dogService.getTopScoringDogsByStakeType(stake, Integer.MAX_VALUE);
    } else {
      ranked = stake == null ? dogService.getTopScoringDogsByDay(day, Integer.MAX_VALUE) : dogService.getTopScoringDogsByDayAndStakeType(day, stake, Integer.MAX_VALUE);
    }
    Map<String, Integer> placeOf = new HashMap<>();
    for (int i = 0; i < ranked.size(); i++) {
      placeOf.put(String.valueOf(ranked.get(i).get("dogNumber")), i + 1);
    }
    List<DogEntity> dogs = new ArrayList<>(dogRepository.findAll());
    dogs.removeIf(d -> stake != null && d.getStake() != stake);
    dogs.sort(Comparator.comparing((DogEntity d) -> placeOf.getOrDefault(d.getNumber(), Integer.MAX_VALUE))
        .thenComparing(DogEntity::getNumber, DogEntity.NUMBER_ORDER));

    List<Map<String, Object>> rows = new ArrayList<>();
    for (DogEntity dog : dogs) {
      Map<String, Object> row = new LinkedHashMap<>();
      Integer place = placeOf.get(dog.getNumber());
      row.put("place", place);
      row.put("number", dog.getNumber());
      row.put("name", dog.getName());
      row.put("stake", dog.getStake());
      row.put("owner", dog.getOwner());
      row.put("sire", dog.getSire());
      row.put("dam", dog.getDam());
      row.put("scratched", dog.isScratched());
      int sdTotal = 0;
      int enduranceTotal = 0;
      int lastDay = 0;
      LocalTime lastTime = null;
      Map<Integer, DailyScore> byDay = new HashMap<>();
      for (DailyScore daily : dog.getScores()) {
        byDay.put(daily.getDay().getDay(), daily);
      }
      for (int d = 1; d <= dayCount; d++) {
        DailyScore daily = byDay.get(d);
        int sd = daily == null ? 0 : daily.getDailyScore();
        int endurance = DogService.endurance(sd, d);
        row.put("sdDay" + d, sd);
        row.put("enduranceDay" + d, endurance);
        row.put("totalDay" + d, sd + endurance);
        sdTotal += sd;
        enduranceTotal += endurance;
        if (daily != null && sd > 0 && daily.getLastCross() != null) {
          lastDay = d;
          lastTime = daily.getLastCross();
        }
        if (day != null && day == d) {
          row.put("daySpeedAndDrive", sd);
          row.put("dayEndurance", endurance);
          row.put("dayTotal", sd + endurance);
        }
      }
      row.put("speedAndDrive", sdTotal);
      row.put("endurance", enduranceTotal);
      row.put("total", sdTotal + enduranceTotal);
      row.put("lastCrossDay", lastDay == 0 ? null : lastDay);
      row.put("lastCrossTime", lastTime);
      rows.add(row);
    }
    return rows;
  }

  // ---------------------------------------------------------------- scores

  private static List<Map<String, Object>> scoreColumns() {
    List<Map<String, Object>> columns = new ArrayList<>();
    columns.add(column("day", "Day", true, null));
    columns.add(column("time", "Time", false, null));
    columns.add(column("judgeNumber", "Judge", true, null));
    columns.add(column("judgeName", "Judge name", false, null));
    columns.add(column("dogNumber", "Dog", true, null));
    columns.add(column("dogName", "Name", false, null));
    columns.add(column("stake", "Stake", false, null));
    columns.add(column("owner", "Owner", false, null));
    columns.add(column("scratched", "Scratched", false, null));
    columns.add(column("points", "Score", true, null));
    columns.add(column("counted", "Counted", false, null));
    columns.add(column("interval", "Interval", true, null));
    return columns;
  }

  private List<Map<String, Object>> scoreRows(Integer day, StakeType stake, String dog, Integer judge) {
    Map<String, DogEntity> dogs = dogsByNumber();
    Map<Integer, JudgeEntity> judges = judgesByNumber();
    List<Map<String, Object>> rows = new ArrayList<>();
    for (Score score : scoreRepository.findAllByOrderByDayAscTimeAsc()) {
      DogEntity owner = dogs.get(score.getDogNumber());
      if (day != null && score.getDay() != day)
        continue;
      if (stake != null && (owner == null || owner.getStake() != stake))
        continue;
      if (dog != null && !dog.isBlank() && !dog.trim().equals(score.getDogNumber()))
        continue;
      if (judge != null && score.getJudgeNumber() != judge)
        continue;
      JudgeEntity judgeEntity = judges.get(score.getJudgeNumber());
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("day", score.getDay());
      row.put("time", score.getTime());
      row.put("judgeNumber", score.getJudgeNumber());
      row.put("judgeName", judgeEntity == null ? null : judgeEntity.getName());
      row.put("dogNumber", score.getDogNumber());
      row.put("dogName", owner == null ? null : owner.getName());
      row.put("stake", owner == null ? null : owner.getStake());
      row.put("owner", owner == null ? null : owner.getOwner());
      row.put("scratched", owner != null && owner.isScratched());
      row.put("points", score.getPoints());
      row.put("counted", score.isCounted());
      row.put("interval", score.getTimeBucket() + 1);
      rows.add(row);
    }
    return rows;
  }

  // ------------------------------------------------------------- scratches

  private static List<Map<String, Object>> scratchColumns() {
    List<Map<String, Object>> columns = new ArrayList<>();
    columns.add(column("day", "Day", true, null));
    columns.add(column("dogNumber", "Dog", true, null));
    columns.add(column("dogName", "Name", false, null));
    columns.add(column("stake", "Stake", false, null));
    columns.add(column("owner", "Owner", false, null));
    columns.add(column("time", "Time", false, null));
    columns.add(column("judgeNumber", "Judge", true, null));
    columns.add(column("judgeName", "Judge name", false, null));
    columns.add(column("reason", "Reason", false, null));
    return columns;
  }

  private List<Map<String, Object>> scratchRows(Integer day, StakeType stake, Integer judge) {
    Map<String, DogEntity> dogs = dogsByNumber();
    Map<Integer, JudgeEntity> judges = judgesByNumber();
    List<Scratch> scratches = new ArrayList<>(scratchRepository.findAll());
    scratches.sort(Comparator.comparingInt(Scratch::getDay)
        .thenComparing(Scratch::getTime, Comparator.nullsLast(Comparator.naturalOrder()))
        .thenComparing(Scratch::getDogNumber, Comparator.nullsLast(DogEntity.NUMBER_ORDER)));
    List<Map<String, Object>> rows = new ArrayList<>();
    for (Scratch scratch : scratches) {
      DogEntity dog = dogs.get(scratch.getDogNumber());
      if (day != null && scratch.getDay() != day)
        continue;
      if (stake != null && (dog == null || dog.getStake() != stake))
        continue;
      if (judge != null && scratch.getJudgeNumber() != judge)
        continue;
      JudgeEntity judgeEntity = judges.get(scratch.getJudgeNumber());
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("day", scratch.getDay());
      row.put("dogNumber", scratch.getDogNumber());
      row.put("dogName", scratch.getDogName() != null ? scratch.getDogName() : dog == null ? null : dog.getName());
      row.put("stake", dog == null ? null : dog.getStake());
      row.put("owner", dog == null ? null : dog.getOwner());
      row.put("time", scratch.getTime());
      row.put("judgeNumber", scratch.getJudgeNumber());
      row.put("judgeName", judgeEntity == null ? null : judgeEntity.getName());
      row.put("reason", scratch.getReason());
      rows.add(row);
    }
    return rows;
  }

  // ---------------------------------------------------------------- judges

  private static List<Map<String, Object>> judgeColumns(int dayCount) {
    List<Map<String, Object>> columns = new ArrayList<>();
    columns.add(column("number", "Judge", true, null));
    columns.add(column("name", "Name", false, null));
    columns.add(column("memberPin", "Member PIN", false, null));
    for (int d = 1; d <= dayCount; d++) {
      columns.add(column("crossesDay" + d, "Day " + d, true, "Crosses"));
    }
    for (int d = 1; d <= dayCount; d++) {
      columns.add(column("scoresDay" + d, "Day " + d, true, "Dogs scored"));
    }
    columns.add(column("totalCrosses", "Crosses", true, null));
    columns.add(column("totalScores", "Dogs scored", true, null));
    columns.add(column("scratches", "Scratches", true, null));
    return columns;
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> judgeRows() {
    Map<Integer, JudgeEntity> judges = judgesByNumber();
    List<Map<String, Object>> rows = new ArrayList<>();
    for (Map<String, Object> summary : reportService.getJudgeSummary()) {
      Map<String, Object> row = new LinkedHashMap<>();
      int number = (Integer) summary.get("judgeNumber");
      JudgeEntity judge = judges.get(number);
      row.put("number", number);
      row.put("name", summary.get("judgeName"));
      row.put("memberPin", judge == null ? null : judge.getMemberPin());
      ((Map<String, Integer>) summary.get("crossesByDay")).forEach((d, count) -> row.put("crossesDay" + d, count));
      ((Map<String, Integer>) summary.get("scoresByDay")).forEach((d, count) -> row.put("scoresDay" + d, count));
      row.put("totalCrosses", summary.get("totalCrosses"));
      row.put("totalScores", summary.get("totalScores"));
      row.put("scratches", summary.get("scratches"));
      rows.add(row);
    }
    return rows;
  }

  // --------------------------------------------------------------- helpers

  private Map<String, DogEntity> dogsByNumber() {
    Map<String, DogEntity> map = new HashMap<>();
    for (DogEntity dog : dogRepository.findAll()) {
      map.put(dog.getNumber(), dog);
    }
    return map;
  }

  private Map<Integer, JudgeEntity> judgesByNumber() {
    Map<Integer, JudgeEntity> map = new HashMap<>();
    for (JudgeEntity judge : judgeRepository.findAll()) {
      map.put(judge.getNumber(), judge);
    }
    return map;
  }

  private static Map<String, Object> column(String key, String label, boolean numeric, String group) {
    Map<String, Object> column = new LinkedHashMap<>();
    column.put("key", key);
    column.put("label", label);
    column.put("numeric", numeric);
    if (group != null) {
      column.put("group", group);
    }
    return column;
  }
}
