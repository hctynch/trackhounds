# TrackHounds 3: conversion to a self-contained desktop application

This document records **why** TrackHounds was converted from a Docker + Electron + MariaDB
application into a single Java + SQLite desktop application, **what** has been done, and **what
the next iterations are**. Keep it up to date: when an iteration finishes, move it to "Done" and
note anything that was learned.

- Status legend: ✅ done · 🔄 in progress · ⏳ planned · 💡 idea / needs a decision
- Last updated: 2026-09-10 (iterations 1-3 and 5 done, 4 and 6 in progress; all on `main`)

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
   packaging risk. Both remain options for a later iteration (see 9).
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
    an optional, user-triggered "check for updates" can be added later (iteration 10). SmartScreen warnings
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

### 🔄 Iteration 4: first release and hardening

Goal: ship `v3.0.0` and make the first-run experience robust.

Done (2026-09-07):

- Start-up failures now show a dialog instead of exiting silently: the packaged launcher has no
  console, so `TrackhoundsApplication.main` catches the failure, closes the splash and shows the root
  cause with a hint (port in use, database cannot be opened, folder not writable) and the log path.
- A branded splash screen (`src/main/jpackage/splash.png`, passed as `-splash:$APPDIR\splash.png` in the
  jpackage launcher options) is shown by the JVM until the server is ready; `DesktopLauncher` closes it.
- `GET /hunt` returns `404` with a message when no hunt exists (it used to return `100 Continue`).
- The ESLint errors were cleared as part of the UI redesign (iteration 5); `npm run lint` passes.

Still to do:

- Push tag `v3.0.0-rc.1`, install the CI-built `.exe` on a machine without Java/Docker, test install →
  use → upgrade → uninstall; confirm data survives the upgrade.

Learned from the first tag build (2026-09-07): Windows installers accept only a numeric
`MAJOR[.MINOR[.BUILD]]` version, so jpackage rejected the tag version `3.0.0-rc.1` outright. The build
now derives a numeric `app.version` (`3.0.0`) with `build-helper-maven-plugin:regex-property` while the
jar, the About dialog and `/app/info` keep the full `3.0.0-rc.1`. Two traps worth remembering:

- `app.version` must **not** be declared in `<properties>`. Maven interpolates the whole POM, plugin
  configuration included, before any plugin runs, so a declared property is frozen and `regex-property`
  can never override it. The first attempt at this fix failed exactly that way.
- jpackage names the installer after the numeric version, so a `v3.0.0-rc.1` tag produces
  `TrackHounds-3.0.0.exe`. The release workflow renames it to the full tag version before upload and
  marks tags containing a hyphen as GitHub pre-releases.

Consequence for the upgrade test: an RC and its final release share the Windows version `3.0.0`, so
installing `v3.0.0` over `v3.0.0-rc.1` is a repair rather than an upgrade. Uninstall the RC first, or
test the upgrade path between two versions that differ numerically.
- Handle start-up failure modes with a message instead of a silent exit: port grabbed between the
  free-port check and Tomcat bind, corrupt database file, unwritable data directory.
- Confirm behaviour when Edge is already running with the default profile (app mode uses a separate
  profile, so it should be independent) and when Edge is missing (default-browser fallback + tray Quit).
- Decide whether to keep the `Live Demo` section in README (it was dropped from the in-app docs).
- Open question for the scoring rules: the score entry page starts with an interval of 5 regardless
  of the hunt's point interval, and the same number is used both as the points step between dogs and
  as the length of a scoring interval in minutes (server side, `ScoreDto.interval`; rankings use
  `HuntEntity.huntInterval`). Prefilling the page from the hunt would keep the two consistent, but the
  behaviour was kept as it was until the rule is confirmed.

### ✅ Iteration 5: professional UI redesign

Done 2026-09-07 (deep green). What was built, on top of the plan below:

