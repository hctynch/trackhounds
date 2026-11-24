package com.trackhounds.trackhounds.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Entity.Award;
import com.trackhounds.trackhounds.Service.AwardService;

/**
 * Special awards given to dogs ("Best Mouth", "Classiest Hound").
 */
@RestController
@CrossOrigin("*")
@RequestMapping("/awards")
public class AwardController {

  private final AwardService awardService;

  public AwardController(AwardService awardService) {
    this.awardService = awardService;
  }

  /** Every award with the dog it went to. */
  @GetMapping
  public List<Map<String, Object>> getAwards() {
    return awardService.getAwards();
  }

  /** Give an award to a dog: {@code {"title": "...", "dogNumber": "...", "notes": "..."}}. */
  @PostMapping
  public Map<String, Object> postAward(@RequestBody Award award) {
    return awardService.createAward(award);
  }

  /** Change an award's title, dog or notes. */
  @PutMapping("/{id}")
  public Map<String, Object> putAward(@PathVariable("id") Long id, @RequestBody Award award) {
    return awardService.updateAward(id, award);
  }

  /** Remove an award. */
  @DeleteMapping("/{id}")
  public void deleteAward(@PathVariable("id") Long id) {
    awardService.deleteAward(id);
  }
}
