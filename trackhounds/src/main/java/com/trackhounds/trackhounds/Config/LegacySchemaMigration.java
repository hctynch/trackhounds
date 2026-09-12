package com.trackhounds.trackhounds.Config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Upgrades databases written by TrackHounds 3.0 release candidates, before
 * the versioned migrations run ({@link DatabaseMigration}):
 * <ul>
 * <li>scores used to be linked to their day through two join tables
 * ({@code time_bucket_score}, {@code highest_score}); the link and the interval
 * now live on the score itself,</li>
 * <li>dog numbers used to be integers; they are now strings of digits so that
 * "0" and "00" are different dogs. SQLite would silently turn "00" into 0 in an
 * integer column, so the affected columns are rebuilt with text affinity.</li>
 * </ul>
 * A copy of the database is written to {@code backups/} before anything is
 * changed. Runs once; a database that is already current is left alone.
 * <p>
 * Columns that 3.0 added to existing tables are created here as well (with
 * their defaults), so a release-candidate file is complete before Flyway
 * baselines it at version 1. Everything after 3.0 is a Flyway script.
 */
public final class LegacySchemaMigration {

  private static final Logger LOG = LoggerFactory.getLogger(LegacySchemaMigration.class);

  private LegacySchemaMigration() {
  }

  /**
   * Upgrade the schema behind {@code connection} if it has the legacy layout.
   *
   * @param connection open connection to the SQLite database
   * @param databaseFile the database file, copied to {@code backupDir} first (may be null to skip the backup)
   * @param backupDir    where the backup goes
   * @return {@code true} if something was migrated
   */
  public static boolean migrate(Connection connection, Path databaseFile, Path backupDir) throws SQLException, IOException {
    if (!tableExists(connection, "dogs")) {
      return false; // empty database: the Flyway scripts create the current schema
    }
    boolean legacyScores = tableExists(connection, "time_bucket_score");
    boolean legacyNumbers = columnType(connection, "dogs", "number").toLowerCase(Locale.ROOT).contains("int");
    if (!legacyScores && !legacyNumbers) {
      return addMissingColumns(connection);
    }
    LOG.info("Upgrading the database layout (scores on the daily score: {}, text dog numbers: {})", legacyScores, legacyNumbers);
    backup(connection, databaseFile, backupDir);

    try (Statement statement = connection.createStatement()) {
      if (legacyScores) {
        if (!columnExists(connection, "score", "daily_score_id")) {
          statement.executeUpdate("alter table score add column daily_score_id bigint");
        }
        if (!columnExists(connection, "score", "time_bucket")) {
          statement.executeUpdate("alter table score add column time_bucket integer default 0 not null");
        }
        statement.executeUpdate("update score set daily_score_id = (select t.daily_score_id from time_bucket_score t where t.score_id = score.id),"
            + " time_bucket = coalesce((select t.time_bucket from time_bucket_score t where t.score_id = score.id), 0)");
        statement.executeUpdate("drop table if exists highest_score");
        statement.executeUpdate("drop table if exists time_bucket_score");
      }
    }
    if (legacyNumbers) {
      retypeColumnToText(connection, "dogs", "number");
      retypeColumnToText(connection, "daily_score", "dog_number");
      retypeColumnToText(connection, "score", "dog_number");
      retypeColumnToText(connection, "scratch", "dog_number");
    }
    addMissingColumns(connection);
    LOG.info("Database layout upgraded");
    return true;
  }

  /** Columns added after the first release, with the defaults their entities use. */
  private static final String[][] LATER_COLUMNS = {
      { "hunt_entity", "point_step", "integer default 5 not null" },
      { "hunt_entity", "first_dog_points", "integer default 35 not null" },
      { "hunt_entity", "hunt_days", "integer default 4 not null" },
      { "scratch", "day", "integer default 1 not null" },
      { "score", "time_bucket", "integer default 0 not null" },
      { "score", "daily_score_id", "bigint" },
  };

