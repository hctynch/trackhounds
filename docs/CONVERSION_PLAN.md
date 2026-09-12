# TrackHounds 3: conversion to a self-contained desktop application

This document records **why** TrackHounds was converted from a Docker + Electron + MariaDB
application into a single Java + SQLite desktop application, **what** has been done, and **what
the next iterations are**. Keep it up to date: when an iteration finishes, move it to "Done" and
note anything that was learned.

- Status legend: ✅ done · 🔄 in progress · ⏳ planned · 💡 idea / needs a decision
- Last updated: 2026-09-12 (iterations 1-3 and 5-8 done, 4 waiting on a second PC, 11 in progress, 9-10
  planned; all on `main`)

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
2. **SQLite through `sqlite-jdbc` + `hibernate-community-dialects`.** The JPA model needed no changes.
   Until iteration 8 the schema was created by Hibernate (`ddl-auto=update`); since then it comes from
   Flyway scripts in `db/migration` and Hibernate only maps to it (`ddl-auto=none`). Hikari's pool is limited to **one
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

### ✅ Iteration 6: logic review and user-flow smoothing

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

Also done (2026-09-11): the score model is simplified (scores owned by their daily score, interval and
counted flag on the score; the two join tables are gone) and dog numbers are text keys so that "0" and
"00" are different dogs (author's rule). Both are schema changes, so `LegacySchemaMigration` upgrades
release-candidate databases on first start after taking a backup; it is the pattern Flyway can replace in
iteration 8.

Also done (2026-09-11): the last flow notes. Two server-computed reports, a one-page **Hunt summary** and
a **Judge summary** (`ReportService`, `GET /reports/*`); the report sheet can now render fact grids and
several titled sections; **Import CSV** on Add dogs (parser in `frontend/src/lib/csv.js`, template in
`frontend/public/dogs-template.csv`); a dog's **number can be changed** (`PUT /dogs/{number}/number`, key rewritten
in place with its scores and scratches); and a **quick start guide** on the Docs page and in
[QUICK_START.md](QUICK_START.md). 87 backend tests pass.

Next:

- Nothing blocks closing the iteration. Section 5 of the review lists small API rough edges (`400` vs
  `404`, route naming, `Days` not linked to the hunt) to take when the API is next touched (iteration 7).

### ✅ Iteration 7: data safety and hunt management

Done 2026-09-11. One design carries all four bullets: **a hunt is a database file**, so a backup, an
exported hunt and an archived hunt are the same kind of file, and "multiple hunts" is a library of
such files rather than a `hunt_id` on every table (the cheaper model named below; the schema and every
query stay single-hunt).

- `DataService` / `GET|POST /data/**`: backups are written with `VACUUM INTO` while the app runs
  (consistent copy, no close needed) to `<data>/backups/`, or streamed as a download
  (`GET /data/backups/download`). Restore goes through SQLite's **online backup API into the live
  connection** (`SQLiteConnection.getDatabase().restore`), so nothing restarts; the uploaded or chosen
  file is checked (SQLite header, `hunt_entity` and `dogs` tables, a hunt row), upgraded on a temp copy
  by `LegacySchemaMigration` (which now also adds the columns later versions introduced), and the current
  database is saved to `backups/trackhounds-before-restore-*.db` first.
- **Past hunts** live in `<data>/hunts/<title-slug>-<stamp>.db`: save the current hunt, open one
  (the current hunt is archived first), delete, import a file. The "New hunt" dialog offers to save the
  current hunt there before clearing it (checked by default).
- UI: a **Backups** page (`/data`, in the rail) with the backups table, restore from file, past hunts and
  the folder locations; **Open data folder** / **Show log file** buttons on the Docs page and folder
  buttons on the Backups page (`POST /app/open/{data|backups|hunts|log}`, desktop mode only).
- Tests: `DataServiceTest` (backup readable on its own, restore + safety copy + undo, rejects non-
  TrackHounds files without touching anything, upgrades an RC-era file, archive/open/delete/import,
  path traversal refused). 95 backend tests pass.

Not done, by choice: a JSON export format (the database file is the portable format and needs no
second serializer) and `hunt_id` multi-hunt (nothing in the UI needs two hunts open at once).

### ✅ Iteration 8: schema migrations

Why: `ddl-auto=update` is fine while every user starts from an empty file, but it cannot rename or drop
columns and SQLite has limited `ALTER TABLE`, so it had to go before the first schema change reaches users
with data. Done 2026-09-12:

