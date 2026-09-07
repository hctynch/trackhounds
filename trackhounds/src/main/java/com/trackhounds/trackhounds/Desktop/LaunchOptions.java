package com.trackhounds.trackhounds.Desktop;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.file.Path;

import com.trackhounds.trackhounds.Config.DataDirectoryEnvironmentPostProcessor;

/**
 * Options that must be known before the Spring context starts (single instance
 * handling, AWT headless mode and the server port). Read from the command line
 * ({@code --trackhounds.desktop.enabled=false}), system properties or
 * environment variables ({@code TRACKHOUNDS_DESKTOP_ENABLED}).
 *
 * @param desktop whether the desktop launcher (tray icon + window) is enabled
 * @param dataDir resolved data directory
 * @param port    port for the embedded server ({@code 0} = any free port)
 */
public record LaunchOptions(boolean desktop, Path dataDir, int port) {

    /** Property that toggles the desktop launcher. */
    public static final String DESKTOP_PROPERTY = "trackhounds.desktop.enabled";

    /** Property that fixes the server port. */
    public static final String PORT_PROPERTY = "trackhounds.port";

    /** Port tried first so the address stays stable between runs. */
    public static final int PREFERRED_PORT = 8080;

    /**
     * Parse launch options and record the chosen port as a system property so
     * that {@code server.port=${trackhounds.port:0}} picks it up.
     *
     * @param args command line arguments
     * @return resolved options
     */
    public static LaunchOptions parse(String[] args) {
        String desktop = value(args, DESKTOP_PROPERTY, "TRACKHOUNDS_DESKTOP_ENABLED");
        for (String arg : args) {
            if (arg.equals("--headless") || arg.equals("--server")) {
                desktop = "false";
            }
        }
        boolean enabled = desktop == null || !desktop.trim().equalsIgnoreCase("false");

        int port;
        String configuredPort = value(args, PORT_PROPERTY, "TRACKHOUNDS_PORT");
        if (configuredPort != null && !configuredPort.isBlank()) {
            port = Integer.parseInt(configuredPort.trim());
        } else {
            port = isFree(PREFERRED_PORT) ? PREFERRED_PORT : 0;
        }
        System.setProperty(PORT_PROPERTY, String.valueOf(port));

        return new LaunchOptions(enabled, DataDirectoryEnvironmentPostProcessor.resolveFromLaunch(args), port);
    }

    private static String value(String[] args, String property, String envVar) {
        String result = null;
        for (String arg : args) {
            if (arg.startsWith("--" + property + "=")) {
                result = arg.substring(("--" + property + "=").length());
            }
        }
        if (result == null) {
            result = System.getProperty(property);
        }
        if (result == null) {
            result = System.getenv(envVar);
        }
        return result;
    }

    private static boolean isFree(int port) {
        try (ServerSocket socket = new ServerSocket(port, 1, InetAddress.getLoopbackAddress())) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }
}
