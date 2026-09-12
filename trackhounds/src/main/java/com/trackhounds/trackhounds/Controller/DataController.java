package com.trackhounds.trackhounds.Controller;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;
import com.trackhounds.trackhounds.Service.DataService;

/**
 * Backups, restores and past hunts; see {@link DataService}.
 */
@RestController
@CrossOrigin("*")
@RequestMapping("/data")
public class DataController {

  private final DataService dataService;

  public DataController(DataService dataService) {
    this.dataService = dataService;
  }

  @GetMapping
  public Map<String, Object> status() throws IOException {
    return dataService.status();
  }

  @GetMapping("/backups")
  public List<Map<String, Object>> backups() throws IOException {
    return dataService.listBackups();
  }

  @PostMapping("/backups")
  public Map<String, Object> backup() throws IOException, SQLException {
    return dataService.backup();
  }

  /** A fresh copy of the database as a download. */
  @GetMapping("/backups/download")
  public ResponseEntity<Resource> download() throws IOException, SQLException {
    Path snapshot = dataService.snapshotForDownload();
    // The temp file disappears once the response has been streamed.
    InputStream stream = Files.newInputStream(snapshot, StandardOpenOption.READ, StandardOpenOption.DELETE_ON_CLOSE);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + dataService.downloadName() + "\"")
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .contentLength(Files.size(snapshot))
        .body(new InputStreamResource(stream));
  }

  @PostMapping("/backups/{file}/restore")
  public Map<String, Object> restoreBackup(@PathVariable("file") String file) throws IOException, SQLException {
    return dataService.restoreBackup(file);
  }

  @DeleteMapping("/backups/{file}")
  public void deleteBackup(@PathVariable("file") String file) throws IOException {
    dataService.deleteBackup(file);
  }

  @PostMapping("/restore")
  public Map<String, Object> restore(@RequestParam("file") MultipartFile file) throws IOException, SQLException {
    requireFile(file);
    try (InputStream in = file.getInputStream()) {
      return dataService.restoreUpload(in, file.getOriginalFilename());
    }
  }

  @GetMapping("/hunts")
  public List<Map<String, Object>> hunts() throws IOException {
    return dataService.listHunts();
  }

  @PostMapping("/hunts")
  public Map<String, Object> archive() throws IOException, SQLException {
    return dataService.archiveCurrentHunt();
  }

  @PostMapping("/hunts/import")
  public Map<String, Object> importHunt(@RequestParam("file") MultipartFile file) throws IOException, SQLException {
    requireFile(file);
    try (InputStream in = file.getInputStream()) {
      return dataService.importHunt(in, file.getOriginalFilename());
    }
  }

  @PostMapping("/hunts/{file}/open")
  public Map<String, Object> open(@PathVariable("file") String file) throws IOException, SQLException {
    return dataService.openHunt(file);
  }

  @DeleteMapping("/hunts/{file}")
  public void delete(@PathVariable("file") String file) throws IOException {
    dataService.deleteHunt(file);
  }

  private static void requireFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new TrackHoundsAPIException(HttpStatus.BAD_REQUEST, "Choose a file first.", Map.of("file", "No file was uploaded."));
    }
  }
}
