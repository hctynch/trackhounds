package com.trackhounds.trackhounds.Controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trackhounds.trackhounds.Config.TrackhoundsProperties;
import com.trackhounds.trackhounds.Desktop.DesktopLauncher;

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
        return info;
    }
}