- `flyway-core` (version managed by Boot; SQLite support is part of core) with `V1__baseline.sql`, the
  schema exactly as Hibernate created it for 3.0. `spring.jpa.hibernate.ddl-auto=none`: Hibernate never
  changes the tables again. A schema change is now a `V<n>__*.sql` script; `V1` is never edited.
- `Config/DatabaseMigration` runs before the `EntityManagerFactory` (the hook the legacy migration used)
  and does, in order: the release-candidate rewrite (`LegacySchemaMigration`, now a plain utility), a
  `VACUUM INTO` copy to `backups/trackhounds-before-upgrade-<stamp>.db` when Flyway has something pending
  on an existing database, then `migrate` with `baselineOnMigrate` at version 1. So a 3.0 database (no
  history table) is baselined on its first start, an empty file gets V1, a release-candidate file is
  rewritten and then baselined, and a current file is left alone. Flyway is driven from that class rather
  than through Boot's auto-configuration (`spring.flyway.enabled=false`) because the auto-configuration
  cannot be ordered after the rewrite and the backup.
- Restores (`DataService.prepare`) run the same upgrade on the temporary copy, so a backup or a past hunt
  from any earlier version loads.
- Tests: `DatabaseMigrationTest` (empty file; 3.0 file baselined with one copy taken and none on a second
  run; release-candidate file rewritten then baselined with one copy; reset; URL parsing) and
  `SchemaMatchesEntitiesTest`, which exports the entities' schema with Hibernate into a scratch file and
  compares every table and column, with nullability and defaults, against the database the scripts built.
  The test profile runs the real path: `trackhounds.database.reset-on-start=true` wipes the file, then the
  scripts build it. 101 backend tests pass.

Learned: Hibernate's `validate` cannot be used on SQLite. `SQLiteDialect` declares every identity key as
`integer` (SQLite only auto-numbers an `integer primary key`) while the validator expects `bigint` for a
`Long` id, so it fails on `daily_score.id` in a schema the dialect itself produced. `none` plus the
comparison test is the replacement, and it is the stricter check. Also checked, because the app must stay
offline: Flyway core has no network code; telemetry is a plugin interface whose only implementation in the
community jar is a no-op, and the URLs inside the jar are documentation links in error messages.

### 🔄 Iteration 9: window technology review

**Decision (author, 2026-09-12): move the application window to JavaFX WebView** (option 3 below). The
recommendation on the table was to keep Edge app mode and finish its messaging, because the two risks of
WebView are exactly the two things the browser window was kept for: printing (WebKit in JavaFX has no
`window.print()`, so reports go through the JavaFX print API) and Tailwind 4 support in JavaFX's WebKit
build. The author chose the pure-Java window anyway, so the move is done in the order that settles those
two risks first:

1. **Spike, behind a switch.** `trackhounds.desktop.window=javafx|browser` selects the window; the Edge
   path stays as it is until the JavaFX one is proven. `Desktop/JavaFxWindow` opens a `Stage` with a
   `WebView` on the local URL, opens `target=_blank` links in the default browser, and exposes a small JS
   bridge (`window.trackhoundsWindow.print(...)`) that the report sheet calls instead of `window.print()`.
   Printing loads the sheet's HTML and stylesheet into an offscreen `WebEngine` and prints that through
   `PrinterJob`, which mirrors what `react-to-print` does with an iframe, so the print CSS stays as it is.
2. **Rendering check.** Every page of the built UI is captured from inside the JavaFX window (a `WebView`
   snapshot) and compared with the Edge screenshots in `docs/screenshots/`. Things to look at: Tailwind 4
   output (`color-mix()`, `@property`, `@layer`), the native `<dialog>` element, `<input type="time">`
   (desktop WebKit builds may render it as a plain text field), Server-Sent Events and `sendBeacon`.
3. **Print check.** Each report printed from the JavaFX window through a real print dialog, compared with
   the Edge output: page breaks, repeated table headers, fonts. The author does this on a real printer or
   the Windows PDF printer; it cannot be automated without a prompt-free printer.
4. **Exit criteria** for making JavaFX the default and removing the Edge path: every page renders like the
   Edge screenshots, every report prints acceptably, start-up is not slower than app mode, and the
   installer grows by no more than about 60 MB. If a blocker turns up in 2 or 3, the fallback is embedded
   Chromium (JCEF), not a return to this question.

**Spike results (2026-09-12, steps 1 and 2 done, step 3 open):**

