package com.trackhounds.trackhounds.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import org.flywaydb.core.api.FlywayException;

import com.trackhounds.trackhounds.Config.DatabaseMigration;
import com.trackhounds.trackhounds.Config.LegacySchemaMigration;
import com.trackhounds.trackhounds.Config.TrackhoundsProperties;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;

/**
 * Backups, restores and the library of past hunts.
 *
 * TrackHounds keeps one hunt per database file, so a backup, an exported hunt
 * and an archived hunt are all the same thing: a consistent copy of the
 * database written with {@code VACUUM INTO} while the application runs.
 * Restoring copies a file <em>into</em> the live database through SQLite's
 * online backup API, so the application never has to close its connection or
 * restart. Every restore first writes a safety copy to {@code backups/}.
 *
 * Works on plain JDBC only: it must not share the single pooled connection
 * with an open Hibernate transaction.
 */
@Service
public class DataService {

  private static final Logger LOG = LoggerFactory.getLogger(DataService.class);
  private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
  private static final byte[] SQLITE_HEADER = "SQLite format 3\0".getBytes(StandardCharsets.US_ASCII);
  static final String BACKUPS = "backups";
  static final String HUNTS = "hunts";
  static final String TEMP = "tmp";

  private final DataSource dataSource;
  private final TrackhoundsProperties properties;
  private final Path databaseFile;

  public DataService(DataSource dataSource, TrackhoundsProperties properties, Environment environment) {
    this.dataSource = dataSource;
    this.properties = properties;
    String url = environment.getProperty("spring.datasource.url", "");
    this.databaseFile = url.startsWith("jdbc:sqlite:") ? Path.of(url.substring("jdbc:sqlite:".length())).toAbsolutePath() : null;
  }

  // ---------------------------------------------------------------- status

  /** Where the data lives and what copies exist. */
  public Map<String, Object> status() throws IOException {
    Map<String, Object> status = new LinkedHashMap<>();
    status.put("databaseFile", databaseFile == null ? null : databaseFile.toString());
    status.put("databaseSize", databaseFile != null && Files.isRegularFile(databaseFile) ? Files.size(databaseFile) : 0L);
    status.put("backupsDir", backupsDir().toString());
    status.put("huntsDir", huntsDir().toString());
    List<Map<String, Object>> backups = listBackups();
    status.put("backupCount", backups.size());
    status.put("lastBackup", backups.isEmpty() ? null : backups.get(0).get("savedAt"));
    status.put("hunt", currentHunt());
    return status;
  }

  // --------------------------------------------------------------- backups

  /** Write a backup to {@code backups/} and describe it. */
  public Map<String, Object> backup() throws IOException, SQLException {
    Path target = unique(backupsDir().resolve("trackhounds-" + stamp() + ".db"));
    snapshot(target);
    LOG.info("Backup written to {}", target);
    return describe(target, BACKUPS);
  }

  /** Backups newest first. */
  public List<Map<String, Object>> listBackups() throws IOException {
    return listDatabases(backupsDir(), BACKUPS);
  }

  /** Restore one of the files in {@code backups/}. */
  public Map<String, Object> restoreBackup(String fileName) throws IOException, SQLException {
    return restore(fileIn(backupsDir(), fileName, "backup"), fileName);
  }

  /** Remove a backup file. */
  public void deleteBackup(String fileName) throws IOException {
    Files.delete(fileIn(backupsDir(), fileName, "backup"));
    LOG.info("Backup {} deleted", fileName);
  }

  /**
   * A fresh consistent copy of the database in the temp folder, for downloading.
   * The caller deletes it when done.
   */
  public Path snapshotForDownload() throws IOException, SQLException {
    Path target = tempDir().resolve("download-" + stamp() + "-" + System.nanoTime() + ".db");
    snapshot(target);
    return target;
  }

  /** The file name a downloaded copy should get: the hunt's title plus the time. */
  public String downloadName() {
    Map<String, Object> hunt = currentHunt();
    String title = hunt == null ? null : (String) hunt.get("title");
    return (title == null || title.isBlank() ? "trackhounds" : "trackhounds-" + slug(title)) + "-" + stamp() + ".db";
  }

