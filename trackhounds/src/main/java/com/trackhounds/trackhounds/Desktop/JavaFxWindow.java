package com.trackhounds.trackhounds.Desktop;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import javax.imageio.ImageIO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javafx.application.Platform;
import javafx.concurrent.Worker;
import javafx.print.PrinterJob;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.image.Image;
import javafx.scene.image.PixelReader;
import javafx.scene.image.WritableImage;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import netscape.javascript.JSObject;

/**
 * The application window as a JavaFX {@link WebView} (iteration 9 decision):
 * a native window owned by this process, no browser involved.
 *
 * <p>
 * What the page cannot do on its own in WebKit is provided through a small
 * bridge object, {@code window.trackhoundsWindow}:
 * <ul>
 * <li>{@code print(title, html, stylesheetUrls, inlineCss)}: the report sheet
 * is loaded into its own window and printed through the JavaFX print API,
 * which mirrors what {@code react-to-print} does with an iframe in a browser
 * (WebKit in JavaFX has no {@code window.print()}),</li>
 * <li>{@code openExternal(url)}: opens a link with the system browser; links
 * with {@code target=_blank} go the same way,</li>
 * <li>{@code saveFile(url, suggestedName)}: WebKit has no download manager (a
 * {@code download} link navigates the window to the file's text), so the page
 * asks for a save dialog and the window fetches the address and writes the
 * file.</li>
 * </ul>
 * The Server-Sent Events lifetime tracking still works from inside the window,
 * but closing the last window also ends the application directly.
 * </p>
 *
 * <p>
 * Diagnostics: with {@code -Dtrackhounds.desktop.capture=<dir>} the window
 * walks through every page of the UI, saves a PNG of each into that folder and
 * quits, which is how the rendering is compared with the browser window.
 * </p>
 */
public final class JavaFxWindow {

    private static final Logger LOG = LoggerFactory.getLogger(JavaFxWindow.class);

    /** System property naming a folder to capture every page into (diagnostics). */
    public static final String CAPTURE_PROPERTY = "trackhounds.desktop.capture";

    /** The UI routes captured by the diagnostics run, in the order of the navigation rail. */
    static final String[][] CAPTURE_ROUTES = {
            { "home", "/" }, { "dogs", "/dogs/all" }, { "add-dogs", "/dogs/add" }, { "judges", "/judges/all" },
            { "score-entry", "/score-entry/enter" }, { "scores", "/score-entry/view" },
            { "scratch-sheet", "/scratch-sheet/view" }, { "reports", "/reports" },
            { "report-daily-speed-and-drive", "/reports/daily-speed-and-drive" },
            { "report-hunt-summary", "/reports/hunt-summary" }, { "report-all-dogs", "/reports/all-dogs-all-days" },
            { "report-builder", "/reports/builder?from=daily-speed-and-drive" },
            { "report-one-dog", "/reports/scores-for-one-dog" }, { "report-custom", "/reports/club-daily-sheet" }, { "hunt-edit", "/hunt/edit" },
            { "backups", "/data" }, { "docs", "/docs" } };

    private static final List<Stage> STAGES = new CopyOnWriteArrayList<>();
    private static final List<Bridge> BRIDGES = new CopyOnWriteArrayList<>(); // JS members are held weakly
    private static volatile boolean toolkitStarted;

    private JavaFxWindow() {
    }

