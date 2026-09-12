package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Config.LegacySchemaMigrationTest;
import com.trackhounds.trackhounds.Dto.ScoreDto;
import com.trackhounds.trackhounds.Entity.DogEntity;
import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Entity.JudgeEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Repository.DaysRepository;
import com.trackhounds.trackhounds.Repository.HuntRepository;
import com.trackhounds.trackhounds.Repository.JudgeRepository;

/**
 * Backups, restores and the past-hunts library, exercised against the live
 * test database. Not transactional on purpose: the service needs the single
 * pooled connection for itself.
 */
@SpringBootTest
@ActiveProfiles("test")
class DataServiceTest {

  @Autowired
  private DataService dataService;
  @Autowired
  private DogService dogService;
  @Autowired
  private HuntService huntService;
  @Autowired
  private HuntRepository huntRepository;
  @Autowired
  private JudgeRepository judgeRepository;
  @Autowired
  private DaysRepository daysRepository;

  @BeforeEach
  void setUp() throws IOException {
    clearDatabase();
    deleteFiles(dataService.backupsDir());
    deleteFiles(dataService.huntsDir());
  }

  @AfterEach
  void tearDown() throws IOException {
    clearDatabase();
    deleteFiles(dataService.backupsDir());
    deleteFiles(dataService.huntsDir());
  }

  private void clearDatabase() {
    dogService.clear();
    daysRepository.deleteAll();
    judgeRepository.deleteAll();
    huntRepository.deleteAll();
  }

  private static void deleteFiles(Path dir) throws IOException {
    if (!Files.isDirectory(dir)) {
      return;
    }
    try (Stream<Path> files = Files.list(dir)) {
      for (Path file : files.toList()) {
        Files.deleteIfExists(file);
      }
    }
  }

  private void hunt(String title, String... dogs) {
    huntRepository.save(new HuntEntity(title, "2026", StakeType.ALL_AGE, 5));
    judgeRepository.save(new JudgeEntity(1, "", "Judge"));
    for (String dog : dogs) {
      dogService.createDogs(List.of(new DogEntity(dog, "Dog " + dog, StakeType.ALL_AGE, "O", "S", "D")));
    }
    if (dogs.length > 0) {
      dogService.createScore(new ScoreDto(1, "08:00:00", 1, "08:10:00", new String[] { dogs[0] }, new int[] { 35 }, 5));
    }
  }

