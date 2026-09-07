package com.trackhounds.trackhounds.Desktop;

import java.awt.Desktop;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Opens the user interface in a dedicated, chrome-less browser window.
 *
 * <p>
 * Microsoft Edge (bundled with Windows 10/11) and Google Chrome support an
 * "application mode" ({@code --app=URL}) that shows a page in its own window
 * without tabs or an address bar, which gives the look and feel of a native
 * desktop application while still using a full modern rendering engine (needed
 * for printing the reports). A private browser profile inside the data
 * directory keeps the window separate from the user's normal browsing session.
 * If no such browser is found the URL is opened with the system default browser
 * instead.
 * </p>
 *
 * <p>
 * Note: the launched process is not a reliable handle on the window. Edge on
 * Windows hands over to a new browser process and exits at once, so window
 * lifetime is tracked by the pages themselves (see {@link DesktopLauncher}).
 * </p>
 */
public final class BrowserWindow {

    private static final Logger LOG = LoggerFactory.getLogger(BrowserWindow.class);

    private BrowserWindow() {
    }

    /**
     * Open {@code url} in an application-mode window.
     *
     * @param url        URL to show
     * @param profileDir browser profile directory (created if missing)
     * @param width      initial window width
     * @param height     initial window height
     * @return {@code true} if an app-mode window was started, {@code false} if
     *         the system default browser was used instead
     */
    public static boolean open(String url, Path profileDir, int width, int height) {
        Optional<Path> browser = findChromiumBrowser();
        if (browser.isPresent()) {
            try {
                Files.createDirectories(profileDir);
                List<String> command = new ArrayList<>();
                command.add(browser.get().toString());
                command.add("--app=" + url);
                command.add("--user-data-dir=" + profileDir);
                command.add("--window-size=" + width + "," + height);
                command.add("--no-first-run");
                command.add("--no-default-browser-check");
                command.add("--disable-background-mode");
                command.add("--disable-background-networking");
                command.add("--disable-sync");
                command.add("--disable-features=Translate");
                new ProcessBuilder(command)
                        .redirectErrorStream(true)
                        .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                        .start();
                LOG.info("Opened application window with {}", browser.get());
                return true;
            } catch (IOException e) {
                LOG.warn("Could not start {} in app mode, falling back to the default browser", browser.get(), e);
            }
        }
        openWithDefaultBrowser(url);
        return false;
    }

    /**
     * Open {@code url} with the system default browser.
     *
     * @param url URL to open
     * @return {@code true} if a browser was launched
     */
    public static boolean openWithDefaultBrowser(String url) {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI.create(url));
                LOG.info("Opened {} with the system default browser", url);
                return true;
            }
        } catch (IOException | RuntimeException e) {
            LOG.warn("Could not open the default browser", e);
        }
        try {
            String os = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
            if (os.contains("win")) {
                new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
                return true;
            }
            if (os.contains("mac")) {
                new ProcessBuilder("open", url).start();
                return true;
            }
            new ProcessBuilder("xdg-open", url).start();
            return true;
        } catch (IOException e) {
            LOG.error("No browser available. Open {} manually.", url);
            return false;
        }
    }

    /**
     * Locate Microsoft Edge or Google Chrome.
     *
     * @return path to the browser executable
     */
    public static Optional<Path> findChromiumBrowser() {
        String os = System.getProperty("os.name", "").toLowerCase(Locale.ROOT);
        List<Path> candidates = new ArrayList<>();
        if (os.contains("win")) {
            for (String base : new String[] { System.getenv("ProgramFiles(x86)"), System.getenv("ProgramFiles"),
                    System.getenv("LOCALAPPDATA") }) {
                if (base == null || base.isBlank()) {
                    continue;
                }
                candidates.add(Paths.get(base, "Microsoft", "Edge", "Application", "msedge.exe"));
                candidates.add(Paths.get(base, "Google", "Chrome", "Application", "chrome.exe"));
            }
            registryAppPath("msedge.exe").ifPresent(candidates::add);
            registryAppPath("chrome.exe").ifPresent(candidates::add);
        } else if (os.contains("mac")) {
            candidates.add(Paths.get("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"));
            candidates.add(Paths.get("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"));
            candidates.add(Paths.get("/Applications/Chromium.app/Contents/MacOS/Chromium"));
        } else {
            for (String name : new String[] { "microsoft-edge", "google-chrome", "google-chrome-stable", "chromium",
                    "chromium-browser" }) {
                onPath(name).ifPresent(candidates::add);
            }
        }
        return candidates.stream().filter(Files::isExecutable).findFirst();
    }

    private static Optional<Path> onPath(String executable) {
        String path = System.getenv("PATH");
        if (path == null) {
            return Optional.empty();
        }
        for (String dir : path.split(java.io.File.pathSeparator)) {
            Path candidate = Paths.get(dir, executable);
            if (Files.isExecutable(candidate)) {
                return Optional.of(candidate);
            }
        }
        return Optional.empty();
    }

    /**
     * Look up an executable in the Windows "App Paths" registry key.
     */
    private static Optional<Path> registryAppPath(String executable) {
        for (String hive : new String[] { "HKCU", "HKLM" }) {
            try {
                Process process = new ProcessBuilder("reg", "query",
                        hive + "\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\" + executable, "/ve")
                        .redirectErrorStream(true).start();
                String output = new String(process.getInputStream().readAllBytes());
                process.waitFor();
                Matcher matcher = Pattern.compile("REG_SZ\\s+(.+)").matcher(output);
                if (matcher.find()) {
                    Path path = Paths.get(matcher.group(1).trim());
                    if (Files.isExecutable(path)) {
                        return Optional.of(path);
                    }
                }
            } catch (IOException | InterruptedException | RuntimeException ignored) {
                // Registry lookup is optional.
            }
        }
        return Optional.empty();
    }
}
