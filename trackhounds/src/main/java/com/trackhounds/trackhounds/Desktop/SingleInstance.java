package com.trackhounds.trackhounds.Desktop;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.Optional;

/**
 * Guarantees that only one TrackHounds process runs per data directory.
 *
 * <p>
 * The running instance holds an OS level lock on {@code .trackhounds.lock} and
 * publishes its URL in {@code .trackhounds.url}. A second launch cannot obtain
 * the lock, reads the URL, opens a window on the running instance and exits.
 * </p>
 */
public final class SingleInstance {

    /** Lock file name inside the data directory. */
    public static final String LOCK_FILE = ".trackhounds.lock";

    /** File that holds the URL of the running instance. */
    public static final String URL_FILE = ".trackhounds.url";

    /** Kept referenced so the lock lives as long as the JVM. */
    @SuppressWarnings("unused")
    private static FileChannel lockChannel;
    private static FileLock lock;

    private SingleInstance() {
    }

    /**
     * Try to become the primary instance.
     *
     * @param dataDir data directory
     * @return {@code true} if this process now owns the lock
     */
    public static synchronized boolean tryAcquire(Path dataDir) {
        if (lock != null) {
            return true;
        }
        try {
            FileChannel channel = FileChannel.open(dataDir.resolve(LOCK_FILE),
                    StandardOpenOption.CREATE, StandardOpenOption.WRITE);
            FileLock acquired = channel.tryLock();
            if (acquired == null) {
                channel.close();
                return false;
            }
            lockChannel = channel;
            lock = acquired;
            return true;
        } catch (IOException | RuntimeException e) {
            // If locking is not possible at all, do not block the user from starting.
            return true;
        }
    }

    /**
     * Publish the URL of this (primary) instance.
     *
     * @param dataDir data directory
     * @param url     base URL of the running server
     */
    public static void publishUrl(Path dataDir, String url) {
        try {
            Files.writeString(dataDir.resolve(URL_FILE), url, StandardCharsets.UTF_8);
        } catch (IOException ignored) {
            // Best effort only.
        }
    }

    /**
     * Remove the published URL (called on shutdown).
     *
     * @param dataDir data directory
     */
    public static void clearUrl(Path dataDir) {
        try {
            Files.deleteIfExists(dataDir.resolve(URL_FILE));
        } catch (IOException ignored) {
            // Best effort only.
        }
    }

    /**
     * URL of an already running instance, if it responds to a health check.
     *
     * @param dataDir data directory
     * @return URL of the live instance
     */
    public static Optional<String> runningInstanceUrl(Path dataDir) {
        Path urlFile = dataDir.resolve(URL_FILE);
        if (!Files.isRegularFile(urlFile)) {
            return Optional.empty();
        }
        try {
            String url = Files.readString(urlFile, StandardCharsets.UTF_8).trim();
            if (url.isEmpty()) {
                return Optional.empty();
            }
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
            HttpRequest request = HttpRequest.newBuilder(URI.create(url + "actuator/health"))
                    .timeout(Duration.ofSeconds(3)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 ? Optional.of(url) : Optional.empty();
        } catch (IOException | InterruptedException | RuntimeException e) {
            return Optional.empty();
        }
    }
}
