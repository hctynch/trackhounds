package com.trackhounds.trackhounds.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DailyScore;
import com.trackhounds.trackhounds.Entity.Days;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DailyScoreRepository;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;
import com.trackhounds.trackhounds.Repository.ScoreRepository;
import com.trackhounds.trackhounds.Repository.ScratchRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.AllArgsConstructor;

@Service
@Transactional
@AllArgsConstructor
/**
 * Dog service class for the controller.
 *
 * Every public method runs in one transaction (one persistence context): the
 * methods work on entities across several repository calls and the ordered
 * {@code DogEntity.scores} list requires that the collection owner is flushed
 * together with new {@code DailyScore} rows.
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
   * Hunt Repository
   */
  @Autowired
  private HuntRepository huntRepository;

  /**
   * Entity manager, used where a change has to bypass the entity mapping
   * (renumbering a dog rewrites its primary key).
   */
  @PersistenceContext
  private EntityManager entityManager;

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
    Set<String> numbersInBatch = new HashSet<>();
    for (int i = 0; i < dogs.size(); i++) {
      DogEntity d = dogs.get(i);
      if (d == null)
        continue;
      if (d.getNumber() != null)
        d.setNumber(d.getNumber().trim());
      if (d.getNumber() == null || d.getNumber().isEmpty()) {
        errs.put(String.format("number%d", i + 1), "Dog number not specified.");
      } else if (!DogEntity.isValidNumber(d.getNumber())) {
        errs.put(String.format("number%d", i + 1), "Dog numbers are digits only, for example 12 or 007.");
      } else if (dogRepository.existsById(d.getNumber())) {
        errs.put(String.format("number%d", i + 1), "Existing dog with matching number.");
      } else if (!numbersInBatch.add(d.getNumber())) {
        errs.put(String.format("number%d", i + 1), "Dog number is repeated in this list.");
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
  public List<DogEntity> deleteDog(String number) {
    dogRepository.deleteById(number);
    return getDogs();
  }

  public List<DogEntity> deleteDog(int number) {
    return deleteDog(String.valueOf(number));
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
    // Validate the submitted values, not the stored ones (the old check let a dog be renamed to "").
    if (dog.getName() == null || dog.getName().isBlank())
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
   * Change a dog's number. The number is the dog's identity and is copied onto
   * its daily scores, crosses and scratches, so all of them move with it. Points
   * and standings are unaffected.
   *
   * @param currentNumber the dog's number today
   * @param newNumber     the number it should have
   * @return the dog under its new number
   * @throws TrackHoundsAPIException if the dog does not exist, the new number is
   *                                 not a valid number, or another dog has it
   */
  public DogEntity renumberDog(String currentNumber, String newNumber) {
    DogEntity dog = dogRepository.findById(currentNumber == null ? "" : currentNumber.trim())
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "Dog with this number does not exist.",
            Map.of("number", "Dog with this number does not exist.")));
    String target = newNumber == null ? "" : newNumber.trim();
    if (target.equals(dog.getNumber()))
      return dog;
    Map<String, String> errs = new HashMap<>();
    if (target.isEmpty())
      errs.put("number", "Enter the new number.");
    else if (!DogEntity.isValidNumber(target))
      errs.put("number", "Dog numbers are digits only, for example 12 or 007.");
    else if (dogRepository.existsById(target))
      errs.put("number", String.format("Dog %s already exists.", target));
    if (!errs.isEmpty())
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid fields", errs);

    // The number is a primary key referenced from three tables; rewriting it in
    // place keeps every row's identity (score ids, scratch ids) unchanged.
    String source = dog.getNumber();
    entityManager.flush();
    entityManager.clear();
    for (String[] column : List.of(new String[] { "dogs", "number" }, new String[] { "daily_score", "dog_number" },
        new String[] { "score", "dog_number" }, new String[] { "scratch", "dog_number" })) {
      entityManager.createNativeQuery(String.format("update %s set %s = :target where %s = :source", column[0], column[1], column[1]))
          .setParameter("target", target)
          .setParameter("source", source)
          .executeUpdate();
    }
    return dogRepository.findById(target).orElseThrow();
  }

  /**
   * Return total number of dogs
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
    // Points are maintained whenever scores change; reading must not write.
    List<DogEntity> dogs = new ArrayList<>(dogRepository.findAll());
    dogs.sort((a, b) -> DogEntity.NUMBER_ORDER.compare(a.getNumber(), b.getNumber()));
    return dogs;
  }

  /**
   * Get a list of all dogs in a cross and the points they should be awarded.
   * 
   * @return dogs in cross, with stake, and points
   */
  public List<Map<String, Object>> getCrossInfo(int[] numbers, int startingPoints, int interval, StakeType stakeType) {
    String[] asStrings = new String[numbers == null ? 0 : numbers.length];
    for (int i = 0; i < asStrings.length; i++) {
      asStrings[i] = String.valueOf(numbers[i]);
    }
    return getCrossInfo(asStrings, startingPoints, interval, stakeType);
  }

  public List<Map<String, Object>> getCrossInfo(String[] numbers, int startingPoints, int interval, StakeType stakeType) {
    List<Map<String, Object>> crossInfo = new ArrayList<>();
    if (numbers == null || numbers.length == 0) {
      return crossInfo;
    }
    if (huntRepository.count() == 0)
      return crossInfo;
    HuntEntity hunt = huntRepository.findAll().get(0);
    if (stakeType != StakeType.DUAL) {
      for (int i = 0; i < numbers.length; i++) {
        Optional<DogEntity> dogRetrieval = dogRepository.findById(numbers[i]);
        Map<String, Object> dogInfo = new HashMap<>();
        if (dogRetrieval.isEmpty()) {
          dogInfo.put("dogNumber", numbers[i]);
          dogInfo.put("error", "Dog does not exist. Skipping.");
          crossInfo.add(dogInfo);
          continue;
        }
        DogEntity dog = dogRetrieval.get();
        dogInfo.put("dogNumber", dog.getNumber());
        dogInfo.put("stake", dog.getStake());
        dogInfo.put("scratched", dog.isScratched());
        dogInfo.put("points", startingPoints - (interval * i));
        crossInfo.add(dogInfo);
      }
    } else {
      int sp1 = startingPoints;
      int sp2 = startingPoints;
      for (int i = 0; i < numbers.length; i++) {
        Optional<DogEntity> dogRetrieval = dogRepository.findById(numbers[i]);
        Map<String, Object> dogInfo = new HashMap<>();
        if (dogRetrieval.isEmpty()) {
          dogInfo.put("dogNumber", numbers[i]);
          dogInfo.put("error", "Dog does not exist. Skipping.");
          crossInfo.add(dogInfo);
          if (hunt.getStakeRange() != null && hunt.getStakeTypeRange() != null) {
            long value = DogEntity.numericValue(numbers[i]);
            if (value < hunt.getStakeRange()[1]) {
              if (hunt.getStakeTypeRange()[0] == StakeType.ALL_AGE) {
                sp1 -= interval;
              } else {
                sp2 -= interval;
              }
            } else if (value < hunt.getStakeRange()[2]) {
              if (hunt.getStakeTypeRange()[1] == StakeType.ALL_AGE) {
                sp1 -= interval;
              } else {
                sp2 -= interval;
              }
            } else if (value < hunt.getStakeRange()[3]) {
              if (hunt.getStakeTypeRange()[2] == StakeType.ALL_AGE) {
                sp1 -= interval;
              } else {
                sp2 -= interval;
              }
            } else {
              if (hunt.getStakeTypeRange()[3] == StakeType.ALL_AGE) {
                sp1 -= interval;
              } else {
                sp2 -= interval;
              }
            }
          }
          continue;
        }
        DogEntity dog = dogRetrieval.get();
        dogInfo.put("dogNumber", dog.getNumber());
        dogInfo.put("stake", dog.getStake());
        dogInfo.put("scratched", dog.isScratched());
        if (dog.getStake() == StakeType.ALL_AGE) {
          dogInfo.put("points", sp1);
          sp1 -= interval;
        } else {
          dogInfo.put("points", sp2);
          sp2 -= interval;
        }
        crossInfo.add(dogInfo);
      }
    }

    return crossInfo;
  }

  /**
   * Calculate the total points for a dog
   * 
   * @param dog Dog to calculate points for
   * @return total points
   */
  private int calculateTotalPoints(DogEntity dog) {
    int totalPoints = 0;
    for (DailyScore dailyScore : dog.getScores()) {
      int speedAndDrive = dailyScore.getDailyScore();
      dailyScoreRepository.save(dailyScore);
      totalPoints += speedAndDrive + endurance(speedAndDrive, dailyScore.getDay().getDay());
    }
    return totalPoints;
  }

  /**
   * Endurance points for one day: ten percent of the day's speed and drive per
   * day number (day 1 adds 10%, day 2 adds 20%, ...), in whole points. Integer
   * arithmetic so the daily sheets and the overall total always agree.
   *
   * @param speedAndDrive counted points of the day
   * @param day           day number (1-4)
   * @return endurance points
   */
  public static int endurance(int speedAndDrive, int day) {
    return speedAndDrive * day / 10;
  }

  /**
   * Get a dog by number
   * 
   * @param number Number of dog
   * @throws TrackHoundsAPIException if dog does not exist
   * @return Dog with the specified number
   */
  public DogEntity getDogByNumber(int number) {
    return getDogByNumber(String.valueOf(number));
  }

  public DogEntity getDogByNumber(String number) {
    return dogRepository.findById(number)
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Dog does not exist.",
            Map.of("number", "Dog does not exist with this number.")));
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
    String[] dogNumbers = score.getDogNumbers() == null ? new String[0] : score.getDogNumbers();
    int[] points = score.getScores() == null ? new int[0] : score.getScores();
    if (dogNumbers.length == 0)
      errs.put("dogNumbers", "Dog numbers cannot be empty.");
    if (points.length == 0)
      errs.put("scores", "Scores cannot be empty.");
    if (dogNumbers.length != points.length)
      errs.put("scores", "Scores and dog numbers do not match.");
    for (int i = 0; i < points.length; i++) {
      if (points[i] < 0)
        errs.put(String.format("scores%d", i), "Score cannot be negative.");
    }
    // Every dog in a cross must be registered and listed once; a silently dropped
    // dog is a lost score nobody notices until the standings are wrong.
    Set<String> seen = new HashSet<>();
    for (int i = 0; i < dogNumbers.length; i++) {
      if (dogNumbers[i] != null)
        dogNumbers[i] = dogNumbers[i].trim();
      if (!DogEntity.isValidNumber(dogNumbers[i]))
        errs.put(String.format("dogNumbers%d", i), "Dog numbers are digits only.");
      else if (!seen.add(dogNumbers[i]))
        errs.put(String.format("dogNumbers%d", i), String.format("Dog %s is listed twice in this cross.", dogNumbers[i]));
      else if (!dogRepository.existsById(dogNumbers[i]))
        errs.put(String.format("dogNumbers%d", i), String.format("Dog %s is not registered in this hunt.", dogNumbers[i]));
    }

    // The day's start time is set by its first cross and is authoritative afterwards:
    // every bucket of the day is measured from it.
    Optional<Days> existingDay = daysRepository.findById(score.getDay());
    LocalTime startTime = existingDay.map(Days::getStartTime).orElse(null);
    if (startTime == null) {
      if (score.getStartTime() == null || score.getStartTime().isEmpty()) {
        errs.put("startTime", "Start time cannot be empty.");
      } else {
        try {
          startTime = LocalTime.parse(score.getStartTime());
        } catch (Exception e) {
          errs.put("startTime", "Invalid start time.");
        }
      }
    }
    LocalTime crossTime = null;
    if (score.getCrossTime() == null || score.getCrossTime().isEmpty()) {
      errs.put("crossTime", "Cross time cannot be empty.");
    } else {
      try {
        crossTime = LocalTime.parse(score.getCrossTime());
      } catch (Exception e) {
        errs.put("crossTime", "Invalid cross time.");
      }
    }
    if (crossTime != null && startTime != null && crossTime.isBefore(startTime))
      errs.put("crossTime", String.format("Cross time cannot be before the day's start time (%s).", startTime));

    if (errs.size() > 0)
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", errs);

    Days day = existingDay.orElse(new Days(score.getDay(), startTime));
    if (day.getStartTime() == null)
      day.setStartTime(startTime);
    day = daysRepository.save(day);
    // The scoring interval (minutes) is a property of the hunt, not of the cross.
    // The value sent with the cross is only used when no hunt exists (unit tests).
    List<HuntEntity> hunts = huntRepository.findAll();
    int scoringInterval = hunts.isEmpty() ? score.getInterval() : hunts.get(0).getHuntInterval();
    for (int i = 0; i < score.getDogNumbers().length; i++) {
      Optional<DogEntity> dogRetrieval = dogRepository.findById(score.getDogNumbers()[i]);
      if (dogRetrieval.isEmpty())
        continue;
      DogEntity dog = dogRetrieval.get();
      // One DailyScore per dog and day, created on the dog's first cross of that day.
      DailyScore dailyScore = dog.dailyScoreFor(score.getDay()).orElse(null);
      if (dailyScore == null) {
        dailyScore = dailyScoreRepository.save(new DailyScore(day, dog));
        dog.getScores().add(dailyScore);
      }
      Score s = new Score(score.getScores()[i], crossTime, false, score.getJudge(), dog.getNumber(), day.getDay());
      s = scoreRepository.save(s);
      dailyScore.addScore(s, startTime, scoringInterval);
      scoreRepository.save(s);
      dailyScoreRepository.save(dailyScore);
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
    removeScore(String.valueOf(dogNumber), scoreId);
  }

  public void removeScore(String dogNumber, Long scoreId) {
    DogEntity dog = dogRepository.findById(dogNumber)
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Dog does not exist.",
            Map.of("number", "Dog does not exist with this number.")));

    Score score = scoreRepository.findById(scoreId)
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Score does not exist.",
            Map.of("scoreId", "Score does not exist with this ID.")));

    DailyScore dailyScore = dog.getScores().stream()
        .filter(ds -> ds.getScores().contains(score))
        .findFirst()
        .orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "DailyScore does not exist.",
            Map.of("dailyScore", "DailyScore does not exist for this score.")));

    dailyScore.removeScore(score);
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
   * Correct a day's start time after crosses have been entered. Every cross of
   * that day is re-sorted into scoring intervals from the new time and the
   * dogs' points are recalculated.
   *
   * @param day       hunt day
   * @param startTime new start time
   * @throws TrackHoundsAPIException if the day has not started or a cross of
   *                                 that day is earlier than the new start time
   */
  public void changeStartTime(int day, LocalTime startTime) {
    Days days = daysRepository.findById(day).orElseThrow(() -> new TrackHoundsAPIException(HttpStatus.BAD_REQUEST,
        "Day has not started.", Map.of("day", "No cross has been entered for this day yet.")));
    if (startTime == null)
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", Map.of("startTime", "Start time cannot be empty."));
    List<Score> scores = scoreRepository.findByDayOrderByTimeAsc(day);
    if (!scores.isEmpty() && scores.get(0).getTime().isBefore(startTime)) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid Fields", Map.of("startTime",
          String.format("The first cross of day %d was at %s; the start time cannot be later than that.", day,
              scores.get(0).getTime())));
    }
    days.setStartTime(startTime);
    daysRepository.save(days);
    List<HuntEntity> hunts = huntRepository.findAll();
    int scoringInterval = hunts.isEmpty() ? 0 : hunts.get(0).getHuntInterval();
    for (DailyScore dailyScore : dailyScoreRepository.findAllByDayDay(day)) {
      dailyScore.rebucket(startTime, scoringInterval);
      dailyScoreRepository.save(dailyScore);
      DogEntity dog = dailyScore.getDog();
      if (dog != null) {
        dog.setPoints(calculateTotalPoints(dog));
        dogRepository.save(dog);
      }
    }
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
    int dayCount = huntRepository.findAll().stream().findFirst().map(HuntEntity::getHuntDays).orElse(4);
    if (scratch.getDay() < 1 || scratch.getDay() > dayCount)
      errs.put("day", String.format("Day must be between 1 and %d.", dayCount));
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
    scratch.setDogName(dog.getName());
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
    Optional<Scratch> scratch = scratchRepository.findById(id);
    if (scratch.isEmpty())
      return;
    String dogNumber = scratch.get().getDogNumber();
    scratchRepository.delete(scratch.get());
    boolean stillScratched = scratchRepository.findAll().stream().anyMatch(s -> dogNumber != null && dogNumber.equals(s.getDogNumber()));
    if (!stillScratched) {
      dogRepository.findById(dogNumber).ifPresent(dog -> {
        dog.setScratched(false);
        dogRepository.save(dog);
      });
    }
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
      Optional<DailyScore> forDay = dog.dailyScoreFor(day);
      if (forDay.isEmpty()) {
        continue;
      }
      DailyScore dailyScore = forDay.get();

      Map<String, Object> dogScore = new HashMap<>();
      dogScore.put("dogNumber", dog.getNumber());
      dogScore.put("dogName", dog.getName());
      dogScore.put("scratched", dog.isScratched());
      dogScore.put("owner", dog.getOwner());
      dogScore.put("sire", dog.getSire()); // Add sire
      dogScore.put("dam", dog.getDam()); // Add dam
      dogScore.put("stake", dog.getStake());
      dogScore.put("totalPoints", dailyScore.getDailyScore());
      dogScore.put("endurance", endurance(dailyScore.getDailyScore(), day));
      dogScore.put("dayTotal", dailyScore.getDailyScore() + endurance(dailyScore.getDailyScore(), day));
      dogScore.put("lastScore", dailyScore.getLastCross());
      dogScore.put("lastScorePoints", dailyScore.getAssociatedPoints());
      dogScores.add(dogScore);
    }

    return dogScores;
  }

  /**
   * Get the top highest scoring dogs for a specific day
   * 
   * @param day   The day number (1-4)
   * @param limit The maximum number of dogs to return
   * @return List of top dogs with their scores
   */
  public List<Map<String, Object>> getTopScoringDogsByDay(int day, int limit) {
    List<Map<String, Object>> dogScores = getDogScoresByDay(day);
    LocalTime startTime;
    final int interval;
    try {
      startTime = getStartTime(day);
      if (startTime == null) {
        return List.of();
      }
      interval = huntRepository.findAll().get(0).getHuntInterval();
    } catch (Exception e) {
      return List.of();
    }
    return dogScores.stream()
        .sorted((d1, d2) -> {
          // First, compare by total points (descending)
          int pointsComparison = Integer.compare(
              (Integer) d2.get("totalPoints"),
              (Integer) d1.get("totalPoints"));

          // If points are equal, sort by dog name (ascending)
          if (pointsComparison == 0) {
            LocalTime tifd1 = (LocalTime) d1.get("lastScore");
            LocalTime tifd2 = (LocalTime) d2.get("lastScore");
            int bucket1 = interval == 0 ? 0 : (int) java.time.Duration.between(startTime, tifd1).toMinutes() / interval;
            int bucket2 = interval == 0 ? 0 : (int) java.time.Duration.between(startTime, tifd2).toMinutes() / interval;
            if (bucket1 != bucket2) {
              return bucket1 > bucket2 ? -1 : 1;
            } else {
              if (tifd1.isAfter(tifd2)) {
                return -1;
              } else if (tifd1.isBefore(tifd2)) {
                return 1;
              } else {
                return -1
                    * Integer.compare((((Integer) d1.get("lastScorePoints"))), (((Integer) d2.get("lastScorePoints"))));
              }
            }
          }
          return pointsComparison;
        })
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
    return getTopScoringDogsOverall(10);
  }

  /**
   * Get the top scoring dogs overall (across all days) with a customizable limit
   * 
   * @param limit The maximum number of dogs to return
   * @return List of top scoring dogs limited to the specified count
   */
  public List<Map<String, Object>> getTopScoringDogsOverall(int limit) {
    List<DogEntity> allDogs = dogRepository.findAll();
    List<Map<String, Object>> dogScores = new ArrayList<>();
    final int interval;

    try {
      interval = huntRepository.findAll().get(0).getHuntInterval();
    } catch (Exception e) {
      return List.of();
    }

    for (DogEntity dog : allDogs) {
      int totalPoints = dog.getPoints(); // Using the existing points field

      Map<String, Object> dogScore = new HashMap<>();
      dogScore.put("dogNumber", dog.getNumber());
      dogScore.put("dogName", dog.getName());
      dogScore.put("scratched", dog.isScratched());
      dogScore.put("sire", dog.getSire());
      dogScore.put("dam", dog.getDam());
      dogScore.put("owner", dog.getOwner());
      dogScore.put("stake", dog.getStake());
      dogScore.put("totalPoints", totalPoints);

      for (DailyScore dailyScore : dog.getScores()) {
        dogScore.put("sdScore" + dailyScore.getDay().getDay(), dailyScore.getDailyScore());
      }

      // Add last score time for tie-breaking
      LocalTime lastScoreTime = null;
      int lastDay = 0;
      int lastScorePoints = 0;
      LocalTime startTime = null;

      if (dog.getScores() != null && !dog.getScores().isEmpty()) {
        for (DailyScore dailyScore : dog.getScores()) {
          if (dailyScore.getLastCross() != null &&
              (dailyScore.getDay().getDay() > lastDay ||
                  (dailyScore.getDay().getDay() == lastDay &&
                      dailyScore.getLastCross().isAfter(lastScoreTime)))) {
            lastScoreTime = dailyScore.getLastCross();
            lastDay = dailyScore.getDay().getDay();
            lastScorePoints = dailyScore.getAssociatedPoints();
            startTime = dailyScore.getDay().getStartTime();
          }
        }
      }

      dogScore.put("lastScore", lastScoreTime);
      dogScore.put("lastScoreDay", lastDay);
      dogScore.put("lastScorePoints", lastScorePoints);
      dogScore.put("startTime", startTime);

      dogScores.add(dogScore);
    }

    // Sort using the improved tie-breaking logic
    return dogScores.stream()
        .sorted((d1, d2) -> {
          // First, compare by total points (descending)
          int pointsComparison = Integer.compare(
              (Integer) d2.get("totalPoints"),
              (Integer) d1.get("totalPoints"));

          // If points are equal, sort by last score day (latest first)
          if (pointsComparison == 0) {
            Integer day1 = (Integer) d1.get("lastScoreDay");
            Integer day2 = (Integer) d2.get("lastScoreDay");

            if (!day1.equals(day2)) {
              return day2.compareTo(day1); // Later day wins
            }

            // If days are equal, use the same time-bucket logic as daily methods
            LocalTime tifd1 = (LocalTime) d1.get("lastScore");
            LocalTime tifd2 = (LocalTime) d2.get("lastScore");

            // Handle null cases
            if (tifd1 == null && tifd2 == null) {
              return DogEntity.NUMBER_ORDER.compare(String.valueOf(d1.get("dogNumber")), String.valueOf(d2.get("dogNumber")));
            } else if (tifd1 == null) {
              return 1; // Null times come after non-null times
            } else if (tifd2 == null) {
              return -1; // Null times come after non-null times
            }

            // Use time buckets for comparison
            LocalTime startTime1 = (LocalTime) d1.get("startTime");
            LocalTime startTime2 = (LocalTime) d2.get("startTime");

            if (startTime1 != null && startTime2 != null) {
              int bucket1 = interval == 0 ? 0
                  : (int) java.time.Duration.between(startTime1, tifd1).toMinutes() / interval;
              int bucket2 = interval == 0 ? 0
                  : (int) java.time.Duration.between(startTime2, tifd2).toMinutes() / interval;

              if (bucket1 != bucket2) {
                return bucket1 > bucket2 ? -1 : 1;
              } else {
                if (tifd1.isAfter(tifd2)) {
                  return -1;
                } else if (tifd1.isBefore(tifd2)) {
                  return 1;
                } else {
                  return -1 * Integer.compare(
                      (Integer) d1.get("lastScorePoints"),
                      (Integer) d2.get("lastScorePoints"));
                }
              }
            }

            // Fall back to time comparison if startTime is null
            return tifd2.compareTo(tifd1);
          }

          return pointsComparison;
        })
        .limit(limit)
        .collect(Collectors.toList());
  }

  /**
   * Get the top scoring dogs of a specific stake type with a limit
   * 
   * @param stakeType The stake type to filter by (ALL_AGE or DERBY)
   * @param limit     The maximum number of dogs to return
   * @return List of top scoring dogs of the specified stake type
   */
  public List<Map<String, Object>> getTopScoringDogsByStakeType(StakeType stakeType, int limit) {
    List<DogEntity> allDogs = dogRepository.findAll();
    List<Map<String, Object>> dogScores = new ArrayList<>();
    final int interval;

    try {
      interval = huntRepository.findAll().get(0).getHuntInterval();
    } catch (Exception e) {
      return List.of();
    }

    // Filter dogs by stake type and calculate total points
    for (DogEntity dog : allDogs) {
      if (dog.getStake() == stakeType) {
        int totalPoints = dog.getPoints(); // Using the existing points field

        Map<String, Object> dogScore = new HashMap<>();
        dogScore.put("dogNumber", dog.getNumber());
        dogScore.put("dogName", dog.getName());
      dogScore.put("scratched", dog.isScratched());
        dogScore.put("owner", dog.getOwner());
        dogScore.put("sire", dog.getSire());
        dogScore.put("dam", dog.getDam());
        dogScore.put("stake", dog.getStake());
        dogScore.put("totalPoints", totalPoints);

        for (DailyScore dailyScore : dog.getScores()) {
          dogScore.put("sdScore" + dailyScore.getDay().getDay(), dailyScore.getDailyScore());
        }

        // Add last score time for tie-breaking
        LocalTime lastScoreTime = null;
        int lastDay = 0;
        int lastScorePoints = 0;
        LocalTime startTime = null;

        if (dog.getScores() != null && !dog.getScores().isEmpty()) {
          for (DailyScore dailyScore : dog.getScores()) {
            if (dailyScore.getLastCross() != null &&
                (dailyScore.getDay().getDay() > lastDay ||
                    (dailyScore.getDay().getDay() == lastDay &&
                        dailyScore.getLastCross().isAfter(lastScoreTime)))) {
              lastScoreTime = dailyScore.getLastCross();
              lastDay = dailyScore.getDay().getDay();
              lastScorePoints = dailyScore.getAssociatedPoints();
              startTime = dailyScore.getDay().getStartTime();
            }
          }
        }

        dogScore.put("lastScore", lastScoreTime);
        dogScore.put("lastScoreDay", lastDay);
        dogScore.put("lastScorePoints", lastScorePoints);
        dogScore.put("startTime", startTime);

        dogScores.add(dogScore);
      }
    }

    // Sort using the same tie-breaking logic as getTopScoringDogsOverall
    return dogScores.stream()
        .sorted((d1, d2) -> {
          // First, compare by total points (descending)
          int pointsComparison = Integer.compare(
              (Integer) d2.get("totalPoints"),
              (Integer) d1.get("totalPoints"));

          // If points are equal, sort by last score day (latest first)
          if (pointsComparison == 0) {
            Integer day1 = (Integer) d1.get("lastScoreDay");
            Integer day2 = (Integer) d2.get("lastScoreDay");

            if (!day1.equals(day2)) {
              return day2.compareTo(day1); // Later day wins
            }

            // If days are equal, use the same time-bucket logic as daily methods
            LocalTime tifd1 = (LocalTime) d1.get("lastScore");
            LocalTime tifd2 = (LocalTime) d2.get("lastScore");

            // Handle null cases
            if (tifd1 == null && tifd2 == null) {
              return DogEntity.NUMBER_ORDER.compare(String.valueOf(d1.get("dogNumber")), String.valueOf(d2.get("dogNumber")));
            } else if (tifd1 == null) {
              return 1; // Null times come after non-null times
            } else if (tifd2 == null) {
              return -1; // Null times come after non-null times
            }

            // Use time buckets for comparison
            LocalTime startTime1 = (LocalTime) d1.get("startTime");
            LocalTime startTime2 = (LocalTime) d2.get("startTime");

            if (startTime1 != null && startTime2 != null) {
              int bucket1 = interval == 0 ? 0
                  : (int) java.time.Duration.between(startTime1, tifd1).toMinutes() / interval;
              int bucket2 = interval == 0 ? 0
                  : (int) java.time.Duration.between(startTime2, tifd2).toMinutes() / interval;

              if (bucket1 != bucket2) {
                return bucket1 > bucket2 ? -1 : 1;
              } else {
                if (tifd1.isAfter(tifd2)) {
                  return -1;
                } else if (tifd1.isBefore(tifd2)) {
                  return 1;
                } else {
                  return -1 * Integer.compare(
                      (Integer) d1.get("lastScorePoints"),
                      (Integer) d2.get("lastScorePoints"));
                }
              }
            }

            // Fall back to time comparison if startTime is null
            return tifd2.compareTo(tifd1);
          }

          return pointsComparison;
        })
        .limit(limit)
        .collect(Collectors.toList());
  }

  /**
   * Get the top 10 highest scoring dogs of a specific stake type
   * 
   * @param stakeType The stake type to filter by (ALL_AGE or DERBY)
   * @return List of top 10 dogs with their scores of the specified stake type
   */
  public List<Map<String, Object>> getTop10ScoringDogsByStakeType(StakeType stakeType) {
    return getTopScoringDogsByStakeType(stakeType, 10);
  }

  /**
   * Get the top scoring dogs of a specific stake type for a specific day with a
   * limit
   * 
   * @param day       The day number (1-4)
   * @param stakeType The stake type to filter by (ALL_AGE or DERBY)
   * @param limit     The maximum number of dogs to return
   * @return List of top scoring dogs for the specified day and stake type
   */
  public List<Map<String, Object>> getTopScoringDogsByDayAndStakeType(int day, StakeType stakeType, int limit) {
    List<Map<String, Object>> allDogScores = getDogScoresByDay(day);
    LocalTime startTime;
    int interval;

    try {
      startTime = getStartTime(day);
      if (startTime == null) {
        return List.of();
      }
      interval = huntRepository.findAll().get(0).getHuntInterval();
    } catch (Exception e) {
      return List.of();
    }

    // Filter by stake type
    List<Map<String, Object>> filteredDogScores = allDogScores.stream()
        .filter(dogScore -> stakeType.equals(dogScore.get("stake")))
        .collect(Collectors.toList());

    // Sort by total points and limit the results
    return filteredDogScores.stream()
        .sorted((d1, d2) -> {
          // First, compare by total points (descending)
          int pointsComparison = Integer.compare(
              (Integer) d2.get("totalPoints"),
              (Integer) d1.get("totalPoints"));

          // If points are equal, apply the same tie-breaking logic as
          // getTopScoringDogsByDay
          if (pointsComparison == 0) {
            LocalTime tifd1 = (LocalTime) d1.get("lastScore");
            LocalTime tifd2 = (LocalTime) d2.get("lastScore");
            int bucket1 = interval == 0 ? 0 : (int) java.time.Duration.between(startTime, tifd1).toMinutes() / interval;
            int bucket2 = interval == 0 ? 0 : (int) java.time.Duration.between(startTime, tifd2).toMinutes() / interval;
            if (bucket1 != bucket2) {
              return bucket1 > bucket2 ? -1 : 1;
            }
            if (tifd1.isAfter(tifd2)) {
              return -1;
            } else if (tifd1.isBefore(tifd2)) {
              return 1;
            } else {
              return -1
                  * Integer.compare((((Integer) d1.get("lastScorePoints"))),
                      (((Integer) d2.get("lastScorePoints"))));
            }
          }
          return pointsComparison;
        })
        .limit(limit)
        .collect(Collectors.toList());
  }

  /**
   * Get the top 10 highest scoring dogs of a specific stake type for a specific
   * day
   * 
   * @param day       The day number (1-4)
   * @param stakeType The stake type to filter by (ALL_AGE or DERBY)
   * @return List of top 10 dogs with their scores for the specified day and stake
   *         type
   */
  public List<Map<String, Object>> getTop10ScoringDogsByDayAndStakeType(int day, StakeType stakeType) {
    return getTopScoringDogsByDayAndStakeType(day, stakeType, 10);
  }

  /**
   * Get all scores for a specific dog
   * 
   * @param dogNumber Number of the dog
   * @return List of scores for the specified dog
   */
  public List<Score> getScoresByDogNumber(int dogNumber) {
    return getScoresByDogNumber(String.valueOf(dogNumber));
  }

  public List<Score> getScoresByDogNumber(String dogNumber) {
    // Verify the dog exists
    if (!dogRepository.existsById(dogNumber)) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Dog does not exist.",
          Map.of("dogNumber", "Dog does not exist with this number."));
    }

    return scoreRepository.findByDogNumberOrderByDayAscTimeAsc(dogNumber);
  }

  /**
   * Get all scores for a specific judge
   * 
   * @param judgeNumber Number of the judge
   * @return List of scores given by the specified judge
   */
  public List<Score> getScoresByJudgeNumber(int judgeNumber) {
    // Verify the judge exists
    if (!judgeRepository.existsById(judgeNumber)) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Judge does not exist.",
          Map.of("judgeNumber", "Judge does not exist with this number."));
    }

    return scoreRepository.findByJudgeNumberOrderByDayAscTimeAsc(judgeNumber);
  }

  /**
   * Get all scores for a specific dog on a specific day
   * 
   * @param dogNumber Number of the dog
   * @param day       Day of the hunt (1-4)
   * @return List of scores for the specified dog on the specified day
   */
  public List<Score> getScoresByDogNumberAndDay(int dogNumber, int day) {
    return getScoresByDogNumberAndDay(String.valueOf(dogNumber), day);
  }

  public List<Score> getScoresByDogNumberAndDay(String dogNumber, int day) {
    // Verify the dog exists
    if (!dogRepository.existsById(dogNumber)) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Dog does not exist.",
          Map.of("dogNumber", "Dog does not exist with this number."));
    }

    // Verify the day exists
    if (!daysRepository.existsById(day)) {
      return List.of(); // Return empty list if day doesn't exist
    }

    return scoreRepository.findByDogNumberAndDayOrderByTimeAsc(dogNumber, day);
  }

  /**
   * Get all scores for a specific judge on a specific day
   * 
   * @param judgeNumber Number of the judge
   * @param day         Day of the hunt (1-4)
   * @return List of scores given by the specified judge on the specified day
   */
  public List<Score> getScoresByJudgeNumberAndDay(int judgeNumber, int day) {
    // Verify the judge exists
    if (!judgeRepository.existsById(judgeNumber)) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Judge does not exist.",
          Map.of("judgeNumber", "Judge does not exist with this number."));
    }

    // Verify the day exists
    if (!daysRepository.existsById(day)) {
      return List.of(); // Return empty list if day doesn't exist
    }

    return scoreRepository.findByJudgeNumberAndDayOrderByTimeAsc(judgeNumber, day);
  }

  /**
   * Get all scores
   * 
   * @return List of all scores
   */
  public List<Score> getScores() {
    return scoreRepository.findAllByOrderByDayAscTimeAsc();
  }

  /**
   * Get all scores for a specific day
   * 
   * @param day Day of the hunt (1-4)
   * @return List of scores for the specified day
   */
  public List<Score> getScoresByDay(int day) {
    // Verify the day exists
    if (!daysRepository.existsById(day)) {
      return List.of(); // Return empty list if day doesn't exist
    }

    return scoreRepository.findByDayOrderByTimeAsc(day);
  }
}
