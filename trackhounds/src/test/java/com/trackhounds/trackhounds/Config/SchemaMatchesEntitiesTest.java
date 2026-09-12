package com.trackhounds.trackhounds.Config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.hibernate.SessionFactory;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import jakarta.persistence.EntityManagerFactory;

/**
 * The Flyway scripts own the schema and Hibernate never changes it, so the two
 * must agree. Hibernate's own validator cannot do this check on SQLite (the
 * dialect declares identity keys as {@code integer}, SQLite's rowid rule, while
 * the validator expects {@code bigint} for a {@code Long}), so the entity
 * schema is exported into a scratch file with the same dialect and naming
 * strategies as the application and compared column by column with a second
 * scratch file built by the scripts.
 * <p>
 * Both files are private to the test: the shared test database is rewritten by
 * the restore tests and its state depends on test order.
 * <p>
 * When this fails after an entity change: add a {@code V<n>__*.sql} script
 * under {@code db/migration}, never edit {@code V1__baseline.sql}.
 */
@SpringBootTest
@ActiveProfiles("test")
class SchemaMatchesEntitiesTest {

  @Autowired
  private EntityManagerFactory entityManagerFactory;

  @TempDir
  Path temp;

  @Test
  void flywaySchemaMatchesTheEntities() throws Exception {
    String fromEntitiesUrl = "jdbc:sqlite:" + temp.resolve("entities.db");
    String fromScriptsUrl = "jdbc:sqlite:" + temp.resolve("scripts.db");
    exportEntitySchema(fromEntitiesUrl);
    DatabaseMigration.upgrade(fromScriptsUrl, null);

    Map<String, List<String>> fromEntities = SchemaSnapshot.describe(fromEntitiesUrl);
    Map<String, List<String>> fromScripts = SchemaSnapshot.describe(fromScriptsUrl);

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
}
