package com.trackhounds.trackhounds.Service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;

/**
 * Saved report layouts as JSON files in the data folder.
 */
@SpringBootTest
@ActiveProfiles("test")
class ReportLayoutServiceTest {

  @Autowired
  private ReportLayoutService layouts;

  @BeforeEach
  @AfterEach
  void clean() throws IOException {
    Path folder = layouts.folder();
    if (Files.isDirectory(folder)) {
      try (Stream<Path> files = Files.list(folder)) {
        for (Path file : files.toList()) {
          Files.deleteIfExists(file);
        }
      }
    }
  }

  private static Map<String, Object> layout(String name) {
    Map<String, Object> layout = new LinkedHashMap<>();
    layout.put("name", name);
    layout.put("dataset", "dogs");
    layout.put("columns", List.of(Map.of("key", "place"), Map.of("key", "number"), Map.of("key", "name", "label", "Hound")));
    layout.put("filters", Map.of("day", "ask", "stake", "ALL", "limit", 10));
    layout.put("title", "Day {day} placings");
    return layout;
  }

  @Test
  @SuppressWarnings("unchecked")
  void layoutsAreSavedListedAndReadBack() throws Exception {
    assertTrue(layouts.list().isEmpty());
    Map<String, Object> saved = layouts.save("club-daily-sheet", layout("Club daily sheet"));
    assertEquals("club-daily-sheet", saved.get("id"));
    assertTrue(Files.isRegularFile(layouts.folder().resolve("club-daily-sheet.json")));

    layouts.save("a-first", layout("A first sheet"));
    List<Map<String, Object>> all = layouts.list();
    assertEquals(2, all.size());
    assertEquals("A first sheet", all.get(0).get("name"), "sorted by name");

    Map<String, Object> read = layouts.get("club-daily-sheet");
    assertEquals("Club daily sheet", read.get("name"));
    assertEquals("dogs", read.get("dataset"));
    List<Map<String, Object>> columns = (List<Map<String, Object>>) read.get("columns");
    assertEquals("Hound", columns.get(2).get("label"));
    assertEquals("ask", ((Map<String, Object>) read.get("filters")).get("day"));

    // Saving again replaces.
    Map<String, Object> renamed = layout("Renamed");
    layouts.save("club-daily-sheet", renamed);
    assertEquals("Renamed", layouts.get("club-daily-sheet").get("name"));
    assertEquals(2, layouts.list().size());

    layouts.delete("club-daily-sheet");
    assertEquals(1, layouts.list().size());
    assertThrows(TrackHoundsAPIException.class, () -> layouts.get("club-daily-sheet"));
    assertThrows(TrackHoundsAPIException.class, () -> layouts.delete("club-daily-sheet"));
  }

  @Test
  void invalidLayoutsAndIdsAreRejected() {
    Map<String, Object> noName = layout("");
    TrackHoundsAPIException nameError = assertThrows(TrackHoundsAPIException.class, () -> layouts.save("x", noName));
    assertTrue(nameError.getFields().containsKey("name"));

    Map<String, Object> badDataset = layout("Bad");
    badDataset.put("dataset", "crosses");
    assertTrue(assertThrows(TrackHoundsAPIException.class, () -> layouts.save("x", badDataset)).getFields().containsKey("dataset"));

    Map<String, Object> noColumns = layout("Empty");
    noColumns.put("columns", List.of());
    assertTrue(assertThrows(TrackHoundsAPIException.class, () -> layouts.save("x", noColumns)).getFields().containsKey("columns"));

    Map<String, Object> fine = layout("Fine");
    assertThrows(TrackHoundsAPIException.class, () -> layouts.save("../escape", fine));
    assertThrows(TrackHoundsAPIException.class, () -> layouts.save("Has Spaces", fine));
  }

  @Test
  void unreadableFilesAreSkipped() throws Exception {
    layouts.save("good", layout("Good"));
    Files.createDirectories(layouts.folder());
    Files.writeString(layouts.folder().resolve("broken.json"), "{ not json");
    List<Map<String, Object>> all = layouts.list();
    assertEquals(1, all.size());
    assertEquals("good", all.get(0).get("id"));
  }
}
