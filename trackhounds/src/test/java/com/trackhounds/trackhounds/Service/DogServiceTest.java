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
import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Score;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
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

        @Autowired
        private HuntRepository huntRepository;

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
                assertAll("Create Dogs",
                                () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
                                () -> assertTrue(dogRepository.count() > 0),
                                () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
                                () -> assertNotNull(dogService.getDogByNumber(1)),
                                () -> assertNotNull(dogService.getDogByNumber(2)),
                                () -> assertNotNull(dogService.getDogByNumber(3)));

                DogEntity emptyName = new DogEntity(4, null, null, "owner", "sire", "dam");
                DogEntity emptyStake = new DogEntity(4, "Name", null, "owner", "sire", "dam");
                assertAll("Invalid",
                                () -> assertThrows(TrackHoundsAPIException.class,
                                                () -> dogService.createDogs(List.of(dog1))),
                                () -> assertThrows(TrackHoundsAPIException.class,
                                                () -> dogService.createDogs(List.of(emptyName))),
                                () -> assertThrows(TrackHoundsAPIException.class,
                                                () -> dogService.createDogs(List.of(emptyStake))));
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
                assertAll("Create Dogs",
                                () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
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
                assertAll("Create Dogs",
                                () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
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
                assertAll("Create Dogs",
                                () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
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
                assertAll("Create Dogs",
                                () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
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
                assertAll("Create Dogs",
                                () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
                                () -> assertTrue(dogRepository.count() > 0),
                                () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
                                () -> assertNotNull(dogService.getDogByNumber(1)),
                                () -> assertNotNull(dogService.getDogByNumber(2)),
                                () -> assertNotNull(dogService.getDogByNumber(3)));

                ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 },
                                new int[] { 35, 30, 25 },
                                10);
                assertAll("Create Score", () -> {
                        assertDoesNotThrow(() -> dogService.createScore(score));
                        assertEquals(1, dogService.getDogByNumber(1).getScores().size());
                        List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
                        assertEquals(1, dailyScores.size());
                        assertEquals(1, dailyScores.get(0).getTimeBucketScores().size());
                        assertEquals(1, dailyScores.get(0).getHighestScores().size());
                        assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(38, dogService.getDogByNumber(1).getPoints());
                        assertEquals("05:30", daysRepository.findById(1).get().getStartTime().toString());
                        List<DailyScore> dailyScores2 = dogService.getDogByNumber(2).getScores();
                        assertEquals(1, dailyScores2.size());
                        assertEquals(1, dailyScores2.get(0).getTimeBucketScores().size());
                        assertEquals(1, dailyScores2.get(0).getHighestScores().size());
                        assertEquals(30, dailyScores2.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(33, dogService.getDogByNumber(2).getPoints());
                        List<DailyScore> dailyScores3 = dogService.getDogByNumber(3).getScores();
                        assertEquals(1, dailyScores3.size());
                        assertEquals(1, dailyScores3.get(0).getTimeBucketScores().size());
                        assertEquals(25, dailyScores3.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(27, dogService.getDogByNumber(3).getPoints());
                });

                ScoreDto score2 = new ScoreDto(1, "05:30:00", 1, "05:42:00", new int[] { 3, 2, 1 },
                                new int[] { 35, 30, 25 },
                                10);

                assertAll("Add additional Score", () -> {
                        assertDoesNotThrow(() -> dogService.createScore(score2));
                        assertEquals(1, dogService.getDogByNumber(1).getScores().size());
                        List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
                        assertEquals(1, dailyScores.size());
                        assertEquals(2, dailyScores.get(0).getTimeBucketScores().size());
                        assertEquals(1, dailyScores.get(0).getHighestScores().size());
                        assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(38, dogService.getDogByNumber(1).getPoints());
                        List<DailyScore> dailyScores2 = dogService.getDogByNumber(2).getScores();
                        assertEquals(1, dailyScores2.size());
                        assertEquals(2, dailyScores2.get(0).getTimeBucketScores().size());
                        assertEquals(1, dailyScores2.get(0).getHighestScores().size());
                        assertEquals(30, dailyScores2.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(33, dogService.getDogByNumber(2).getPoints());
                        List<DailyScore> dailyScores3 = dogService.getDogByNumber(3).getScores();
                        assertEquals(1, dailyScores3.size());
                        assertEquals(2, dailyScores3.get(0).getTimeBucketScores().size());
                        assertEquals(1, dailyScores3.get(0).getHighestScores().size());
                        assertEquals(35, dailyScores3.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(38, dogService.getDogByNumber(3).getPoints());

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
                                assertEquals(77, d1.getPoints());
                                DogEntity d2 = dogService.getDogByNumber(2);
                                assertEquals(66, d2.getPoints());
                                DogEntity d3 = dogService.getDogByNumber(3);
                                assertEquals(66, d3.getPoints());
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
                                assertEquals(126, d1.getPoints());
                                DogEntity d2 = dogService.getDogByNumber(2);
                                assertEquals(108, d2.getPoints());
                                DogEntity d3 = dogService.getDogByNumber(3);
                                assertEquals(101, d3.getPoints());
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
                assertAll("Create Dogs",
                                () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
                                () -> assertTrue(dogRepository.count() > 0),
                                () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
                                () -> assertNotNull(dogService.getDogByNumber(1)),
                                () -> assertNotNull(dogService.getDogByNumber(2)),
                                () -> assertNotNull(dogService.getDogByNumber(3)));

                ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 },
                                new int[] { 35, 30, 25 },
                                10);
                assertAll("Create Score", () -> {
                        assertDoesNotThrow(() -> dogService.createScore(score));
                        assertEquals(1, dogService.getDogByNumber(1).getScores().size());
                        List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
                        assertEquals(1, dailyScores.size());
                        assertEquals(1, dailyScores.get(0).getTimeBucketScores().size());
                        assertEquals(1, dailyScores.get(0).getHighestScores().size());
                        assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(38, dogService.getDogByNumber(1).getPoints());
                });

                Long scoreId = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore()
                                .getId();
                assertAll("Remove Score", () -> {
                        assertDoesNotThrow(() -> dogService.removeScore(1, scoreId));
                        assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
                        assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
                        assertEquals(0, dogService.getDogByNumber(1).getPoints());
                });

                ScoreDto score2 = new ScoreDto(1, "05:30:00", 1, "05:42:00", new int[] { 1, 2, 3 },
                                new int[] { 35, 30, 25 },
                                10);
                assertAll("Create Score Again", () -> {
                        assertDoesNotThrow(() -> dogService.createScore(score2));
                        assertEquals(1, dogService.getDogByNumber(1).getScores().size());
                        List<DailyScore> dailyScores = dogService.getDogByNumber(1).getScores();
                        assertEquals(1, dailyScores.size());
                        assertEquals(1, dailyScores.get(0).getTimeBucketScores().size());
                        assertEquals(1, dailyScores.get(0).getHighestScores().size());
                        assertEquals(35, dailyScores.get(0).getHighestScores().iterator().next().getScore()
                                        .getPoints());
                        assertEquals(38, dogService.getDogByNumber(1).getPoints());
                });

                Long scoreId2 = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore()
                                .getId();
                assertAll("Remove Score Again", () -> {
                        assertDoesNotThrow(() -> dogService.removeScore(1, scoreId2));
                        assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
                        assertEquals(0, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
                        assertEquals(0, dogService.getDogByNumber(1).getPoints());
                });

                ScoreDto score3 = new ScoreDto(1, "05:30:00", 1, "05:35:00", new int[] { 1, 2, 3 },
                                new int[] { 35, 30, 25 },
                                10);
                dogService.createScore(score3);
                dogService.createScore(score2);
                Long secondScoreId2 = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(1)
                                .getScore()
                                .getId();
                assertAll("Remove Score Again", () -> {
                        assertDoesNotThrow(() -> dogService.removeScore(1, secondScoreId2));
                        assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
                        assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
                        assertEquals(38, dogService.getDogByNumber(1).getPoints());
                });

                ScoreDto score4 = new ScoreDto(1, "05:30:00", 1, "05:35:00", new int[] { 3, 2, 1 },
                                new int[] { 35, 30, 25 },
                                10);
                dogService.createScore(score4);
                Long scoreId3 = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore()
                                .getId();
                assertAll("Remove Score Again", () -> {
                        assertDoesNotThrow(() -> dogService.removeScore(1, scoreId3));
                        assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().size());
                        assertEquals(1, dogService.getDogByNumber(1).getScores().get(0).getHighestScores().size());
                        assertEquals(27, dogService.getDogByNumber(1).getPoints());
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
                huntRepository.save(new HuntEntity("Title", null, StakeType.ALL_AGE, 10));
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
                                                .anyMatch(score -> score.get("dogNumber").equals(1)
                                                                && score.get("totalPoints").equals(70))),
                                () -> assertTrue(day1Scores.stream()
                                                .anyMatch(score -> score.get("dogNumber").equals(2)
                                                                && score.get("totalPoints").equals(45))),
                                () -> assertTrue(day1Scores.stream()
                                                .anyMatch(score -> score.get("dogNumber").equals(3)
                                                                && score.get("totalPoints").equals(65))),
                                () -> assertTrue(day2Scores.stream()
                                                .anyMatch(score -> score.get("dogNumber").equals(1)
                                                                && score.get("totalPoints").equals(25))),
                                () -> assertTrue(day2Scores.stream()
                                                .anyMatch(score -> score.get("dogNumber").equals(2)
                                                                && score.get("totalPoints").equals(35))),
                                () -> assertTrue(day2Scores.stream()
                                                .anyMatch(score -> score.get("dogNumber").equals(3)
                                                                && score.get("totalPoints").equals(15))));

                // Test getTopScoringDogsByDay
                List<Map<String, Object>> top2DogsDay1 = dogService.getTopScoringDogsByDay(1, 2);

                assertAll("getTopScoringDogsByDay",
                                () -> assertEquals(2, top2DogsDay1.size()),
                                () -> assertEquals(1, top2DogsDay1.get(0).get("dogNumber")), // Dog1 should be first
                                                                                             // with 70 points
                                () -> assertEquals(3, top2DogsDay1.get(1).get("dogNumber")) // Dog3 should be second
                                                                                            // with 45 points
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
                                () -> assertEquals(1, top10DogsOverall.get(0).get("dogNumber")), // Dog1 should be first
                                                                                                 // with 70+25=95
                                                                                                 // points
                                () -> assertEquals(2, top10DogsOverall.get(1).get("dogNumber")), // Dog3 should be
                                                                                                 // second with 45+15=60
                                                                                                 // points
                                () -> assertEquals(3, top10DogsOverall.get(2).get("dogNumber")) // Dog2 should be third
                                                                                                // with 30+35=65
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
                huntRepository.save(new HuntEntity("Title", null, StakeType.ALL_AGE, 10));

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
                huntRepository.save(new HuntEntity("Title", null, StakeType.ALL_AGE, 10));
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
                                () -> assertEquals(2, topAllAgeDogs.get(0).get("dogNumber")), // AllAgeDog2 has 65
                                                                                              // points
                                () -> assertEquals(1, topAllAgeDogs.get(1).get("dogNumber")), // AllAgeDog1 has 65
                                                                                              // points
                                () -> assertEquals(4, topDerbyDogs.get(0).get("dogNumber")), // DerbyDog1 has 65 points
                                () -> assertEquals(3, topDerbyDogs.get(1).get("dogNumber")), // DerbyDog2 has 65 points
                                () -> assertEquals(75, topAllAgeDogs.get(0).get("totalPoints")),
                                () -> assertEquals(76, topDerbyDogs.get(0).get("totalPoints")));

                // Test getTop10ScoringDogsByStakeType
                List<Map<String, Object>> top10AllAgeDogs = dogService
                                .getTop10ScoringDogsByStakeType(StakeType.ALL_AGE);
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
                List<Map<String, Object>> topDerbyDogsDay1 = dogService.getTopScoringDogsByDayAndStakeType(1,
                                StakeType.DERBY,
                                2);
                List<Map<String, Object>> topAllAgeDogsDay2 = dogService.getTopScoringDogsByDayAndStakeType(2,
                                StakeType.ALL_AGE,
                                2);
                List<Map<String, Object>> topDerbyDogsDay2 = dogService.getTopScoringDogsByDayAndStakeType(2,
                                StakeType.DERBY,
                                2);

                assertAll("getTopScoringDogsByDayAndStakeType",
                                () -> assertEquals(2, topAllAgeDogsDay1.size()),
                                () -> assertEquals(2, topDerbyDogsDay1.size()),
                                () -> assertEquals(2, topAllAgeDogsDay2.size()),
                                () -> assertEquals(2, topDerbyDogsDay2.size()),
                                () -> assertEquals(1, topAllAgeDogsDay1.get(0).get("dogNumber")), // Dog1 has 40 points
                                                                                                  // on day 1
                                () -> assertEquals(2, topAllAgeDogsDay1.get(1).get("dogNumber")), // Dog2 has 30 points
                                                                                                  // on day 1
                                () -> assertEquals(3, topDerbyDogsDay1.get(0).get("dogNumber")), // Dog3 has 50 points
                                                                                                 // on day 1
                                () -> assertEquals(4, topDerbyDogsDay1.get(1).get("dogNumber")), // Dog4 has 20 points
                                                                                                 // on day 1
                                () -> assertEquals(2, topAllAgeDogsDay2.get(0).get("dogNumber")), // Dog2 has 35 points
                                                                                                  // on day 2
                                () -> assertEquals(1, topAllAgeDogsDay2.get(1).get("dogNumber")), // Dog1 has 25 points
                                                                                                  // on day 2
                                () -> assertEquals(4, topDerbyDogsDay2.get(0).get("dogNumber")), // Dog4 has 45 points
                                                                                                 // on day 2
                                () -> assertEquals(3, topDerbyDogsDay2.get(1).get("dogNumber")) // Dog3 has 15 points on
                                                                                                // day 2
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
                huntRepository.save(new HuntEntity("Title", null, StakeType.ALL_AGE, 10));
                List<Map<String, Object>> emptyAllAgeDogs = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE,
                                5);
                List<Map<String, Object>> emptyDerbyDogs = dogService.getTopScoringDogsByStakeType(StakeType.DERBY, 5);

                assertAll("Empty database tests",
                                () -> assertTrue(emptyAllAgeDogs.isEmpty()),
                                () -> assertTrue(emptyDerbyDogs.isEmpty()));

                // Create dogs but don't add any scores
                DogEntity allAgeDog = new DogEntity(1, "AllAge", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
                DogEntity derbyDog = new DogEntity(2, "Derby", StakeType.DERBY, "Owner2", "Sire2", "Dam2");
                dogService.createDogs(List.of(allAgeDog, derbyDog));

                // Test with dogs that have no scores
                List<Map<String, Object>> noScoreAllAgeDogs = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE,
                                5);
                List<Map<String, Object>> noScoreDerbyDogs = dogService.getTopScoringDogsByStakeType(StakeType.DERBY,
                                5);

                assertAll("Dogs with no scores tests",
                                () -> assertEquals(1, noScoreAllAgeDogs.size()),
                                () -> assertEquals(1, noScoreDerbyDogs.size()),
                                () -> assertEquals(1, noScoreAllAgeDogs.get(0).get("dogNumber")),
                                () -> assertEquals(2, noScoreDerbyDogs.get(0).get("dogNumber")),
                                () -> assertEquals(0, noScoreAllAgeDogs.get(0).get("totalPoints")),
                                () -> assertEquals(0, noScoreDerbyDogs.get(0).get("totalPoints")));

                // Test with non-existent day and stake type combination
                List<Map<String, Object>> nonExistentDay = dogService.getTopScoringDogsByDayAndStakeType(99,
                                StakeType.ALL_AGE,
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

        /**
         * Test the tie-breaking logic in ranking methods
         */
        @Test
        @Transactional
        void testTieBreakingInRankings() {
                huntRepository.save(new HuntEntity("Title", null, StakeType.ALL_AGE, 10));
                // Create test dogs
                DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
                DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2");
                DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire3", "Dam3");
                DogEntity dog4 = new DogEntity(4, "Dog4", StakeType.DERBY, "Owner4", "Sire4", "Dam4");

                dogService.createDogs(List.of(dog1, dog2, dog3, dog4));

                // Create scores with identical point values but different times
                ScoreDto earlyScore = new ScoreDto(
                                1, "05:30:00", 1, "05:45:00",
                                new int[] { 1, 3 },
                                new int[] { 40, 40 },
                                10);

                // Wait a bit to ensure scores have different timestamps
                ScoreDto laterScore = new ScoreDto(
                                1, "05:30:00", 1, "05:55:00",
                                new int[] { 2, 4 },
                                new int[] { 40, 40 },
                                10);

                // Add scores for day 2 to test day-based tie breaking
                ScoreDto day2Score = new ScoreDto(
                                2, "05:30:00", 1, "05:45:00",
                                new int[] { 2, 3 },
                                new int[] { 30, 30 },
                                10);

                // Create the scores in a specific order
                dogService.createScore(earlyScore);
                dogService.createScore(laterScore);
                dogService.createScore(day2Score);

                // Test tie-breaking for getTopScoringDogsByDay
                List<Map<String, Object>> topDogsDay1 = dogService.getTopScoringDogsByDay(1, 4);

                assertAll("Tie-breaking in getTopScoringDogsByDay",
                                () -> assertEquals(4, topDogsDay1.size()),
                                () -> assertEquals(40, topDogsDay1.get(0).get("totalPoints")),
                                () -> assertEquals(40, topDogsDay1.get(1).get("totalPoints")),
                                () -> assertEquals(40, topDogsDay1.get(2).get("totalPoints")),
                                () -> assertEquals(40, topDogsDay1.get(3).get("totalPoints")),
                                // Dogs with later score times should come first
                                () -> assertEquals(2, topDogsDay1.get(0).get("dogNumber")), // Later score time
                                () -> assertEquals(4, topDogsDay1.get(1).get("dogNumber")), // Later score time
                                () -> assertEquals(1, topDogsDay1.get(2).get("dogNumber")), // Earlier score time
                                () -> assertEquals(3, topDogsDay1.get(3).get("dogNumber")) // Earlier score time
                );

                // Test tie-breaking for getTopScoringDogsOverall
                List<Map<String, Object>> topDogsOverall = dogService.getTopScoringDogsOverall(4);

                assertAll("Tie-breaking in getTopScoringDogsOverall",
                                () -> assertEquals(4, topDogsOverall.size()),
                                // Dogs with scores on day 2 should be ranked higher in case of tie
                                () -> assertEquals(2, topDogsOverall.get(0).get("dogNumber")), // Has score on day 2
                                () -> assertEquals(3, topDogsOverall.get(1).get("dogNumber")), // Has score on day 2
                                // Then the later time on day 1 should break the tie
                                () -> assertEquals(4, topDogsOverall.get(2).get("dogNumber")), // Later score time on
                                                                                               // day 1
                                () -> assertEquals(1, topDogsOverall.get(3).get("dogNumber")) // Earlier score time on
                                                                                              // day 1
                );

                // Test tie-breaking for getTopScoringDogsByStakeType
                List<Map<String, Object>> topAllAgeDogs = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE, 2);
                List<Map<String, Object>> topDerbyDogs = dogService.getTopScoringDogsByStakeType(StakeType.DERBY, 2);

                assertAll("Tie-breaking in getTopScoringDogsByStakeType",
                                () -> assertEquals(2, topAllAgeDogs.size()),
                                () -> assertEquals(2, topDerbyDogs.size()),
                                // Dog2 has score on day 2 (later than Dog1)
                                () -> assertEquals(2, topAllAgeDogs.get(0).get("dogNumber")),
                                () -> assertEquals(1, topAllAgeDogs.get(1).get("dogNumber")),
                                // Dog3 has score on day 2 (later than Dog4)
                                () -> assertEquals(3, topDerbyDogs.get(0).get("dogNumber")),
                                () -> assertEquals(4, topDerbyDogs.get(1).get("dogNumber")));

                // Test tie-breaking for getTopScoringDogsByDayAndStakeType
                List<Map<String, Object>> topAllAgeDogsDay1 = dogService.getTopScoringDogsByDayAndStakeType(1,
                                StakeType.ALL_AGE, 2);
                List<Map<String, Object>> topDerbyDogsDay1 = dogService.getTopScoringDogsByDayAndStakeType(1,
                                StakeType.DERBY, 2);

                assertAll("Tie-breaking in getTopScoringDogsByDayAndStakeType",
                                () -> assertEquals(2, topAllAgeDogsDay1.size()),
                                () -> assertEquals(2, topDerbyDogsDay1.size()),
                                // Within a single day, later score time should win
                                () -> assertEquals(2, topAllAgeDogsDay1.get(0).get("dogNumber")), // Later score
                                () -> assertEquals(1, topAllAgeDogsDay1.get(1).get("dogNumber")), // Earlier score
                                () -> assertEquals(4, topDerbyDogsDay1.get(0).get("dogNumber")), // Later score
                                () -> assertEquals(3, topDerbyDogsDay1.get(1).get("dogNumber")) // Earlier score
                );
        }

        /**
         * Comprehensive test for tie-breaking logic across all ranking methods
         */
        @Test
        @Transactional
        void testComprehensiveTieBreaking() {
                // Setup a hunt with a specific interval for time bucket calculations
                huntRepository.save(new HuntEntity("Tie-Breaking Test Hunt", null, StakeType.ALL_AGE, 10));

                // Create test dogs - mix of ALL_AGE and DERBY
                DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
                DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2");
                DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.ALL_AGE, "Owner3", "Sire3", "Dam3");
                DogEntity dog4 = new DogEntity(4, "Dog4", StakeType.ALL_AGE, "Owner4", "Sire4", "Dam4");
                DogEntity dog5 = new DogEntity(5, "Dog5", StakeType.DERBY, "Owner5", "Sire5", "Dam5");
                DogEntity dog6 = new DogEntity(6, "Dog6", StakeType.DERBY, "Owner6", "Sire6", "Dam6");
                DogEntity dog7 = new DogEntity(7, "Dog7", StakeType.DERBY, "Owner7", "Sire7", "Dam7");
                DogEntity dog8 = new DogEntity(8, "Dog8", StakeType.DERBY, "Owner8", "Sire8", "Dam8");

                dogService.createDogs(List.of(dog1, dog2, dog3, dog4, dog5, dog6, dog7, dog8));

                // SCENARIO 1: Same points, different days
                // Dog1 and Dog2 both have 50 points total, but Dog2's last score is on Day 2
                // (should win tie)

                // Day 1 scores for Dog1 (50 points on day 1)
                ScoreDto score1Day1 = new ScoreDto(
                                1, "05:30:00", 1, "05:45:00",
                                new int[] { 1 },
                                new int[] { 50 },
                                10);

                // Day 1 and 2 scores for Dog2 (25 points on each day = 50 total)
                ScoreDto score2Day1 = new ScoreDto(
                                1, "05:30:00", 1, "05:45:00",
                                new int[] { 2 },
                                new int[] { 25 },
                                10);

                ScoreDto score2Day2 = new ScoreDto(
                                2, "05:30:00", 1, "05:45:00",
                                new int[] { 2 },
                                new int[] { 24 },
                                10);

                // SCENARIO 2: Same points, same day, different time buckets
                // Dog3 and Dog4 both have 40 points on day 1, but Dog3's last score is in a
                // later time bucket

                ScoreDto score3Day1 = new ScoreDto(
                                1, "05:30:00", 1, "06:15:00", // Later time bucket (bucket 4)
                                new int[] { 3 },
                                new int[] { 40 },
                                10);

                ScoreDto score4Day1 = new ScoreDto(
                                1, "05:30:00", 1, "05:45:00", // Earlier time bucket (bucket 1)
                                new int[] { 4 },
                                new int[] { 40 },
                                10);

                // SCENARIO 3: Same points, same day, same time bucket, different score points
                // Dog5 and Dog6 both have 30 points on day 1, same time bucket, but Dog5 has
                // higher individual score

                ScoreDto score5Day1 = new ScoreDto(
                                1, "05:30:00", 1, "05:35:00", // Same time bucket (bucket 0)
                                new int[] { 5 },
                                new int[] { 30 },
                                10);

                ScoreDto score6Day1 = new ScoreDto(
                                1, "05:30:00", 1, "05:35:00", // Same time bucket (bucket 0)
                                new int[] { 6 },
                                new int[] { 25 },
                                10);

                // Additional score for Dog6 to make total also 30
                ScoreDto score6Day1Additional = new ScoreDto(
                                1, "05:30:00", 1, "05:40:00", // Same day, different bucket
                                new int[] { 6 },
                                new int[] { 5 },
                                10);

                // SCENARIO 4: Dogs with no scores
                // Dog7 and Dog8 have no scores initially - should be sorted by dog number

                // Create all the scores
                dogService.createScore(score1Day1);
                dogService.createScore(score2Day1);
                dogService.createScore(score2Day2);
                dogService.createScore(score3Day1);
                dogService.createScore(score4Day1);
                dogService.createScore(score5Day1);
                dogService.createScore(score6Day1);
                dogService.createScore(score6Day1Additional);

                // TEST 1: getTopScoringDogsOverall
                List<Map<String, Object>> allDogs = dogService.getTopScoringDogsOverall(8);

                assertAll("Overall ranking tie-breaking tests",
                                // First, check the expected order of dogs
                                () -> assertEquals(8, allDogs.size()),

                                // Scenario 1: Dog2 should win tie with Dog1 due to later day
                                () -> assertEquals(2, allDogs.get(0).get("dogNumber")), // Dog2 has score on day 2
                                () -> assertEquals(1, allDogs.get(1).get("dogNumber")), // Dog1 only has score on day 1

                                // Scenario 2: Dog3 should win tie with Dog4 due to later time bucket
                                () -> assertEquals(3, allDogs.get(2).get("dogNumber")), // Dog3 has score in later
                                // bucket
                                () -> assertEquals(4, allDogs.get(3).get("dogNumber")), // Dog4 has score in earlier
                                // bucket

                                // Scenario 3: Dog6 should win tie with Dog5 due to later bucket score
                                () -> assertEquals(6, allDogs.get(4).get("dogNumber")),
                                () -> assertEquals(5, allDogs.get(5).get("dogNumber")),

                                // Scenario 4: Dog7 and Dog8 should be sorted by dog number (ascending)
                                () -> assertEquals(7, allDogs.get(6).get("dogNumber")), // Lower dog number
                                () -> assertEquals(8, allDogs.get(7).get("dogNumber")), // Higher dog number

                                // Verify tie scores are actually equal
                                () -> assertEquals(allDogs.get(0).get("totalPoints"),
                                                allDogs.get(1).get("totalPoints")), // Dog1 and Dog2
                                () -> assertEquals(allDogs.get(2).get("totalPoints"),
                                                allDogs.get(3).get("totalPoints")), // Dog3 and Dog4
                                () -> assertEquals(allDogs.get(4).get("totalPoints"),
                                                allDogs.get(5).get("totalPoints")), // Dog5 and Dog6
                                () -> assertEquals(allDogs.get(6).get("totalPoints"), allDogs.get(7).get("totalPoints")) // Dog7
                                                                                                                         // and
                                                                                                                         // Dog8
                );

                // TEST 2: getTopScoringDogsByDay (Day 1)
                List<Map<String, Object>> day1Dogs = dogService.getTopScoringDogsByDay(1, 8);

                assertAll("Day 1 ranking tie-breaking tests",
                                () -> assertEquals(6, day1Dogs.size()), // Only 6 dogs have scores on day 1

                                // Check expected order for dogs with same points on day 1
                                // All dogs with day 1 scores should be in descending order by points
                                () -> assertEquals(1, day1Dogs.get(0).get("dogNumber")), // Dog1 has 50 points on day 1

                                // Scenario 2: Dog3 and Dog4 both have 40 points
                                () -> assertEquals(3, day1Dogs.get(1).get("dogNumber")), // Dog3 has score in later
                                // bucket
                                () -> assertEquals(4, day1Dogs.get(2).get("dogNumber")), // Dog4 has score in earlier
                                // bucket

                                // Scenario 3: Dog5 and Dog6 both have 30 points
                                () -> assertEquals(6, day1Dogs.get(3).get("dogNumber")), // Dog5 has higher individual
                                // score
                                () -> assertEquals(5, day1Dogs.get(4).get("dogNumber")), // Dog6 has lower individual
                                // score

                                // Dog2 has lowest points on day 1
                                () -> assertEquals(2, day1Dogs.get(5).get("dogNumber")) // Dog2 has 25 points on day 1
                );

                // TEST 3: getTopScoringDogsByStakeType (ALL_AGE)
                List<Map<String, Object>> allAgeDogs = dogService.getTopScoringDogsByStakeType(StakeType.ALL_AGE, 4);

                assertAll("ALL_AGE ranking tie-breaking tests",
                                () -> assertEquals(4, allAgeDogs.size()),

                                // Scenario 1: Dog2 should win tie with Dog1 due to later day
                                () -> assertEquals(2, allAgeDogs.get(0).get("dogNumber")), // Dog2 has score on day 2
                                () -> assertEquals(1, allAgeDogs.get(1).get("dogNumber")), // Dog1 only has score on day
                                // 1

                                // Scenario 2: Dog3 should win tie with Dog4 due to later time bucket
                                () -> assertEquals(3, allAgeDogs.get(2).get("dogNumber")), // Dog3 has score in later
                                // bucket
                                () -> assertEquals(4, allAgeDogs.get(3).get("dogNumber")) // Dog4 has score in earlier
                                                                                          // bucket
                );

                // TEST 4: getTopScoringDogsByStakeType (DERBY)
                List<Map<String, Object>> derbyDogs = dogService.getTopScoringDogsByStakeType(StakeType.DERBY, 4);

                assertAll("DERBY ranking tie-breaking tests",
                                () -> assertEquals(4, derbyDogs.size()),

                                // Scenario 3: Dog5 should win tie with Dog6 due to higher individual score
                                () -> assertEquals(6, derbyDogs.get(0).get("dogNumber")), // Dog5 has higher individual
                                // score
                                () -> assertEquals(5, derbyDogs.get(1).get("dogNumber")), // Dog6 has lower individual
                                // score

                                // Scenario 4: Dog7 and Dog8 should be sorted by dog number (ascending)
                                () -> assertEquals(7, derbyDogs.get(2).get("dogNumber")), // Lower dog number
                                () -> assertEquals(8, derbyDogs.get(3).get("dogNumber")) // Higher dog number
                );

                // TEST 5: getTopScoringDogsByDayAndStakeType (Day 1, ALL_AGE)
                List<Map<String, Object>> day1AllAgeDogs = dogService.getTopScoringDogsByDayAndStakeType(1,
                                StakeType.ALL_AGE, 4);

                assertAll("Day 1 ALL_AGE ranking tie-breaking tests",
                                () -> assertEquals(4, day1AllAgeDogs.size()),

                                // Check expected order for ALL_AGE dogs on day 1
                                () -> assertEquals(1, day1AllAgeDogs.get(0).get("dogNumber")), // Dog1 has 50 points
                                () -> assertEquals(3, day1AllAgeDogs.get(1).get("dogNumber")), // Dog3 has 40 points,
                                // later bucket
                                () -> assertEquals(4, day1AllAgeDogs.get(2).get("dogNumber")), // Dog4 has 40 points,
                                // earlier bucket
                                () -> assertEquals(2, day1AllAgeDogs.get(3).get("dogNumber")) // Dog2 has 25 points
                );

                // Add an additional test with multiple scores on the same day

                // SCENARIO 5: Multiple scores on the same day, same time bucket
                // Give Dog1 and Dog2 more scores on day 3 with equal points, same time
                // Dog1 has a higher scoring bucket

                ScoreDto score1Day3a = new ScoreDto(
                                3, "05:30:00", 1, "05:45:00", // First bucket
                                new int[] { 1 },
                                new int[] { 20 },
                                10);

                ScoreDto score1Day3b = new ScoreDto(
                                3, "05:30:00", 1, "06:15:00", // Fourth bucket
                                new int[] { 1 },
                                new int[] { 30 },
                                10);

                ScoreDto score2Day3 = new ScoreDto(
                                3, "05:30:00", 1, "05:45:00", // First bucket
                                new int[] { 2 },
                                new int[] { 50 },
                                10);

                // Create the additional scores
                dogService.createScore(score1Day3a);
                dogService.createScore(score1Day3b);
                dogService.createScore(score2Day3);

                // Test getTopScoringDogsByDay for day 3
                List<Map<String, Object>> day3Dogs = dogService.getTopScoringDogsByDay(3, 8);

                assertAll("Day 3 ranking with multiple scores",
                                () -> assertEquals(2, day3Dogs.size()), // Only 2 dogs have scores on day 3

                                // On day 3, Dog1 has higher total (50) than Dog2 (also 50) but Dog1 has a score
                                // in a later bucket
                                () -> assertEquals(1, day3Dogs.get(0).get("dogNumber")), // Dog1 has score in bucket 4
                                () -> assertEquals(2, day3Dogs.get(1).get("dogNumber")) // Dog2 has score in bucket 1
                );
        }

        @Test
        @Transactional
        void testGetCrossInfo() {
                huntRepository.save(new HuntEntity("Cross Info Test Hunt", null, StakeType.ALL_AGE, 5));
                // Create test dogs
                DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1");
                DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2");
                DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire3", "Dam3");
                DogEntity dog4 = new DogEntity(4, "Dog4", StakeType.DERBY, "Owner4", "Sire4", "Dam4");

                dogService.createDogs(List.of(dog1, dog2, dog3, dog4));

                // Test case 1: Single-stake hunt (ALL_AGE)
                int[] numbers = { 1, 2 };
                int startingPoints = 35;
                int interval = 5;
                StakeType stakeType = StakeType.ALL_AGE;

                final List<Map<String, Object>> crossInfo = dogService.getCrossInfo(numbers, startingPoints, interval,
                                stakeType);

                assertAll("Single-stake hunt",
                                () -> assertEquals(2, crossInfo.size()),
                                () -> assertEquals(1, crossInfo.get(0).get("dogNumber")),
                                () -> assertEquals(35, crossInfo.get(0).get("points")),
                                () -> assertEquals(2, crossInfo.get(1).get("dogNumber")),
                                () -> assertEquals(30, crossInfo.get(1).get("points")));

                // Test case 2: Dual-stake hunt
                numbers = new int[] { 1, 3, 2, 4 };
                stakeType = StakeType.DUAL;

                final List<Map<String, Object>> crossInfo1 = dogService.getCrossInfo(numbers, startingPoints, interval,
                                stakeType);

                assertAll("Dual-stake hunt",
                                () -> assertEquals(4, crossInfo1.size()),
                                () -> assertEquals(1, crossInfo1.get(0).get("dogNumber")),
                                () -> assertEquals(35, crossInfo1.get(0).get("points")), // ALL_AGE starting points
                                () -> assertEquals(3, crossInfo1.get(1).get("dogNumber")),
                                () -> assertEquals(35, crossInfo1.get(1).get("points")), // DERBY starting points
                                () -> assertEquals(2, crossInfo1.get(2).get("dogNumber")),
                                () -> assertEquals(30, crossInfo1.get(2).get("points")), // ALL_AGE interval applied
                                () -> assertEquals(4, crossInfo1.get(3).get("dogNumber")),
                                () -> assertEquals(30, crossInfo1.get(3).get("points")) // DERBY interval applied
                );

                // Test case 3: Invalid dog numbers
                numbers = new int[] { 1, 999, 3 };
                stakeType = StakeType.ALL_AGE;

                final List<Map<String, Object>> crossInfo2 = dogService.getCrossInfo(numbers, startingPoints, interval,
                                stakeType);

                assertAll("Invalid dog numbers",
                                () -> assertEquals(3, crossInfo2.size()), // Only valid dogs are included
                                () -> assertEquals(1, crossInfo2.get(0).get("dogNumber")),
                                () -> assertEquals(35, crossInfo2.get(0).get("points")),
                                () -> assertEquals(999, crossInfo2.get(1).get("dogNumber")),
                                () -> assertNotNull(crossInfo2.get(1).get("error")),
                                () -> assertEquals(3, crossInfo2.get(2).get("dogNumber")),
                                () -> assertEquals(25, crossInfo2.get(2).get("points")));

                // Test case 4: Empty numbers array
                numbers = new int[] {};
                final List<Map<String, Object>> crossInfo3 = dogService.getCrossInfo(numbers, startingPoints, interval,
                                stakeType);

                assertAll("Empty numbers array",
                                () -> assertTrue(crossInfo3.isEmpty()));

                // Test case 5: Dual-stake hunt with only one stake type present
                numbers = new int[] { 1, 2 };
                stakeType = StakeType.DUAL;

                final List<Map<String, Object>> crossInfo4 = dogService.getCrossInfo(numbers, startingPoints, interval,
                                stakeType);

                assertAll("Dual-stake hunt with one stake type",
                                () -> assertEquals(2, crossInfo4.size()),
                                () -> assertEquals(1, crossInfo4.get(0).get("dogNumber")),
                                () -> assertEquals(35, crossInfo4.get(0).get("points")),
                                () -> assertEquals(2, crossInfo4.get(1).get("dogNumber")),
                                () -> assertEquals(30, crossInfo4.get(1).get("points")));

                // Test case 6: Dual-stake hunt with mixed stake types
                numbers = new int[] { 1, 3, 2, 4 };
                stakeType = StakeType.DUAL;

                final List<Map<String, Object>> crossInfo5 = dogService.getCrossInfo(numbers, startingPoints, interval,
                                stakeType);

                assertAll("Dual-stake hunt with mixed stake types",
                                () -> assertEquals(4, crossInfo5.size()),
                                () -> assertEquals(1, crossInfo5.get(0).get("dogNumber")),
                                () -> assertEquals(35, crossInfo5.get(0).get("points")), // ALL_AGE starting points
                                () -> assertEquals(3, crossInfo5.get(1).get("dogNumber")),
                                () -> assertEquals(35, crossInfo5.get(1).get("points")), // DERBY starting points
                                () -> assertEquals(2, crossInfo5.get(2).get("dogNumber")),
                                () -> assertEquals(30, crossInfo5.get(2).get("points")), // ALL_AGE interval applied
                                () -> assertEquals(4, crossInfo5.get(3).get("dogNumber")),
                                () -> assertEquals(30, crossInfo5.get(3).get("points")) // DERBY interval applied
                );
        }
}
