package com.trackhounds.trackhounds.Controller;

import java.awt.Desktop;
import java.io.File;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Config.TrackhoundsProperties;
import com.trackhounds.trackhounds.Desktop.DesktopLauncher;
import com.trackhounds.trackhounds.Exception.TrackHoundsAPIException;

/**
 * Information about the running application (version, data folder) for the
 * documentation page of the UI and for troubleshooting.
 */
@RestController
@CrossOrigin("*")
@RequestMapping("/app")
public class AppInfoController {

    private final TrackhoundsProperties properties;
    private final ObjectProvider<BuildProperties> buildProperties;
    private final ObjectProvider<DesktopLauncher> launcher;
    private final Environment environment;

    public AppInfoController(TrackhoundsProperties properties, ObjectProvider<BuildProperties> buildProperties,
            ObjectProvider<DesktopLauncher> launcher, Environment environment) {
        this.properties = properties;
        this.buildProperties = buildProperties;
        this.launcher = launcher;
        this.environment = environment;
    }

    /**
     * Basic application information.
     *
     * @return name, version, data directory and database location
     */
    @GetMapping("/info")
    public Map<String, Object> info() {
        BuildProperties build = buildProperties.getIfAvailable();
        DesktopLauncher desktop = launcher.getIfAvailable();
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("name", "TrackHounds");
        info.put("version", build != null ? build.getVersion() : "development");
        info.put("buildTime", build != null && build.getTime() != null ? build.getTime().toString() : null);
        info.put("dataDir", properties.getDataDir() != null ? properties.getDataDir().toString() : null);
        info.put("database", environment.getProperty("spring.datasource.url"));
        info.put("port", environment.getProperty("local.server.port"));
        info.put("desktop", desktop != null);
        info.put("connectedWindows", desktop != null ? desktop.getConnectedClients() : null);
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("canOpenFolders", canOpen());
        return info;
    }

    /**
     * Open a folder or the log file in Windows Explorer / the default editor.
     * Only works in the desktop application (there is no desktop in server mode).
     *
     * @param target {@code data}, {@code backups}, {@code hunts} or {@code log}
     */
    @PostMapping("/open/{target}")
    public Map<String, Object> open(@PathVariable("target") String target) {
        if (!canOpen() || properties.getDataDir() == null) {
            throw new TrackHoundsAPIException(HttpStatus.CONFLICT, "Only the desktop application can open folders.",
                    Map.of("target", "Open the folder shown on this page yourself."));
        }
        File file = switch (target) {
            case "data" -> properties.getDataDir().toFile();
            case "backups" -> properties.getDataDir().resolve("backups").toFile();
            case "hunts" -> properties.getDataDir().resolve("hunts").toFile();
            case "log" -> properties.getDataDir().resolve("logs").resolve("trackhounds.log").toFile();
            default -> throw new TrackHoundsAPIException(HttpStatus.NOT_FOUND, "Nothing to open called " + target + ".", Map.of("target", target));
        };
        if (!file.exists() && !file.getName().endsWith(".log")) {
            file.mkdirs();
        }
        if (!file.exists()) {
            throw new TrackHoundsAPIException(HttpStatus.NOT_FOUND, file.getName() + " does not exist yet.", Map.of("target", file.toString()));
        }
        try {
            Desktop.getDesktop().open(file);
        } catch (IOException | RuntimeException e) {
            throw new TrackHoundsAPIException(HttpStatus.INTERNAL_SERVER_ERROR, "Windows could not open " + file + ".", Map.of("target", e.getMessage() == null ? "" : e.getMessage()));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("opened", file.toString());
        return result;
    }

    private boolean canOpen() {
        try {
            return launcher.getIfAvailable() != null && Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.OPEN);
        } catch (RuntimeException e) {
            return false;
        }
    }
}
