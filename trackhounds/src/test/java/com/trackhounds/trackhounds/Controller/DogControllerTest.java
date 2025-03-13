package com.trackhounds.trackhounds.Controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureJdbc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.google.gson.Gson;
import com.trackhounds.trackhounds.GsonUtil;
import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Entity.Scratch;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Repository.DogRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;
import com.trackhounds.trackhounds.Repository.ScoreRepository;
import com.trackhounds.trackhounds.Repository.ScratchRepository;
import com.trackhounds.trackhounds.Service.DogService;

import jakarta.transaction.Transactional;

/**
 * Test class for DogController.
 * This class contains unit tests for all the endpoints exposed by the
 * DogController.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureJdbc
@ActiveProfiles("test")
public class DogControllerTest {

        @Autowired
        private MockMvc mvc;

        @Autowired
        private DogRepository dogRepository;

        @Autowired
        private DogService dogService;

        @Autowired
        private JudgeRepository judgeRepository;

        @Autowired
        private ScoreRepository scoreRepository;

        @Autowired
        private ScratchRepository scratchRepository;

        private final Gson gson = GsonUtil.GSON;

        /**
         * Sets up the test environment by clearing the dog repository before each test.
         */
        @BeforeEach
        void setUp() {
                dogService.clear();
                judgeRepository.deleteAll();
                scoreRepository.deleteAll();
                judgeRepository.save(new JudgeEntity(1, "PIN", "Judgy Judge"));
        }

        /**
         * Tests the deletion of a dog by its number.
         */
        @Test
        @Transactional
        void testDeleteDog() throws Exception {
                DogEntity dog = new DogEntity(1, "TestDog", StakeType.ALL_AGE, "", "", "");
                dogRepository.save(dog);
                assertTrue(dogRepository.count() > 0);

                mvc.perform(delete("/dogs/1").contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk());

                assertEquals(0, dogRepository.count());
        }

        /**
         * Tests retrieving all dogs from the database.
         */
        @Test
        @Transactional
        void testGetAllDogs() throws Exception {
                dogRepository.saveAll(List.of(
                                new DogEntity(1, "Dog1", StakeType.ALL_AGE, "", "", ""),
                                new DogEntity(2, "Dog2", StakeType.DERBY, "", "", "")));

                mvc.perform(get("/dogs").accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2));
        }

        /**
         * Tests retrieving a specific dog by its number.
         */
        @Test
        @Transactional
        void testGetDog() throws Exception {
                dogRepository.save(new DogEntity(1, "TestDog", StakeType.ALL_AGE, "", "", ""));

                mvc.perform(get("/dogs/1").accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value("TestDog"));
        }

        /**
         * Tests retrieving the total count of dogs in the repository.
         */
        @Test
        @Transactional
        void testGetDogTotal() throws Exception {
                dogRepository.saveAll(List.of(
                                new DogEntity(1, "Dog1", StakeType.ALL_AGE, "", "", ""),
                                new DogEntity(2, "Dog2", StakeType.DERBY, "", "", "")));

                mvc.perform(get("/dogs/total").accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(content().string("2"));
        }

        /**
         * Tests creating new dogs using the POST endpoint.
         */
        @Test
        @Transactional
        void testPostDogs() throws Exception {
                DogEntity dog = new DogEntity(1, "NewDog", StakeType.ALL_AGE, "", "", "");

                mvc.perform(post("/dogs").contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(List.of(dog))))
                                .andExpect(status().isOk());

                assertEquals(1, dogRepository.count());
        }

        /**
         * Tests updating an existing dog using the PUT endpoint.
         */
        @Test
        @Transactional
        void testPutDog() throws Exception {
                DogEntity dog = new DogEntity(1, "OldName", StakeType.ALL_AGE, "", "", "");
                dogRepository.save(dog);

                DogEntity updatedDog = new DogEntity(1, "UpdatedName", StakeType.ALL_AGE, "", "", "");

                mvc.perform(put("/dogs").contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(updatedDog)))
                                .andExpect(status().isOk());

                DogEntity retrievedDog = dogRepository.findById(1).orElse(null);
                assertNotNull(retrievedDog);
                assertEquals("UpdatedName", retrievedDog.getName());
        }

        /**
         * Tests creating a score using the POST /dogs/scores endpoint.
         */
        @Test
        @Transactional
        void testPostScores() throws Exception {
                ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 },
                                new int[] { 35, 30, 25 },
                                10);
                dogRepository.save(new DogEntity(1, "TestDog", StakeType.ALL_AGE, "", "", ""));
                dogRepository.save(new DogEntity(2, "TestDog2", StakeType.ALL_AGE, "", "", ""));
                dogRepository.save(new DogEntity(3, "TestDog3", StakeType.ALL_AGE, "", "", ""));
                judgeRepository.save(new JudgeEntity(1, "PIN", "TestJudge"));
                mvc.perform(post("/dogs/scores").contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(score)))
                                .andExpect(status().isOk());
                DogEntity dog = dogRepository.findById(1).get();
                assertEquals(35, dog.getPoints());
                DogEntity dog2 = dogRepository.findById(2).get();
                assertEquals(30, dog2.getPoints());
                DogEntity dog3 = dogRepository.findById(3).get();
                assertEquals(25, dog3.getPoints());
        }

        /**
         * Tests deleting a score using the DELETE /dogs/{dogNumber}/scores/{scoreId}
         * endpoint.
         */
        @Test
        @Transactional
        void testDeleteScore() throws Exception {
                DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
                DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
                DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
                dogService.createDogs(List.of(dog1, dog2, dog3));

                ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 },
                                new int[] { 35, 30, 25 },
                                10);
                mvc.perform(post("/dogs/scores")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(score)))
                                .andExpect(status().isOk());

                Long scoreId = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore()
                                .getId();
                mvc.perform(delete("/dogs/1/scores/" + scoreId)
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk());

                DogEntity updatedDog = dogService.getDogByNumber(1);
                assertNotNull(updatedDog);
                assertTrue(updatedDog.getScores().get(0).getTimeBucketScores().isEmpty());
                assertTrue(updatedDog.getScores().get(0).getHighestScores().isEmpty());
                assertEquals(0, updatedDog.getPoints());
        }

        /**
         * Tests the creation of a scratch using the POST /dogs/scratches endpoint.
         */
        @Test
        @Transactional
        void testPostScratch() throws Exception {
                // First create a dog to scratch
                DogEntity dog = new DogEntity(1, "TestDog", StakeType.ALL_AGE, "", "", "");
                dogRepository.save(dog);

                // Create the scratch request
                Scratch scratch = new Scratch();
                scratch.setDogNumber(1);
                scratch.setJudgeNumber(1);
                scratch.setTime(LocalTime.of(9, 30));
                scratch.setReason("Test reason");

                mvc.perform(post("/dogs/scratches")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(scratch)))
                                .andExpect(status().isOk());

                // Verify dog is marked as scratched
                DogEntity scratchedDog = dogRepository.findById(1).orElse(null);
                assertNotNull(scratchedDog);
                assertTrue(scratchedDog.isScratched());

                // Verify scratch is saved in repository
                List<Scratch> scratches = scratchRepository.findAll();
                assertEquals(1, scratches.size());
                assertEquals("Test reason", scratches.get(0).getReason());
                assertEquals(1, scratches.get(0).getDogNumber());
        }

        /**
         * Tests getting all scratches using the GET /dogs/scratches endpoint.
         */
        @Test
        @Transactional
        void testGetScratches() throws Exception {
                // Create dogs
                DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "", "", "");
                DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "", "", "");
                dogRepository.saveAll(List.of(dog1, dog2));

                // Create scratches
                Scratch scratch1 = new Scratch();
                scratch1.setDogNumber(1);
                scratch1.setJudgeNumber(1);
                scratch1.setTime(LocalTime.of(9, 30));
                scratch1.setReason("Reason 1");

                Scratch scratch2 = new Scratch();
                scratch2.setDogNumber(2);
                scratch2.setJudgeNumber(1);
                scratch2.setTime(LocalTime.of(10, 15));
                scratch2.setReason("Reason 2");

                // Save scratches and mark dogs as scratched
                scratchRepository.save(scratch1);
                scratchRepository.save(scratch2);
                dog1.setScratched(true);
                dog2.setScratched(true);
                dogRepository.saveAll(List.of(dog1, dog2));

                mvc.perform(get("/dogs/scratches")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].reason").value("Reason 1"))
                                .andExpect(jsonPath("$[1].reason").value("Reason 2"));
        }

        /**
         * Tests deleting a scratch using the DELETE /dogs/scratches/{id} endpoint.
         */
        @Test
        @Transactional
        void testDeleteScratch() throws Exception {
                // Create dog and scratch
                DogEntity dog = new DogEntity(1, "TestDog", StakeType.ALL_AGE, "", "", "");
                dogRepository.save(dog);

                Scratch scratch = new Scratch();
                scratch.setDogNumber(1);
                scratch.setJudgeNumber(1);
                scratch.setTime(LocalTime.of(9, 30));
                scratch.setReason("Test reason");

                Scratch savedScratch = scratchRepository.save(scratch);
                dog.setScratched(true);
                dogRepository.save(dog);

                // Verify scratch exists
                assertEquals(1, scratchRepository.count());

                mvc.perform(delete("/dogs/scratches/" + savedScratch.getId())
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk());

                // Verify scratch was deleted
                assertEquals(0, scratchRepository.count());
        }

        /**
         * Sets up test data for dog scores tests.
         * Creates dogs and adds scores for different days.
         */
        private void setupTestScores() throws Exception {
                // Create test dogs
                dogRepository.saveAll(List.of(
                                new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1"),
                                new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2"),
                                new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire3", "Dam3")));

                // Make sure we have at least two judges
                judgeRepository.save(new JudgeEntity(2, "PIN2", "Judge2"));

                // Add scores for day 1
                ScoreDto scoreDay1 = new ScoreDto(
                                1, "05:30:00", 1, "05:45:00",
                                new int[] { 1, 2, 3 },
                                new int[] { 40, 30, 20 },
                                10);

                // Add scores for day 2
                ScoreDto scoreDay2 = new ScoreDto(
                                2, "06:30:00", 1, "06:45:00",
                                new int[] { 1, 2, 3 },
                                new int[] { 25, 35, 15 },
                                10);

                // Create the scores
                mvc.perform(post("/dogs/scores")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(scoreDay1)))
                                .andExpect(status().isOk());

                mvc.perform(post("/dogs/scores")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(scoreDay2)))
                                .andExpect(status().isOk());
        }

        /**
         * Tests getting dog scores by day using the GET /dogs/scores/day/{day}
         * endpoint.
         */
        @Test
        @Transactional
        void testGetDogScoresByDay() throws Exception {
                setupTestScores();

                // Test day 1 scores
                mvc.perform(get("/dogs/scores/day/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(3))
                                .andExpect(jsonPath("$[0].dogNumber").value(1))
                                .andExpect(jsonPath("$[0].dogName").value("Dog1"))
                                .andExpect(jsonPath("$[0].totalPoints").exists());

                // Test day with no scores
                mvc.perform(get("/dogs/scores/day/3")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));
        }

        /**
         * Tests getting top scoring dogs for a specific day with a limit using the
         * GET /dogs/scores/day/{day}/top/{limit} endpoint.
         */
        @Test
        @Transactional
        void testGetTopScoringDogsByDay() throws Exception {
                setupTestScores();

                // Test getting top 2 dogs for day 1
                mvc.perform(get("/dogs/scores/day/1/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].dogNumber").value(1)) // Dog1 should be first (40 points)
                                .andExpect(jsonPath("$[1].dogNumber").value(2)); // Dog2 should be second (30 points)

                // Test getting top 2 dogs for day 2
                mvc.perform(get("/dogs/scores/day/2/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].dogNumber").value(2)) // Dog2 should be first (35 points)
                                .andExpect(jsonPath("$[1].dogNumber").value(1)); // Dog1 should be second (25 points)

                // Test day with no scores
                mvc.perform(get("/dogs/scores/day/3/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                // Test with limit higher than available dogs
                mvc.perform(get("/dogs/scores/day/1/top/10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(3)); // Should return all 3 dogs
        }

        /**
         * Tests getting top 10 scoring dogs for a specific day using the
         * GET /dogs/scores/day/{day}/top10 endpoint.
         */
        @Test
        @Transactional
        void testGetTop10ScoringDogsByDay() throws Exception {
                setupTestScores();

                // Test getting top 10 dogs for day 1
                mvc.perform(get("/dogs/scores/day/1/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(3)) // Should return all 3 dogs
                                .andExpect(jsonPath("$[0].dogNumber").value(1)) // Dog1 should be first (40 points)
                                .andExpect(jsonPath("$[1].dogNumber").value(2)) // Dog2 should be second (30 points)
                                .andExpect(jsonPath("$[2].dogNumber").value(3)); // Dog3 should be third (20 points)

                // Test day with no scores
                mvc.perform(get("/dogs/scores/day/3/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));
        }

        /**
         * Tests getting top 10 scoring dogs overall using the
         * GET /dogs/scores/top10/overall endpoint.
         */
        @Test
        @Transactional
        void testGetTop10ScoringDogsOverall() throws Exception {
                setupTestScores();

                // Verify dog points from both days are combined
                DogEntity dog1 = dogRepository.findById(1).get();
                DogEntity dog2 = dogRepository.findById(2).get();
                DogEntity dog3 = dogRepository.findById(3).get();

                assertEquals(65, dog1.getPoints()); // 40 + 25 = 65
                assertEquals(65, dog2.getPoints()); // 30 + 35 = 65
                assertEquals(35, dog3.getPoints()); // 20 + 15 = 35

                // Test getting top 10 dogs overall
                mvc.perform(get("/dogs/scores/top10/overall")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(3)) // Should return all 3 dogs
                                // Dogs 1 and 2 have the same total (65), so either could be first/second
                                // Only check Dog3 is last since it has lowest score
                                .andExpect(jsonPath("$[2].dogNumber").value(3)) // Dog3 should be third (35 points)
                                .andExpect(jsonPath("$[2].totalPoints").value(35));
        }

        /**
         * Tests edge cases for score endpoints.
         */
        @Test
        @Transactional
        void testScoreEndpointsEdgeCases() throws Exception {
                // Test with no dogs in database
                mvc.perform(get("/dogs/scores/day/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                mvc.perform(get("/dogs/scores/day/1/top/10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                mvc.perform(get("/dogs/scores/day/1/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                mvc.perform(get("/dogs/scores/top10/overall")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                // Create dogs with no scores
                dogRepository.saveAll(List.of(
                                new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1"),
                                new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire2", "Dam2")));

                // Test overall scores with dogs that have no scores
                mvc.perform(get("/dogs/scores/top10/overall")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].totalPoints").value(0))
                                .andExpect(jsonPath("$[1].totalPoints").value(0));
        }

        /**
         * Test getting top scoring dogs by stake type with a limit
         */
        @Test
        @Transactional
        void testGetTopScoringDogsByStakeType() throws Exception {
                // Set up test data
                setupTestScores();

                // Test getting top 2 ALL_AGE dogs
                mvc.perform(get("/dogs/scores/stake/ALL_AGE/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].stake").value("ALL_AGE"));

                // Test getting top 2 DERBY dogs
                mvc.perform(get("/dogs/scores/stake/DERBY/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].stake").value("DERBY"));

                // Test with invalid stake type
                mvc.perform(get("/dogs/scores/stake/INVALID/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());
        }

        /**
         * Test getting top 10 scoring dogs by stake type
         */
        @Test
        @Transactional
        void testGetTop10ScoringDogsByStakeType() throws Exception {
                // Set up test data
                setupTestScores();

                // Test getting top 10 ALL_AGE dogs
                mvc.perform(get("/dogs/scores/stake/ALL_AGE/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].stake").value("ALL_AGE"));

                // Test getting top 10 DERBY dogs
                mvc.perform(get("/dogs/scores/stake/DERBY/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].stake").value("DERBY"));

                // Test with invalid stake type
                mvc.perform(get("/dogs/scores/stake/INVALID/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());
        }

        /**
         * Test getting top scoring dogs by day and stake type with a limit
         */
        @Test
        @Transactional
        void testGetTopScoringDogsByDayAndStakeType() throws Exception {
                // Set up test data
                setupTestScores();

                // Test getting top 2 ALL_AGE dogs for day 1
                mvc.perform(get("/dogs/scores/day/1/stake/ALL_AGE/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].stake").value("ALL_AGE"));

                // Test getting top 2 DERBY dogs for day 1
                mvc.perform(get("/dogs/scores/day/1/stake/DERBY/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].stake").value("DERBY"));

                // Test with invalid stake type
                mvc.perform(get("/dogs/scores/day/1/stake/INVALID/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());

                // Test with non-existent day
                mvc.perform(get("/dogs/scores/day/99/stake/ALL_AGE/top/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));
        }

        /**
         * Test getting top 10 scoring dogs by day and stake type
         */
        @Test
        @Transactional
        void testGetTop10ScoringDogsByDayAndStakeType() throws Exception {
                // Set up test data
                setupTestScores();

                // Test getting top 10 ALL_AGE dogs for day 1
                mvc.perform(get("/dogs/scores/day/1/stake/ALL_AGE/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2))
                                .andExpect(jsonPath("$[0].stake").value("ALL_AGE"));

                // Test getting top 10 DERBY dogs for day 1
                mvc.perform(get("/dogs/scores/day/1/stake/DERBY/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].stake").value("DERBY"));

                // Test with invalid stake type
                mvc.perform(get("/dogs/scores/day/1/stake/INVALID/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());

                // Test with no scores for the day
                mvc.perform(get("/dogs/scores/day/3/stake/ALL_AGE/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));
        }

        /**
         * Test edge cases for stake type filtering endpoints
         */
        @Test
        @Transactional
        void testStakeTypeFilteringEdgeCases() throws Exception {
                // Test with empty database
                mvc.perform(get("/dogs/scores/stake/ALL_AGE/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                // Create dogs with different stake types but no scores
                dogRepository.saveAll(List.of(
                                new DogEntity(1, "AllAge1", StakeType.ALL_AGE, "Owner1", "Sire1", "Dam1"),
                                new DogEntity(2, "Derby1", StakeType.DERBY, "Owner2", "Sire2", "Dam2")));

                // Test with dogs that have no scores
                mvc.perform(get("/dogs/scores/stake/ALL_AGE/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].dogNumber").value(1))
                                .andExpect(jsonPath("$[0].totalPoints").value(0));

                // Test with zero limit
                mvc.perform(get("/dogs/scores/stake/ALL_AGE/top/0")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                // Test case insensitivity of stake type
                mvc.perform(get("/dogs/scores/stake/all_age/top10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1));
        }

        /**
         * Test getting scores by dog number
         */
        @Test
        @Transactional
        void testGetScoresByDogNumber() throws Exception {
                setupTestScores();

                // Test getting scores for dog #1
                mvc.perform(get("/dogs/1/scores")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(2)) // Dog 1 has scores on 2 days
                                .andExpect(jsonPath("$[0].dogNumber").value(1))
                                .andExpect(jsonPath("$[1].dogNumber").value(1));

                // Test getting scores for non-existent dog
                mvc.perform(get("/dogs/999/scores")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());

                // Test getting scores for dog with no scores
                // First create a dog with no scores
                dogRepository.save(new DogEntity(10, "NoScores", StakeType.ALL_AGE, "Owner", "Sire", "Dam"));

                mvc.perform(get("/dogs/10/scores")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));
        }

        /**
         * Test getting scores by judge number
         */
        @Test
        @Transactional
        void testGetScoresByJudgeNumber() throws Exception {
                setupTestScores();

                // Test getting scores for judge #1
                mvc.perform(get("/dogs/scores/judge/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").isNumber())
                                .andExpect(jsonPath("$[0].judgeNumber").value(1));

                // Test getting scores for non-existent judge
                mvc.perform(get("/dogs/scores/judge/999")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());

                // Test getting scores for judge with no scores
                // First create a judge with no scores
                judgeRepository.save(new JudgeEntity(10, "PIN10", "No Scores Judge"));

                mvc.perform(get("/dogs/scores/judge/10")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));
        }

        /**
         * Test getting scores by dog number and day
         */
        @Test
        @Transactional
        void testGetScoresByDogNumberAndDay() throws Exception {
                setupTestScores();

                // Test getting scores for dog #1 on day 1
                mvc.perform(get("/dogs/1/scores/day/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].dogNumber").value(1))
                                .andExpect(jsonPath("$[0].day").value(1));

                // Test getting scores for dog #1 on day 2
                mvc.perform(get("/dogs/1/scores/day/2")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(1))
                                .andExpect(jsonPath("$[0].dogNumber").value(1))
                                .andExpect(jsonPath("$[0].day").value(2));

                // Test getting scores for a non-existent day
                mvc.perform(get("/dogs/1/scores/day/99")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                // Test getting scores for a non-existent dog
                mvc.perform(get("/dogs/999/scores/day/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());
        }

        /**
         * Test getting scores by judge number and day
         */
        @Test
        @Transactional
        void testGetScoresByJudgeNumberAndDay() throws Exception {
                setupTestScores();

                // Ensure we have scores from different judges on different days
                // Add a score from judge 2 on day 1
                ScoreDto scoreJudge2Day1 = new ScoreDto(
                                1, "08:30:00", 2, "08:45:00",
                                new int[] { 3 },
                                new int[] { 35 },
                                10);
                mvc.perform(post("/dogs/scores")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(gson.toJson(scoreJudge2Day1)))
                                .andExpect(status().isOk());

                // Test getting scores for judge #1 on day 1
                mvc.perform(get("/dogs/scores/judge/1/day/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].judgeNumber").value(1))
                                .andExpect(jsonPath("$[0].day").value(1));

                // Test getting scores for judge #2 on day 1
                mvc.perform(get("/dogs/scores/judge/2/day/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].judgeNumber").value(2))
                                .andExpect(jsonPath("$[0].day").value(1));

                // Test getting scores for a non-existent day
                mvc.perform(get("/dogs/scores/judge/1/day/99")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.length()").value(0));

                // Test getting scores for a non-existent judge
                mvc.perform(get("/dogs/scores/judge/999/day/1")
                                .accept(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());
        }
}
