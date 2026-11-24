package com.trackhounds.trackhounds.Controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Repository.AwardRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
import com.trackhounds.trackhounds.Service.DogService;

import jakarta.transaction.Transactional;

/**
 * The special awards endpoints, and the hunt details and pack-scoring setting
 * as the UI sends and reads them (the JSON names are the contract).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AwardControllerTest {

  @Autowired
  private MockMvc mvc;
  @Autowired
  private DogService dogService;
  @Autowired
  private AwardRepository awardRepository;
  @Autowired
  private HuntRepository huntRepository;

  @BeforeEach
  void setUp() {
    dogService.clear();
    huntRepository.deleteAll();
    dogService.createDogs(List.of(new DogEntity("12", "Rex", StakeType.ALL_AGE, "Ann Owner", "Sire", "Dam")));
  }

  @Test
  void awardsCanBeAddedListedChangedAndRemoved() throws Exception {
    mvc.perform(post("/awards").contentType(MediaType.APPLICATION_JSON)
        .content("{\"title\":\"Best Mouth\",\"dogNumber\":\"12\",\"notes\":\"\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Best Mouth"))
        .andExpect(jsonPath("$.dogName").value("Rex"))
        .andExpect(jsonPath("$.stake").value("ALL_AGE"));

    mvc.perform(get("/awards").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].dogNumber").value("12"))
        .andExpect(jsonPath("$[0].owner").value("Ann Owner"));

    Long id = awardRepository.findAll().get(0).getId();
    mvc.perform(put("/awards/" + id).contentType(MediaType.APPLICATION_JSON)
        .content("{\"title\":\"Classiest Hound\",\"dogNumber\":\"12\",\"notes\":\"By acclaim\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Classiest Hound"))
        .andExpect(jsonPath("$.notes").value("By acclaim"));

    mvc.perform(post("/awards").contentType(MediaType.APPLICATION_JSON)
        .content("{\"title\":\"Best Mouth\",\"dogNumber\":\"99\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.fields.dogNumber").value("Dog 99 is not registered in this hunt."));

    mvc.perform(delete("/awards/" + id)).andExpect(status().isOk());
    assertEquals(0, awardRepository.count());
  }

  @Test
  void huntDetailsAndPackScoringTravelAsJson() throws Exception {
    String hunt = "{\"title\":\"Spring Trial\",\"dates\":\"March 2026\",\"stake\":\"ALL_AGE\",\"huntInterval\":5,"
        + "\"pointStep\":5,\"firstDogPoints\":35,\"huntDays\":3,\"city\":\"Ocala\",\"state\":\"FL\","
        + "\"president\":\"Pat President\",\"masterOfHounds\":\"Morgan Master\",\"packScoring\":true,\"packMinimumPoints\":15,"
        + "\"stakeTypeRange\":[\"ALL_AGE\",\"ALL_AGE\",\"ALL_AGE\",\"ALL_AGE\"],\"stakeRange\":[0,0,0,0]}";
    mvc.perform(post("/hunt").contentType(MediaType.APPLICATION_JSON).content(hunt))
        .andExpect(status().isOk());

    mvc.perform(get("/hunt").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.city").value("Ocala"))
        .andExpect(jsonPath("$.state").value("FL"))
        .andExpect(jsonPath("$.president").value("Pat President"))
        .andExpect(jsonPath("$.masterOfHounds").value("Morgan Master"))
        .andExpect(jsonPath("$.packScoring").value(true))
        .andExpect(jsonPath("$.packMinimumPoints").value(15));

    // The points the score entry page proposes follow the setting.
    dogService.createDogs(List.of(
        new DogEntity("1", "One", StakeType.ALL_AGE, "O", "S", "D"),
        new DogEntity("2", "Two", StakeType.ALL_AGE, "O", "S", "D")));
    mvc.perform(post("/dogs/cross-info").contentType(MediaType.APPLICATION_JSON)
        .content("{\"dogNumbers\":[\"1\",\"2\",\"12\"],\"startingPoints\":20,\"interval\":5,\"stakeType\":\"ALL_AGE\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].points").value(20))
        .andExpect(jsonPath("$[1].points").value(15))
        .andExpect(jsonPath("$[2].points").value(15));
  }
}