  // --------------------------------------------------------------- restore

  /**
   * Replace the live database with the contents of an uploaded file.
   *
   * @param upload the uploaded bytes
   * @param name   the uploaded file's name, for messages
   */
  public Map<String, Object> restoreUpload(InputStream upload, String name) throws IOException, SQLException {
    Path temp = tempDir().resolve("upload-" + stamp() + "-" + System.nanoTime() + ".db");
    try {
      Files.copy(upload, temp, StandardCopyOption.REPLACE_EXISTING);
      return restore(temp, name == null || name.isBlank() ? "the uploaded file" : name);
    } finally {
      Files.deleteIfExists(temp);
    }
  }

  /**
   * Replace the live database with a copy of {@code source}. The file is
   * checked and, if it comes from a release candidate, upgraded on a temporary
   * copy first; the current database is backed up before it is overwritten.
   */
  public Map<String, Object> restore(Path source, String label) throws IOException, SQLException {
    Path prepared = tempDir().resolve("restore-" + stamp() + "-" + System.nanoTime() + ".db");
    try {
      Map<String, Object> hunt = prepare(source, prepared, label);
      Path safety = unique(backupsDir().resolve("trackhounds-before-restore-" + stamp() + ".db"));
      snapshot(safety);
      try (Connection connection = dataSource.getConnection()) {
        org.sqlite.SQLiteConnection sqlite = connection.unwrap(org.sqlite.SQLiteConnection.class);
        int rc = sqlite.getDatabase().restore("main", prepared.toString(), null);
        if (rc != 0) {
          throw new SQLException("SQLite restore failed with code " + rc);
        }
      }
      LOG.info("Database restored from {} (previous copy in {})", label, safety);
      Map<String, Object> result = new LinkedHashMap<>();
      result.put("restoredFrom", label);
      result.put("safetyBackup", safety.toString());
      result.put("hunt", hunt);
      return result;
    } finally {
      Files.deleteIfExists(prepared);
    }
  }

  // ------------------------------------------------------------ hunt files

  /** Archived hunts, newest first. */
  public List<Map<String, Object>> listHunts() throws IOException {
    return listDatabases(huntsDir(), HUNTS);
  }

