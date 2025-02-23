package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.JudgeRepository;

import jakarta.transaction.Transactional;

/**
 * Test class for the JudgeService.
 */
@SpringBootTest
@ActiveProfiles("test")
public class JudgeServiceTest {

    /**
     * The service for the judges.
     */
    @Autowired
    private JudgeService judgeService;

    /**
     * The repository for the judges.
     */
    @Autowired
    private JudgeRepository judgeRepository;

    /**
     * Setup method to clear the database before each test.
     */
    @BeforeEach
    void setup() {
        judgeRepository.deleteAll();
    }

    /**
     * Test adding a judge.
     */
    @Test
    @Transactional
    void testAddJudge() {
        JudgeEntity judge = new JudgeEntity(1, "123-4444", "John Doe");
        JudgeEntity addedJudge = judgeService.addJudge(judge);
        assertAll("Add Judge", () -> {
            assertNotNull(addedJudge);
            assertEquals(judge.getNumber(), addedJudge.getNumber());
            assertEquals(judge.getMemberPin(), addedJudge.getMemberPin());
            assertEquals(judge.getName(), addedJudge.getName());
            assertEquals(1, (int) judgeRepository.count());
        });

        assertAll("Invalid Judge", () -> {
            JudgeEntity invalidJudge = new JudgeEntity(-1, "123-4444", "John Doe");
            try {
                judgeService.addJudge(invalidJudge);
            } catch (TrackHoundsAPIException e) {
                Map<String, String> errs = e.getFields();
                assertEquals("Invalid Fields", e.getMessage());
                assertEquals(1, errs.size());
                assertEquals("Number cannot be negative.", errs.get("number"));
            }

            invalidJudge = new JudgeEntity(1, "123-4444", "");
            try {
                judgeService.addJudge(invalidJudge);
            } catch (TrackHoundsAPIException e) {
                Map<String, String> errs = e.getFields();
                assertEquals("Invalid Fields", e.getMessage());
                assertEquals(2, errs.size());
                assertEquals("Name cannot be empty.", errs.get("name"));
                assertEquals("Number already exists.", errs.get("number"));
            }
        });

    }

    /**
     * Test deleting a judge.
     */
    @Test
    void testDeleteJudge() {
        assertEquals(0, judgeRepository.count());
        JudgeEntity judge = new JudgeEntity(1, "123-4444", "John Doe");
        judgeRepository.save(judge);
        assertEquals(1, judgeRepository.count());
        assertDoesNotThrow(() -> judgeService.deleteJudge(1));
        assertEquals(0, judgeRepository.count());
    }

    /**
     * Test getting all judges.
     */
    @Test
    void testGetAllJudges() {
        JudgeEntity judge = new JudgeEntity(1, "123-4444", "John Doe");
        JudgeEntity judge2 = new JudgeEntity(2, "123-4444", "Jane Doe");
        JudgeEntity judge3 = new JudgeEntity(3, "123-4444", "John Smith");
        assertAll("Save and Get All Judges", () -> {
            JudgeEntity added1 = judgeService.addJudge(judge);
            JudgeEntity added2 = judgeService.addJudge(judge2);
            JudgeEntity added3 = judgeService.addJudge(judge3);
            assertEquals(3, judgeRepository.count());
            List<JudgeEntity> judges = judgeService.getAllJudges();
            assertNotNull(judges);
            assertEquals(3, judges.size());
            assertTrue(judges.contains(added1));
            assertTrue(judges.contains(added2));
            assertTrue(judges.contains(added3));
        });
    }

    /**
     * Test getting the judge count.
     */
    @Test
    void testGetJudgeCount() {
        assertEquals(0, judgeService.getJudgeCount());
        JudgeEntity judge = new JudgeEntity(1, "123-4444", "John Doe");
        JudgeEntity judge2 = new JudgeEntity(2, "123-4444", "Jane Doe");
        JudgeEntity judge3 = new JudgeEntity(3, "123-4444", "John Smith");
        judgeRepository.save(judge);
        judgeRepository.save(judge2);
        judgeRepository.save(judge3);
        assertEquals(3, judgeService.getJudgeCount());
    }

    /**
     * Test updating a judge.
     */
    @Test
    void testUpdateJudge() {
        JudgeEntity judge = new JudgeEntity(1, "123-4444", "John Doe");
        judgeRepository.save(judge);
        JudgeEntity updatedJudge = new JudgeEntity(1, "123-4444", "Jane Doe");
        JudgeEntity returnedJudge = judgeService.updateJudge(updatedJudge);
        assertAll("Update Judge", () -> {
            assertNotNull(returnedJudge);
            assertEquals(judge.getNumber(), returnedJudge.getNumber());
            assertEquals(updatedJudge.getName(), returnedJudge.getName());
            assertEquals(updatedJudge.getMemberPin(), returnedJudge.getMemberPin());
        });

        assertAll("Invalid Judge", () -> {
            JudgeEntity invalidJudge = new JudgeEntity(1, "123-4444", "");
            try {
                judgeService.updateJudge(invalidJudge);
            } catch (TrackHoundsAPIException e) {
                Map<String, String> errs = e.getFields();
                assertEquals("Invalid Fields", e.getMessage());
                assertEquals(1, errs.size());
                assertEquals("Name cannot be empty.", errs.get("name"));
            }
        });
    }
}
