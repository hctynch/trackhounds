package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DailyScore;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DailyScoreRepository;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;
import com.trackhounds.trackhounds.Repository.ScoreRepository;

import jakarta.transaction.Transactional;

/**
 * DogService Test class
 */
@SpringBootTest
@ActiveProfiles("test")
public class DogServiceTest {

  /**
   * Repository Reference
   */
  @Autowired
  private DogRepository dogRepository;

  @Autowired
  private DaysRepository daysRepository;

  @Autowired
  private DailyScoreRepository dailyScoreRepository;

  @Autowired
  private JudgeRepository judgeRepository;

  @Autowired
  private ScoreRepository scoreRepository;
  /**
   * Service
   */
  @Autowired
  private DogService dogService;

  private JudgeEntity j;

  /**
   * Clear repository
   */
  @BeforeEach
  void setUp() {
    dogRepository.deleteAll();
    daysRepository.deleteAll();
    this.j = judgeRepository.save(new JudgeEntity(1, "PIN", "Judgy Judge"));
  }

  /**
   * Test creating dogs
   */
  @Test
  @Transactional
  void testCreateDogs() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)));

    DogEntity emptyName = new DogEntity(4, null, null, "owner", "sire", "dam");
    DogEntity emptyStake = new DogEntity(4, "Name", null, "owner", "sire", "dam");
    assertAll("Invalid", () -> assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(List.of(dog1))),
        () -> assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(List.of(emptyName))),
        () -> assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(List.of(emptyStake))));
  }

  /**
   * Test deleting dogs
   */
  @Test
  @Transactional
  void testDeleteDog() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)));

    assertAll("Delete", () -> assertDoesNotThrow(() -> dogService.deleteDog(1)),
        () -> assertEquals(2, dogService.getDogTotal()));
  }

  /**
   * Test editing dogs
   */
  @Test
  @Transactional
  void testEditDog() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)));

    DogEntity editDog1 = new DogEntity(1, "Edited Name", StakeType.DERBY, "Edited", "ES", "ED");
    assertAll("Edit dogs", () -> assertDoesNotThrow(() -> dogService.editDog(editDog1)),
        () -> assertEquals("Edited Name", dogService.getDogByNumber(1).getName()),
        () -> assertEquals(StakeType.DERBY, dogService.getDogByNumber(1).getStake()),
        () -> assertEquals("Edited", dogService.getDogByNumber(1).getOwner()),
        () -> assertEquals("ES", dogService.getDogByNumber(1).getSire()),
        () -> assertEquals("ED", dogService.getDogByNumber(1).getDam()));
  }

  /**
   * Test getting dogs by number
   */
  @Test
  @Transactional
  void testGetDogByNumber() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)));

    assertDoesNotThrow(() -> {
      dogService.getDogByNumber(1);
    });
    assertThrows(TrackHoundsAPIException.class, () -> dogService.getDogByNumber(4));
    DogEntity gotDog1 = dogService.getDogByNumber(1);
    assertAll("Get Dog by Number", () -> assertNotNull(gotDog1),
        () -> assertEquals(dog1.getNumber(), gotDog1.getNumber()),
        () -> assertEquals(dog1.getName(), gotDog1.getName()),
        () -> assertEquals(dog1.getStake(), gotDog1.getStake()),
        () -> assertEquals(dog1.getOwner(), gotDog1.getOwner()),
        () -> assertEquals(dog1.getSire(), gotDog1.getSire()),
        () -> assertEquals(dog1.getDam(), gotDog1.getDam()));
  }

  /**
   * Test get all dogs
   */
  @Test
  @Transactional
  void testGetDogs() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)),
        () -> assertNotEquals(dog2.hashCode(), dog3.hashCode()),
        () -> assertFalse(dog2.equals(dog3)));

    List<DogEntity> dogs = dogService.getDogs();
    assertAll("Got all dogs", () -> assertEquals(3, dogs.size()),
        () -> assertTrue(dogs.contains(dog1)));

  }

  @Test
  @Transactional
  void createScore() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)));

    ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 }, 10);
    assertAll("Create Score", () -> {
      assertDoesNotThrow(() -> dogService.createScore(score));
      assertEquals(1, dogService.getDogByNumber(1).getScores().size());
      List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
      assertEquals(1, dailyScores.size());
      assertEquals(1, dailyScores.get(0).getTimeBucketScores().size());
      assertEquals(1, dailyScores.get(0).getHighestScores().size());
      assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore().getPoints());
      assertEquals(35, dogService.getDogByNumber(1).getPoints());
      List<DailyScore> dailyScores2 = dogService.getDogByNumber(2).getScores();
      assertEquals(1, dailyScores2.size());
      assertEquals(1, dailyScores2.get(0).getTimeBucketScores().size());
      assertEquals(1, dailyScores2.get(0).getHighestScores().size());
      assertEquals(30, dailyScores2.get(0).getHighestScores().iterator().next().getScore().getPoints());
      assertEquals(30, dogService.getDogByNumber(2).getPoints());
      List<DailyScore> dailyScores3 = dogService.getDogByNumber(3).getScores();
      assertEquals(1, dailyScores3.size());
      assertEquals(1, dailyScores3.get(0).getTimeBucketScores().size());
      assertEquals(1, dailyScores3.get(0).getHighestScores().size());
      assertEquals(25, dailyScores3.get(0).getHighestScores().iterator().next().getScore().getPoints());
      assertEquals(25, dogService.getDogByNumber(3).getPoints());
    });

    ScoreDto score2 = new ScoreDto(1, "05:30:00", 1, "05:42:00", new int[] { 3, 2, 1 }, new int[] { 35, 30, 25 }, 10);

    assertAll("Add additional Score", () -> {
      assertDoesNotThrow(() -> dogService.createScore(score2));
      assertEquals(1, dogService.getDogByNumber(1).getScores().size());
      List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
      assertEquals(1, dailyScores.size());
      assertEquals(2, dailyScores.get(0).getTimeBucketScores().size());
      assertEquals(1, dailyScores.get(0).getHighestScores().size());
      assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore().getPoints());
      assertEquals(35, dogService.getDogByNumber(1).getPoints());
      List<DailyScore> dailyScores2 = dogService.getDogByNumber(2).getScores();
      assertEquals(1, dailyScores2.size());
      assertEquals(2, dailyScores2.get(0).getTimeBucketScores().size());
      assertEquals(1, dailyScores2.get(0).getHighestScores().size());
      assertEquals(30, dailyScores2.get(0).getHighestScores().iterator().next().getScore().getPoints());
      assertEquals(30, dogService.getDogByNumber(2).getPoints());
      List<DailyScore> dailyScores3 = dogService.getDogByNumber(3).getScores();
      assertEquals(1, dailyScores3.size());
      assertEquals(2, dailyScores3.get(0).getTimeBucketScores().size());
      assertEquals(1, dailyScores3.get(0).getHighestScores().size());
      assertEquals(35, dailyScores3.get(0).getHighestScores().iterator().next().getScore().getPoints());
      assertEquals(35, dogService.getDogByNumber(3).getPoints());

      ScoreDto score3 = new ScoreDto(1, "05:30:00", 1, "05:35:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 }, 10);

      assertAll("Add score in different interval", () -> {
        assertDoesNotThrow(() -> dogService.createScore(score3));
        assertEquals(1, dogService.getDogByNumber(1).getScores().size());
        DogEntity d1 = dogService.getDogByNumber(1);
        List<DailyScore> dailyScores4 = d1.getScores();
        assertEquals(1, dailyScores4.size());
        assertEquals(3, dailyScores4.get(0).getTimeBucketScores().size());
        assertEquals(2, dailyScores4.get(0).getHighestScores().size());
        assertEquals(70, d1.getPoints());
        DogEntity d2 = dogService.getDogByNumber(2);
        assertEquals(60, d2.getPoints());
        DogEntity d3 = dogService.getDogByNumber(3);
        assertEquals(60, d3.getPoints());
      });

      ScoreDto score4 = new ScoreDto(4, "05:30:00", 1, "05:35:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 }, 10);
      assertAll("Add score for different day", () -> {
        assertDoesNotThrow(() -> dogService.createScore(score4));
        assertEquals(4, dogService.getDogByNumber(1).getScores().size());
        DogEntity d1 = dogService.getDogByNumber(1);
        List<DailyScore> dailyScores5 = d1.getScores();
        assertEquals(4, dailyScores5.size());
        assertEquals(3, dailyScores5.get(0).getTimeBucketScores().size());
        assertEquals(0, dailyScores5.get(1).getTimeBucketScores().size());
        assertEquals(0, dailyScores5.get(2).getTimeBucketScores().size());
        assertEquals(1, dailyScores5.get(3).getTimeBucketScores().size());
        assertEquals(2, dailyScores5.get(0).getHighestScores().size());
        assertEquals(1, dailyScores5.get(3).getHighestScores().size());
        assertEquals(105, d1.getPoints());
        DogEntity d2 = dogService.getDogByNumber(2);
        assertEquals(90, d2.getPoints());
        DogEntity d3 = dogService.getDogByNumber(3);
        assertEquals(85, d3.getPoints());
      });

    });

  }

}