- One stylesheet (`frontend/src/index.css`): Tailwind 4 `@theme` tokens with the default palette
  removed, so every colour is a token (pine, brass, neutrals, semantic). IBM Plex Sans and Serif are
  bundled from `@fontsource` packages (latin subsets, about 140 KB of fonts). The three legacy
  stylesheets and the inline-style `Button` are gone.
- Primitives in `frontend/src/components/ui/`: `Button`/`IconButton`, `Field`/`Input`/`Select`/`CellInput`,
  `Panel`, `PageHeader`, `DataTable` (aligned numeric columns, tabular figures, sticky header, empty
  states), `Dialog`/`ConfirmDialog` on the native `<dialog>` element, `Toast`, `Alert`, `Badge`/`StakeBadge`,
  `EmptyState`, `SegmentedControl` (a real radio group), `SearchInput`. Icons come from one set (Lucide).
- App shell: the green rail (`components/layout/Sidebar.jsx`) with wordmark, grouped navigation,
  Docs link and the loaded hunt; the content area is a CSS grid (no more `ml-[276px]`). The rail collapses
  to icons below the `lg` breakpoint.
- A shared `HuntProvider` (`hooks/useHunt.jsx`) so the rail and every page agree on the current hunt.
- Every page rebuilt on the primitives. Behavioural changes worth knowing: deleting a dog, judge or
  score asks for confirmation; judges are added/edited in a dialog; create and edit hunt share one
  `HuntForm`; each report has its own route (`/reports/<id>`), so a report can be bookmarked; success and
  failure are reported with toasts and inline alerts instead of `alert()`; a dog can no longer be given
  the `DUAL` stake on the edit page (only hunts are dual).
- Reports print through the shared `@media print` rules in `index.css`; the injected `<style>` element
  is gone. Verified by printing a report to PDF from headless Edge.
- Verification: every page was screenshotted from the built jar with seeded data using headless Edge
  (`docs/screenshots/`), and `npm run lint` reports no errors. One headless artefact to remember: with
  `--virtual-time-budget`, CSS colour transitions are frozen mid-way, so a freshly enabled primary
  button captures as pale green; a longer budget renders it correctly.

Not covered yet: dialogs and toasts were not screenshot-tested (they need interaction); the rail's
collapsed state below 1024 px was not reviewed visually; there is no dark theme.

Original plan for reference:

Goal: make TrackHounds look and feel like a finished product rather than a prototype, without changing
what it does. The scoring logic, the API and the page set stay the same; the visual layer is rebuilt on a
proper foundation. Users are judges and scorekeepers working quickly at a hunt, often on a laptop in a
truck or a clubhouse, so clarity, large touch/click targets and keyboard speed matter more than flourish.

**Where the current UI falls short (audit, 2026-09-07)**

- `index.css` is still the Vite starter sheet: dark `color-scheme`, `#242424` body, centred flex body,
  `h1 { font-size: 3.2em }`. Every page fights it with utility classes, which is why colours look
  inconsistent and why `buttonOverrides.css` exists (a file of `!important` catch-alls, including invalid
  `:contains()` selectors). `Button.jsx` layers inline styles, `!` utilities and a hover-state hook to win
  the same fight. `App.css` still contains the spinning Vite logo animation.
- No design tokens. Colours (`blue-500`, `amber-500`, `purple-500`...), radii and shadows are chosen per
  page, so cards, tables and dialogs differ from screen to screen.
- Layout is hard-coded: a fixed 260 px sidebar and `ml-[276px]` on every page; a `h-[49.25%]` magic
  number in the nav dropdown; nothing adapts to narrower windows or the Edge app window being resized.
- Six different `react-icons` families are mixed (Hi, Io, Fa, Gr, Md, Tb), so icon weight and style vary
  line by line. The sidebar has an empty `<img />` where a logo should be; the app has a dog icon but no
  wordmark or brand colour.
- Typography: `Inter` is named but never bundled, so the app silently falls back to Arial on most PCs.
  As an offline application it cannot load fonts from Google Fonts at runtime.
