package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DogRepository;

import jakarta.transaction.Transactional;

/**
 * DogService Test class
 */
@SpringBootTest
@ActiveProfiles("test")
public class DogServiceTest {

  /**
   * Repository Reference
   */
  @Autowired
  private DogRepository dogRepository;

  /**
   * Service
   */
  @Autowired
  private DogService dogService;

  /**
   * Clear repository
   */
  @BeforeEach
  void setUp() {
    dogRepository.deleteAll();
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
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)));

    DogEntity emptyName = new DogEntity(4, null, null, "owner", "sire", "dam");
    DogEntity emptyStake = new DogEntity(4, "Name", null, "owner", "sire", "dam");
    assertAll("Invalid", () -> assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(List.of(dog1))),
        () -> assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(List.of(emptyName))),
        () -> assertThrows(TrackHoundsAPIException.class, () -> dogService.createDogs(List.of(emptyStake))));
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
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
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
  void testEditDog() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
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
  void testGetDogByNumber() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
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
  void testGetDogs() {
    DogEntity dog1 = new DogEntity(1, "Dog1", StakeType.ALL_AGE, "Owner1", "Sire", "Dam");
    DogEntity dog2 = new DogEntity(2, "Dog2", StakeType.ALL_AGE, "Owner2", "Sire", "Dam");
    DogEntity dog3 = new DogEntity(3, "Dog3", StakeType.DERBY, "Owner3", "Sire", "Dam");
    assertAll("Create Dogs", () -> assertDoesNotThrow(() -> dogService.createDogs(List.of(dog1, dog2, dog3))),
        () -> assertTrue(dogRepository.count() > 0),
        () -> assertEquals(dogService.getDogTotal(), (int) dogRepository.count()),
        () -> assertNotNull(dogService.getDogByNumber(1)),
        () -> assertNotNull(dogService.getDogByNumber(2)),
        () -> assertNotNull(dogService.getDogByNumber(3)));

    List<DogEntity> dogs = dogService.getDogs();
    assertAll("Got all dogs", () -> assertEquals(3, dogs.size()),
        () -> assertTrue(dogs.contains(dog1)));

  }
}
