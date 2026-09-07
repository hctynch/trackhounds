package com.trackhounds.trackhounds.Config;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * Application settings under the {@code trackhounds.*} prefix.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "trackhounds")
public class TrackhoundsProperties {

    /**
     * Folder that holds the database, logs and browser profile. Resolved by
     * {@link DataDirectoryEnvironmentPostProcessor}.
     */
    private Path dataDir;

    /**
     * Fixed port for the embedded web server. {@code 0} (default) lets the
     * desktop launcher pick the preferred port or a free one.
     */
    private int port = 0;

    /** Desktop launcher settings. */
    private Desktop desktop = new Desktop();

    /**
     * Settings for the desktop launcher (tray icon and application window).
     */
    @Getter
    @Setter
    public static class Desktop {
        /** Whether to show the tray icon and open the application window. */
        private boolean enabled = true;

        /** Port tried first before falling back to a random free port. */
        private int preferredPort = 8080;

        /** Initial window width in pixels. */
        private int windowWidth = 1440;

        /** Initial window height in pixels. */
        private int windowHeight = 900;
    }
}
