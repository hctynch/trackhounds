package com.trackhounds.trackhounds.Controller;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Dto.CrossInfoRequest;
import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Service.DogService;

/**
 * Dog Controller
 */
@RestController
@RequestMapping("/api/dogs")
public class DogController {

  /**
   * Dog service reference
   */
  @Autowired
  private DogService dogService;

  /**
   * Get all dogs
   * 
   * @return a list of all dogs
   */
  @GetMapping
  public List<DogEntity> getAllDogs() {
    return dogService.getDogs();
  }

  /**
   * Total number of dogs
   * 
   * @return total number of dogs
   */
  @GetMapping("/total")
  public int getMethodName() {
    return dogService.getDogTotal();
  }

  /**
   * Get a specific dog
   * 
   * @param number Number of dog
   * @return dog specified by number
   */
  @GetMapping("/{number}")
  public DogEntity getDog(@PathVariable("number") int number) {
    return dogService.getDogByNumber(number);
  }

  /**
   * Create a list of dogs
   * 
   * @param entities Dogs to create
   */
  @PostMapping
  public void postDogs(@RequestBody List<DogEntity> entities) {
    dogService.createDogs(entities);
  }

  /**
   * Edit a dog
   * 
   * @param entity Editied Dog
   */
  @PutMapping
  public void putDog(@RequestBody DogEntity entity) {
    dogService.editDog(entity);
  }

  /**
   * Delete a dog by number
   * 
   * @param number Number of dog
   */
  @DeleteMapping("/{number}")
  public List<DogEntity> deleteDog(@PathVariable("number") int number) {
    return dogService.deleteDog(number);
  }

  /**
   * Create a score
   * 
   * @param score Score to create
   */
  @PostMapping("/scores")
  public void postScores(@RequestBody ScoreDto score) {
    dogService.createScore(score);
  }

  /**
   * Delete a score by dog number and score ID
   * 
   * @param dogNumber Dog number
   * @param scoreId   Score ID
   */
  @DeleteMapping("/{dogNumber}/scores/{scoreId}")
  public void deleteScore(@PathVariable("dogNumber") int dogNumber, @PathVariable("scoreId") Long scoreId) {
    dogService.removeScore(dogNumber, scoreId);
  }

  /**
   * Get the start time of a day
   * 
   * @param day Day
   * @return Start time of the day
   */
  @GetMapping("/day/{day}")
  public LocalTime getStartTime(@PathVariable("day") int day) {
    return dogService.getStartTime(day);
  }

  /**
   * Get all scratches
   * 
   * @return List of scratches
   */
  @GetMapping("/scratches")
  public List<Scratch> getScratches() {
    return dogService.getScratches();
  }

  /**
   * Create a scratch
   * 
   * @param scratch Scratch to create
   */
  @PostMapping("/scratches")
  public void postScratch(@RequestBody Scratch scratch) {
    dogService.scratchDog(scratch);
  }

  /**
   * Delete a scratch by ID
   * 
   * @param id ID of scratch
   */
  @DeleteMapping("/scratches/{id}")
  public void deleteScratch(@PathVariable("id") Long id) {
    dogService.deleteScratch(id);
  }

  /**
   * Get dog scores by day
   * 
   * @param day The day number (1-4)
   * @return List of dogs with their scores for the specified day
   */
  @GetMapping("/scores/day/{day}")
  public List<Map<String, Object>> getDogScoresByDay(@PathVariable("day") int day) {
    return dogService.getDogScoresByDay(day);
  }

  /**
   * Get the top scoring dogs for a specific day with a limit
   * 
   * @param day   The day number (1-4)
   * @param limit The maximum number of dogs to return
   * @return List of top scoring dogs for the specified day
   */
  @GetMapping("/scores/day/{day}/top/{limit}")
  public List<Map<String, Object>> getTopScoringDogsByDay(
      @PathVariable("day") int day,
      @PathVariable("limit") int limit) {
    return dogService.getTopScoringDogsByDay(day, limit);
  }

  /**
   * Get the top 10 highest scoring dogs for a specific day
   * 
   * @param day The day number (1-4)
   * @return List of top 10 dogs with their scores for the specified day
   */
  @GetMapping("/scores/day/{day}/top10")
  public List<Map<String, Object>> getTop10ScoringDogsByDay(@PathVariable("day") int day) {
    return dogService.getTop10ScoringDogsByDay(day);
  }

  /**
   * Get the top 10 highest scoring dogs overall (across all days)
   * 
   * @return List of top 10 dogs with their total scores
   */
  @GetMapping("/scores/top10/overall")
  public List<Map<String, Object>> getTop10ScoringDogsOverall() {
    return dogService.getTop10ScoringDogsOverall();
  }

  /**
   * Get the top scoring dogs overall (across all days) with a customizable limit
   * 
   * @param limit The maximum number of dogs to return
   * @return List of top scoring dogs limited to the specified count
   */
  @GetMapping("/scores/top/{limit}/overall")
  public List<Map<String, Object>> getTopScoringDogsOverall(@PathVariable("limit") int limit) {
    return dogService.getTopScoringDogsOverall(limit);
  }

