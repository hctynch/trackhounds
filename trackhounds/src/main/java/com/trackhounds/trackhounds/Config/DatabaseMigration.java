package com.trackhounds.trackhounds.Config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfoService;
import org.flywaydb.core.api.output.MigrateResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.autoconfigure.orm.jpa.EntityManagerFactoryDependsOnPostProcessor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Brings the database file up to the current schema before Hibernate opens
 * it. Three steps, in order:
 * <ol>
 * <li>{@link LegacySchemaMigration}: databases written by the 3.0 release
 * candidates (score join tables, integer dog numbers) are rewritten,</li>
 * <li>a copy of the database goes to {@code backups/} when Flyway has
 * something to apply to an existing database,</li>
 * <li>Flyway applies the versioned scripts in {@code db/migration}. A database
 * created by TrackHounds 3.0, before Flyway, has no history table and is
 * baselined at version 1; an empty file gets {@code V1__baseline.sql}.</li>
 * </ol>
 * Hibernate then validates the schema ({@code ddl-auto=validate}) and never
 * changes it. The same steps run on a copy of every file that is restored
 * ({@code DataService}), so a backup from an older version loads.
 * <p>
 * Flyway is driven from here rather than through Spring Boot's auto-configuration
 * so that the legacy rewrite and the backup are guaranteed to run first;
 * {@code spring.flyway.enabled=false} keeps the auto-configuration out.
 */
@Component("databaseMigration")
public class DatabaseMigration implements InitializingBean {

  private static final Logger LOG = LoggerFactory.getLogger(DatabaseMigration.class);

  /** Where the versioned scripts live on the class path. */
  static final String SCRIPTS = "classpath:db/migration";
  static final String JDBC_PREFIX = "jdbc:sqlite:";

  private final Environment environment;
  private final TrackhoundsProperties properties;

  public DatabaseMigration(Environment environment, TrackhoundsProperties properties) {
    this.environment = environment;
    this.properties = properties;
  }

  /** Makes Hibernate's schema validation wait for the migrations. */
  @Configuration
  static class RunBeforeHibernate extends EntityManagerFactoryDependsOnPostProcessor {
    RunBeforeHibernate() {
      super("databaseMigration");
    }
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    String url = environment.getProperty("spring.datasource.url", "");
    if (!url.startsWith(JDBC_PREFIX)) {
      LOG.warn("Not a SQLite data source ({}); schema migrations skipped", url);
      return;
    }
    if (properties.getDatabase().isResetOnStart()) {
      reset(url);
    }
    Path dataDir = properties.getDataDir();
    upgrade(url, dataDir == null ? null : dataDir.resolve("backups"));
  }

  /**
   * Bring the database behind {@code jdbcUrl} to the current schema.
   *
   * @param jdbcUrl   a {@code jdbc:sqlite:} URL; the file is created if missing
   * @param backupDir where a copy of an existing database is written before a
   *                  pending migration is applied; {@code null} for no copy
   * @return {@code true} if the schema was changed (legacy rewrite, baseline or
   *         migration)
   */
  public static boolean upgrade(String jdbcUrl, Path backupDir) throws SQLException, IOException {
    Path databaseFile = fileOf(jdbcUrl);
    boolean changed;
    boolean hasTables;
    try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
      changed = LegacySchemaMigration.migrate(connection, databaseFile, backupDir);
      hasTables = LegacySchemaMigration.tableExists(connection, "dogs");
    }

    Flyway flyway = Flyway.configure()
        .dataSource(jdbcUrl, null, null)
        .locations(SCRIPTS)
        .baselineOnMigrate(true)
        .baselineVersion("1")
        .baselineDescription("Schema of TrackHounds 3.0")
        .validateMigrationNaming(true)
        .load();

    MigrationInfoService info = flyway.info();
    boolean baselining = hasTables && info.current() == null;
    boolean pending = info.pending().length > 0;
    if (pending && hasTables && !changed && backupDir != null && databaseFile != null && Files.isRegularFile(databaseFile)) {
      // The legacy rewrite takes its own copy; otherwise copy before Flyway touches an existing database.
      Path copy = backup(jdbcUrl, backupDir);
      LOG.info("Database backed up to {} before the schema upgrade", copy);
    }

    MigrateResult result = flyway.migrate();
    if (baselining) {
      LOG.info("Database created before schema versioning; baselined at version 1");
      changed = true;
    }
    if (result.migrationsExecuted > 0) {
      LOG.info("Database schema upgraded to version {} ({} migration(s) applied)", result.targetSchemaVersion, result.migrationsExecuted);
      changed = true;
    }
    return changed;
  }

  /**
   * Drop every table, so the next {@link #upgrade} starts from the scripts.
   * Used by the tests ({@code trackhounds.database.reset-on-start=true}) so a
   * test database left behind by an earlier run never gets in the way.
   */
  static void reset(String jdbcUrl) {
    Flyway.configure().dataSource(jdbcUrl, null, null).cleanDisabled(false).load().clean();
    LOG.info("Database reset: every table dropped before the migrations");
  }

  /** A consistent copy of the database, written with {@code VACUUM INTO}. */
  static Path backup(String jdbcUrl, Path backupDir) throws SQLException, IOException {
    Files.createDirectories(backupDir);
    String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    Path target = backupDir.resolve("trackhounds-before-upgrade-" + stamp + ".db");
    for (int n = 2; Files.exists(target); n++) {
      target = backupDir.resolve("trackhounds-before-upgrade-" + stamp + "-" + n + ".db");
    }
    try (Connection connection = DriverManager.getConnection(jdbcUrl); Statement statement = connection.createStatement()) {
      statement.execute("vacuum into '" + target.toString().replace("'", "''") + "'");
    }
    return target;
  }

  /** The file behind a {@code jdbc:sqlite:} URL, or {@code null} for an in-memory database. */
  static Path fileOf(String jdbcUrl) {
    if (jdbcUrl == null || !jdbcUrl.startsWith(JDBC_PREFIX)) {
      return null;
    }
    String path = jdbcUrl.substring(JDBC_PREFIX.length());
    if (path.isEmpty() || path.startsWith(":memory:") || path.startsWith("file::memory:")) {
      return null;
    }
    int query = path.indexOf('?');
    return Path.of(query >= 0 ? path.substring(0, query) : path).toAbsolutePath();
  }
}