- Built as planned: `javafx-controls` and `javafx-web` 26.0.2 from Maven (the platform classifier jars,
  about 47 MB more in the jar, inside the budget), `Desktop/JavaFxWindow`, the
  `trackhounds.desktop.window` switch (default still `browser`), the print bridge, `target=_blank` to the
  system browser, WebKit's console routed to the log, and the capture mode
  (`-Dtrackhounds.desktop.capture=<dir>`). Run it with
  `java -Dtrackhounds.desktop.capture=<dir> -jar trackhounds-3.0.0.jar --trackhounds.desktop.window=javafx`.
- **Rendering: every page matches the Edge screenshots.** Tailwind 4 output (`color-mix()`, `@layer`,
  `@property`), the fonts, badges, tables, segmented controls and the native `<dialog>` all render the
  same in JavaFX 26's WebKit; Server-Sent Events work (the page connects and the launcher sees it).
  Evidence in `docs/screenshots/javafx-home.png` and `javafx-score-entry.png`. Two differences, both fixed
  or accepted: WebKit rejected the Select control's chevron, a raw `<svg>` data URL that a Tailwind
  arbitrary value produced (now a percent-encoded `select-arrow` utility in `index.css`, fine in both
  engines); and `<input type="time">` is a plain text field in JavaFX's WebKit, so the time fields carry
  an `HH:MM` placeholder and the server's time parsing reports a bad entry (Edge ignores the placeholder).
- **Printing, first half: the print document is right.** The capture run also builds the document the
  bridge prints (the sheet's HTML with the app's stylesheet) in a second WebView and saves it
  (`docs/screenshots/javafx-print-document.png`): fonts, rules and zebra rows come through. What is not
  checked yet is the second half, pagination through `WebEngine.print`: repeated table headers and page
  breaks on a multi-page sheet. That needs a real print dialog: start the app with
  `--trackhounds.desktop.window=javafx`, open Reports, print Daily speed and drive and All dogs all days
  to the Windows PDF printer, and compare with the Edge output.
- Start-up: the window shows about one second after the server is ready (the first run unpacks the
  native libraries into `<data>/javafx-cache`). JavaFX logs "Unsupported JavaFX configuration: classes
  were loaded from 'unnamed module'" because the jars sit inside the Spring Boot fat jar; it works.
- Build consequences: JavaFX 26 ships Java 24 class files, so `java.version` is 24 and both workflows
  set up **JDK 25** (LTS), which also becomes the bundled runtime. Developers need JDK 24 or newer. The
  jlink image adds `java.datatransfer`, `jdk.jsobject` and `jdk.xml.dom`.
- Not touched yet: `javafx-media` (pulled in by `javafx-web`, about 1 MB, could be excluded), the
  `browser-profile` folder and the Edge path itself, which stay until the exit criteria are met, and the
  installer size (the app image has not been rebuilt with JavaFX).

Next for this iteration: the author's print check (above); then, if it passes, make `javafx` the
default, remove the Edge/Chrome path and the browser profile, rebuild the app image and confirm the
installer size, update the README's "Start TrackHounds" wording and the troubleshooting section.

Also decided: no Mac or Linux work for now (iteration 10). Options as originally listed, in order of effort:

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

- ✅ "Check for updates" button (2026-09-12): UI only, by decision. The Docs page's **Check for updates**
  calls GitHub's latest-release API on click (`lib/updates.js`, 8 s timeout, pre-releases excluded),
  compares the tag with the version from `/app/info` (`lib/version.js`, pre-release aware) and shows
  "latest", "version X available" with a link to the release page, or a could-not-reach message. No server
  endpoint; nothing happens without the click.
- Code signing: decided 2026-09-12 to **stay unsigned for now**. The SmartScreen workaround stays
  documented in the README. Options priced at the time, for when the budget allows: Azure Trusted Signing
  (about 10 USD a month, identity validation, signs from CI), SignPath Foundation (free for eligible open
  source), or an OV/EV certificate (roughly 200 to 600 USD a year plus a token or cloud HSM).
- macOS `.dmg` / Linux `.deb`: **out of scope** by decision of 2026-09-12 (the launcher keeps its code
  paths, nothing is built or tested for them).
- ✅ Automated smoke test in CI (2026-09-12): `.github/scripts/smoke.sh`, run by `Build and Test` after
  `mvnw verify`, starts the jar with `--server` against an empty folder, checks `/actuator/health`,
  `/app/info`, the UI, the CSV template, `GET /hunt` (404) and `GET /dogs`, confirms V1 was applied, then
  starts it again and confirms the schema is found current with no backup taken. Runs locally too.

