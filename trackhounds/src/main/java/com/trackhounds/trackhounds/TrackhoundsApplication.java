package com.trackhounds.trackhounds;

import java.awt.SplashScreen;
import java.nio.file.Path;
import java.util.Optional;

import javax.swing.JOptionPane;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;

import com.trackhounds.trackhounds.Desktop.BrowserWindow;
import com.trackhounds.trackhounds.Desktop.LaunchOptions;
import com.trackhounds.trackhounds.Desktop.SingleInstance;

/**
 * TrackHounds: a self-contained desktop scoring application. The embedded web
 * server, the SQLite database and the user interface all run inside this one
 * process; no network access or external services are required.
 *
 * <p>
 * Run with {@code --trackhounds.desktop.enabled=false} (or {@code --server})
 * to start only the local web server, for example during UI development.
 * </p>
 */
@SpringBootApplication
public class TrackhoundsApplication {

	public static void main(String[] args) {
		LaunchOptions options = LaunchOptions.parse(args);
		if (!options.desktop()) {
			// Make sure the DesktopLauncher bean is not created (system properties win over application.properties).
			System.setProperty(LaunchOptions.DESKTOP_PROPERTY, "false");
		}
		if (options.desktop() && !SingleInstance.tryAcquire(options.dataDir())) {
			// Another instance owns this data directory: hand over to it.
			Optional<String> running = SingleInstance.runningInstanceUrl(options.dataDir());
			if (running.isPresent()) {
				closeSplash();
				BrowserWindow.open(running.get(), options.dataDir().resolve("browser-profile"), 1440, 900);
				return;
			}
			// Stale lock (previous process died without releasing it): fall through and start normally.
		}
		try {
			new SpringApplicationBuilder(TrackhoundsApplication.class)
					.headless(!options.desktop())
					.run(args);
		} catch (Throwable failure) {
			closeSplash();
			if (options.desktop()) {
				reportStartupFailure(failure, options.dataDir());
			}
			System.exit(1);
		}
	}

	/**
	 * Close the JVM splash screen (shown by the packaged launcher with
	 * {@code -splash:}) if one is visible.
	 */
	public static void closeSplash() {
		try {
			SplashScreen splash = SplashScreen.getSplashScreen();
			if (splash != null && splash.isVisible()) {
				splash.close();
			}
		} catch (RuntimeException | UnsatisfiedLinkError ignored) {
			// No splash support (headless runtime); nothing to close.
		}
	}

	/**
	 * The packaged application has no console, so a start-up failure would
	 * otherwise be invisible. Show the cause and where to find the log.
	 */
	private static void reportStartupFailure(Throwable failure, Path dataDir) {
		Throwable root = failure;
		while (root.getCause() != null && root.getCause() != root) {
			root = root.getCause();
		}
		String detail = root.getMessage() != null ? root.getMessage() : root.getClass().getSimpleName();
		String hint;
		String lower = detail.toLowerCase();
		if (lower.contains("port") && lower.contains("in use")) {
			hint = "Another program is using the port TrackHounds needs. Close it and start TrackHounds again.";
		} else if (lower.contains("sqlite") || lower.contains("database") || lower.contains("malformed")) {
			hint = "The database file could not be opened. Restore a backup of trackhounds.db, or move the file "
					+ "aside to start with an empty database.";
		} else if (lower.contains("access is denied") || lower.contains("permission")) {
			hint = "TrackHounds cannot write to its data folder. Check the folder permissions.";
		} else {
			hint = "Details are in the log file. Please attach it when reporting the problem.";
		}
		String message = "TrackHounds could not start.\n\n"
				+ hint + "\n\n"
				+ "Reason: " + detail + "\n"
				+ "Data folder: " + dataDir + "\n"
				+ "Log file: " + dataDir.resolve("logs").resolve("trackhounds.log");
		try {
			System.setProperty("java.awt.headless", "false");
			JOptionPane.showMessageDialog(null, message, "TrackHounds", JOptionPane.ERROR_MESSAGE);
		} catch (RuntimeException | UnsatisfiedLinkError ignored) {
			System.err.println(message);
		}
	}

}
