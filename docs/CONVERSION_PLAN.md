# TrackHounds 3: conversion to a self-contained desktop application

This document records **why** TrackHounds was converted from a Docker + Electron + MariaDB
application into a single Java + SQLite desktop application, **what** has been done, and **what
the next iterations are**. Keep it up to date: when an iteration finishes, move it to "Done" and
note anything that was learned.

- Status legend: ✅ done · 🔄 in progress · ⏳ planned · 💡 idea / needs a decision
- Last updated: 2026-09-07 (iterations 1-3 implemented on branch `feature/java-sqlite-desktop`)

---

## 1. Goal and constraints

| Requirement                                   | How version 3 meets it                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| Runs on ordinary Windows machines             | `jpackage` installer / portable zip with a private Java runtime; no prerequisites       |
| No Docker, no database server                 | SQLite file database (`trackhounds.db`) accessed in-process through JDBC + Hibernate   |
| No internet connection required               | Nothing is downloaded at runtime; no update checks, telemetry or CDN assets            |
| Only Java + SQLite at runtime                 | One JVM process: Spring Boot (embedded Tomcat) + SQLite. The UI is static HTML/JS/CSS  |
| One executable / installer at the end         | `TrackHounds-<version>.exe` (installer) and `TrackHounds-<version>-win-portable.zip`   |
| Keep the existing features and scoring rules  | Business logic, entities and the React UI were kept; 62 existing tests still pass      |

## 2. Architecture

### Before (version 2)

```
Electron shell (Node)  ──HTTP──▶  Spring Boot in Docker  ──JDBC──▶  MariaDB in Docker
   React UI (bundled)              (image shipped as .tar)             (volume)
   docker CLI orchestration, electron-updater, GitHub releases with docker tars
```

### After (version 3)

```
TrackHounds.exe (jpackage launcher + private JRE)
└── one JVM process
    ├── Spring Boot: REST API (/dogs, /hunt, /judges, /app/info, /actuator/health)
    │   └── serves the compiled React UI from the jar at http://127.0.0.1:<port>/
    ├── SQLite database  %LOCALAPPDATA%\TrackHounds\trackhounds.db   (Hibernate community dialect)
    └── Desktop launcher: single-instance lock, system tray icon, application window
                          (Edge/Chrome "app mode" window; default browser as fallback)
```

### Key decisions (and why)

1. **Keep Spring Boot.** It is Java, the services/repositories/tests were already written against it, and
   the cost (about 2-3 s start-up, ~200 MB RAM) is acceptable for a desktop tool. Rewriting on a lighter
   stack would have re-implemented working, tested scoring logic for no user-visible benefit.
2. **SQLite through `sqlite-jdbc` + `hibernate-community-dialects`.** The JPA model needed no changes;
   the schema is created by Hibernate (`ddl-auto=update`) on first start. Hikari's pool is limited to **one
   connection** because SQLite allows a single writer; this serialises requests and avoids "database is
   locked" errors. WAL journal mode and a 10 s busy timeout are set as connection properties.
3. **Keep the React UI instead of rewriting it in Swing/JavaFX.** The UI has ~30 components and the reports
   rely on the browser's print engine (`react-to-print`, CSS `@media print`). A native rewrite is a large,
   risky project that would change nothing for users. The UI is compiled at build time (Maven downloads a
   private Node; developers only need a JDK) and served from the jar, so **Node is not needed at runtime**.
4. **Application window = Edge/Chrome in `--app` mode with a private profile.** Edge is part of Windows
   10/11, gives a chrome-less window that looks like a native app, supports modern CSS (Tailwind 4) and
   prints reports properly. JavaFX WebView was rejected for now: its WebKit build lacks `window.print()`
   and has uncertain Tailwind 4 support. Embedding WebView2 (JNI) was rejected for now because of native
   packaging risk. Both remain options for a later iteration (see 7).
5. **Process lifetime is tracked by the pages, not by processes.** Edge on Windows hands the window over to
   a new browser process and exits immediately, and Java cannot read other processes' command lines on
   Windows, so watching the launched process is useless. Instead every UI page keeps a Server-Sent Events
   connection open (`GET /app/events`) and sends a beacon (`POST /app/window-closed`) on `pagehide`. When
   no page has been connected for 6 s the application exits (the grace period covers reloads). Until the
   first page connects the app keeps running. This works with any browser, including the default-browser
   fallback. On shutdown the server pushes a `shutdown` event and the page shows a "closed" notice. The
   tray icon provides Open / Open data folder / About / Quit.
6. **Single instance per data directory** via a file lock (`.trackhounds.lock`) and a published URL
   (`.trackhounds.url`). A second launch opens a window on the running instance and exits.
7. **Port**: 8080 if free (stable, bookmarkable), otherwise any free port; bound to `127.0.0.1` only.
8. **Data directory** (`%LOCALAPPDATA%\TrackHounds`, overridable) holds the database, logs and the browser
   profile so a backup is a single folder copy.
