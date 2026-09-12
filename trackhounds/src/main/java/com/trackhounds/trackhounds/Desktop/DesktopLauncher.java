package com.trackhounds.trackhounds.Desktop;

import java.awt.AWTException;
import java.awt.Desktop;
import java.awt.Image;
import java.awt.MenuItem;
import java.awt.PopupMenu;
import java.awt.SystemTray;
import java.awt.Toolkit;
import java.awt.TrayIcon;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.imageio.ImageIO;
import javax.swing.JOptionPane;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.info.BuildProperties;
import org.springframework.boot.web.context.WebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.trackhounds.trackhounds.Config.TrackhoundsProperties;

/**
 * Turns the embedded web application into a desktop application:
 * <ul>
 * <li>publishes the server URL for the single-instance check,</li>
 * <li>adds a system tray icon with Open / Data folder / About / Quit,</li>
 * <li>opens the UI in an application window,</li>
 * <li>shuts the server down once the last UI window has been closed.</li>
 * </ul>
 *
 * <p>
 * Window lifetime is tracked by the pages themselves rather than by browser
 * processes (Edge on Windows hands the window over to another process and
 * exits immediately). Every open page keeps a Server-Sent Events connection
 * ({@code GET /app/events}) and sends a beacon ({@code POST /app/window-closed})
 * when it unloads. When no page has been connected for
 * {@link #RECONNECT_GRACE} the application exits; the grace period covers page
 * reloads and short network hiccups. Until the first page has connected the
 * application keeps running so a slow browser start does not kill it.
 * </p>
 *
 * Disabled with {@code trackhounds.desktop.enabled=false} (tests, CI, or when
 * running as a plain local web server).
 */
public class DesktopLauncher {

    private static final Logger LOG = LoggerFactory.getLogger(DesktopLauncher.class);

    /** Time without any connected page after which the application exits. */
    static final Duration RECONNECT_GRACE = Duration.ofSeconds(6);

    /** Interval of SSE keep-alive comments (also detects closed connections). */
    static final Duration PING_INTERVAL = Duration.ofSeconds(10);

    /** Warn if no page connected within this time after start-up. */
    static final Duration FIRST_CONNECTION_WARNING = Duration.ofSeconds(60);

    private final TrackhoundsProperties properties;
    private final ObjectProvider<BuildProperties> buildProperties;
    private final Map<String, SseEmitter> clients = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(runnable -> {
        Thread thread = new Thread(runnable, "trackhounds-desktop");
        thread.setDaemon(true);
        return thread;
    });
    private final AtomicBoolean shuttingDown = new AtomicBoolean(false);

    private ConfigurableApplicationContext context;
    private String url;
    private TrayIcon trayIcon;
    private volatile boolean everConnected;
    private volatile ScheduledFuture<?> pendingShutdown;

    public DesktopLauncher(TrackhoundsProperties properties, ObjectProvider<BuildProperties> buildProperties) {
        this.properties = properties;
        this.buildProperties = buildProperties;
    }

    /**
     * Base URL of the running server.
     */
    public String getUrl() {
        return url;
    }

    /**
     * Number of UI pages currently connected.
     */
    public int getConnectedClients() {
        return clients.size();
    }

