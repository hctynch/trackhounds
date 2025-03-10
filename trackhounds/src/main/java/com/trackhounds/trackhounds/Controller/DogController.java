package com.trackhounds.trackhounds.Controller;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Service.DogService;

/**
 * Dog Controller
 */
@RestController
@CrossOrigin("*")
@RequestMapping("/dogs")
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
}
