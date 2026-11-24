package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
        HuntEntity edit = new HuntEntity("New Title", "Edited", StakeType.ALL_AGE, 10);
        HuntEntity editedHunt = huntService.editHunt(edit);
        assertAll("Test Edit Hunt Successful", () -> {
            assertEquals("New Title", editedHunt.getTitle());
            assertEquals("Edited", editedHunt.getDates());
        });
        assertAll("Test Edit Hunt Failed", () -> {
            assertThrows(TrackHoundsAPIException.class, () -> {
                huntService.editHunt(new HuntEntity());
            });
        });
    }

    @Test
    @Transactional
    void huntDetailsAreStoredTrimmedAndCanBeEdited() {
        HuntEntity hunt = new HuntEntity("Detailed Hunt", "2026", StakeType.ALL_AGE, 10);
        hunt.setCity("  Ocala ");
        hunt.setState("FL");
        hunt.setPresident(" Pat President ");
        hunt.setMasterOfHounds("   ");
        HuntEntity saved = huntService.createHunt(hunt);
        assertAll("Details on create", () -> {
            assertEquals("Ocala", saved.getCity());
            assertEquals("FL", saved.getState());
            assertEquals("Pat President", saved.getPresident());
            assertEquals(null, saved.getMasterOfHounds(), "an empty detail is stored as nothing");
        });

        HuntEntity edit = new HuntEntity("Detailed Hunt", "2026", StakeType.ALL_AGE, 10);
        edit.setCity("Gainesville");
        edit.setMasterOfHounds("Morgan Master");
        HuntEntity edited = huntService.editHunt(edit);
        assertAll("Details on edit", () -> {
            assertEquals("Gainesville", edited.getCity());
            assertEquals(null, edited.getState(), "a cleared detail is cleared");
            assertEquals(null, edited.getPresident());
            assertEquals("Morgan Master", edited.getMasterOfHounds());
        });
    }

    @Test
    @Transactional
    void packScoringIsAHuntSettingWithAMinimum() {
        HuntEntity plain = huntService.createHunt(new HuntEntity("Plain", "2026", StakeType.ALL_AGE, 10));
        assertAll("Off unless chosen", () -> {
            assertEquals(false, plain.isPackScoring());
            assertEquals(15, plain.getPackMinimumPoints());
            assertEquals(0, plain.lowestCrossPoints());
        });

        HuntEntity pack = new HuntEntity("Pack", "2026", StakeType.ALL_AGE, 10);
        pack.setPackScoring(true);
        HuntEntity saved = huntService.createHunt(pack);
        assertAll("Chosen when the hunt is created", () -> {
            assertEquals(true, saved.isPackScoring());
            assertEquals(15, saved.lowestCrossPoints());
        });

        HuntEntity edit = new HuntEntity("Pack", "2026", StakeType.ALL_AGE, 10);
        edit.setPackScoring(true);
        edit.setPackMinimumPoints(20);
        assertEquals(20, huntService.editHunt(edit).lowestCrossPoints());

        HuntEntity tooHigh = new HuntEntity("Pack", "2026", StakeType.ALL_AGE, 10);
        tooHigh.setPackScoring(true);
        tooHigh.setPackMinimumPoints(40);
        HuntEntity negative = new HuntEntity("Pack", "2026", StakeType.ALL_AGE, 10);
        negative.setPackMinimumPoints(-1);
        assertAll("Refused", () -> {
            assertTrue(assertThrows(TrackHoundsAPIException.class, () -> huntService.editHunt(tooHigh)).getFields().containsKey("packMinimumPoints"));
            assertTrue(assertThrows(TrackHoundsAPIException.class, () -> huntService.editHunt(negative)).getFields().containsKey("packMinimumPoints"));
            assertEquals(20, huntService.getHunt().getPackMinimumPoints());
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
}