9. **Packaging with `jpackage`** (part of the JDK) through `jpackage-maven-plugin`: `app-image` profile
   (portable folder, works on any machine with a JDK) and `win-installer` profile (`.exe`, needs WiX 3.x,
   built in CI). A fixed `winUpgradeUuid` lets new installers upgrade in place. Per-user install: no admin.
10. **No auto-update.** Version 2 used `electron-updater`. Version 3 updates manually via the installer;
    an optional, user-triggered "check for updates" can be added later (iteration 8). SmartScreen warnings
    remain because code signing was dropped for cost reasons.
11. **Version 3.0.0** (major bump: different installation and data location). Maven `pom.xml` is the
    single source of the version; the release workflow sets it from the git tag.

### What was removed

`docker-compose.yml`, `init-db.sql`, `.env.example`, both `Dockerfile`s, `trackhounds/compose.yml`,
`frontend/electron/*`, `frontend/docker-resources/*`, Electron cleanup scripts, `DockerStatus` and
`UpdateNotification` components, `spring-boot-starter-data-rest` (unused; it also hijacked `GET /`),
`spring-boot-docker-compose`, `spring-boot-devtools`, the MariaDB driver, the javadoc plugin and the
`jacoco-maven-plugin` dependency entry.

---

## 3. Iterations

### ✅ Iteration 1: backend on SQLite, Docker removed

- Spring Boot 3.5, `sqlite-jdbc`, Hibernate community `SQLiteDialect`, single-connection Hikari pool.
- Data directory resolution (`DataDirectoryEnvironmentPostProcessor`), typed `trackhounds.*` properties.
- Tests run against a throw-away SQLite file under `target/` (no service containers in CI).
- Rolling file log in the data directory (the packaged app has no console).

Learned: the existing entity model (arrays on `HuntEntity`, `LocalTime` columns, `@OrderColumn`) works
unchanged on SQLite; no Hibernate warnings were produced. Nothing forced a schema change.

Learned the hard way: the services (`DogService.createScore` etc.) juggle entities across several
repository calls and rely on **one persistence context per request**; the ordered `DogEntity.scores`
list (`@OrderColumn`) is only written correctly when the owning dog is flushed in the same session as the
new `DailyScore`. With Open-Session-In-View switched off every `GET /dogs` failed with
"Illegal null value for list index". The test suite never caught it because every test is
`@Transactional`. Fix: class-level `@Transactional` on `DogService`, `HuntService` and `JudgeService`
(one transaction per service call, matching the tests) and OSIV left on.

### ✅ Iteration 2: single process, UI bundled, desktop launcher

- Maven builds the React UI (`frontend-maven-plugin`, private Node) and copies `dist/` into the jar.
- `API_BASE_URL` is relative in production (same origin) and `http://localhost:8080` in Vite dev mode.
- Electron and Docker code removed from the UI; `Docs` page rewritten (install, data folder, backups,
  troubleshooting) and shows live data from `GET /app/info`.
- `DesktopLauncher`: tray icon, app-mode window (`BrowserWindow`), shutdown on window close,
  `SingleInstance`, `LaunchOptions` (`--server` / `--headless` for server-only mode).

### ✅ Iteration 3: packaging and release pipeline

- `app-image` and `win-installer` Maven profiles (jpackage), trimmed jlink runtime, app icon,
  license page, per-user install, upgrade UUID, Start-menu and Desktop shortcuts.
- CI: `Build and Test` (Ubuntu, `mvnw verify`, coverage) and `Build and Release` (Windows, tag `v*`,
  uploads installer + portable zip + jar).
- README rewritten for version 3; `frontend/README.md` documents UI development.

Learned: jpackage does not run `java -jar`; it puts the jar on the class path and starts a main class.
For a Spring Boot executable jar that class must be `org.springframework.boot.loader.launch.JarLauncher`
(which reads `Start-Class` from the manifest). With the application class as entry point the JVM dies
before logging starts and, because the launcher has no console, nothing is shown at all.

Also learned: the fat jar must be staged for jpackage *after* `spring-boot:repackage`. Executions run in
plugin declaration order within a phase, which is why `maven-antrun-plugin` (which does the staging copy
in the `app-image` profile) is declared after the Spring Boot plugin. jpackage also marks
`TrackHounds.exe` read-only, which `mvn clean` cannot delete on Windows; a `pre-clean` antrun step clears
the attribute first.

Verification done locally (2026-09-07): full build, 62 tests, jar runs in server mode (all endpoints,
scoring, 20 parallel requests without errors), UI served from the jar, app image produced and started on
this machine (ready in ~5 s, Edge app window connected, closing the window ended the process 7 s later
with no stray browser processes). Single instance verified: a second launch exits within 1 s and adds a
window to the running instance; closing one of two windows keeps the app alive, closing the last one
ends it.
**Still to verify** (needs the first tag / a second PC): the `.exe` installer produced by CI, and a run
on a clean Windows machine without a JDK.

### ⏳ Iteration 4: first release and hardening

Goal: ship `v3.0.0` and make the first-run experience robust.

- Push tag `v3.0.0-rc.1`, install the CI-built `.exe` on a machine without Java/Docker, test install →
  use → upgrade → uninstall; confirm data survives the upgrade.
