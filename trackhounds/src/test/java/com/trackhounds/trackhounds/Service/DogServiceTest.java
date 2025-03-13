package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DailyScore;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;

import jakarta.transaction.Transactional;

/**
 * DogService Test class
 */
@SpringBootTest
@ActiveProfiles("test")
public class DogServiceTest {

    /**
     * Dog Repository
     */
    @Autowired
    private DogRepository dogRepository;

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
     * Dog Service
     */
    @Autowired
    private DogService dogService;

    /**
     * Setup for the tests
     */
    @BeforeEach
    void setUp() {
        dogService.clear();
        daysRepository.deleteAll();
        judgeRepository.save(new JudgeEntity(1, "PIN", "Judgy Judge"));
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
        assertAll("Invalid",
                () -> assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(List.of(dog1))),
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

        ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 },
                10);
        assertAll("Create Score", () -> {
            assertDoesNotThrow(() -> dogService.createScore(score));
            assertEquals(1, dogService.getDogByNumber(1).getScores().size());
            List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
            assertEquals(1, dailyScores.size());
            assertEquals(1, dailyScores.get(0).getTimeBucketScores().size());
            assertEquals(1, dailyScores.get(0).getHighestScores().size());
            assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore().getPoints());
            assertEquals(35, dogService.getDogByNumber(1).getPoints());
            assertEquals("05:30", daysRepository.findById(1).get().getStartTime().toString());
            List<DailyScore> dailyScores2 = dogService.getDogByNumber(2).getScores();
            assertEquals(1, dailyScores2.size());
            assertEquals(1, dailyScores2.get(0).getTimeBucketScores().size());
            assertEquals(1, dailyScores2.get(0).getHighestScores().size());
            assertEquals(30, dailyScores2.get(0).getHighestScores().iterator().next().getScore().getPoints());
            assertEquals(30, dogService.getDogByNumber(2).getPoints());
            List<DailyScore> dailyScores3 = dogService.getDogByNumber(3).getScores();
            assertEquals(1, dailyScores3.size());
            assertEquals(1, dailyScores3.get(0).getTimeBucketScores().size());
            assertEquals(25, dailyScores3.get(0).getHighestScores().iterator().next().getScore().getPoints());
            assertEquals(25, dogService.getDogByNumber(3).getPoints());
        });

        ScoreDto score2 = new ScoreDto(1, "05:30:00", 1, "05:42:00", new int[] { 3, 2, 1 }, new int[] { 35, 30, 25 },
                10);

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

            ScoreDto score3 = new ScoreDto(1, "05:30:00", 1, "05:35:00", new int[] { 1, 2, 3 },
                    new int[] { 35, 30, 25 }, 10);

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

            ScoreDto score4 = new ScoreDto(4, "05:30:00", 1, "05:35:00", new int[] { 1, 2, 3 },
                    new int[] { 35, 30, 25 }, 10);
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

    /**
     * Test removing a score
     */
    @Test
    @Transactional
    void testRemoveScore() {
        DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
        DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
        DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
        assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
                () -> assertTrue(dogRepository.count() > 0),
                () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
                () -> assertNotNull(dogService.getDogByNumber(1)),
                () -> assertNotNull(dogService.getDogByNumber(2)),
                () -> assertNotNull(dogService.getDogByNumber(3)));

        ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 },
                10);
        assertAll("Create Score", () -> {
            assertDoesNotThrow(() -> dogService.createScore(score));
            assertEquals(1, dogService.getDogByNumber(1).getScores().size());
            List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
            assertEquals(1, dailyScores.size());
            assertEquals(1, dailyScores.get(0).getTimeBucketScores().size());
            assertEquals(1, dailyScores.get(0).getHighestScores().size());
            assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore().getPoints());
            assertEquals(35, dogService.getDogByNumber(1).getPoints());
        });

        Long scoreId = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore().getId();
        assertAll("Remove Score", () -> {
            assertDoesNotThrow(() -> dogService.removeScore(1, scoreId));
            assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
            assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
            assertEquals(0, dogService.getDogByNumber(1).getPoints());
        });

        ScoreDto score2 = new ScoreDto(1, "05:30:00", 1, "05:42:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 },
                10);
        assertAll("Create Score Again", () -> {
            assertDoesNotThrow(() -> dogService.createScore(score2));
            assertEquals(1, dogService.getDogByNumber(1).getScores().size());
            List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
            assertEquals(1, dailyScores.size());
            assertEquals(1, dailyScores.get(0).getTimeBucketScores().size());
            assertEquals(1, dailyScores.get(0).getHighestScores().size());
            assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore().getPoints());
            assertEquals(35, dogService.getDogByNumber(1).getPoints());
        });

        Long scoreId2 = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore().getId();
        assertAll("Remove Score Again", () -> {
            assertDoesNotThrow(() -> dogService.removeScore(1, scoreId2));
            assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
            assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
            assertEquals(0, dogService.getDogByNumber(1).getPoints());
        });

        ScoreDto score3 = new ScoreDto(1, "05:30:00", 1, "05:35:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 },
                10);
        dogService.createScore(score3);
        dogService.createScore(score2);
        Long secondScoreId2 = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(1).getScore()
                .getId();
        assertAll("Remove Score Again", () -> {
            assertDoesNotThrow(() -> dogService.removeScore(1, secondScoreId2));
            assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
            assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
            assertEquals(35, dogService.getDogByNumber(1).getPoints());
        });

        ScoreDto score4 = new ScoreDto(1, "05:30:00", 1, "05:35:00", new int[] { 3, 2, 1 }, new int[] { 35, 30, 25 },
                10);
        dogService.createScore(score4);
        Long scoreId3 = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore().getId();
        assertAll("Remove Score Again", () -> {
            assertDoesNotThrow(() -> dogService.removeScore(1, scoreId3));
            assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
            assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
            assertEquals(25, dogService.getDogByNumber(1).getPoints());
        });
    }

    /**
     * Test scratching a dog
     */
    @Test
    @Transactional
    void testScratchDog() {
        DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
        assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1)));

        Scratch scratch = new Scratch();
        scratch.setDogNumber(1);
        scratch.setJudgeNumber(1);
        scratch.setTime(LocalTime.now());
        scratch.setReason("Test reason");

        assertAll("Scratch dog",
                () -> assertDoesNotThrow(() -> dogService.scratchDog(scratch)),
                () -> assertTrue(dogService.getDogByNumber(1).isScratched()));

        // Test validation scenarios
        Scratch invalidDogScratch = new Scratch();
        invalidDogScratch.setDogNumber(999);
        invalidDogScratch.setJudgeNumber(1);
        invalidDogScratch.setTime(LocalTime.now());
        invalidDogScratch.setReason("Test reason");

        TrackHoundsAPIException exception = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.scratchDog(invalidDogScratch));
        assertTrue(exception.getFields().containsKey("dogNumber"));

        Scratch invalidJudgeScratch = new Scratch();
        invalidJudgeScratch.setDogNumber(1);
        invalidJudgeScratch.setJudgeNumber(999);
        invalidJudgeScratch.setTime(LocalTime.now());
        invalidJudgeScratch.setReason("Test reason");

        exception = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.scratchDog(invalidJudgeScratch));
        assertTrue(exception.getFields().containsKey("judgeNumber"));

        Scratch missingReasonScratch = new Scratch();
        missingReasonScratch.setDogNumber(1);
        missingReasonScratch.setJudgeNumber(1);
        missingReasonScratch.setTime(LocalTime.now());
        missingReasonScratch.setReason("");

        exception = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.scratchDog(missingReasonScratch));
        assertTrue(exception.getFields().containsKey("reason"));

        Scratch missingTimeScratch = new Scratch();
        missingTimeScratch.setDogNumber(1);
        missingReasonScratch.setJudgeNumber(1);
        missingTimeScratch.setTime(null);
        missingTimeScratch.setReason("Test reason");

        exception = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.scratchDog(missingTimeScratch));
        assertTrue(exception.getFields().containsKey("time"));
    }

    /**
     * Test retrieving all scratches
     */
    @Test
    @Transactional
    void testGetScratches() {
        DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
        DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
        dogService.createDogs(List.of(dog1, dog2));

        Scratch scratch1 = new Scratch();
        scratch1.setDogNumber(1);
        scratch1.setJudgeNumber(1);
        scratch1.setTime(LocalTime.now());
        scratch1.setReason("Reason 1");

        Scratch scratch2 = new Scratch();
        scratch2.setDogNumber(2);
        scratch2.setJudgeNumber(1);
        scratch2.setTime(LocalTime.now());
        scratch2.setReason("Reason 2");

        assertAll("Create scratches",
                () -> assertDoesNotThrow(() -> dogService.scratchDog(scratch1)),
                () -> assertDoesNotThrow(() -> dogService.scratchDog(scratch2)));

        List<Scratch> scratches = dogService.getScratches();
        assertEquals(2, scratches.size());
    }

    /**
     * Test deleting a scratch
     */
    @Test
    @Transactional
    void testDeleteScratch() {
        DogEntity dog = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
        dogService.createDogs(List.of(dog));

        Scratch scratch = new Scratch();
        scratch.setDogNumber(1);
        scratch.setJudgeNumber(1);
        scratch.setTime(LocalTime.now());
        scratch.setReason("Test reason");

        assertDoesNotThrow(() -> dogService.scratchDog(scratch));

        List<Scratch> scratches = dogService.getScratches();
        assertEquals(1, scratches.size());

        Long scratchId = scratches.get(0).getId();

        assertAll("Delete scratch",
                () -> assertDoesNotThrow(() -> dogService.deleteScratch(scratchId)),
                () -> assertEquals(0, dogService.getScratches().size()));
    }

    /**
     * Test methods for dog scores by day and top-scoring dogs
     */
    @Test
    @Transactional
    void testDogScoresMethods() {
        // Create test dogs
        DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
        DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2");
        DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire3", "Dam3");

        dogService.createDogs(List.of(dog1, dog2, dog3));

        // Add scores for day 1
        ScoreDto score1Day1 = new ScoreDto(
                1, "05:30:00", 1, "05:45:00",
                new int[] { 1, 2, 3 },
                new int[] { 40, 30, 20 },
                10);

        // Add scores for day 2
        ScoreDto score1Day2 = new ScoreDto(
                2, "06:30:00", 1, "06:45:00",
                new int[] { 1, 2, 3 },
                new int[] { 25, 35, 15 },
                10);

        // Add more scores for day 1 (different time bucket)
        ScoreDto score2Day1 = new ScoreDto(
                1, "05:30:00", 1, "06:00:00",
                new int[] { 1, 2, 3 },
                new int[] { 30, 15, 45 },
                10);

        // Create the scores
        dogService.createScore(score1Day1);
        dogService.createScore(score1Day2);
        dogService.createScore(score2Day1);

        // Test getDogScoresByDay
        List<Map<String, Object>> day1Scores = dogService.getDogScoresByDay(1);
        List<Map<String, Object>> day2Scores = dogService.getDogScoresByDay(2);

        assertAll("getDogScoresByDay",
                () -> assertEquals(3, day1Scores.size()),
                () -> assertEquals(3, day2Scores.size()),
                () -> assertTrue(day1Scores.stream()
                        .anyMatch(score -> score.get("dogNumber").equals(1) && score.get("totalPoints").equals(70))),
                () -> assertTrue(day1Scores.stream()
                        .anyMatch(score -> score.get("dogNumber").equals(2) && score.get("totalPoints").equals(45))),
                () -> assertTrue(day1Scores.stream()
                        .anyMatch(score -> score.get("dogNumber").equals(3) && score.get("totalPoints").equals(65))),
                () -> assertTrue(day2Scores.stream()
                        .anyMatch(score -> score.get("dogNumber").equals(1) && score.get("totalPoints").equals(25))),
                () -> assertTrue(day2Scores.stream()
                        .anyMatch(score -> score.get("dogNumber").equals(2) && score.get("totalPoints").equals(35))),
                () -> assertTrue(day2Scores.stream()
                        .anyMatch(score -> score.get("dogNumber").equals(3) && score.get("totalPoints").equals(15))));

        // Test getTopScoringDogsByDay
        List<Map<String, Object>> top2DogsDay1 = dogService.getTopScoringDogsByDay(1, 2);

        assertAll("getTopScoringDogsByDay",
                () -> assertEquals(2, top2DogsDay1.size()),
                () -> assertEquals(1, top2DogsDay1.get(0).get("dogNumber")), // Dog1 should be first with 70 points
                () -> assertEquals(3, top2DogsDay1.get(1).get("dogNumber")) // Dog3 should be second with 45 points
        );

        // Test getTop10ScoringDogsByDay
        List<Map<String, Object>> top10DogsDay1 = dogService.getTop10ScoringDogsByDay(1);

        assertAll("getTop10ScoringDogsByDay",
                () -> assertEquals(3, top10DogsDay1.size()), // Only 3 dogs total
                () -> assertEquals(1, top10DogsDay1.get(0).get("dogNumber")), // Dog1 first
                () -> assertEquals(3, top10DogsDay1.get(1).get("dogNumber")), // Dog3 second
                () -> assertEquals(2, top10DogsDay1.get(2).get("dogNumber")) // Dog2 third
        );

        // Test getTop10ScoringDogsOverall
        List<Map<String, Object>> top10DogsOverall = dogService.getTop10ScoringDogsOverall();

        assertAll("getTop10ScoringDogsOverall",
                () -> assertEquals(3, top10DogsOverall.size()), // Only 3 dogs total
                () -> assertEquals(1, top10DogsOverall.get(0).get("dogNumber")), // Dog1 should be first with 70+25=95
                                                                                 // points
                () -> assertEquals(2, top10DogsOverall.get(1).get("dogNumber")), // Dog3 should be second with 45+15=60
                                                                                 // points
                () -> assertEquals(3, top10DogsOverall.get(2).get("dogNumber")) // Dog2 should be third with 30+35=65
                                                                                // points
        );

        // Test with a day that has no scores
        List<Map<String, Object>> day3Scores = dogService.getDogScoresByDay(3);

        assertAll("Empty day scores",
                () -> assertEquals(0, day3Scores.size()));

        // Test with limit higher than available dogs
        List<Map<String, Object>> allDogsWithHighLimit = dogService.getTopScoringDogsByDay(1, 10);

        assertAll("High limit test",
                () -> assertEquals(3, allDogsWithHighLimit.size()) // Still only 3 dogs
        );
    }

    /**
     * Test edge cases for score calculation methods
     */
    @Test
    @Transactional
    void testDogScoresMethodsEdgeCases() {
        // Create a dog with no scores
        DogEntity dogWithNoScores = new DogEntity(10, "NoScores", StakeType.ALL_AGE, "Owner", "Sire", "Dam");
        dogService.createDogs(List.of(dogWithNoScores));

        // Test getDogScoresByDay with a dog that has no scores
        List<Map<String, Object>> noScores = dogService.getDogScoresByDay(1);

        assertAll("No scores test",
                () -> assertEquals(0, noScores.size()));

        // Test getTop10ScoringDogsOverall with no scored dogs
        List<Map<String, Object>> noTopDogs = dogService.getTop10ScoringDogsOverall();

        assertAll("No top dogs test",
                () -> assertEquals(1, noTopDogs.size()),
                () -> assertEquals(10, noTopDogs.get(0).get("dogNumber")),
                () -> assertEquals(0, noTopDogs.get(0).get("totalPoints")));

        // Create multiple dogs with same score to test sorting stability
        DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
        DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2");

        dogService.createDogs(List.of(dog1, dog2));

        // Give them the exact same scores
        ScoreDto sameScore = new ScoreDto(
                1, "05:30:00", 1, "05:45:00",
                new int[] { 1, 2 },
                new int[] { 50, 50 },
                10);

        dogService.createScore(sameScore);

        // Check that they are sorted correctly with same scores
        List<Map<String, Object>> sameScoreDogs = dogService.getTop10ScoringDogsByDay(1);

        assertAll("Same score test",
                () -> assertEquals(2, sameScoreDogs.size()),
                () -> assertEquals(50, sameScoreDogs.get(0).get("totalPoints")),
                () -> assertEquals(50, sameScoreDogs.get(1).get("totalPoints")));
    }

    /**
     * Test methods for stake type filtering
     */
    @Test
    @Transactional
    void testDogScoresByStakeTypeMethods() {
        // Create test dogs with different stake types
        DogEntity allAgeDog1 = new DogEntity(1, "AllAge1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
        DogEntity allAgeDog2 = new DogEntity(2, "AllAge2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2");
        DogEntity derbyDog1 = new DogEntity(3, "Derby1", StakeType.DERBY, "Owner3", "Sire3", "Dam3");
        DogEntity derbyDog2 = new DogEntity(4, "Derby2", StakeType.DERBY, "Owner4", "Sire4", "Dam4");

        dogService.createDogs(List.of(allAgeDog1, allAgeDog2, derbyDog1, derbyDog2));

        // Add scores for day 1
        ScoreDto score1Day1 = new ScoreDto(
                1, "05:30:00", 1, "05:45:00",
                new int[] { 1, 2, 3, 4 },
                new int[] { 40, 30, 50, 20 },
                10);

        // Add scores for day 2
        ScoreDto score1Day2 = new ScoreDto(
                2, "06:30:00", 1, "06:45:00",
                new int[] { 1, 2, 3, 4 },
                new int[] { 25, 35, 15, 45 },
                10);

        // Create the scores
        dogService.createScore(score1Day1);
        dogService.createScore(score1Day2);

        // Test getTopScoringDogsByStakeType
        List<Map<String, Object>> topAllAgeDogs = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE, 2);
        List<Map<String, Object>> topDerbyDogs = dogService.getTopScoringDogsByStakeType(StakeType.DERBY, 2);

        assertAll("getTopScoringDogsByStakeType",
                () -> assertEquals(2, topAllAgeDogs.size()),
                () -> assertEquals(2, topDerbyDogs.size()),
                () -> assertEquals(1, topAllAgeDogs.get(0).get("dogNumber")), // AllAgeDog2 has 65 points
                () -> assertEquals(2, topAllAgeDogs.get(1).get("dogNumber")), // AllAgeDog1 has 65 points
                () -> assertEquals(3, topDerbyDogs.get(0).get("dogNumber")), // DerbyDog1 has 65 points
                () -> assertEquals(4, topDerbyDogs.get(1).get("dogNumber")), // DerbyDog2 has 65 points
                () -> assertEquals(65, topAllAgeDogs.get(0).get("totalPoints")),
                () -> assertEquals(65, topDerbyDogs.get(0).get("totalPoints")));

        // Test getTop10ScoringDogsByStakeType
        List<Map<String, Object>> top10AllAgeDogs = dogService.getTop10ScoringDogsByStakeType(StakeType.ALL_AGE);
        List<Map<String, Object>> top10DerbyDogs = dogService.getTop10ScoringDogsByStakeType(StakeType.DERBY);

        assertAll("getTop10ScoringDogsByStakeType",
                () -> assertEquals(2, top10AllAgeDogs.size()),
                () -> assertEquals(2, top10DerbyDogs.size()),
                () -> assertTrue(top10AllAgeDogs.stream().anyMatch(d -> d.get("dogNumber").equals(1))),
                () -> assertTrue(top10AllAgeDogs.stream().anyMatch(d -> d.get("dogNumber").equals(2))),
                () -> assertTrue(top10DerbyDogs.stream().anyMatch(d -> d.get("dogNumber").equals(3))),
                () -> assertTrue(top10DerbyDogs.stream().anyMatch(d -> d.get("dogNumber").equals(4))));

        // Test getTopScoringDogsByDayAndStakeType
        List<Map<String, Object>> topAllAgeDogsDay1 = dogService.getTopScoringDogsByDayAndStakeType(1,
                StakeType.ALL_AGE,
                2);
        List<Map<String, Object>> topDerbyDogsDay1 = dogService.getTopScoringDogsByDayAndStakeType(1, StakeType.DERBY,
                2);
        List<Map<String, Object>> topAllAgeDogsDay2 = dogService.getTopScoringDogsByDayAndStakeType(2,
                StakeType.ALL_AGE,
                2);
        List<Map<String, Object>> topDerbyDogsDay2 = dogService.getTopScoringDogsByDayAndStakeType(2, StakeType.DERBY,
                2);

        assertAll("getTopScoringDogsByDayAndStakeType",
                () -> assertEquals(2, topAllAgeDogsDay1.size()),
                () -> assertEquals(2, topDerbyDogsDay1.size()),
                () -> assertEquals(2, topAllAgeDogsDay2.size()),
                () -> assertEquals(2, topDerbyDogsDay2.size()),
                () -> assertEquals(1, topAllAgeDogsDay1.get(0).get("dogNumber")), // Dog1 has 40 points on day 1
                () -> assertEquals(2, topAllAgeDogsDay1.get(1).get("dogNumber")), // Dog2 has 30 points on day 1
                () -> assertEquals(3, topDerbyDogsDay1.get(0).get("dogNumber")), // Dog3 has 50 points on day 1
                () -> assertEquals(4, topDerbyDogsDay1.get(1).get("dogNumber")), // Dog4 has 20 points on day 1
                () -> assertEquals(2, topAllAgeDogsDay2.get(0).get("dogNumber")), // Dog2 has 35 points on day 2
                () -> assertEquals(1, topAllAgeDogsDay2.get(1).get("dogNumber")), // Dog1 has 25 points on day 2
                () -> assertEquals(4, topDerbyDogsDay2.get(0).get("dogNumber")), // Dog4 has 45 points on day 2
                () -> assertEquals(3, topDerbyDogsDay2.get(1).get("dogNumber")) // Dog3 has 15 points on day 2
        );

        // Test getTop10ScoringDogsByDayAndStakeType
        List<Map<String, Object>> top10AllAgeDogsDay1 = dogService.getTop10ScoringDogsByDayAndStakeType(1,
                StakeType.ALL_AGE);
        List<Map<String, Object>> top10DerbyDogsDay1 = dogService.getTop10ScoringDogsByDayAndStakeType(1,
                StakeType.DERBY);

        assertAll("getTop10ScoringDogsByDayAndStakeType",
                () -> assertEquals(2, top10AllAgeDogsDay1.size()),
                () -> assertEquals(2, top10DerbyDogsDay1.size()),
                () -> assertEquals(1, top10AllAgeDogsDay1.get(0).get("dogNumber")),
                () -> assertEquals(2, top10AllAgeDogsDay1.get(1).get("dogNumber")),
                () -> assertEquals(3, top10DerbyDogsDay1.get(0).get("dogNumber")),
                () -> assertEquals(4, top10DerbyDogsDay1.get(1).get("dogNumber")));
    }

    /**
     * Test edge cases for stake type filtering methods
     */
    @Test
    @Transactional
    void testDogScoresByStakeTypeEdgeCases() {
        // Test with empty database
        List<Map<String, Object>> emptyAllAgeDogs = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE, 5);
        List<Map<String, Object>> emptyDerbyDogs = dogService.getTopScoringDogsByStakeType(StakeType.DERBY, 5);

        assertAll("Empty database tests",
                () -> assertTrue(emptyAllAgeDogs.isEmpty()),
                () -> assertTrue(emptyDerbyDogs.isEmpty()));

        // Create dogs but don't add any scores
        DogEntity allAgeDog = new DogEntity(1, "AllAge", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
        DogEntity derbyDog = new DogEntity(2, "Derby", StakeType.DERBY, "Owner2", "Sire2", "Dam2");
        dogService.createDogs(List.of(allAgeDog, derbyDog));

        // Test with dogs that have no scores
        List<Map<String, Object>> noScoreAllAgeDogs = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE, 5);
        List<Map<String, Object>> noScoreDerbyDogs = dogService.getTopScoringDogsByStakeType(StakeType.DERBY, 5);

        assertAll("Dogs with no scores tests",
                () -> assertEquals(1, noScoreAllAgeDogs.size()),
                () -> assertEquals(1, noScoreDerbyDogs.size()),
                () -> assertEquals(1, noScoreAllAgeDogs.get(0).get("dogNumber")),
                () -> assertEquals(2, noScoreDerbyDogs.get(0).get("dogNumber")),
                () -> assertEquals(0, noScoreAllAgeDogs.get(0).get("totalPoints")),
                () -> assertEquals(0, noScoreDerbyDogs.get(0).get("totalPoints")));

        // Test with non-existent day and stake type combination
        List<Map<String, Object>> nonExistentDay = dogService.getTopScoringDogsByDayAndStakeType(99, StakeType.ALL_AGE,
                5);

        assertAll("Non-existent day test",
                () -> assertTrue(nonExistentDay.isEmpty()));

        // Test with limit = 0
        List<Map<String, Object>> zeroLimit = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE, 0);

        assertAll("Zero limit test",
                () -> assertTrue(zeroLimit.isEmpty()));
    }

    /**
     * Test methods for retrieving scores by dog number and judge number
     */
    @Test
    @Transactional
    void testGetScoresByDogAndJudge() {
        // Create test dogs and judge
        DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
        DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2");
        dogService.createDogs(List.of(dog1, dog2));
        judgeRepository.save(new JudgeEntity(2, "PIN2", "Judge2"));

        // Add scores for days 1 and 2
        ScoreDto scoreDay1Dog1 = new ScoreDto(
                1, "05:30:00", 1, "05:45:00",
                new int[] { 1 },
                new int[] { 40 },
                10);

        ScoreDto scoreDay1Dog2 = new ScoreDto(
                1, "06:30:00", 2, "06:45:00",
                new int[] { 2 },
                new int[] { 30 },
                10);

        ScoreDto scoreDay2Dog1 = new ScoreDto(
                2, "07:30:00", 1, "07:45:00",
                new int[] { 1 },
                new int[] { 25 },
                10);

        // Create the scores
        dogService.createScore(scoreDay1Dog1);
        dogService.createScore(scoreDay1Dog2);
        dogService.createScore(scoreDay2Dog1);

        // Test getScoresByDogNumber
        List<Score> dog1Scores = dogService.getScoresByDogNumber(1);
        List<Score> dog2Scores = dogService.getScoresByDogNumber(2);

        assertAll("getScoresByDogNumber",
                () -> assertEquals(2, dog1Scores.size()), // Dog1 should have 2 scores (day 1 and 2)
                () -> assertEquals(1, dog2Scores.size()), // Dog2 should have 1 score (day 1)
                () -> assertTrue(dog1Scores.stream().anyMatch(s -> s.getDay() == 1)),
                () -> assertTrue(dog1Scores.stream().anyMatch(s -> s.getDay() == 2)),
                () -> assertTrue(dog2Scores.stream().anyMatch(s -> s.getDay() == 1)));

        // Test getScoresByJudgeNumber
        List<Score> judge1Scores = dogService.getScoresByJudgeNumber(1);
        List<Score> judge2Scores = dogService.getScoresByJudgeNumber(2);

        assertAll("getScoresByJudgeNumber",
                () -> assertEquals(2, judge1Scores.size()), // Judge 1 gave 2 scores
                () -> assertEquals(1, judge2Scores.size()), // Judge 2 gave 1 score
                () -> assertTrue(judge1Scores.stream().anyMatch(s -> s.getDogNumber() == 1)),
                () -> assertTrue(judge2Scores.stream().anyMatch(s -> s.getDogNumber() == 2)));

        // Test getScoresByDogNumberAndDay
        List<Score> dog1Day1Scores = dogService.getScoresByDogNumberAndDay(1, 1);
        List<Score> dog1Day2Scores = dogService.getScoresByDogNumberAndDay(1, 2);
        List<Score> dog1Day3Scores = dogService.getScoresByDogNumberAndDay(1, 3); // No scores on day 3

        assertAll("getScoresByDogNumberAndDay",
                () -> assertEquals(1, dog1Day1Scores.size()),
                () -> assertEquals(1, dog1Day2Scores.size()),
                () -> assertEquals(0, dog1Day3Scores.size()),
                () -> assertEquals(1, dog1Day1Scores.get(0).getDay()),
                () -> assertEquals(2, dog1Day2Scores.get(0).getDay()));

        // Test getScoresByJudgeNumberAndDay
        List<Score> judge1Day1Scores = dogService.getScoresByJudgeNumberAndDay(1, 1);
        List<Score> judge1Day2Scores = dogService.getScoresByJudgeNumberAndDay(1, 2);
        List<Score> judge2Day1Scores = dogService.getScoresByJudgeNumberAndDay(2, 1);

        assertAll("getScoresByJudgeNumberAndDay",
                () -> assertEquals(1, judge1Day1Scores.size()),
                () -> assertEquals(1, judge1Day2Scores.size()),
                () -> assertEquals(1, judge2Day1Scores.size()),
                () -> assertEquals(1, judge1Day1Scores.get(0).getDay()),
                () -> assertEquals(2, judge1Day2Scores.get(0).getDay()),
                () -> assertEquals(1, judge2Day1Scores.get(0).getDay()));
    }

    /**
     * Test edge cases for score retrieval methods
     */
    @Test
    @Transactional
    void testScoreRetrievalEdgeCases() {
        // Create one dog and one judge
        DogEntity dog = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
        dogService.createDogs(List.of(dog));
        judgeRepository.save(new JudgeEntity(2, "PIN2", "Judge2"));

        // Test retrieving scores for non-existent dog
        TrackHoundsAPIException dogException = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.getScoresByDogNumber(999));
        assertEquals(HttpStatus.BAD_REQUEST, dogException.getStatus());
        assertTrue(dogException.getFields().containsKey("dogNumber"));

        // Test retrieving scores for non-existent judge
        TrackHoundsAPIException judgeException = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.getScoresByJudgeNumber(999));
        assertEquals(HttpStatus.BAD_REQUEST, judgeException.getStatus());
        assertTrue(judgeException.getFields().containsKey("judgeNumber"));

        // Test retrieving scores for non-existent day (should return empty list, not
        // throw exception)
        List<Score> nonExistentDayScores = dogService.getScoresByDogNumberAndDay(1, 999);
        assertTrue(nonExistentDayScores.isEmpty());

        // Test retrieving scores for a dog that exists but has no scores
        List<Score> noScoresDog = dogService.getScoresByDogNumber(1);
        assertTrue(noScoresDog.isEmpty());

        // Test retrieving scores by day for non-existent dog (should throw exception)
        TrackHoundsAPIException dogDayException = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.getScoresByDogNumberAndDay(999, 1));
        assertEquals(HttpStatus.BAD_REQUEST, dogDayException.getStatus());
        assertTrue(dogDayException.getFields().containsKey("dogNumber"));

        // Test retrieving scores by day for non-existent judge (should throw exception)
        TrackHoundsAPIException judgeDayException = assertThrows(TrackHoundsAPIException.class,
                () -> dogService.getScoresByJudgeNumberAndDay(999, 1));
        assertEquals(HttpStatus.BAD_REQUEST, judgeDayException.getStatus());
        assertTrue(judgeDayException.getFields().containsKey("judgeNumber"));
    }
}
