package com.trackhounds.trackhounds;

import java.util.Optional;

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
				BrowserWindow.open(running.get(), options.dataDir().resolve("browser-profile"), 1440, 900);
				return;
			}
			// Stale lock (previous process died without releasing it): fall through and start normally.
		}
		new SpringApplicationBuilder(TrackhoundsApplication.class)
				.headless(!options.desktop())
				.run(args);
	}

}
