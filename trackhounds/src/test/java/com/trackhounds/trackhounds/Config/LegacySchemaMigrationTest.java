package com.trackhounds.trackhounds.Config;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * The migration is exercised against a database built exactly like the ones
 * written by the 3.0 release candidates.
 */
public class LegacySchemaMigrationTest {

  @TempDir
  Path temp;

  private static final String[] LEGACY_SCHEMA = {
      "create table daily_score (id integer, associated_points integer not null, daily_score integer not null, last_cross time(6), zero_interval boolean not null, day_day integer not null, dog_number integer, score_order integer, primary key (id))",
      "create table days (day integer not null, start_time time(6), primary key (day))",
      "create table dogs (number integer not null, dam varchar(255), name varchar(255), owner varchar(255), points integer not null, scratched boolean not null, sire varchar(255), stake tinyint check (stake between 0 and 2), primary key (number))",
      "create table highest_score (id integer, time_bucket integer not null, daily_score_id bigint, score_id bigint, primary key (id))",
      "create table score (id integer, counted boolean not null, day integer not null, dog_number integer not null, judge_number integer not null, points integer not null, time time(6), primary key (id))",
      "create table scratch (id integer, dog_name varchar(255), dog_number integer not null, judge_number integer not null, reason varchar(255), time time(6), day integer default 1 not null, primary key (id))",
      "create table time_bucket_score (id integer, time_bucket integer not null, daily_score_id bigint, score_id bigint, primary key (id))",
      "create table hunt_entity (id integer, dates varchar(255), hunt_interval integer not null, stake tinyint check (stake between 0 and 2), stake_range blob, stake_type_range blob, title varchar(255), primary key (id))",
      "create table judge_entity (number integer not null, member_pin varchar(255), name varchar(255), primary key (number))",
  };