    /** Whether the JavaFX web module is on the class path of this runtime. */
    public static boolean isAvailable() {
        try {
            Class.forName("javafx.scene.web.WebView");
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    /**
     * Open a window on {@code url}, or bring the existing one to the front.
     *
     * @param url               address of the UI
     * @param title             window title
     * @param width             initial width
     * @param height            initial height
     * @param cacheDir          where JavaFX may unpack its native libraries
     * @param onLastWindowClose run when the last window has been closed
     * @return {@code true} if a window is showing, {@code false} if JavaFX could
     *         not be started (the caller falls back to a browser)
     */
    public static boolean open(String url, String title, int width, int height, Path cacheDir, Runnable onLastWindowClose) {
        if (!STAGES.isEmpty()) {
            Platform.runLater(() -> {
                Stage stage = STAGES.get(0);
                stage.setIconified(false);
                stage.toFront();
                stage.requestFocus();
            });
            return true;
        }
        if (!startToolkit(cacheDir)) {
            return false;
        }
        CountDownLatch shown = new CountDownLatch(1);
        boolean[] ok = { false };
        Platform.runLater(() -> {
            try {
                createStage(url, title, width, height, onLastWindowClose);
                ok[0] = true;
            } catch (RuntimeException | LinkageError e) {
                LOG.warn("The JavaFX window could not be created", e);
            } finally {
                shown.countDown();
            }
        });
        try {
            shown.await(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return ok[0];
    }

    private static boolean startToolkit(Path cacheDir) {
        if (toolkitStarted) {
            return true;
        }
        try {
            if (cacheDir != null) {
                Files.createDirectories(cacheDir);
                System.setProperty("javafx.cachedir", cacheDir.toString());
            }
            Platform.startup(() -> {
            });
        } catch (IllegalStateException alreadyRunning) {
            // The toolkit was started earlier in this JVM.
        } catch (IOException | RuntimeException | LinkageError e) {
            LOG.warn("JavaFX could not be started", e);
            return false;
        }
        Platform.setImplicitExit(false);
        toolkitStarted = true;
        return true;
    }

    private static void createStage(String url, String title, int width, int height, Runnable onLastWindowClose) {
        Stage stage = new Stage();
        WebView view = new WebView();
        WebEngine engine = view.getEngine();
        engine.setJavaScriptEnabled(true);
        Bridge bridge = new Bridge(stage);
        BRIDGES.add(bridge);

        engine.setOnAlert(event -> dialog(Alert.AlertType.INFORMATION, title, event.getData()));
        engine.setConfirmHandler(message -> dialog(Alert.AlertType.CONFIRMATION, title, message) == ButtonType.OK);
        engine.setOnError(event -> LOG.warn("Page error: {}", event.getMessage()));
        engine.setCreatePopupHandler(config -> {
            // target=_blank: read the address the page wants, open it outside, and drop the popup.
            WebEngine popup = new WebEngine();
            popup.locationProperty().addListener((observable, previous, location) -> {
                if (location != null && !location.isBlank()) {
                    BrowserWindow.openWithDefaultBrowser(location);
                    Platform.runLater(() -> popup.getLoadWorker().cancel());
                }
            });
            return popup;
        });
        engine.getLoadWorker().stateProperty().addListener((observable, previous, state) -> {
            if (state == Worker.State.SUCCEEDED) {
                JSObject window = (JSObject) engine.executeScript("window");
                window.setMember("trackhoundsWindow", bridge);
                LOG.info("Page loaded in the JavaFX window: {}", engine.getLocation());
                String captureDir = System.getProperty(CAPTURE_PROPERTY);
                if (captureDir != null && !captureDir.isBlank()) {
                    capturePages(view, Path.of(captureDir), onLastWindowClose);
                }
            } else if (state == Worker.State.FAILED) {
                LOG.error("The page could not be loaded in the JavaFX window: {}", engine.getLoadWorker().getException() != null
                        ? engine.getLoadWorker().getException().getMessage() : "unknown error");
            }
        });
        installConsoleListener();

        stage.setTitle(title);
        loadIcon().ifPresent(icon -> stage.getIcons().add(icon));
        stage.setScene(new Scene(view, width, height));
        stage.setOnHidden(event -> {
            STAGES.remove(stage);
            BRIDGES.remove(bridge);
            if (STAGES.isEmpty()) {
                LOG.info("Last application window closed");
                onLastWindowClose.run();
            }
        });
        STAGES.add(stage);
        engine.load(url);
        stage.show();
        LOG.info("Opened the JavaFX application window on {}", url);
    }

    private static ButtonType dialog(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type, message == null ? "" : message);
        alert.setTitle(title);
        alert.setHeaderText(null);
        return alert.showAndWait().orElse(ButtonType.CANCEL);
    }

    /** Route WebKit's console to the log; internal API, so best effort only. */
    private static void installConsoleListener() {
        try {
            com.sun.javafx.webkit.WebConsoleListener.setDefaultListener(
                    (webView, message, lineNumber, sourceId) -> LOG.info("Page console: {} ({}:{})", message, sourceId, lineNumber));
        } catch (Throwable t) {
            LOG.debug("WebKit console not available: {}", t.toString());
        }
    }

    private static java.util.Optional<Image> loadIcon() {
        try (InputStream in = JavaFxWindow.class.getResourceAsStream("/desktop/tray.png")) {
            return in == null ? java.util.Optional.empty() : java.util.Optional.of(new Image(in));
        } catch (IOException | RuntimeException e) {
            return java.util.Optional.empty();
        }
    }

    // ------------------------------------------------------------ diagnostics

    /** Visit every route, save a PNG of each, then end the application. */
    private static void capturePages(WebView view, Path dir, Runnable done) {
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            LOG.warn("Cannot create {}", dir, e);
            done.run();
            return;
        }
        Thread worker = new Thread(() -> {
            try {
                for (String[] route : CAPTURE_ROUTES) {
                    Platform.runLater(() -> view.getEngine().executeScript("window.location.hash = '#" + route[1] + "'"));
                    Thread.sleep(1500);
                    CountDownLatch saved = new CountDownLatch(1);
                    Platform.runLater(() -> {
                        try {
                            savePng(view.snapshot(null, null), dir.resolve(route[0] + ".png"));
                        } catch (IOException | RuntimeException e) {
                            LOG.warn("Could not capture {}", route[0], e);
                        } finally {
                            saved.countDown();
                        }
                    });
                    saved.await(10, TimeUnit.SECONDS);
                }
                capturePrintDocument(view, dir);
                LOG.info("Captured {} pages into {}", CAPTURE_ROUTES.length, dir);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                done.run();
            }
        }, "trackhounds-capture");
        worker.setDaemon(true);
        worker.start();
    }

    /**
     * Build the document the print bridge would print for the daily sheet and
     * save a picture of it, so the stylesheet handling of the print path is
     * checked without a printer (pagination still needs a real print).
     */
    private static void capturePrintDocument(WebView view, Path dir) throws InterruptedException {
        String[] parts = new String[1];
        CountDownLatch collected = new CountDownLatch(1);
        Platform.runLater(() -> {
            try {
                view.getEngine().executeScript("window.location.hash = '#/reports/daily-speed-and-drive'");
            } finally {
                collected.countDown();
            }
        });
        collected.await(5, TimeUnit.SECONDS);
        Thread.sleep(1500);
        CountDownLatch read = new CountDownLatch(1);
        Platform.runLater(() -> {
            try {
                Object result = view.getEngine().executeScript(
                        "(function(){var s=document.querySelector('.report-sheet');if(!s)return '';"
                                + "var links=Array.from(document.styleSheets).map(function(x){return x.href;}).filter(Boolean)"
                                + ".map(function(h){return new URL(h,window.location.href).href;}).join('\\n');"
                                + "var inline=Array.from(document.querySelectorAll('style')).map(function(x){return x.textContent||'';}).join('\\n');"
                                + "return JSON.stringify({html:s.outerHTML,links:links,inline:inline});})()");
                parts[0] = result == null ? "" : result.toString();
            } catch (RuntimeException e) {
                LOG.warn("Could not read the report sheet", e);
            } finally {
                read.countDown();
            }
        });
        read.await(5, TimeUnit.SECONDS);
        if (parts[0] == null || parts[0].isEmpty()) {
            LOG.warn("No report sheet on the page; print document not captured");
            return;
        }
        // Minimal JSON reading: the three fields are strings written by JSON.stringify.
        String json = parts[0];
        String html = jsonString(json, "html");
        String links = jsonString(json, "links");
        String inline = jsonString(json, "inline");
        String document = Bridge.buildDocument("Print check", html, links, inline);
        CountDownLatch rendered = new CountDownLatch(1);
        Platform.runLater(() -> {
            Stage stage = new Stage();
            WebView printView = new WebView();
            stage.setScene(new Scene(printView, 1000, 900));
            printView.getEngine().getLoadWorker().stateProperty().addListener((observable, previous, state) -> {
                if (state == Worker.State.SUCCEEDED || state == Worker.State.FAILED) {
                    Platform.runLater(() -> {
                        try {
                            savePng(printView.snapshot(null, null), dir.resolve("print-document.png"));
                        } catch (IOException | RuntimeException e) {
                            LOG.warn("Could not capture the print document", e);
                        } finally {
                            stage.close();
                            rendered.countDown();
                        }
                    });
                }
            });
            stage.show();
            printView.getEngine().loadContent(document, "text/html");
        });
        rendered.await(15, TimeUnit.SECONDS);
    }

    /** Value of a string field of a flat JSON object produced by JSON.stringify. */
    private static String jsonString(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key);
        if (start < 0) {
            return "";
        }
        StringBuilder value = new StringBuilder();
        for (int i = start + key.length(); i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '\\') {
                char next = json.charAt(++i);
                switch (next) {
                    case 'n' -> value.append('\n');
                    case 't' -> value.append('\t');
                    case 'r' -> value.append('\r');
                    case 'u' -> {
                        value.append((char) Integer.parseInt(json.substring(i + 1, i + 5), 16));
                        i += 4;
                    }
                    default -> value.append(next);
                }
            } else if (c == '"') {
                break;
            } else {
                value.append(c);
            }
        }
        return value.toString();
    }

