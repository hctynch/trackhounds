package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
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
        // huntRepository.deleteAll();
    }

    /**
     * Test for createHunt.
     */
    @Test
    void testCreateHunt() {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        HuntEntity savedHunt = huntService.createHunt(hunt);
        assertAll(() -> {
            assertEquals(hunt.getTitle(), savedHunt.getTitle());
            assertEquals(hunt.getHuntInterval(), savedHunt.getHuntInterval());
            assertTrue(savedHunt.getId() > 0);
            assertTrue(huntRepository.count() == 1);
        });
    }

    @Test
    @Transactional
    void testEditHunt() {

    }

    @Test
    @Transactional
    void testGetHunt() {

    }

    @Test
    @Transactional
    void testSetStakes() {

    }
}
