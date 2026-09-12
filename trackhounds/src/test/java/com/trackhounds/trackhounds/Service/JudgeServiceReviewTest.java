package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;

import jakarta.transaction.Transactional;

@SpringBootTest
@ActiveProfiles("test")
class JudgeServiceReviewTest {

  @Autowired
  private JudgeService judgeService;

  @Test
  @Transactional
  void judgeNumberMustBePositive() {
    TrackHoundsAPIException failure = assertThrows(TrackHoundsAPIException.class,
        () -> judgeService.addJudge(new JudgeEntity(0, null, "Zero")));
    assertEquals("Number must be greater than 0.", failure.getFields().get("number"));
  }
}
