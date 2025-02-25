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
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Repository.JudgeRepository;

import jakarta.transaction.Transactional;

/**
 * Test class for JudgeController.
 * This class contains unit tests for all the endpoints exposed by the
 * JudgeController.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureJdbc
@ActiveProfiles("test")
public class JudgeControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JudgeRepository judgeRepository;

    private final Gson gson = GsonUtil.GSON;

    /**
     * Sets up the test environment by clearing the judge repository before each
     * test.
     */
    @BeforeEach
    void setUp() {
        judgeRepository.deleteAll();
    }

    /**
     * Tests the deletion of a judge by its number.
     */
    @Test
    @Transactional
    void testDeleteJudge() throws Exception {
        JudgeEntity judge = new JudgeEntity(1, "1234", "TestJudge");
        judgeRepository.save(judge);
        assertTrue(judgeRepository.count() > 0);

        mvc.perform(delete("/judges/1").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        assertEquals(0, judgeRepository.count());
    }

    /**
     * Tests retrieving all judges from the database.
     */
    @Test
    @Transactional
    void testGetAllJudges() throws Exception {
        judgeRepository.saveAll(List.of(
                new JudgeEntity(1, "1234", "Judge1"),
                new JudgeEntity(2, "5678", "Judge2")));

        mvc.perform(get("/judges").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    /**
     * Tests retrieving the total count of judges in the repository.
     */
    @Test
    @Transactional
    void testGetJudgeCount() throws Exception {
        judgeRepository.saveAll(List.of(
                new JudgeEntity(1, "1234", "Judge1"),
                new JudgeEntity(2, "5678", "Judge2")));

        mvc.perform(get("/judges/total").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("2"));
    }

    /**
     * Tests creating a new judge using the POST endpoint.
     */
    @Test
    @Transactional
    void testPostJudge() throws Exception {
        JudgeEntity judge = new JudgeEntity(1, "1234", "NewJudge");

        mvc.perform(post("/judges").contentType(MediaType.APPLICATION_JSON)
                .content(gson.toJson(judge)))
                .andExpect(status().isOk());

        assertEquals(1, judgeRepository.count());
    }

    /**
     * Tests updating an existing judge using the PUT endpoint.
     */
    @Test
    @Transactional
    void testUpdateJudge() throws Exception {
        JudgeEntity judge = new JudgeEntity(1, "1234", "OldName");
        judgeRepository.save(judge);

        JudgeEntity updatedJudge = new JudgeEntity(1, "5678", "UpdatedName");

        mvc.perform(put("/judges").contentType(MediaType.APPLICATION_JSON)
                .content(gson.toJson(updatedJudge)))
                .andExpect(status().isOk());

        JudgeEntity retrievedJudge = judgeRepository.findById(1).orElse(null);
        assertNotNull(retrievedJudge);
        assertEquals("UpdatedName", retrievedJudge.getName());
    }
}
