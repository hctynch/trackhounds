package com.trackhounds.trackhounds.Controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Service.ReportDatasetService;
import com.trackhounds.trackhounds.Service.ReportLayoutService;
import com.trackhounds.trackhounds.Service.ReportService;

/**
 * Summaries for printed sheets ({@link ReportService}), the row sets the
 * report builder composes from ({@link ReportDatasetService}) and the saved
 * layouts ({@link ReportLayoutService}).
 */
@RestController
@CrossOrigin("*")
@RequestMapping("/reports")
public class ReportController {

  private final ReportService reportService;
  private final ReportDatasetService datasets;
  private final ReportLayoutService layouts;

  public ReportController(ReportService reportService, ReportDatasetService datasets, ReportLayoutService layouts) {
    this.reportService = reportService;
    this.datasets = datasets;
    this.layouts = layouts;
  }

  /** What each judge recorded, per day. */
  @GetMapping("/judges")
  public List<Map<String, Object>> getJudgeSummary() {
    return reportService.getJudgeSummary();
  }

  /** The one-page hunt summary; 404 when no hunt exists. */
  @GetMapping("/hunt-summary")
  public Map<String, Object> getHuntSummary() {
    return reportService.getHuntSummary();
  }

  /**
   * A dataset for the report builder: its column catalogue and rows.
   *
   * @param name  dogs, scores, scratches or judges
   * @param day   only this day (ranking for the day in {@code dogs})
   * @param stake ALL_AGE or DERBY; anything else means every dog
   * @param limit at most this many rows
   * @param dog   only this dog (scores)
   * @param judge only this judge (scores, scratches)
   */
  @GetMapping("/datasets/{name}")
  public Map<String, Object> dataset(@PathVariable("name") String name,
      @RequestParam(value = "day", required = false) Integer day,
      @RequestParam(value = "stake", required = false) String stake,
      @RequestParam(value = "limit", required = false) Integer limit,
      @RequestParam(value = "dog", required = false) String dog,
      @RequestParam(value = "judge", required = false) Integer judge) {
    StakeType stakeType = "ALL_AGE".equalsIgnoreCase(stake) ? StakeType.ALL_AGE : "DERBY".equalsIgnoreCase(stake) ? StakeType.DERBY : null;
    return datasets.dataset(name, day, stakeType, limit, dog, judge);
  }

  @GetMapping("/custom")
  public List<Map<String, Object>> customLayouts() throws IOException {
    return layouts.list();
  }

  @GetMapping("/custom/{id}")
  public Map<String, Object> customLayout(@PathVariable("id") String id) throws IOException {
    return layouts.get(id);
  }

  @PutMapping("/custom/{id}")
  public Map<String, Object> saveLayout(@PathVariable("id") String id, @RequestBody Map<String, Object> layout) throws IOException {
    return layouts.save(id, layout);
  }

  @DeleteMapping("/custom/{id}")
  public void deleteLayout(@PathVariable("id") String id) throws IOException {
    layouts.delete(id);
  }
}