    private static void savePng(WritableImage image, Path file) throws IOException {
        int width = (int) image.getWidth();
        int height = (int) image.getHeight();
        BufferedImage buffered = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        PixelReader reader = image.getPixelReader();
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                buffered.setRGB(x, y, reader.getArgb(x, y));
            }
        }
        ImageIO.write(buffered, "png", file.toFile());
    }

    // ----------------------------------------------------------------- bridge

    /**
     * Methods the page may call as {@code window.trackhoundsWindow.<name>()}.
     * Public class and methods: WebKit only exposes those.
     */
    public static final class Bridge {

        private final Stage owner;

        Bridge(Stage owner) {
            this.owner = owner;
        }

        /** Open an address with the system browser. */
        public void openExternal(String url) {
            if (url != null && !url.isBlank()) {
                BrowserWindow.openWithDefaultBrowser(url);
            }
        }

        /**
         * Save what {@code url} serves to a file the user picks. The address is
         * fetched by the window itself (it is the application's own server), so
         * the page needs no download support from WebKit.
         *
         * @param url           absolute address of the file
         * @param suggestedName file name offered in the dialog
         */
        public void saveFile(String url, String suggestedName) {
            if (url == null || url.isBlank()) {
                return;
            }
            Platform.runLater(() -> {
                FileChooser chooser = new FileChooser();
                chooser.setTitle("Save file");
                String name = suggestedName == null || suggestedName.isBlank() ? "download" : suggestedName;
                chooser.setInitialFileName(name);
                int dot = name.lastIndexOf('.');
                if (dot > 0) {
                    String extension = name.substring(dot + 1).toLowerCase(java.util.Locale.ROOT);
                    chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter(extension.toUpperCase(java.util.Locale.ROOT) + " file", "*." + extension));
                }
                chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("All files", "*.*"));
                java.io.File target = chooser.showSaveDialog(owner);
                if (target == null) {
                    return;
                }
                Thread worker = new Thread(() -> download(url, target.toPath()), "trackhounds-save-file");
                worker.setDaemon(true);
                worker.start();
            });
        }

        private static void download(String url, Path target) {
            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder(java.net.URI.create(url)).GET().build();
                java.net.http.HttpResponse<Path> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofFile(target));
                if (response.statusCode() >= 400) {
                    Files.deleteIfExists(target);
                    throw new IOException("The server answered " + response.statusCode());
                }
                LOG.info("Saved {} to {}", url, target);
            } catch (IOException | RuntimeException e) {
                LOG.warn("Could not save {} to {}", url, target, e);
                Platform.runLater(() -> dialog(Alert.AlertType.ERROR, "Save file", "The file could not be saved: " + e.getMessage()));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        /**
         * Print a report sheet. The sheet's HTML is shown in its own window with
         * the application's stylesheets, the print dialog opens, and the window
         * closes once the job is done. A print job that the user cancels closes
         * the window as well.
         *
         * @param title       document title
         * @param html        the sheet element as HTML
         * @param stylesheets absolute stylesheet URLs, one per line
         * @param inlineCss   inline style text (the Vite dev server injects styles instead of files)
         */
        public void print(String title, String html, String stylesheets, String inlineCss) {
            String document = buildDocument(title, html, stylesheets, inlineCss);
            Platform.runLater(() -> printDocument(title, document));
        }

        /** The stand-alone document that is printed: the sheet with the application's stylesheets. */
        static String buildDocument(String title, String html, String stylesheets, String inlineCss) {
            StringBuilder document = new StringBuilder("<!doctype html><html><head><meta charset=\"utf-8\"><title>")
                    .append(escape(title)).append("</title>");
            for (String href : (stylesheets == null ? "" : stylesheets).split("\n")) {
                if (!href.isBlank()) {
                    document.append("<link rel=\"stylesheet\" href=\"").append(escape(href.trim())).append("\">");
                }
            }
            if (inlineCss != null && !inlineCss.isBlank()) {
                document.append("<style>").append(inlineCss).append("</style>");
            }
            document.append("</head><body class=\"print-only\">").append(html == null ? "" : html).append("</body></html>");
            return document.toString();
        }

        private void printDocument(String title, String document) {
            Stage preview = new Stage();
            WebView view = new WebView();
            preview.setTitle("Print " + title);
            preview.initOwner(owner);
            preview.setScene(new Scene(view, 900, 700));
            view.getEngine().getLoadWorker().stateProperty().addListener((observable, previous, state) -> {
                if (state == Worker.State.SUCCEEDED) {
                    Platform.runLater(() -> {
                        try {
                            PrinterJob job = PrinterJob.createPrinterJob();
                            if (job == null) {
                                dialog(Alert.AlertType.WARNING, "Print", "No printer is installed on this computer.");
                            } else if (job.showPrintDialog(preview)) {
                                view.getEngine().print(job);
                                job.endJob();
                                LOG.info("Printed \"{}\" on {}", title, job.getPrinter() == null ? "the default printer" : job.getPrinter().getName());
                            }
                        } catch (RuntimeException e) {
                            LOG.warn("Printing failed", e);
                            dialog(Alert.AlertType.ERROR, "Print", "The report could not be printed: " + e.getMessage());
                        } finally {
                            preview.close();
                        }
                    });
                } else if (state == Worker.State.FAILED) {
                    LOG.warn("The report could not be prepared for printing");
                    preview.close();
                }
            });
            preview.show();
            view.getEngine().loadContent(document, "text/html");
        }

        private static String escape(String text) {
            return text == null ? "" : text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
        }
    }
}