  /**
   * Add the columns of {@link #LATER_COLUMNS} that are missing.
   *
   * @return {@code true} if a column was added
   */
  static boolean addMissingColumns(Connection connection) throws SQLException {
    boolean changed = false;
    for (String[] column : LATER_COLUMNS) {
      if (tableExists(connection, column[0]) && !columnExists(connection, column[0], column[1])) {
        try (Statement statement = connection.createStatement()) {
          statement.executeUpdate("alter table " + column[0] + " add column " + column[1] + " " + column[2]);
        }
        LOG.info("Added column {}.{}", column[0], column[1]);
        changed = true;
      }
    }
    return changed;
  }

  private static void backup(Connection connection, Path databaseFile, Path backupDir) throws SQLException, IOException {
    if (databaseFile == null || backupDir == null || !Files.isRegularFile(databaseFile)) {
      return;
    }
    try (Statement statement = connection.createStatement()) {
      statement.execute("pragma wal_checkpoint(TRUNCATE)");
    }
    Files.createDirectories(backupDir);
    String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    Path target = backupDir.resolve("trackhounds-before-upgrade-" + stamp + ".db");
    Files.copy(databaseFile, target, StandardCopyOption.REPLACE_EXISTING);
    LOG.info("Database backed up to {}", target);
  }

  /**
   * SQLite cannot change a column's type in place: rebuild the table with the
   * column declared as text, copying every row. Only the declared types,
   * nullability, defaults and the primary key are preserved, which is all
   * Hibernate created for these tables.
   */
  static void retypeColumnToText(Connection connection, String table, String column) throws SQLException {
    if (!tableExists(connection, table)) {
      return;
    }
    List<String> definitions = new ArrayList<>();
    List<String> names = new ArrayList<>();
    List<String> primaryKey = new ArrayList<>();
    try (Statement statement = connection.createStatement();
        ResultSet columns = statement.executeQuery("pragma table_info(" + table + ")")) {
      while (columns.next()) {
        String name = columns.getString("name");
        String type = name.equalsIgnoreCase(column) ? "varchar(255)" : columns.getString("type");
        boolean notNull = columns.getInt("notnull") == 1;
        String defaultValue = columns.getString("dflt_value");
        int pk = columns.getInt("pk");
        StringBuilder definition = new StringBuilder(name).append(' ').append(type);
        if (notNull) {
          definition.append(" not null");
        }
        if (defaultValue != null) {
          definition.append(" default ").append(defaultValue);
        }
        definitions.add(definition.toString());
        names.add(name);
        if (pk > 0) {
          primaryKey.add(name);
        }
      }
    }
    if (names.isEmpty()) {
      return;
    }
    String columnList = String.join(", ", names);
    String selectList = names.stream().map(name -> name.equalsIgnoreCase(column) ? "cast(" + name + " as text)" : name)
        .reduce((a, b) -> a + ", " + b).orElse("");
    String temp = table + "__new";
    try (Statement statement = connection.createStatement()) {
      statement.executeUpdate("drop table if exists " + temp);
      statement.executeUpdate("create table " + temp + " (" + String.join(", ", definitions)
          + (primaryKey.isEmpty() ? "" : ", primary key (" + String.join(", ", primaryKey) + ")") + ")");
      statement.executeUpdate("insert into " + temp + " (" + columnList + ") select " + selectList + " from " + table);
      statement.executeUpdate("drop table " + table);
      statement.executeUpdate("alter table " + temp + " rename to " + table);
    }
  }

  public static boolean tableExists(Connection connection, String table) throws SQLException {
    try (ResultSet tables = connection.getMetaData().getTables(null, null, table, null)) {
      return tables.next();
    }
  }

  public static boolean columnExists(Connection connection, String table, String column) throws SQLException {
    return !columnType(connection, table, column).isEmpty();
  }

  public static String columnType(Connection connection, String table, String column) throws SQLException {
    try (Statement statement = connection.createStatement();
        ResultSet columns = statement.executeQuery("pragma table_info(" + table + ")")) {
      while (columns.next()) {
        if (columns.getString("name").equalsIgnoreCase(column)) {
          String type = columns.getString("type");
          return type == null || type.isEmpty() ? "text" : type;
        }
      }
    }
    return "";
  }
}