- Handle start-up failure modes with a message instead of a silent exit: port grabbed between the
  free-port check and Tomcat bind, corrupt database file, unwritable data directory.
- Loading page while Spring starts (the window currently opens after `ApplicationReadyEvent`, which is
  correct, but a splash or "Starting TrackHounds..." tray notification would reassure users).
- Confirm behaviour when Edge is already running with the default profile (app mode uses a separate
  profile, so it should be independent) and when Edge is missing (default-browser fallback + tray Quit).
- Fix `HuntService.getHunt()` returning HTTP `100 Continue` when no hunt exists (use `404`); adjust the
  UI's "no active hunt" handling accordingly.
- Frontend hygiene: the existing ESLint errors (prop-types, missing keys, unused vars) and the
  `__dirname` usage in `vite.config.js`.
- Decide whether to keep the `Live Demo` section (cloud demo) in README/Docs.

### ⏳ Iteration 5: data safety and hunt management

- In-app **Backup** (copy `trackhounds.db` to a chosen file; use SQLite's online backup API so the app
  need not be closed) and **Restore**.
- **Export / import a hunt** as a single file (JSON or a copy of the database) so a hunt can be moved
  between computers or archived.
- Optional: multiple hunts. Cheapest model with SQLite: one database file per hunt plus a "hunt library"
  screen; alternative: add a `hunt_id` to all tables. Needs a decision.
- "Open data folder" and "Show log file" from the UI (currently tray menu only).

### ⏳ Iteration 6: schema migrations

`spring.jpa.hibernate.ddl-auto=update` is fine while every user starts from an empty file, but it cannot
rename or drop columns and SQLite has limited `ALTER TABLE`. Before the first schema change ships to
users with existing data:

- Add Flyway (`flyway-core` + `flyway-database-sqlite` is not needed; Flyway supports SQLite in core),
  generate `V1__baseline.sql` from the current Hibernate schema, switch to `ddl-auto=validate`.
- Add a start-up backup of the database before migrations run.

### ⏳ Iteration 7: window technology review

Revisit after real-world use of the Edge app-mode window. Options, in order of effort:

1. Keep app mode (current). Add a Chrome fallback check and better messaging when neither is present.
2. **Embedded WebView2** via a Java binding (JNI/JNA). Native window, no separate browser process, still
   Chromium (printing works). Risk: native library packaging and WebView2 runtime presence on old
   Windows 10 builds.
3. **JavaFX WebView** window. Pure Java, but printing must be re-implemented with `WebEngine.print` and
   Tailwind 4 CSS support must be verified. Adds ~50 MB to the runtime.
4. **Full JavaFX UI rewrite** (no browser at all). Largest effort; reports would be generated as PDF
   (e.g. OpenPDF) instead of printed from HTML. Only worth it if the browser-based window proves
   unreliable for users.

### ⏳ Iteration 8: distribution extras

- Optional "Check for updates" button that queries GitHub releases **only when the user asks** and opens
  the download page (the app itself never phones home).
- Code signing (certificate cost) to remove the SmartScreen warning, if the budget allows.
- macOS `.dmg` / Linux `.deb` with the same jpackage setup if there is demand (the launcher already has
  the code paths).
- Automated smoke test in CI: start the jar with `--server`, call `/actuator/health` and `/app/info`.

### 💡 Ideas / parking lot

- Replace `int[]`/`StakeType[]` columns on `HuntEntity` with explicit columns for readability of the
  database file in external tools.
- `LocalTime` columns: consider storing ISO strings (`HH:mm:ss`) via an `AttributeConverter` so the
  database is readable in a SQLite browser.
- Retire Gson (`GsonUtil`) in favour of the Jackson mapper Spring already provides.
- Reduce start-up time (Spring AOT / CDS archive via `-XX:SharedArchiveFile`).

---

## 4. Build, run, package (cheat sheet)

```bash
cd trackhounds
./mvnw verify                                  # UI + backend + tests
./mvnw spring-boot:run                         # desktop mode from source
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server   # server only (UI dev with `npm run dev`)
./mvnw package -DskipTests -Papp-image         # target/dist/TrackHounds/TrackHounds.exe
./mvnw package -DskipTests -Papp-image,win-installer   # + target/dist/TrackHounds-<version>.exe (WiX)
git tag v3.0.0 && git push origin v3.0.0       # CI builds and publishes the release
```

Runtime switches: `--server`, `--trackhounds.data-dir=<dir>`, `--trackhounds.port=<port>`,
`--trackhounds.desktop.enabled=false` (also as system properties or `TRACKHOUNDS_*` environment variables).

## 5. Known limitations

- Unsigned installer: SmartScreen shows a warning on first run.
- The application window depends on Microsoft Edge or Google Chrome being installed; otherwise the UI
  opens in the default browser and the app is closed from the tray icon.
- One writer at a time (SQLite): fine for a single operator; not designed for several scorers entering
  data at once from different computers.
- Data from version 2 (Docker volume) is not migrated.