  /** Save the current hunt to the library. */
  public Map<String, Object> archiveCurrentHunt() throws IOException, SQLException {
    Map<String, Object> hunt = currentHunt();
    if (hunt == null) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "There is no hunt to save.",
          Map.of("hunt", "Create a hunt before saving it to past hunts."));
    }
    Path target = unique(huntsDir().resolve(slug((String) hunt.get("title")) + "-" + stamp() + ".db"));
    snapshot(target);
    LOG.info("Hunt archived to {}", target);
    return describe(target, HUNTS);
  }

  /** Add an uploaded hunt file to the library without opening it. */
  public Map<String, Object> importHunt(InputStream upload, String name) throws IOException, SQLException {
    Path temp = tempDir().resolve("import-" + stamp() + "-" + System.nanoTime() + ".db");
    Path prepared = tempDir().resolve("import-ready-" + stamp() + "-" + System.nanoTime() + ".db");
    try {
      Files.copy(upload, temp, StandardCopyOption.REPLACE_EXISTING);
      Map<String, Object> hunt = prepare(temp, prepared, name == null || name.isBlank() ? "the uploaded file" : name);
      Path target = unique(huntsDir().resolve(slug((String) hunt.get("title")) + "-" + stamp() + ".db"));
      Files.createDirectories(target.getParent());
      Files.move(prepared, target, StandardCopyOption.REPLACE_EXISTING);
      LOG.info("Hunt imported to {}", target);
      return describe(target, HUNTS);
    } finally {
      Files.deleteIfExists(temp);
      Files.deleteIfExists(prepared);
    }
  }

  /**
   * Make an archived hunt the current one. The current hunt, if any, is saved
   * to the library first so nothing is lost.
   */
  public Map<String, Object> openHunt(String fileName) throws IOException, SQLException {
    Path file = huntFile(fileName);
    Map<String, Object> archived = currentHunt() == null ? null : archiveCurrentHunt();
    Map<String, Object> result = restore(file, fileName);
    result.put("archivedCurrent", archived);
    return result;
  }

  /** Remove an archived hunt file. */
  public void deleteHunt(String fileName) throws IOException {
    Files.delete(huntFile(fileName));
    LOG.info("Archived hunt {} deleted", fileName);
  }

  // --------------------------------------------------------------- helpers

  private Path dataDir() {
    Path dir = properties.getDataDir();
    if (dir == null && databaseFile != null) {
      dir = databaseFile.getParent();
    }
    if (dir == null) {
      dir = Path.of(".").toAbsolutePath();
    }
    return dir;
  }

  Path backupsDir() {
    return dataDir().resolve(BACKUPS);
  }

  Path huntsDir() {
    return dataDir().resolve(HUNTS);
  }

  private Path tempDir() throws IOException {
    Path dir = dataDir().resolve(TEMP);
    Files.createDirectories(dir);
    return dir;
  }

  private Path huntFile(String fileName) {
    return fileIn(huntsDir(), fileName, "hunt");
  }

  /** A file name inside one of the managed folders; never a path. */
  private static Path fileIn(Path dir, String fileName, String kind) {
    if (fileName == null || fileName.isBlank() || !fileName.toLowerCase(Locale.ROOT).endsWith(".db")
        || fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Not a " + kind + " file name.", Map.of("file", "Not a " + kind + " file name."));
    }
    Path file = dir.resolve(fileName);
    if (!Files.isRegularFile(file)) {
      throw new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "That " + kind + " file no longer exists.", Map.of("file", fileName));
    }
    return file;
  }

  /** The path, or a numbered variant of it, that does not exist yet (two copies in one second). */
  private static Path unique(Path path) {
    if (!Files.exists(path)) {
      return path;
    }
    String name = path.getFileName().toString();
    String base = name.substring(0, name.length() - 3);
    for (int i = 2;; i++) {
      Path candidate = path.resolveSibling(base + "-" + i + ".db");
      if (!Files.exists(candidate)) {
        return candidate;
      }
    }
  }

  private static String stamp() {
    return LocalDateTime.now().format(STAMP);
  }

  static String slug(String title) {
    if (title == null) {
      return "hunt";
    }
    String slug = title.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    return slug.isEmpty() ? "hunt" : slug.length() > 60 ? slug.substring(0, 60) : slug;
  }

  /** A consistent copy of the live database, written while it is in use. */
  private void snapshot(Path target) throws IOException, SQLException {
    Files.createDirectories(target.getParent());
    Files.deleteIfExists(target);
    try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
      statement.execute("vacuum into '" + target.toString().replace("'", "''") + "'");
    }
  }

  /**
   * Check that {@code source} is a TrackHounds database, upgrade a copy of it
   * to the current layout, and return the hunt it holds.
   */
  private Map<String, Object> prepare(Path source, Path prepared, String label) throws IOException, SQLException {
    if (!Files.isRegularFile(source) || Files.size(source) < SQLITE_HEADER.length) {
      throw notADatabase(label);
    }
    try (InputStream in = Files.newInputStream(source)) {
      byte[] header = in.readNBytes(SQLITE_HEADER.length);
      if (!Arrays.equals(header, SQLITE_HEADER)) {
        throw notADatabase(label);
      }
    }
    Files.copy(source, prepared, StandardCopyOption.REPLACE_EXISTING);
    String url = "jdbc:sqlite:" + prepared;
    try {
      try (Connection connection = DriverManager.getConnection(url)) {
        if (!LegacySchemaMigration.tableExists(connection, "hunt_entity") || !LegacySchemaMigration.tableExists(connection, "dogs")) {
          throw notADatabase(label);
        }
      }
      // Legacy rewrite plus the versioned migrations, so a backup from any earlier version loads.
      DatabaseMigration.upgrade(url, null);
      try (Connection connection = DriverManager.getConnection(url)) {
        try (Statement statement = connection.createStatement()) {
          statement.execute("pragma wal_checkpoint(TRUNCATE)");
          statement.execute("pragma journal_mode=DELETE");
        }
        Map<String, Object> hunt = readHunt(connection);
        if (hunt == null) {
          throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, String.format("%s has no hunt in it.", label),
              Map.of("file", "The file is a TrackHounds database without a hunt."));
        }
        return hunt;
      }
    } catch (SQLException | FlywayException e) {
      LOG.warn("{} could not be prepared for restore: {}", label, e.getMessage());
      throw notADatabase(label);
    }
  }

  private static TrackHoundsAPIException notADatabase(String label) {
    return new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, String.format("%s is not a TrackHounds database.", label),
        Map.of("file", "Choose a backup or hunt file written by TrackHounds (a .db file)."));
  }

  /** The hunt in the live database, or null. */
  private Map<String, Object> currentHunt() {
    try (Connection connection = dataSource.getConnection()) {
      return LegacySchemaMigration.tableExists(connection, "hunt_entity") ? readHunt(connection) : null;
    } catch (SQLException e) {
      LOG.warn("Could not read the current hunt", e);
      return null;
    }
  }

  private static Map<String, Object> readHunt(Connection connection) throws SQLException {
    try (Statement statement = connection.createStatement();
        ResultSet hunt = statement.executeQuery("select title, dates from hunt_entity order by id limit 1")) {
      if (!hunt.next()) {
        return null;
      }
      Map<String, Object> info = new LinkedHashMap<>();
      info.put("title", hunt.getString("title"));
      info.put("dates", hunt.getString("dates"));
      info.put("dogs", count(connection, "dogs"));
      info.put("judges", count(connection, "judge_entity"));
      info.put("scores", count(connection, "score"));
      return info;
    }
  }

  private static int count(Connection connection, String table) throws SQLException {
    if (!LegacySchemaMigration.tableExists(connection, table)) {
      return 0;
    }
    try (Statement statement = connection.createStatement(); ResultSet rows = statement.executeQuery("select count(*) from " + table)) {
      return rows.next() ? rows.getInt(1) : 0;
    }
  }

  private List<Map<String, Object>> listDatabases(Path dir, String kind) throws IOException {
    if (!Files.isDirectory(dir)) {
      return List.of();
    }
    List<Path> files;
    try (Stream<Path> stream = Files.list(dir)) {
      files = stream.filter(path -> path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".db"))
          .sorted(Comparator.comparing((Path path) -> {
            try {
              return Files.getLastModifiedTime(path).toMillis();
            } catch (IOException e) {
              return 0L;
            }
          }).reversed())
          .toList();
    }
    List<Map<String, Object>> result = new ArrayList<>();
    for (Path file : files) {
      result.add(describe(file, kind));
    }
    return result;
  }

  /** File facts plus the hunt inside it (read-only, tolerant of old layouts). */
  private Map<String, Object> describe(Path file, String kind) throws IOException {
    Map<String, Object> info = new LinkedHashMap<>();
    info.put("file", file.getFileName().toString());
    info.put("kind", kind);
    info.put("path", file.toString());
    info.put("size", Files.size(file));
    info.put("savedAt", Instant.ofEpochMilli(Files.getLastModifiedTime(file).toMillis()).toString());
    Map<String, Object> hunt = null;
    org.sqlite.SQLiteConfig config = new org.sqlite.SQLiteConfig();
    config.setReadOnly(true);
    try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + file, config.toProperties())) {
      if (LegacySchemaMigration.tableExists(connection, "hunt_entity")) {
        hunt = readHunt(connection);
      }
    } catch (SQLException e) {
      LOG.debug("Could not read {}", file, e);
    }
    info.put("hunt", hunt);
    info.put("readable", hunt != null);
    return info;
  }
}