  /**
   * Write a small database in the release-candidate layout: dog 12 with one
   * counted and one uncounted score, dog 2 without scores, one scratch, one
   * judge and the hunt "Legacy hunt". Shared with the restore tests.
   */
  public static void writeLegacyDatabase(Path database) throws Exception {
    try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + database); Statement statement = connection.createStatement()) {
      for (String ddl : LEGACY_SCHEMA) {
        statement.executeUpdate(ddl);
      }
      statement.executeUpdate("insert into hunt_entity (id, dates, hunt_interval, stake, title) values (1, '2026', 5, 0, 'Legacy hunt')");
      statement.executeUpdate("insert into judge_entity (number, member_pin, name) values (1, '', 'Judge')");
      statement.executeUpdate("insert into dogs (number, name, points, scratched, stake) values (1, 'Rex', 38, 0, 0)");
      statement.executeUpdate("insert into dogs (number, name, points, scratched, stake) values (2, 'Bo', 0, 0, 0)");
      statement.executeUpdate("insert into days (day, start_time) values (1, 25200000)");
      statement.executeUpdate("insert into daily_score (id, associated_points, daily_score, zero_interval, day_day, dog_number, score_order) values (7, 35, 35, 0, 1, 1, 0)");
      statement.executeUpdate("insert into score (id, counted, day, dog_number, judge_number, points, time) values (3, 1, 1, 1, 1, 35, 25800000)");
      statement.executeUpdate("insert into time_bucket_score (id, time_bucket, daily_score_id, score_id) values (1, 2, 7, 3)");
      statement.executeUpdate("insert into highest_score (id, time_bucket, daily_score_id, score_id) values (1, 2, 7, 3)");
      statement.executeUpdate("insert into scratch (id, dog_number, judge_number, reason) values (1, 2, 1, 'Injured')");
    }
  }

  @Test
  void upgradesAReleaseCandidateDatabase() throws Exception {
    Path database = temp.resolve("legacy.db");
    try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + database)) {
      try (Statement statement = connection.createStatement()) {
        for (String ddl : LEGACY_SCHEMA) {
          statement.executeUpdate(ddl);
        }
        statement.executeUpdate("insert into dogs (number, name, points, scratched, stake) values (12, 'Rex', 38, 0, 0)");
        statement.executeUpdate("insert into days (day, start_time) values (1, 25200000)");
        statement.executeUpdate("insert into daily_score (id, associated_points, daily_score, zero_interval, day_day, dog_number, score_order) values (7, 35, 35, 0, 1, 12, 0)");
        statement.executeUpdate("insert into score (id, counted, day, dog_number, judge_number, points, time) values (3, 1, 1, 12, 1, 35, 25800000)");
        statement.executeUpdate("insert into score (id, counted, day, dog_number, judge_number, points, time) values (4, 0, 1, 12, 1, 30, 25900000)");
        statement.executeUpdate("insert into time_bucket_score (id, time_bucket, daily_score_id, score_id) values (1, 2, 7, 3)");
        statement.executeUpdate("insert into time_bucket_score (id, time_bucket, daily_score_id, score_id) values (2, 2, 7, 4)");
        statement.executeUpdate("insert into highest_score (id, time_bucket, daily_score_id, score_id) values (1, 2, 7, 3)");
        statement.executeUpdate("insert into scratch (id, dog_number, judge_number, reason) values (1, 12, 1, 'Injured')");
      }

      Path backups = temp.resolve("backups");
      assertTrue(LegacySchemaMigration.migrate(connection, database, backups));

      try (Statement statement = connection.createStatement()) {
        assertAll("scores carry their daily score and interval",
            () -> assertEquals("7|2", query(statement, "select daily_score_id || '|' || time_bucket from score where id = 3")),
            () -> assertEquals("7|2", query(statement, "select daily_score_id || '|' || time_bucket from score where id = 4")),
            () -> assertFalse(LegacySchemaMigration.tableExists(connection, "time_bucket_score")),
            () -> assertFalse(LegacySchemaMigration.tableExists(connection, "highest_score")));
        assertAll("dog numbers are text with the data kept",
            () -> assertEquals("varchar(255)", LegacySchemaMigration.columnType(connection, "dogs", "number")),
            () -> assertEquals("text", query(statement, "select typeof(number) from dogs")),
            () -> assertEquals("12|Rex|38", query(statement, "select number || '|' || name || '|' || points from dogs")),
            () -> assertEquals("text", query(statement, "select typeof(dog_number) from score where id = 3")),
            () -> assertEquals("text", query(statement, "select typeof(dog_number) from daily_score")),
            () -> assertEquals("text", query(statement, "select typeof(dog_number) from scratch")));
        // "0" and "00" can now coexist, which an integer column would have merged.
        statement.executeUpdate("insert into dogs (number, name, points, scratched, stake) values ('0', 'Zero', 0, 0, 0)");
        statement.executeUpdate("insert into dogs (number, name, points, scratched, stake) values ('00', 'Double zero', 0, 0, 0)");
        assertEquals("3", query(statement, "select count(*) from dogs"));
        assertEquals("Double zero", query(statement, "select name from dogs where number = '00'"));
      }

      // The columns later versions added are present with their defaults.
      assertEquals("integer", LegacySchemaMigration.columnType(connection, "hunt_entity", "point_step").toLowerCase());
      try (Statement statement = connection.createStatement()) {
        statement.executeUpdate("insert into hunt_entity (id, dates, hunt_interval, stake, title) values (1, '2026', 5, 0, 'Old')");
        assertEquals("5|35|4", query(statement, "select point_step || '|' || first_dog_points || '|' || hunt_days from hunt_entity"));
      }

      // Idempotent: a second run finds nothing to do.
      assertFalse(LegacySchemaMigration.migrate(connection, database, backups));
      try (var files = Files.list(backups)) {
        assertEquals(1, files.count());
      }
    }
  }

  private static String query(Statement statement, String sql) throws Exception {
    try (ResultSet result = statement.executeQuery(sql)) {
      return result.next() ? result.getString(1) : null;
    }
  }
}
