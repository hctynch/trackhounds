package com.trackhounds.trackhounds.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DailyScore;
import com.trackhounds.trackhounds.Entity.Days;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DailyScoreRepository;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;
import com.trackhounds.trackhounds.Repository.ScoreRepository;
import com.trackhounds.trackhounds.Repository.ScratchRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
/**
 * Dog service class for the controller
 */
public class DogService {

  /**
   * Dog Repository
   */
  @Autowired
  private DogRepository dogRepository;

  /**
   * Daily Score Repository
   */
  @Autowired
  private DailyScoreRepository dailyScoreRepository;

  /**
   * Score Repository
   */
  @Autowired
  private ScoreRepository scoreRepository;

  /**
   * Days Repository
   */
  @Autowired
  private DaysRepository daysRepository;

  /**
   * Judge Repository
   */
  @Autowired
  private JudgeRepository judgeRepository;

  /**
   * Scratch Repository
   */
  @Autowired
  private ScratchRepository scratchRepository;

  /**
   * Create a group of dogs
   * 
   * @param dogs List of dogs to create
   * @throws TrackHoundsAPIException if dog number is not specified, dog with
   *                                 matching number already exists, name is
   *                                 empty,
   *                                 stake is null.
   */
  public void createDogs(List<DogEntity> dogs) {
    Map<String, String> errs = new HashMap<>();
    if (dogs == null || dogs.size() == 0) {
      return;
    }
    for (int i = 0; i < dogs.size(); i++) {
      DogEntity d = dogs.get(i);
      if (d == null)
        continue;
      if (dogRepository.existsById(d.getNumber())) {
        errs.put(String.format("number%d", i + 1), "Existing dog with matching number.");
      }
      if (d.getName() == null || d.getName().isEmpty())
        errs.put(String.format("name%d", i + 1), "Name cannot be empty.");
      if (d.getStake() == null)
        errs.put(String.format("stake%d", i + 1), "Stake type cannot be null.");
    }
    if (errs.size() > 0)
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);
    dogRepository.saveAll(dogs);
  }

  /**
   * Delete a dog by number
   * 
   * @param number Number of dog
   */
  public List<DogEntity> deleteDog(int number) {
    dogRepository.deleteById(number);
    return dogRepository.findAll();
  }

  /**
   * Edit a dog
   * 
   * @param dog Edited Dog
   * @throws TrackHoundsAPIException if dog does not exist, name is empty, stake
   *                                 is null
   *                                 or dog number is not specified
   */
  public void editDog(DogEntity dog) {
    DogEntity d = dogRepository.findById(dog.getNumber())
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Dog with this number does not exist.",
            Map.of("number", "Dog with this number does not exist.")));
    Map<String, String> errs = new HashMap<>();
    if (d.getName() == null || d.getName().isEmpty())
      errs.put("name", "Name cannot be empty.");
    if (dog.getStake() == null)
      errs.put("stake", "Stake not specified.");
    if (errs.size() > 0)
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid fields", errs);
    d.setName(dog.getName());
    d.setOwner(dog.getOwner());
    d.setDam(dog.getDam());
    d.setSire(dog.getSire());
    d.setStake(dog.getStake());
    dogRepository.save(d);
  }

  /**
   * REturn total number of dogs
   * 
   * @return total number of dogs
   */
  public int getDogTotal() {
    return (int) dogRepository.count();
  }

  /**
   * Get a list of all dogs
   * 
   * @return all dogs
   */
  public List<DogEntity> getDogs() {
    List<DogEntity> dogs = dogRepository.findAll();
    for (DogEntity dog : dogs) {
      // Calculate the total points for each dog
      int totalPoints = calculateTotalPoints(dog);
      dog.setPoints(totalPoints);
    }
    return dogs;
  }

  /**
   * Calculate the total points for a dog
   * 
   * @param dog Dog to calculate points for
   * @return total points
   */
  private int calculateTotalPoints(DogEntity dog) {
    int totalPoints = 0;
    List<DailyScore> scores = dog.getScores();
    for (DailyScore dailyScore : scores) {
      totalPoints += dailyScore.getHighestScores().stream().mapToInt(hs -> hs.getScore().getPoints()).sum();
    }
    return totalPoints;
  }

  /**
   * Get a dog by number
   * 
   * @param number Number of dog
   * @throws TrackHoundsAPIException if dog does not exist
   * @return Dog with the specified number
   */
  public DogEntity getDogByNumber(int number) {
    DogEntity dog = dogRepository.findById(number)
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Dog does not exist.",
            Map.of("number", "Dog does not exist with this number.")));
    // Calculate the total points for the dog
    int totalPoints = calculateTotalPoints(dog);
    dog.setPoints(totalPoints);
    return dog;
  }

  /**
   * Clear all dogs and days
   */
  public void clear() {
    dogRepository.deleteAll();
    daysRepository.deleteAll();
    scoreRepository.deleteAll();
    scratchRepository.deleteAll();
  }

  /**
   * Create a score
   * 
   * @param score Score to create
   * @throws TrackHoundsAPIException if judge does not exist, dog does not exist,
   *                                 scores
   *                                 and dog numbers do not match, scores are
   *                                 negative,
   *                                 start time is empty, cross time is empty,
   *                                 cross time is before
   *                                 start time.
   */
  public void createScore(ScoreDto score) {
    Map<String, String> errs = new HashMap<>();
    if (judgeRepository.findById(score.getJudge()).isEmpty())
      errs.put("judge", "Judge does not exist.");
    if (score.getDogNumbers() == null || score.getDogNumbers().length == 0)
      errs.put("dogNumbers", "Dog numbers cannot be empty.");
    if (score.getScores() == null || score.getScores().length == 0)
      errs.put("scores", "Scores cannot be empty.");
    if (score.getDogNumbers().length != score.getScores().length)
      errs.put("scores", "Scores and dog numbers do not match.");
    for (int i = 0; i < score.getDogNumbers().length; i++) {
      if (dogRepository.findById(score.getDogNumbers()[i]).isEmpty())
        errs.put(String.format("dogNumbers%d", i), "Dog does not exist.");
      if (score.getScores()[i] < 0)
        errs.put(String.format("scores%d", i), "Score cannot be negative.");
    }
    if (score.getStartTime() == null || score.getStartTime().isEmpty())
      errs.put("startTime", "Start time cannot be empty.");
    if (score.getCrossTime() == null || score.getCrossTime().isEmpty())
      errs.put("crossTime", "Cross time cannot be empty.");
    LocalTime crossTime = null;
    LocalTime startTime = null;
    try {
      crossTime = LocalTime.parse(score.getCrossTime());
    } catch (Exception e) {
      errs.put("crossTime", "Invalid cross time.");
    }
    try {
      startTime = LocalTime.parse(score.getStartTime());
    } catch (Exception e) {
      errs.put("startTime", "Invalid start time.");
    }
    if (crossTime != null && startTime != null && crossTime.isBefore(startTime))
      errs.put("crossTime", "Cross time cannot be before start time.");

    if (errs.size() > 0)
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);

    Days day = daysRepository.findById(score.getDay()).orElse(new Days(score.getDay(), startTime));
    if (day.getStartTime() == null)
      day.setStartTime(startTime);
    day = daysRepository.save(day);
    for (int i = 0; i < score.getDogNumbers().length; i++) {
      DogEntity dog = dogRepository.findById(score.getDogNumbers()[i]).get();
      List<DailyScore> scores = dog.getScores();
      if (scores.size() < score.getDay()) {
        for (int j = scores.size(); j < score.getDay(); j++) {
          final int dayIndex = j + 1;
          Days d = daysRepository.findByDay(dayIndex).orElseGet(() -> {
            Days newDay = new Days(dayIndex, null);
            return daysRepository.save(newDay);
          });
          DailyScore dailyScore = new DailyScore(d, dog);
          dailyScore = dailyScoreRepository.save(dailyScore);
          dog.getScores().add(dailyScore);
        }
      }
      DailyScore dailyScore = dog.getScores().get(score.getDay() - 1);
      dailyScore.setDay(day);
      Score s = new Score(score.getScores()[i], crossTime, false, score.getJudge());
      dailyScore.addScore(s, startTime, score.getInterval());
      scoreRepository.save(s);
      dailyScore = dailyScoreRepository.save(dailyScore);
      dog.getScores().set(score.getDay() - 1, dailyScore);
      dog.setPoints(calculateTotalPoints(dog));
      dogRepository.save(dog);
    }
  }

  /**
   * Remove a score
   * 
   * @param dogNumber Dog number
   * @param scoreId   Score ID
   * @throws TrackHoundsAPIException if dog or score does not exist
   * @throws TrackHoundsAPIException if score does not exist for dog
   */
  public void removeScore(int dogNumber, Long scoreId) {
    DogEntity dog = dogRepository.findById(dogNumber)
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Dog does not exist.",
            Map.of("number", "Dog does not exist with this number.")));

    Score score = scoreRepository.findById(scoreId)
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Score does not exist.",
            Map.of("scoreId", "Score does not exist with this ID.")));

    DailyScore dailyScore = dog.getScores().stream()
        .filter(ds -> ds.getTimeBucketScores().stream().anyMatch(tbs -> tbs.getScore().equals(score)))
        .findFirst()
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "DailyScore does not exist.",
            Map.of("dailyScore", "DailyScore does not exist for this score.")));

    dailyScore.removeScore(score);
    scoreRepository.delete(score);
    dailyScoreRepository.save(dailyScore);
    dog.setPoints(calculateTotalPoints(dog));
    dogRepository.save(dog);
  }

  /**
   * Get the start time for a day
   * 
   * @param day Day number
   * @throws TrackHoundsAPIException if day does not exist
   * @return Start time
   */
  public LocalTime getStartTime(int day) {
    return daysRepository.findById(day).orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST,
        "Day does not exist.", Map.of("day", "Day does not exist."))).getStartTime();
  }

  /**
   * Scratch a dog
   * 
   * @param dogNumber Dog number
   * @throws TrackHoundsAPIException if dog does not exist
   */
  public void scratchDog(Scratch scratch) {
    Map<String, String> errs = new HashMap<>();
    if (scratch.getReason() == null || scratch.getReason().isEmpty())
      errs.put("reason", "Reason cannot be empty.");
    if (scratch.getTime() == null)
      errs.put("time", "Time cannot be empty.");
    Optional<DogEntity> dogRetrieval = dogRepository.findById(scratch.getDogNumber());
    if (dogRetrieval.isEmpty())
      errs.put("dogNumber", "Dog does not exist.");
    Optional<JudgeEntity> judgeRetrieval = judgeRepository.findById(scratch.getJudgeNumber());
    if (judgeRetrieval.isEmpty())
      errs.put("judgeNumber", "Judge does not exist.");
    if (errs.size() > 0)
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);
    DogEntity dog = dogRetrieval.get();
    dog.setScratched(true);
    scratchRepository.save(scratch);
    dogRepository.save(dog);
  }

  /**
   * Get all scratches
   * 
   * @return List of scratches
   */
  public List<Scratch> getScratches() {
    return scratchRepository.findAll();
  }

  /**
   * Delete a scratch
   * 
   * @param id ID of scratch
   */
  public void deleteScratch(Long id) {
    scratchRepository.deleteById(id);
  }

  /**
   * Get total scores for all dogs on a specific day
   * 
   * @param day The day number (1-4)
   * @return List of dogs with their total scores for the specified day
   */
  public List<Map<String, Object>> getDogScoresByDay(int day) {
    List<DogEntity> allDogs = dogRepository.findAll();
    List<Map<String, Object>> dogScores = new ArrayList<>();

    for (DogEntity dog : allDogs) {
      Optional<DailyScore> dailyScoreOpt = dog.getScores().stream()
          .filter(score -> score.getDay().getDay() == day)
          .findFirst();

      if (dailyScoreOpt.isPresent()) {
        DailyScore dailyScore = dailyScoreOpt.get();
        int totalPoints = calculateDailyPoints(dailyScore);

        Map<String, Object> dogScore = new HashMap<>();
        dogScore.put("dogNumber", dog.getNumber());
        dogScore.put("dogName", dog.getName());
        dogScore.put("owner", dog.getOwner());
        dogScore.put("stake", dog.getStake());
        dogScore.put("totalPoints", totalPoints);

        dogScores.add(dogScore);
      }
    }

    return dogScores;
  }

  /**
   * Calculate total points for a dog's daily score
   * 
   * @param dailyScore The daily score
   * @return Total points from highest scores
   */
  private int calculateDailyPoints(DailyScore dailyScore) {
    return dailyScore.getHighestScores().stream()
        .mapToInt(highestScore -> highestScore.getScore().getPoints())
        .sum();
  }

  /**
   * Get the top 10 highest scoring dogs for a specific day
   * 
   * @param day The day number (1-4)
   * @return List of top 10 dogs with their scores
   */
  public List<Map<String, Object>> getTopScoringDogsByDay(int day, int limit) {
    List<Map<String, Object>> dogScores = getDogScoresByDay(day);

    return dogScores.stream()
        .sorted((d1, d2) -> Integer.compare(
            (Integer) d2.get("totalPoints"),
            (Integer) d1.get("totalPoints")))
        .limit(limit)
        .collect(Collectors.toList());
  }

  /**
   * Get the top 10 highest scoring dogs for a specific day
   * 
   * @param day The day number (1-4)
   * @return List of top 10 dogs with their scores
   */
  public List<Map<String, Object>> getTop10ScoringDogsByDay(int day) {
    return getTopScoringDogsByDay(day, 10);
  }

  /**
   * Get the top 10 highest scoring dogs overall (across all days)
   * 
   * @return List of top 10 dogs with their total scores
   */
  public List<Map<String, Object>> getTop10ScoringDogsOverall() {
    List<DogEntity> allDogs = dogRepository.findAll();
    List<Map<String, Object>> dogScores = new ArrayList<>();

    for (DogEntity dog : allDogs) {
      int totalPoints = dog.getPoints(); // Using the existing points field

      Map<String, Object> dogScore = new HashMap<>();
      dogScore.put("dogNumber", dog.getNumber());
      dogScore.put("dogName", dog.getName());
      dogScore.put("owner", dog.getOwner());
      dogScore.put("stake", dog.getStake());
      dogScore.put("totalPoints", totalPoints);

      dogScores.add(dogScore);
    }

    return dogScores.stream()
        .sorted((d1, d2) -> Integer.compare(
            (Integer) d2.get("totalPoints"),
            (Integer) d1.get("totalPoints")))
        .limit(10)
        .collect(Collectors.toList());
  }
}