- Feedback states are ad hoc: success banners, error maps and empty states are styled differently in
  each page; no loading skeletons; dialogs are hand-rolled fixed overlays.

**Design direction (decided 2026-09-07: deep green)**

- Brand: pine green `#1F4D3A` (hover `#173A2C`, tints down to `#E6EEE9`). The green lives in the
  sidebar rail and primary actions; content sits on a light green-grey canvas `#F1F4F2` with white
  panels separated by hairline rules rather than shadows. Ink `#172119`. Brass `#A8782A` is reserved
  for "leading" and "current" states (top dog, selected day) and for keyboard focus rings, so it always
  means "look here". Semantic colours are separate from the brand: success `#2E7D4F`, warning
  `#B5651D`, danger `#B23A3A`. The dog mark stays as the logo; a serif wordmark is added.
- Typography: IBM Plex Sans (UI, tabular figures for scores and times) and IBM Plex Serif (wordmark,
  printed report titles), bundled through `@fontsource` packages so nothing loads from the network.
  Type scale: 28/22/17/15/13 px with 15 px body.
- Density: this is a data-entry tool. Prefer a compact, well-aligned layout with clear grouping over
  large marketing-style cards. Score tables need tabular figures, right-aligned numbers and zebra rows.
- Motion: minimal and purposeful (hover, focus, panel open); respect `prefers-reduced-motion`.
- Light theme only for v3 (matches the printed reports and the current pages); dark mode is an idea
  for later once tokens exist.

**Approach (foundation first, then pages; ship behind the same routes)**

1. **Foundation.** Replace `index.css`/`App.css`/`buttonOverrides.css` with one stylesheet: Tailwind 4
   `@theme` tokens (colours, radii, shadows, spacing, fonts), a sane reset, bundled font, print base.
   Delete the inline-style hacks in `Button.jsx`.
2. **Primitives** in `src/components/ui/`: `Button` (primary/secondary/danger/ghost, sizes, loading),
   `Input`/`Select`/`Field` (label, help text, error text, required marker), `Card`, `Table` (sortable
   header, numeric alignment, empty state, sticky header for long lists), `Dialog` (accessible: focus
   trap, Esc, `aria-modal`), `Toast` for success/error feedback, `EmptyState`, `Badge`, `Stat`.
   Standardise on a single icon set (one `react-icons` family such as Lucide via `react-icons/lu`).
3. **App shell.** Collapsible sidebar with logo/wordmark, active-route highlighting, current hunt name
   and day, and a content area that uses CSS grid instead of `ml-[276px]`; a page header component
   (title, description, actions) shared by every page; responsive down to ~1024 px.
4. **Pages, in order of daily use:** Score Entry (keyboard-first: Tab/Enter flow through dog numbers,
   inline validation, clear cross preview), View Scores, Home dashboard, Dogs (list + add + edit),
   Judges, Scratch Sheet, Reports (report picker + preview), Create/Edit Hunt, Docs.
5. **Reports and printing.** Keep `ReportGenerator`'s print layout working: run every report through
   Edge's print preview after the restyle; use `@media print` in the shared stylesheet instead of the
   injected `<style>` element; consistent report header with logo, hunt title, dates and day.
6. **Hygiene while touching each file:** fix the pre-existing ESLint errors (prop-types, missing keys,
   unused vars) so `npm run lint` passes at the end of the iteration.

**Constraints**

- Fully offline: no CDN fonts, icons or stylesheets; everything is bundled by Vite.
- Do not change API contracts or `HashRouter` routes; the desktop launcher and `AppLifecycle` depend on
  the same origin and paths.
- Printing must remain browser-native (the reason the React UI was kept).
- Accessibility baseline: visible focus rings, labels on every input, contrast AA, dialogs usable by
  keyboard.

**Done when**