    @EventListener
    public void onReady(ApplicationReadyEvent event) {
        this.context = event.getApplicationContext();
        int port = ((WebServerApplicationContext) context).getWebServer().getPort();
        this.url = "http://127.0.0.1:" + port + "/";
        com.trackhounds.trackhounds.TrackhoundsApplication.closeSplash();
        LOG.info("TrackHounds is running at {}", url);
        LOG.info("Data directory: {}", properties.getDataDir());

        SingleInstance.publishUrl(properties.getDataDir(), url);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> SingleInstance.clearUrl(properties.getDataDir()),
                "trackhounds-cleanup"));

        scheduler.scheduleAtFixedRate(this::ping, PING_INTERVAL.toMillis(), PING_INTERVAL.toMillis(),
                TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> {
            if (!everConnected) {
                LOG.warn("No application window has connected yet. Open {} manually or use the tray icon.", url);
            }
        }, FIRST_CONNECTION_WARNING.toMillis(), TimeUnit.MILLISECONDS);

        installTrayIcon();
        openWindow();
    }

    /**
     * Open (another) application window.
     */
    public void openWindow() {
        int width = properties.getDesktop().getWindowWidth();
        int height = properties.getDesktop().getWindowHeight();
        if ("javafx".equalsIgnoreCase(properties.getDesktop().getWindow())) {
            if (JavaFxWindow.isAvailable()
                    && JavaFxWindow.open(url, "TrackHounds", width, height, properties.getDataDir().resolve("javafx-cache"), this::shutdown)) {
                return;
            }
            LOG.warn("The JavaFX window is not available; opening a browser window instead");
        }
        boolean appMode = BrowserWindow.open(url, profileDir(), width, height);
        if (!appMode && trayIcon == null) {
            LOG.warn("No tray icon and no application window: close the window to stop, or end the process manually.");
        }
    }

    /**
     * Register a UI page. Called for every {@code GET /app/events}.
     *
     * @param clientId identifier generated by the page
     * @return emitter that stays open while the page is alive
     */
    public SseEmitter register(String clientId) {
        SseEmitter emitter = new SseEmitter(0L);
        SseEmitter previous = clients.put(clientId, emitter);
        if (previous != null) {
            previous.complete();
        }
        everConnected = true;
        cancelPendingShutdown();
        Runnable remove = () -> unregister(clientId, emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(throwable -> remove.run());
        try {
            emitter.send(SseEmitter.event().name("connected").data(url));
        } catch (IOException | IllegalStateException e) {
            remove.run();
        }
        LOG.debug("Page connected ({} open)", clients.size());
        return emitter;
    }

    /**
     * A page reported that it is being unloaded (closed, reloaded or
     * navigated away). Called for {@code POST /app/window-closed}.
     *
     * @param clientId identifier generated by the page
     */
    public void windowClosed(String clientId) {
        SseEmitter emitter = clients.remove(clientId);
        if (emitter != null) {
            emitter.complete();
        }
        if (clients.isEmpty()) {
            scheduleShutdownCheck();
        }
    }

    private void unregister(String clientId, SseEmitter emitter) {
        if (clients.remove(clientId, emitter)) {
            LOG.debug("Page disconnected ({} open)", clients.size());
            if (clients.isEmpty()) {
                scheduleShutdownCheck();
            }
        }
    }

    private void scheduleShutdownCheck() {
        cancelPendingShutdown();
        pendingShutdown = scheduler.schedule(() -> {
            if (everConnected && clients.isEmpty() && !shuttingDown.get()) {
                LOG.info("Last application window closed, shutting down");
                shutdown();
            }
        }, RECONNECT_GRACE.toMillis(), TimeUnit.MILLISECONDS);
    }

    private void cancelPendingShutdown() {
        ScheduledFuture<?> pending = pendingShutdown;
        if (pending != null) {
            pending.cancel(false);
            pendingShutdown = null;
        }
    }

    private void ping() {
        clients.forEach((clientId, emitter) -> {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (IOException | IllegalStateException e) {
                unregister(clientId, emitter);
                emitter.completeWithError(e);
            }
        });
    }

    /**
     * Tell every open page that the application is closing, stop the server and
     * exit the JVM.
     */
    public void shutdown() {
        if (!shuttingDown.compareAndSet(false, true)) {
            return;
        }
        Thread thread = new Thread(() -> {
            clients.forEach((clientId, emitter) -> {
                try {
                    emitter.send(SseEmitter.event().name("shutdown").data("TrackHounds is closing"));
                    emitter.complete();
                } catch (IOException | IllegalStateException ignored) {
                    // The page is already gone.
                }
            });
            clients.clear();
            try {
                if (trayIcon != null && SystemTray.isSupported()) {
                    SystemTray.getSystemTray().remove(trayIcon);
                }
            } catch (RuntimeException ignored) {
                // Tray removal is cosmetic.
            }
            int code = context == null ? 0 : SpringApplication.exit(context, () -> 0);
            System.exit(code);
        }, "trackhounds-shutdown");
        thread.setDaemon(false);
        thread.start();
    }

    private Path profileDir() {
        return properties.getDataDir().resolve("browser-profile");
    }

    private void installTrayIcon() {
        if (!SystemTray.isSupported()) {
            LOG.info("System tray not supported on this platform");
            return;
        }
        try {
            PopupMenu menu = new PopupMenu();
            MenuItem open = new MenuItem("Open TrackHounds");
            open.addActionListener(e -> openWindow());
            MenuItem folder = new MenuItem("Open data folder");
            folder.addActionListener(e -> openDataFolder());
            MenuItem about = new MenuItem("About TrackHounds");
            about.addActionListener(e -> showAbout());
            MenuItem quit = new MenuItem("Quit TrackHounds");
            quit.addActionListener(e -> shutdown());
            menu.add(open);
            menu.add(folder);
            menu.addSeparator();
            menu.add(about);
            menu.addSeparator();
            menu.add(quit);

            trayIcon = new TrayIcon(loadTrayImage(), "TrackHounds - " + url, menu);
            trayIcon.setImageAutoSize(true);
            trayIcon.addActionListener(e -> openWindow());
            SystemTray.getSystemTray().add(trayIcon);
        } catch (AWTException | RuntimeException e) {
            LOG.warn("Could not install the system tray icon", e);
            trayIcon = null;
        }
    }

    private Image loadTrayImage() {
        try (InputStream in = DesktopLauncher.class.getResourceAsStream("/desktop/tray.png")) {
            if (in != null) {
                return ImageIO.read(in);
            }
        } catch (IOException ignored) {
            // Fall through to a generated placeholder.
        }
        return Toolkit.getDefaultToolkit().createImage(new byte[0]);
    }

    private void openDataFolder() {
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.OPEN)) {
                Desktop.getDesktop().open(properties.getDataDir().toFile());
            }
        } catch (IOException | RuntimeException e) {
            LOG.warn("Could not open data folder {}", properties.getDataDir(), e);
        }
    }

    private void showAbout() {
        BuildProperties build = buildProperties.getIfAvailable();
        String version = build != null ? build.getVersion() : "development";
        String message = "TrackHounds " + version + "\n\n"
                + "Scoring application for Master's Foxhunts.\n"
                + "Author: Hunt Tynch (tynchhunt@gmail.com)\n\n"
                + "Address: " + url + "\n"
                + "Data folder: " + properties.getDataDir();
        new Thread(() -> JOptionPane.showMessageDialog(null, message, "About TrackHounds",
                JOptionPane.INFORMATION_MESSAGE), "trackhounds-about").start();
    }
}
