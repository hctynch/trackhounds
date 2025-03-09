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
    ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 }, 10);
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

    ScoreDto score = new ScoreDto(1, "05:30:00", 1, "05:45:00", new int[] { 1, 2, 3 }, new int[] { 35, 30, 25 }, 10);
    mvc.perform(post("/dogs/scores")
        .contentType(MediaType.APPLICATION_JSON)
        .content(gson.toJson(score)))
        .andExpect(status().isOk());

    Long scoreId = dogService.getDogByNumber(1).getScores().get(0).getTimeBucketScores().get(0).getScore().getId();
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
}