- Every page uses the shared shell, primitives and tokens; no page-level hex colours or `!important`.
- The three legacy stylesheets and inline-style hacks are gone; `npm run lint` is clean.
- All reports print correctly from the Edge app window and from a normal browser.
- A screenshot set of every page is added under `docs/screenshots/` and the README uses them.

Suggested sequencing: do this after the first `v3.0.0` installer is confirmed on a clean machine
(iteration 4), so the visual work lands on a stable base and can ship as `v3.1.0`.

### 🔄 Iteration 6: logic review and user-flow smoothing

Context from the author (2026-09-10): the original project was not fully fleshed out when it was
created. The scoring logic and the user flows therefore have to be **reviewed and confirmed**, not
carried over on trust, before the data-safety and migration work builds on them.

The working document is [LOGIC_REVIEW.md](LOGIC_REVIEW.md): how scoring works as implemented, the
questions that need a rules decision, the defects fixed, what is still to do, and the flow notes.

Done so far:

- Audit of `DogService`, `DailyScore`, `HuntService`, the controllers and the tests.
- Eight defects fixed without changing any scoring rule: submitted-name validation on edit, duplicate
  dog numbers in a batch, unknown or duplicated dogs in a cross (now rejected instead of silently
  dropped), endurance rounding made identical on server and UI, the day's stored start time made
  authoritative for buckets, un-scratching when a scratch is deleted, entity `equals`/`hashCode`, and a
  copy-paste check in `getCrossInfo`. Covered by `DogServiceReviewTest`.
- The by-day results now include `endurance` and `dayTotal`, so the UI stops recomputing scoring maths.

Decisions: on 2026-09-10 the author answered all fourteen rule and flow questions (see the review, section 2)
and every answer is implemented and tested (interval vs. point step, scratches flagged on reports, per-hunt
day count and first-dog points, scratch day and reason list, growable crosses, register-or-skip for unknown
dogs, correctable start times with re-bucketing). 75 backend tests pass.

Also done (2026-09-11): reads no longer write (`GET /dogs` returned recalculated points and saved them on
every call), daily scores are looked up by day instead of list position (scoring day 4 first no longer
creates empty days 1-3), judge numbers must be positive, the dashboard shows a setup checklist until the
hunt has judges, dogs and a first cross, "New hunt" asks for confirmation naming the current hunt, and
score entry keeps the judge between crosses, lists the day's last three crosses and warns when a cross
time is earlier than that judge's last cross. 78 backend tests pass.

Next:

- Simplify the score model (`Score` owned by `DailyScore`, bucket and counted flag on the score) before
  iteration 8 freezes the schema with migrations; see LOGIC_REVIEW.md section 5.
- Remaining flow notes in section 6: scratched-dog and per-judge reports, a hunt summary sheet, bulk dog
  import (CSV), editing a dog's number.

### ⏳ Iteration 7: data safety and hunt management

- In-app **Backup** (copy `trackhounds.db` to a chosen file; use SQLite's online backup API so the app
  need not be closed) and **Restore**.
- **Export / import a hunt** as a single file (JSON or a copy of the database) so a hunt can be moved
  between computers or archived.
- Optional: multiple hunts. Cheapest model with SQLite: one database file per hunt plus a "hunt library"
  screen; alternative: add a `hunt_id` to all tables. Needs a decision.
- "Open data folder" and "Show log file" from the UI (currently tray menu only).

### ⏳ Iteration 8: schema migrations

`spring.jpa.hibernate.ddl-auto=update` is fine while every user starts from an empty file, but it cannot
rename or drop columns and SQLite has limited `ALTER TABLE`. Before the first schema change ships to
users with existing data:

- Add Flyway (`flyway-core` + `flyway-database-sqlite` is not needed; Flyway supports SQLite in core),
  generate `V1__baseline.sql` from the current Hibernate schema, switch to `ddl-auto=validate`.
- Add a start-up backup of the database before migrations run.

### ⏳ Iteration 9: window technology review

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

### ⏳ Iteration 10: distribution extras

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
