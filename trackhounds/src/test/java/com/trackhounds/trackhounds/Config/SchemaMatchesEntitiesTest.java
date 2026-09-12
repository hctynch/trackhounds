package com.trackhounds.trackhounds.Config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import jakarta.persistence.EntityManagerFactory;

/**
 * The Flyway scripts own the schema and Hibernate never changes it, so the two
 * must agree. Hibernate's own validator cannot do this check on SQLite (the
 * dialect declares identity keys as {@code integer}, SQLite's rowid rule, while
 * the validator expects {@code bigint} for a {@code Long}), so the entity
 * schema is exported into a scratch file with the same dialect and naming
 * strategies as the application and compared column by column with the
 * database the scripts built.
 * <p>
 * When this fails after an entity change: add a {@code V<n>__*.sql} script
 * under {@code db/migration}, never edit {@code V1__baseline.sql}.
 */
@SpringBootTest
@ActiveProfiles("test")
class SchemaMatchesEntitiesTest {

  @Autowired
  private EntityManagerFactory entityManagerFactory;
  @Autowired
  private Environment environment;

  @TempDir
  Path temp;

  @Test
  void flywaySchemaMatchesTheEntities() throws Exception {
    Path reference = temp.resolve("entities.db");
    exportEntitySchema("jdbc:sqlite:" + reference);

    Map<String, List<String>> fromEntities = describe("jdbc:sqlite:" + reference);
    Map<String, List<String>> fromScripts = describe(environment.getProperty("spring.datasource.url"));

    assertFalse(fromEntities.isEmpty(), "the entity export produced no tables");
    assertEquals(fromEntities, fromScripts, "db/migration scripts differ from the entities; add a new V<n>__*.sql");
  }

  /**
   * Create the entities' tables in an empty database, as Hibernate would with
   * ddl-auto=create: a throw-away session factory with the same dialect and
   * naming strategies as the application, and schema generation switched on.
   */
  private void exportEntitySchema(String jdbcUrl) {
    Map<String, Object> settings = Map.of(
        "hibernate.connection.url", jdbcUrl,
        "hibernate.connection.driver_class", "org.sqlite.JDBC",
        "hibernate.dialect", "org.hibernate.community.dialect.SQLiteDialect",
        "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy",
        "hibernate.implicit_naming_strategy", "org.springframework.boot.orm.jpa.hibernate.SpringImplicitNamingStrategy",
        "jakarta.persistence.schema-generation.database.action", "create");
    StandardServiceRegistry registry = new StandardServiceRegistryBuilder().applySettings(settings).build();
    try {
      MetadataSources sources = new MetadataSources(registry);
      entityManagerFactory.getMetamodel().getEntities().forEach(entity -> sources.addAnnotatedClass(entity.getJavaType()));
      try (SessionFactory factory = sources.buildMetadata().buildSessionFactory()) {
        assertFalse(factory.isClosed());
      }
    } finally {
      StandardServiceRegistryBuilder.destroy(registry);
    }
  }

  /** Every application table with its columns as "name type notnull default pk", sorted. */
  private static Map<String, List<String>> describe(String jdbcUrl) throws SQLException {
    Map<String, List<String>> tables = new TreeMap<>();
    try (Connection connection = DriverManager.getConnection(jdbcUrl); Statement statement = connection.createStatement()) {
      List<String> names = new ArrayList<>();
      try (ResultSet rows = statement.executeQuery(
          "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like 'flyway_%' order by name")) {
        while (rows.next()) {
          names.add(rows.getString(1));
        }
      }
      for (String table : names) {
        List<String> columns = new ArrayList<>();
        try (ResultSet rows = statement.executeQuery("pragma table_info(" + table + ")")) {
          while (rows.next()) {
            columns.add(String.join(" ",
                rows.getString("name"),
                String.valueOf(rows.getString("type")).toLowerCase(),
                "notnull=" + rows.getInt("notnull"),
                "default=" + rows.getString("dflt_value"),
                "pk=" + rows.getInt("pk")));
          }
        }
        columns.sort(null);
        tables.put(table, columns);
      }
    }
    return tables;
  }
}
