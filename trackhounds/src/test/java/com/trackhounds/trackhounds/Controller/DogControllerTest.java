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
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Repository.DogRepository;

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

  private final Gson gson = GsonUtil.GSON;

  /**
   * Sets up the test environment by clearing the dog repository before each test.
   */
  @BeforeEach
  void setUp() {
    dogRepository.deleteAll();
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
}