### 🔄 Iteration 11: stakes made visible, and a report builder

Context from the author (2026-09-12), after using the app: the judge number sat at the right edge of
its input box; on the dashboard and in the score list it was not clear which stake a dog belongs to
("separate scoreboards or tags beside the number or name"); and the reports should let users
compose their own sheets with the columns they want. The first two are done; the third is planned
below and needs the decisions at the end.

Done 2026-09-12:

- **Numeric inputs read like every other field.** The `input-number` utility (used by `Input numeric`)
  right-aligned its text, a table habit that looked wrong in a dialog. It now only sets tabular figures
  and hides the spinner; `CellInput numeric` (the points column of the cross table) adds `text-right`
  itself so it still lines up with its right-aligned header.
- **Stake tags and stake views.** Helpers `isDualHunt`, `showsStake` and `STAKE_VIEWS` in
  `frontend/src/lib/hunt.js`. The rule for a tag: always in a dual hunt; in a single-stake hunt only on a
  dog whose stake differs from the hunt's (registered outside the number ranges), because "All age" on
  every row of an all-age hunt says nothing.
  - Home: a dual hunt gets a "Both stakes / All age / Derby" control above the standings that switches
    both panels to the per-stake rankings (the existing `/dogs/scores/stake/...` and
    `/dogs/scores/day/{d}/stake/...` endpoints, which already carry `stake` in every row). In "Both
    stakes" every dog carries its stake tag next to its name. The setup checklist keys off an unfiltered
    call so a stake view with no scored dogs does not bring the checklist back.
  - Scores: a Name column (name, stake tag, scratched mark) joined from `GET /dogs`, because a score row
    only holds the dog's number, and a Stake filter in dual hunts. The row count line names the stake.
  - Sheets: the four rankings that can list "All dogs" (Daily speed and drive, Overall speed and drive,
    Top dogs overall, Daily top dogs) add a Stake column after the name when the hunt is dual
    (`addStakeColumn` in `Reports/format.js`). Per-stake sheets are unchanged.
- Score entry: the "Last crosses of day N" list tags each dog with its stake (same rule), so the two point
  ladders of a dual cross can be checked at a glance; the dog list is reloaded after every save and
  registration so a dog registered from the cross is tagged at once.
- Add dogs: a **Download template** button beside Import CSV. The template moved from `docs/` to
  `frontend/public/dogs-template.csv` so it ships inside the app and downloads without a connection.
- Verified with `npm run lint` (no errors) and a production build; screenshots of the dual-hunt
  dashboard, score list and score entry from the built jar are in `docs/screenshots/` (`home-dual.png`,
  `scores-dual.png`, `score-entry-dual.png`).

Noticed on the way, left for the builder below:

- "All dogs, all days" hard-codes four day columns whatever `huntDays` says (decision Q6) and its
  column-group borders are index arithmetic on that count, so it cannot take a Stake column either.
- `Reports/TopDogsReport.jsx`, `DogScoresByDayReport.jsx`, `TopDogsByStakeTypeReport.jsx` and
  `TopDogsByDayAndStakeTypeReport.jsx` are no longer in the catalogue; the last three survive only because
  `Reports.jsx` imports their option selectors.

**Plan: the report builder**

Goal: a scorekeeper composes a printable sheet from the hunt's data without code: what the rows are,
which columns in which order, the filters, a name. The sheet then lives in the Reports catalogue and
prints like the built-in ones. The built-in sheets stay, and most of them become definitions over the
same machinery so there is one code path to keep correct.