  /**
   * Get the top scoring dogs of a specific stake type with a limit
   * 
   * @param stakeType The stake type (ALL_AGE or DERBY)
   * @param limit     The maximum number of dogs to return
   * @return List of top scoring dogs of the specified stake type
   */
  @GetMapping("/scores/stake/{stakeType}/top/{limit}")
  public List<Map<String, Object>> getTopScoringDogsByStakeType(
      @PathVariable("stakeType") String stakeType,
      @PathVariable("limit") int limit) {
    try {
      StakeType stake = StakeType.valueOf(stakeType.toUpperCase());
      return dogService.getTopScoringDogsByStakeType(stake, limit);
    } catch (IllegalArgumentException e) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid stake type: " + stakeType,
          Map.of("stake", stakeType));
    }
  }

  /**
   * Get the top 10 highest scoring dogs of a specific stake type
   * 
   * @param stakeType The stake type (ALL_AGE or DERBY)
   * @return List of top 10 dogs with their scores of the specified stake type
   */
  @GetMapping("/scores/stake/{stakeType}/top10")
  public List<Map<String, Object>> getTop10ScoringDogsByStakeType(
      @PathVariable("stakeType") String stakeType) {
    try {
      StakeType stake = StakeType.valueOf(stakeType.toUpperCase());
      return dogService.getTop10ScoringDogsByStakeType(stake);
    } catch (IllegalArgumentException e) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid stake type: " + stakeType,
          Map.of("stake", stakeType));
    }
  }

  /**
   * Get the top scoring dogs of a specific stake type for a specific day with a
   * limit
   * 
   * @param day       The day number (1-4)
   * @param stakeType The stake type (ALL_AGE or DERBY)
   * @param limit     The maximum number of dogs to return
   * @return List of top scoring dogs for the specified day and stake type
   */
  @GetMapping("/scores/day/{day}/stake/{stakeType}/top/{limit}")
  public List<Map<String, Object>> getTopScoringDogsByDayAndStakeType(
      @PathVariable("day") int day,
      @PathVariable("stakeType") String stakeType,
      @PathVariable("limit") int limit) {
    try {
      StakeType stake = StakeType.valueOf(stakeType.toUpperCase());
      return dogService.getTopScoringDogsByDayAndStakeType(day, stake, limit);
    } catch (IllegalArgumentException e) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid stake type: " + stakeType,
          Map.of("stake", stakeType));
    }

  }

  /**
   * Get the top 10 highest scoring dogs of a specific stake type for a specific
   * day
   * 
   * @param day       The day number (1-4)
   * @param stakeType The stake type (ALL_AGE or DERBY)
   * @return List of top 10 dogs with their scores for the specified day and stake
   *         type
   */
  @GetMapping("/scores/day/{day}/stake/{stakeType}/top10")
  public List<Map<String, Object>> getTop10ScoringDogsByDayAndStakeType(
      @PathVariable("day") int day,
      @PathVariable("stakeType") String stakeType) {
    try {
      StakeType stake = StakeType.valueOf(stakeType.toUpperCase());
      return dogService.getTop10ScoringDogsByDayAndStakeType(day, stake);
    } catch (IllegalArgumentException e) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Invalid stake type: " + stakeType,
          Map.of("stake", stakeType));
    }
  }

  /**
   * Get all scores for a specific dog
   * 
   * @param dogNumber Number of the dog
   * @return List of scores for the specified dog
   */
  @GetMapping("/{dogNumber}/scores")
  public List<Score> getScoresByDogNumber(@PathVariable("dogNumber") int dogNumber) {
    return dogService.getScoresByDogNumber(dogNumber);
  }

  /**
   * Get all scores for a specific judge
   * 
   * @param judgeNumber Number of the judge
   * @return List of scores given by the specified judge
   */
  @GetMapping("/scores/judge/{judgeNumber}")
  public List<Score> getScoresByJudgeNumber(@PathVariable("judgeNumber") int judgeNumber) {
    return dogService.getScoresByJudgeNumber(judgeNumber);
  }

  /**
   * Get all scores for a specific dog on a specific day
   * 
   * @param dogNumber Number of the dog
   * @param day       Day of the hunt (1-4)
   * @return List of scores for the specified dog on the specified day
   */
  @GetMapping("/{dogNumber}/scores/day/{day}")
  public List<Score> getScoresByDogNumberAndDay(
      @PathVariable("dogNumber") int dogNumber,
      @PathVariable("day") int day) {
    return dogService.getScoresByDogNumberAndDay(dogNumber, day);
  }

  /**
   * Get all scores for a specific judge on a specific day
   * 
   * @param judgeNumber Number of the judge
   * @param day         Day of the hunt (1-4)
   * @return List of scores given by the specified judge on the specified day
   */
  @GetMapping("/scores/judge/{judgeNumber}/day/{day}")
  public List<Score> getScoresByJudgeNumberAndDay(
      @PathVariable("judgeNumber") int judgeNumber,
      @PathVariable("day") int day) {
    return dogService.getScoresByJudgeNumberAndDay(judgeNumber, day);
  }

  /**
   * Get all scores
   * 
   * @return List of all scores
   */
  @GetMapping("/scores")
  public List<Score> getAllScores() {
    return dogService.getScores();
  }

  /**
   * Get all scores for a specific day
   * 
   * @param day Day of the hunt (1-4)
   * @return List of scores for the specified day
   */
  @GetMapping("/scores/{day}")
  public List<Score> getScoresByDay(@PathVariable("day") int day) {
    return dogService.getScoresByDay(day);
  }

  /**
   * Get cross information with calculated points for dogs
   * 
   * @param crossRequest Object containing dog numbers, starting points, interval,
   *                     and stake type
   * @return List of dogs in cross with their assigned points
   */
  @PostMapping("/cross-info")
  public List<Map<String, Object>> getCrossInfo(@RequestBody CrossInfoRequest crossRequest) {
    return dogService.getCrossInfo(
        crossRequest.getDogNumbers(),
        crossRequest.getStartingPoints(),
        crossRequest.getInterval(),
        crossRequest.getStakeType());
  }
}
