package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.HuntRepository;

import jakarta.transaction.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@EntityScan(basePackageClasses = HuntEntity.class)
/**
 * Test class for HuntService.
 */
public class HuntServiceTest {
    /**
     * The service for the hunts.
     */
    @Autowired
    private HuntService huntService;
    /**
     * The repository for the hunts.
     */
    @Autowired
    private HuntRepository huntRepository;

    /**
     * Set up the test.
     */
    @BeforeEach
    public void setUp() {
        huntRepository.deleteAll();
    }

    /**
     * Test for createHunt.
     */
    @Test
    @Transactional
    void testCreateHunt() {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        HuntEntity savedHunt = huntService.createHunt(hunt);
        assertAll(() -> {
            assertEquals(hunt.getTitle(), savedHunt.getTitle());
            assertEquals(hunt.getHuntInterval(), savedHunt.getHuntInterval());
            assertTrue(savedHunt.getId() > 0);
            assertTrue(huntRepository.count() == 1);
        });
        HuntEntity hunt2 = new HuntEntity("", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, -1);
        assertAll("Error Test", () -> {
            assertThrows(TrackHoundsAPIException.class, () -> {
                huntService.createHunt(hunt2);
            });
        });
    }

    @Test
    @Transactional
    void testEditHunt() {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        huntService.createHunt(hunt);
        Map<String, String> fields = new HashMap<>();
        fields.put("title", "New Title");
        fields.put("dates", "Edited");
        HuntEntity editedHunt = huntService.editHunt(fields);
        assertAll("Test Edit Hunt Successful", () -> {
            assertEquals("New Title", editedHunt.getTitle());
            assertEquals("Edited", editedHunt.getDates());
        });
        assertAll("Test Edit Hunt Failed", () -> {
            assertThrows(TrackHoundsAPIException.class, () -> {
                huntService.editHunt(Map.of("title", ""));
            });
        });
    }

    @Test
    @Transactional
    void testGetHunt() {
        assertThrows(TrackHoundsAPIException.class, () -> {
            huntService.getHunt();
        });
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        HuntEntity savedHunt = huntService.createHunt(hunt);
        HuntEntity retrievedHunt = huntService.getHunt();
        assertAll("Test Get Hunt", () -> {
            assertEquals(savedHunt.getId(), retrievedHunt.getId());
            assertEquals(savedHunt.getTitle(), retrievedHunt.getTitle());
            assertEquals(savedHunt.getHuntInterval(), retrievedHunt.getHuntInterval());
        });
    }

    @Test
    @Transactional
    void testSetStakes() {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        HuntEntity saved = huntService.createHunt(hunt);
        assertAll("Test Set Stakes", () -> {
            assertEquals(StakeType.ALL_AGE, hunt.getStake());
            StakeType[] types = { StakeType.ALL_AGE, StakeType.DERBY, StakeType.ALL_AGE, StakeType.DERBY };
            int[] range = { 250, 400, 699 };
            saved.setStakeTypeRange(types);
            saved.setStakeRange(range);
            assertDoesNotThrow(() -> huntService.setStakes(saved));
            HuntEntity retrieved = huntService.getHunt();
            assertEquals(types, retrieved.getStakeTypeRange());
            assertEquals(range, retrieved.getStakeRange());
        });
    }
}