1. **Datasets (the rows).** Four, each served by the backend as flat rows with every column filled in,
   so the UI never recomputes scoring maths (the rule since F4):
   - `dogs`: one row per registered dog: place, number, name, stake, owner, sire, dam, scratched,
     speed and drive per day, endurance per day, day total per day, overall speed and drive, overall
     endurance, overall total, last cross day and time. Ranked by the server's rule (points, then the
     tie-break) either overall or for one day, so "top N" keeps the tie-break order.
   - `scores`: one row per dog placing in a cross: day, time, judge number and name, dog number and name,
     stake, owner, points, counted, interval number.
   - `scratches`: day, dog number and name, stake, owner, time, judge number and name, reason.
   - `judges`: number, name, member PIN, crosses and dogs scored per day and in total, scratches
     recorded (what `getJudgeSummary` already returns).
   Endpoint `GET /reports/datasets/{dogs|scores|scratches|judges}?day=&stake=&limit=` in `ReportService`;
   the parameters are the filters that need the server (a day's ranking, top N in tie-break order), the
   rest is filtered in the browser. Day columns follow `huntDays`. `ReportServiceTest` covers each dataset,
   the day count and the dual-stake ranking.
2. **Definition (what is saved).**
   ```json
   {
     "id": "club-daily-sheet", "name": "Club daily sheet", "dataset": "dogs",
     "columns": [{ "key": "place" }, { "key": "dayTotal", "label": "Total" }, { "key": "number" },
                 { "key": "name" }, { "key": "stake" }, { "key": "owner" }],
     "filters": { "day": "ask", "stake": "ask", "limit": 10, "includeScratched": true, "splitByStake": false },
     "sort": { "key": "rank" },
     "title": "Day {day} placings, {stake}"
   }
   ```
   A filter is a fixed value or `"ask"`, in which case the sheet shows that control when it is opened
   (day, stake, number of dogs), exactly like today's option rows. `splitByStake` prints a dual hunt as
   two sections (all age, then derby) with the sheet's existing section support. Column labels can be
   renamed. Sort defaults to the dataset's natural order (ranking for dogs, day and time for scores) and
   can be any column.
3. **Storage.** One JSON file per definition in `<data>/reports/`, through `GET|PUT|DELETE
   /reports/custom[/{id}]`. A hunt is a database file (iteration 7) but a sheet layout belongs to the
   club, not to a hunt: it must survive "New hunt" and opening a past hunt, and it is inside the one-folder
   backup. Export and import of a definition file (share a layout with another club) then costs nothing.
4. **UI.** The catalogue gets a "Custom" group with the saved sheets and a "New report" entry; each custom
   sheet has Edit, Duplicate and Delete. Routes `/reports/builder` and `/reports/builder/{id}`; printing
   stays at `/reports/{id}`. The builder has three parts: settings (name, dataset, each filter with a
   "fixed / ask when opening" choice, sort, split by stake), a column picker (the dataset's columns as a
   checkbox list in print order, move up and down, optional label) and a live preview rendered by the
   unchanged `ReportGenerator` from the current hunt's data. No drag and drop in the first cut. Every
   built-in sheet gets a "Customise" action that opens the builder pre-filled, so users start from
   something that already looks right.
5. **Built-ins as definitions (second step).** Daily speed and drive, Overall speed and drive, Top dogs
   overall, Daily top dogs, All dogs all days, Scratches, Judge summary, Scores for one dog and Scores by
   one judge are each one dataset plus columns plus filters. They move into a read-only list of
   definitions (`Reports/builtin.js`); the ten report modules and the nine selector components go. Hunt
   summary stays hand-written (facts plus sections from several datasets). The column-group header of
   All dogs all days becomes a `group` attribute on columns so the border maths stops depending on
   exactly four days.

Sequence: (a) datasets and tests; (b) definition model, storage endpoints, tests; (c) builder page and
catalogue group; (d) built-ins as definitions, old modules deleted; (e) docs, screenshots, a Quick start
row.

Done when: a scorekeeper can build "Day N placings with owner and stake, top 15, ask for the day"
without code, print it, and find it again after restarting the app and after opening a past hunt; every
built-in sheet prints as it does today; day columns follow the hunt's day count everywhere.

💡 Decisions needed before (b):

1. Storage: JSON files in the data folder (recommended, above) or a table in the hunt database, where a
   layout would travel with a past-hunt file and be lost on "New hunt" unless copied.
2. Re-express the built-in sheets as definitions (recommended: it is what makes "Customise" possible and
   removes ten near-identical modules) or keep them as code and only add custom sheets beside them.
3. Are four datasets enough for the first version? A `crosses` dataset (one row per cross with its dogs in
   order, the judge's card transcribed) is the likely fifth.
4. Column reordering with up and down buttons first; drag and drop only if that proves too slow to use.

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
`--trackhounds.desktop.enabled=false`, `--trackhounds.desktop.window=javafx|browser` (also as system
properties or `TRACKHOUNDS_*` environment variables); `-Dtrackhounds.desktop.capture=<dir>` saves a PNG of
every page from the JavaFX window and quits.

## 5. Known limitations

- Unsigned installer: SmartScreen shows a warning on first run.
- The application window depends on Microsoft Edge or Google Chrome being installed; otherwise the UI
  opens in the default browser and the app is closed from the tray icon.
- One writer at a time (SQLite): fine for a single operator; not designed for several scorers entering
  data at once from different computers.
- Data from version 2 (Docker volume) is not migrated.
