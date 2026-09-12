package com.trackhounds.trackhounds.Config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** A comparable picture of a SQLite database's application tables, for the schema tests. */
final class SchemaSnapshot {

  private SchemaSnapshot() {
  }

  /** Every application table with its columns as "name type notnull default pk", sorted. */
  static Map<String, List<String>> describe(String jdbcUrl) throws SQLException {
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
