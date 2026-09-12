package com.trackhounds.trackhounds.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Service.ReportService;

/**
 * Summaries for printed sheets; see {@link ReportService}.
 */
@RestController
@CrossOrigin("*")
@RequestMapping("/reports")
public class ReportController {

  @Autowired
  private ReportService reportService;

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
}
