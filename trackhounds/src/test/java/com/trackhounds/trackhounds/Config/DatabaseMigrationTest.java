package com.trackhounds.trackhounds.Config;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * The start-up path of every database file: empty, written by 3.0 before
 * schema versioning, written by a release candidate, or already current.
 */
class DatabaseMigrationTest {

  static final List<String> TABLES = List.of("hunt_entity", "judge_entity", "dogs", "days", "daily_score", "score", "scratch");

  @TempDir
  Path temp;

  private static String url(Path file) {
    return "jdbc:sqlite:" + file;
  }

  @Test
  void createsTheSchemaInAnEmptyFile() throws Exception {
    Path database = temp.resolve("fresh.db");
    Path backups = temp.resolve("backups");

    assertTrue(DatabaseMigration.upgrade(url(database), backups));

    try (Connection connection = DriverManager.getConnection(url(database))) {
      for (String table : TABLES) {
        assertTrue(LegacySchemaMigration.tableExists(connection, table), table);
      }
      assertAll("version 1 recorded, text dog numbers",
          () -> assertEquals("1", query(connection, "select max(version) from flyway_schema_history where success = 1")),
          () -> assertEquals("varchar(255)", LegacySchemaMigration.columnType(connection, "dogs", "number")));
    }
    assertFalse(Files.isDirectory(backups), "an empty file has nothing to back up");
    assertFalse(DatabaseMigration.upgrade(url(database), backups), "a current database is left alone");
    assertFalse(Files.isDirectory(backups));
  }

  @Test
  void baselinesADatabaseWrittenBeforeSchemaVersioning() throws Exception {
    // A 3.0 database: the current tables with data in them, but no schema history.
    Path database = temp.resolve("three-oh.db");
    DatabaseMigration.upgrade(url(database), null);
    try (Connection connection = DriverManager.getConnection(url(database)); Statement statement = connection.createStatement()) {
      statement.executeUpdate("drop table flyway_schema_history");
      statement.executeUpdate("insert into hunt_entity (id, title, hunt_interval) values (1, 'Kept', 5)");
    }
    Path backups = temp.resolve("backups");

    assertTrue(DatabaseMigration.upgrade(url(database), backups));

    try (Connection connection = DriverManager.getConnection(url(database))) {
      assertAll("baselined without touching the data",
          () -> assertEquals("1", query(connection, "select max(version) from flyway_schema_history where success = 1")),
          () -> assertEquals("Kept", query(connection, "select title from hunt_entity")));
    }
    assertEquals(1, backupsIn(backups), "one copy taken before the baseline");
    assertFalse(DatabaseMigration.upgrade(url(database), backups));
    assertEquals(1, backupsIn(backups), "no second copy when nothing is pending");
  }

  @Test
  void rewritesAReleaseCandidateDatabaseThenBaselines() throws Exception {
    Path database = temp.resolve("legacy.db");
    LegacySchemaMigrationTest.writeLegacyDatabase(database);
    Path backups = temp.resolve("backups");

    assertTrue(DatabaseMigration.upgrade(url(database), backups));

    try (Connection connection = DriverManager.getConnection(url(database))) {
      assertAll("legacy layout gone, data kept, version 1 recorded",
          () -> assertEquals("varchar(255)", LegacySchemaMigration.columnType(connection, "dogs", "number")),
          () -> assertFalse(LegacySchemaMigration.tableExists(connection, "time_bucket_score")),
          () -> assertEquals("Legacy hunt", query(connection, "select title from hunt_entity")),
          () -> assertEquals("5", query(connection, "select point_step from hunt_entity")),
          () -> assertEquals("Rex", query(connection, "select name from dogs where number = '1'")),
          () -> assertEquals("1", query(connection, "select max(version) from flyway_schema_history where success = 1")));
    }
    assertEquals(1, backupsIn(backups), "the legacy rewrite takes the copy; the baseline does not take a second one");
  }

  @Test
  void aRewrittenReleaseCandidateDatabaseHasExactlyTheBaselineSchema() throws Exception {
    // The restore tests found this the hard way: the rewrite used to keep "not null" on dog_number
    // and the default of an added column, so an upgraded file differed from a fresh one.
    Path legacy = temp.resolve("legacy.db");
    Path fresh = temp.resolve("fresh.db");
    LegacySchemaMigrationTest.writeLegacyDatabase(legacy);

    DatabaseMigration.upgrade(url(legacy), null);
    DatabaseMigration.upgrade(url(fresh), null);

    assertEquals(SchemaSnapshot.describe(url(fresh)), SchemaSnapshot.describe(url(legacy)));
    try (Connection connection = DriverManager.getConnection(url(legacy))) {
      assertAll("rows and ids survive the rebuild",
          () -> assertEquals("Legacy hunt", query(connection, "select title from hunt_entity")),
          () -> assertEquals("3", query(connection, "select id from score where dog_number = '1'")),
          () -> assertEquals("7|2", query(connection, "select daily_score_id || '|' || time_bucket from score where id = 3")),
          () -> assertEquals("Injured", query(connection, "select reason from scratch where id = 1")));
    }
  }

  @Test
  void resetDropsEverythingSoTheScriptsStartOver() throws Exception {
    Path database = temp.resolve("reset.db");
    DatabaseMigration.upgrade(url(database), null);
    try (Connection connection = DriverManager.getConnection(url(database)); Statement statement = connection.createStatement()) {
      statement.executeUpdate("insert into hunt_entity (id, title, hunt_interval) values (1, 'Gone', 5)");
    }

    DatabaseMigration.reset(url(database));
    try (Connection connection = DriverManager.getConnection(url(database))) {
      assertFalse(LegacySchemaMigration.tableExists(connection, "hunt_entity"));
    }

    assertTrue(DatabaseMigration.upgrade(url(database), null));
    try (Connection connection = DriverManager.getConnection(url(database))) {
      assertEquals("0", query(connection, "select count(*) from hunt_entity"));
    }
  }

  @Test
  void fileOfReadsTheSqliteUrl() {
    assertAll(
        () -> assertEquals(Path.of("C:/data/trackhounds.db").toAbsolutePath(), DatabaseMigration.fileOf("jdbc:sqlite:C:/data/trackhounds.db")),
        () -> assertEquals(Path.of("C:/data/x.db").toAbsolutePath(), DatabaseMigration.fileOf("jdbc:sqlite:C:/data/x.db?journal_mode=WAL")),
        () -> assertEquals(null, DatabaseMigration.fileOf("jdbc:sqlite::memory:")),
        () -> assertEquals(null, DatabaseMigration.fileOf("jdbc:h2:mem:test")));
  }

  private static long backupsIn(Path dir) throws IOException {
    if (!Files.isDirectory(dir)) {
      return 0;
    }
    try (Stream<Path> files = Files.list(dir)) {
      return files.filter(file -> file.getFileName().toString().startsWith("trackhounds-before-upgrade-")).count();
    }
  }

  private static String query(Connection connection, String sql) throws SQLException {
    try (Statement statement = connection.createStatement(); ResultSet rows = statement.executeQuery(sql)) {
      return rows.next() ? rows.getString(1) : null;
    }
  }
}
