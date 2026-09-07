package com.trackhounds.trackhounds.Config;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Resolves the {@code trackhounds.data-dir} property before the rest of the
 * configuration is bound, creates the directory, and publishes the normalised
 * absolute path so that {@code application.properties} can reference it (for
 * example in the SQLite JDBC URL and the log file location).
 *
 * <p>
 * Resolution order: explicit property (command line, system property,
 * {@code TRACKHOUNDS_DATA_DIR} environment variable, profile properties) and
 * otherwise a per-user application-data folder for the current platform.
 * </p>
 */
public class DataDirectoryEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    /** Property holding the data directory. */
    public static final String PROPERTY = "trackhounds.data-dir";

    /** Environment variable equivalent of {@link #PROPERTY}. */
    public static final String ENV_VAR = "TRACKHOUNDS_DATA_DIR";

    /** Folder name used inside the platform application-data directory. */
    public static final String APP_FOLDER = "TrackHounds";

    @Override
    public int getOrder() {
        // Run after application.properties / profile files have been loaded.
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path dataDir = resolve(environment.getProperty(PROPERTY));
        environment.getPropertySources().addFirst(
                new MapPropertySource("trackhoundsDataDirectory", Map.of(PROPERTY, toPropertyValue(dataDir))));
    }

    /**
     * Resolve, normalise and create the data directory.
     *
     * @param configured explicitly configured path, may be {@code null} or blank
     * @return absolute, existing data directory
     */
    public static Path resolve(String configured) {
        Path dir = (configured == null || configured.isBlank())
                ? defaultDataDirectory()
                : Paths.get(configured.trim());
        dir = dir.toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
            Files.createDirectories(dir.resolve("logs"));
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create TrackHounds data directory " + dir, e);
        }
        return dir;
    }

    /**
     * Resolve the data directory from launch-time sources only (command line,
     * system property, environment variable). Used before Spring starts.
     *
     * @param args command line arguments
     * @return absolute, existing data directory
     */
    public static Path resolveFromLaunch(String[] args) {
        String configured = null;
        for (String arg : args) {
            if (arg.startsWith("--" + PROPERTY + "=")) {
                configured = arg.substring(("--" + PROPERTY + "=").length());
            }
        }
        if (configured == null) {
            configured = System.getProperty(PROPERTY);
        }
        if (configured == null) {
            configured = System.getenv(ENV_VAR);
        }
        return resolve(configured);
    }

    /**
     * Platform specific default location.
     *
     * @return default data directory (not yet created)
     */
    public static Path defaultDataDirectory() {
        String os = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        Path home = Paths.get(System.getProperty("user.home"));
        if (os.contains("win")) {
            String localAppData = System.getenv("LOCALAPPDATA");
            Path base = (localAppData != null && !localAppData.isBlank())
                    ? Paths.get(localAppData)
                    : home.resolve("AppData").resolve("Local");
            return base.resolve(APP_FOLDER);
        }
        if (os.contains("mac")) {
            return home.resolve("Library").resolve("Application Support").resolve(APP_FOLDER);
        }
        String xdg = System.getenv("XDG_DATA_HOME");
        Path base = (xdg != null && !xdg.isBlank()) ? Paths.get(xdg) : home.resolve(".local").resolve("share");
        return base.resolve(APP_FOLDER);
    }

    /**
     * Property-friendly representation (forward slashes work in JDBC URLs and
     * logging configuration on every platform).
     */
    public static String toPropertyValue(Path dir) {
        return dir.toString().replace('\\', '/');
    }
}
