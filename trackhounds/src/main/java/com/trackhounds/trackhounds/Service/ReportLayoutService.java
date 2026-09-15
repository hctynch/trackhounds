package com.trackhounds.trackhounds.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.trackhounds.trackhounds.Config.TrackhoundsProperties;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;

/**
 * Saved report layouts (the report builder's definitions): one JSON file per
 * layout in {@code <data>/reports/}. A layout belongs to the club, not to a
 * hunt, so it lives beside the database rather than inside it: it survives
 * "New hunt" and opening a past hunt, and it is part of the one-folder backup.
 *
 * The server stores the definition as the UI wrote it and checks only what it
 * needs to be a layout: an id that is safe as a file name, a name, a known
 * dataset and at least one column.
 */
@Service
public class ReportLayoutService {

  private static final Logger LOG = LoggerFactory.getLogger(ReportLayoutService.class);
  private static final Pattern ID = Pattern.compile("[a-z0-9][a-z0-9-]{0,79}");
  static final String FOLDER = "reports";

  private final TrackhoundsProperties properties;
  private final ObjectMapper mapper;

  public ReportLayoutService(TrackhoundsProperties properties, ObjectMapper mapper) {
    this.properties = properties;
    this.mapper = mapper.copy().enable(SerializationFeature.INDENT_OUTPUT);
  }

  Path folder() {
    Path dataDir = properties.getDataDir();
    return (dataDir == null ? Path.of(".").toAbsolutePath() : dataDir).resolve(FOLDER);
  }

  /** Every saved layout, by name. Unreadable files are skipped and logged. */
  public List<Map<String, Object>> list() throws IOException {
    Path folder = folder();
    if (!Files.isDirectory(folder)) {
      return List.of();
    }
    List<Map<String, Object>> layouts = new ArrayList<>();
    try (Stream<Path> files = Files.list(folder)) {
      for (Path file : files.filter(f -> f.getFileName().toString().endsWith(".json")).toList()) {
        try {
          Map<String, Object> layout = read(file);
          layout.put("id", file.getFileName().toString().replaceFirst("\\.json$", ""));
          layouts.add(layout);
        } catch (IOException | RuntimeException e) {
          LOG.warn("Skipping unreadable report layout {}", file, e);
        }
      }
    }
    layouts.sort(Comparator.comparing(layout -> String.valueOf(layout.get("name")).toLowerCase(Locale.ROOT)));
    return layouts;
  }

  public Map<String, Object> get(String id) throws IOException {
    Path file = file(id);
    if (!Files.isRegularFile(file)) {
      throw new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "There is no saved report called " + id + ".", Map.of("id", id));
    }
    Map<String, Object> layout = read(file);
    layout.put("id", id);
    return layout;
  }

  /** Create or replace a layout. */
  public Map<String, Object> save(String id, Map<String, Object> layout) throws IOException {
    Path file = file(id);
    Map<String, String> errors = new LinkedHashMap<>();
    if (layout == null) {
      errors.put("layout", "Nothing to save.");
    } else {
      Object name = layout.get("name");
      if (!(name instanceof String) || ((String) name).isBlank()) {
        errors.put("name", "Give the report a name.");
      }
      Object dataset = layout.get("dataset");
      if (!(dataset instanceof String) || !ReportDatasetService.DATASETS.contains(dataset)) {
        errors.put("dataset", "Choose what the rows are: dogs, scores, scratches or judges.");
      }
      Object columns = layout.get("columns");
      if (!(columns instanceof List) || ((List<?>) columns).isEmpty()) {
        errors.put("columns", "Pick at least one column.");
      }
    }
    if (!errors.isEmpty()) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "The report cannot be saved yet.", errors);
    }
    Map<String, Object> stored = new LinkedHashMap<>(layout);
    stored.put("id", id);
    stored.remove("builtin");
    Files.createDirectories(file.getParent());
    Files.writeString(file, mapper.writeValueAsString(stored));
    LOG.info("Report layout {} saved", id);
    return stored;
  }

  public void delete(String id) throws IOException {
    Path file = file(id);
    if (!Files.deleteIfExists(file)) {
      throw new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "There is no saved report called " + id + ".", Map.of("id", id));
    }
    LOG.info("Report layout {} deleted", id);
  }

  private Path file(String id) {
    if (id == null || !ID.matcher(id).matches()) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Report ids are lowercase letters, digits and dashes.", Map.of("id", String.valueOf(id)));
    }
    return folder().resolve(id + ".json");
  }

  private Map<String, Object> read(Path file) throws IOException {
    return mapper.readValue(Files.readString(file), new TypeReference<LinkedHashMap<String, Object>>() {
    });
  }
}