  @Test
  @SuppressWarnings("unchecked")
  void backupIsAReadableCopyOfTheLiveDatabase() throws Exception {
    hunt("Spring trial", "1", "2");
    Map<String, Object> backup = dataService.backup();
    Path file = Path.of((String) backup.get("path"));
    assertTrue(Files.isRegularFile(file));
    assertTrue(((String) backup.get("file")).startsWith("trackhounds-"));
    Map<String, Object> hunt = (Map<String, Object>) backup.get("hunt");
    assertEquals("Spring trial", hunt.get("title"));
    assertEquals(2, hunt.get("dogs"));
    assertEquals(1, hunt.get("scores"));

    // The copy is a complete database on its own.
    try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + file); Statement statement = connection.createStatement()) {
      assertTrue(statement.executeQuery("select count(*) from dogs where number = '2'").getInt(1) == 1);
    }

    List<Map<String, Object>> backups = dataService.listBackups();
    assertEquals(1, backups.size());
    Map<String, Object> status = dataService.status();
    assertEquals(1, status.get("backupCount"));
    assertNotNull(status.get("lastBackup"));
    assertEquals("Spring trial", ((Map<String, Object>) status.get("hunt")).get("title"));
  }

  @Test
  @SuppressWarnings("unchecked")
  void restoreReplacesTheLiveDataAndKeepsASafetyCopy() throws Exception {
    hunt("First hunt", "1");
    Path saved = Path.of((String) dataService.backup().get("path"));

    clearDatabase();
    hunt("Second hunt", "7", "8");
    assertEquals("Second hunt", huntService.getHunt().getTitle());

    Map<String, Object> result = dataService.restore(saved, "first.db");
    assertEquals("First hunt", ((Map<String, Object>) result.get("hunt")).get("title"));
    assertEquals("First hunt", huntService.getHunt().getTitle());
    assertEquals(List.of("1"), dogService.getDogs().stream().map(DogEntity::getNumber).toList());
    assertEquals(38, dogService.getDogByNumber("1").getPoints(), "scores came back with the hunt");

    // The hunt that was replaced is still available.
    Path safety = Path.of((String) result.get("safetyBackup"));
    assertTrue(Files.isRegularFile(safety));
    assertTrue(safety.getFileName().toString().contains("before-restore"));
    Map<String, Object> restoredAgain = dataService.restore(safety, "safety");
    assertEquals("Second hunt", ((Map<String, Object>) restoredAgain.get("hunt")).get("title"));
    assertEquals(2, dogService.getDogTotal());
    assertEquals(3, dataService.listBackups().size(), "two safety copies in the same second get distinct names");
  }

  @Test
  void restoreRejectsFilesThatAreNotTrackHoundsDatabases() throws Exception {
    hunt("Kept", "1");
    Path text = Files.createTempFile("not-a-db", ".db");
    Files.writeString(text, "hello");
    TrackHoundsAPIException notSqlite = assertThrows(TrackHoundsAPIException.class, () -> dataService.restore(text, "notes.db"));
    assertTrue(notSqlite.getMessage().contains("not a TrackHounds database"));

    Path other = Files.createTempFile("other", ".db");
    Files.delete(other);
    try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + other); Statement statement = connection.createStatement()) {
      statement.executeUpdate("create table notes (id integer primary key, text varchar(255))");
    }
    TrackHoundsAPIException otherDb = assertThrows(TrackHoundsAPIException.class,
        () -> dataService.restoreUpload(new ByteArrayInputStream(Files.readAllBytes(other)), "other.db"));
    assertTrue(otherDb.getMessage().contains("not a TrackHounds database"));

    TrackHoundsAPIException empty = assertThrows(TrackHoundsAPIException.class,
        () -> dataService.restoreUpload(new ByteArrayInputStream("x".getBytes(StandardCharsets.UTF_8)), "x.db"));
    assertEquals("x.db is not a TrackHounds database.", empty.getMessage());

    assertEquals("Kept", huntService.getHunt().getTitle(), "a rejected restore changes nothing");
    assertTrue(dataService.listBackups().isEmpty(), "no safety copy is taken for a rejected file");
  }

  @Test
  @SuppressWarnings("unchecked")
  void restoreUpgradesAReleaseCandidateFile() throws Exception {
    hunt("Current", "1");
    Path legacy = Files.createTempFile("legacy", ".db");
    Files.delete(legacy);
    LegacySchemaMigrationTest.writeLegacyDatabase(legacy);

    Map<String, Object> result = dataService.restore(legacy, "legacy.db");
    assertEquals("Legacy hunt", ((Map<String, Object>) result.get("hunt")).get("title"));
    assertEquals("Legacy hunt", huntService.getHunt().getTitle());
    assertEquals(5, huntService.getHunt().getPointStep(), "columns added after the RC exist with their defaults");
    assertEquals(4, huntService.getHunt().getHuntDays());
    List<String> numbers = dogService.getDogs().stream().map(DogEntity::getNumber).toList();
    assertEquals(List.of("1", "2"), numbers);
    assertEquals(1, dogService.getScoresByDogNumber("1").size());
    assertTrue(dogService.getScoresByDogNumber("1").get(0).isCounted());
  }

  @Test
  @SuppressWarnings("unchecked")
  void pastHuntsCanBeArchivedOpenedAndDeleted() throws Exception {
    assertThrows(TrackHoundsAPIException.class, () -> dataService.archiveCurrentHunt(), "nothing to archive yet");

    hunt("Autumn classic", "1", "2");
    Map<String, Object> archived = dataService.archiveCurrentHunt();
    String file = (String) archived.get("file");
    assertTrue(file.startsWith("autumn-classic-"), file);
    assertEquals(1, dataService.listHunts().size());

    clearDatabase();
    hunt("Winter trial", "9");
    Map<String, Object> opened = dataService.openHunt(file);
    assertEquals("Autumn classic", huntService.getHunt().getTitle());
    assertEquals(2, dogService.getDogTotal());
    Map<String, Object> archivedCurrent = (Map<String, Object>) opened.get("archivedCurrent");
    assertNotNull(archivedCurrent, "the hunt that was open is archived before it is replaced");
    assertEquals("Winter trial", ((Map<String, Object>) archivedCurrent.get("hunt")).get("title"));
    assertEquals(2, dataService.listHunts().size());

    dataService.deleteHunt(file);
    assertEquals(1, dataService.listHunts().size());
    assertThrows(TrackHoundsAPIException.class, () -> dataService.openHunt(file));
    assertThrows(TrackHoundsAPIException.class, () -> dataService.openHunt("..\\trackhounds-test.db"));
  }

  @Test
  @SuppressWarnings("unchecked")
  void importedHuntFilesJoinTheLibraryWithoutOpening() throws Exception {
    hunt("Open hunt", "1");
    byte[] bytes = Files.readAllBytes(Path.of((String) dataService.backup().get("path")));
    clearDatabase();
    hunt("Still open", "5");

    Map<String, Object> imported = dataService.importHunt(new ByteArrayInputStream(bytes), "open-hunt.db");
    assertTrue(((String) imported.get("file")).startsWith("open-hunt-"));
    assertEquals("Open hunt", ((Map<String, Object>) imported.get("hunt")).get("title"));
    assertEquals("Still open", huntService.getHunt().getTitle(), "importing does not change the current hunt");
    assertEquals(1, dataService.listHunts().size());
  }

  @Test
  void downloadSnapshotIsAFreshCopy() throws Exception {
    hunt("Download me", "3");
    Path snapshot = dataService.snapshotForDownload();
    assertTrue(Files.size(snapshot) > 0);
    assertTrue(dataService.downloadName().startsWith("trackhounds-download-me-"));
    Files.delete(snapshot);
    assertFalse(Files.exists(snapshot));
  }

  @Test
  void slugsAreFileSafe() {
    assertEquals("piedmont-spring-trial", DataService.slug("Piedmont Spring Trial"));
    assertEquals("hunt", DataService.slug("***"));
    assertEquals("hunt", DataService.slug(null));
    assertNull(null);
  }
}
