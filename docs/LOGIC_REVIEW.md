# Logic review and user-flow notes

The original project was written quickly and never fully fleshed out, so version 3 treats the scoring
logic and the user flows as things to **verify**, not assume. This is the working document for that
review (iteration 6 in [CONVERSION_PLAN.md](CONVERSION_PLAN.md)). Keep it current: when a question is
answered, record the answer here and fix the code; when a defect is fixed, move it to "Fixed".

Reviewed on 2026-09-10 against `trackhounds/src/main/java/.../Service/DogService.java`,
`Entity/DailyScore.java`, `Service/HuntService.java`, the controllers and the tests in
`DogServiceTest.java`, which are the only written specification of the rules.

## 1. How scoring works today (as implemented)

- A **cross** is entered with a day, a start time, a cross time, a judge and the dogs in crossing order.
  The server proposes points for each dog as `firstDogPoints - position * pointStep` (35, 30, 25, ...), both set per hunt,
  never below zero; with **pack scoring** (a hunt setting) never below the hunt's minimum, normally 15, so every dog
  after the 15-point place also gets 15. The judge can overwrite any value. The points sent to the server are what is stored.
- A cross is stored as a row of its own (day, time, judge) and each dog's score carries the cross's id and the
  dog's place in it, so a cross can be listed, corrected and deleted as a whole.
- Each dog has one `DailyScore` per hunt day. A day's crosses are placed in **time buckets** of
  `huntInterval` minutes (the hunt's scoring interval) counted from the day's start time (`bucket = minutesSinceStart / interval`).
  Within one bucket only the dog's **highest** cross counts (`HighestScore`); the others are stored but
  marked `counted = false`. With `interval = 0` every cross counts.
- **Speed and drive** for a day (`dailyScore`) is the sum of the counted crosses of that day.
- **Endurance** adds 10 % of the day's speed and drive per day number (day 1 adds 10 %, day 2 20 %,
  day 3 30 %, day 4 40 %), truncated to whole points. A dog's overall **points** is the sum over days of
  speed and drive plus endurance.
- **Ties** in a ranking are broken by the later last cross: later day first, then the later time bucket,
  then the later time, then the higher points of that last cross (`testTieBreakingInRankings`).
- **Dual stake** hunts award two parallel point ladders in one cross: all-age dogs count down from the
  first-dog points among themselves and derby dogs among themselves (`DogService.getCrossInfo`).
- Dogs take their stake from the hunt's **number ranges** when registered through the UI; the stake is
  stored on the dog and never re-derived.
- A **scratch** records the dog, the day, the time, the judge and a reason, sets `dog.scratched = true`, and the dog is marked as scratched in standings and on reports.

## 2. Decisions taken (answered by the author on 2026-09-10)

| # | Decision | Implemented as |
| - | -------- | -------------- |
| Q1 | The **scoring interval** (minutes) and the **point step** (points between dogs in a cross) are two different hunt settings. Only a dog's highest cross within each interval, counted from the day's start time, is scored. The point step is normally 5 but is set per hunt. | `HuntEntity.huntInterval` is the scoring interval in minutes and `HuntEntity.pointStep` (default 5) the point step. The server buckets crosses with the hunt's interval and ignores the value sent with a cross (it is only used when no hunt exists, in unit tests). The hunt form has both fields; the score entry page prefills the point step from the hunt and shows the scoring interval. |
| Q4 | A **scratch** flags the dog; the dog keeps its points and stays in the standings, and every report indicates that the dog was scratched. | `scratched` is returned in every standings and cross-info result; the dashboard, the dog list and the score entry page show a "Scratched" badge, and every printed sheet marks the dog's name (or number) with "(scratched)". |
| Q2 | Endurance is 10 % of the day's speed and drive **per day number** (day 3 adds 30 %). | As coded and tested; no change. |
| Q3 | Ties are broken in favour of the **later** last cross. | As coded and tested; no change. |
| Q5 | A scratch **records the day** it happened on. | `Scratch.day` (default 1 for existing rows), validated against the hunt's day count; day selector on the scratch sheet and a Day column on the sheet and the scratch report. |
| Q6 | Hunts have **1 to 4 days, set per hunt**. | `HuntEntity.huntDays` (default 4); the hunt form has a day selector and every day list (dashboard, score entry, scores, scratch sheet, report options) only offers those days. |
| Q7 | A cross can have **more than seven dogs**; rows are added as needed. | Score entry starts with seven rows and has an "Add dog" button; the keyboard map grows with the rows. |
| Q8 | Changing the hunt's number ranges does **not** re-derive registered dogs' stakes. | As coded; no change. |
| Q9 | A dog that is not registered is shown with an explicit message and two choices: **register it on the spot** or **skip it**. | Score entry shows "Dog N is not registered" with "Register dog N" (a small dialog; the stake is pre-filled from the number ranges) and "Skip" (the row is excluded from the cross; the other dogs keep their places). The server still rejects unknown dogs, so a skipped row is never sent. |
| Q10 | A day's start time **can be changed** and the day's crosses are re-sorted into intervals. | "Change" next to the start time opens a dialog; `PUT /dogs/day/{day}` re-buckets every cross of the day (`DailyScore.rebucket`) and recalculates points. The new time cannot be later than the day's first cross. |
| Q11 | The **first-dog points** are set per hunt. | `HuntEntity.firstDogPoints` (default 35); the hunt form has the field and score entry prefills it. |
| Q12 | Scores are **not edited in place**; delete and re-enter. | Replaced on 2026-11-24 by Q18: a cross is corrected as a whole. |
| Q13 | The judge **member PIN** is a reference number only. | Kept as an optional field. |
| Q14 | Scratch reasons are a **fixed list plus "Other"** with free text. | `SCRATCH_REASONS` in `frontend/src/lib/hunt.js`: injured, withdrawn by owner, not found, disqualified, other. Adjust the list there. |
| Q15 | Dog numbers are **combinations of digits** and leading zeros are significant: "0" and "00" are two different dogs. | The dog number is a text key (digits only, up to six). Numbers order by value, then by length ("0", "00", "1", "01"). Every screen sends and shows numbers as text. Databases from the release candidates are upgraded on first start (see F18). |

Also confirmed: **dual stake** hunts must score all-age and derby dogs separately within one cross. That is
what `getCrossInfo` does (two point ladders); it stays and is covered by `testGetCrossInfo`.

### From the first test hunt (2026-11-24, [FIRST_NOTES.md](FIRST_NOTES.md))

| # | Decision | Implemented as |
| - | -------- | -------------- |
| Q16 | **Pack scoring** is an option chosen when the hunt is set up: points count down from 35 to 15 and every dog after the 15-point place also receives 15. | `HuntEntity.packScoring` and `packMinimumPoints` (default 15). `DogService.ladderPoints` is the one formula, `max(lowest, firstDogPoints - pointStep * position)`, with `lowest` the pack minimum or 0. The hunt form explains the choice with the hunt's own numbers. |
| Q17 | A time may be typed **without the colon**: 0600, 1300. | `parseTime` on the page (`lib/time.js`) and on the server (`DogService.parseTime`): with digits only, the last two are the minutes. |
| Q18 | The scores of one crossing are shown **together**, and a crossing can be **opened and corrected**. | `CrossEntity` (table `crosses`), `Score.crossId` and `crossPosition`. `DogService.updateCross` replaces the scores of a cross under the same id after the same checks as a new cross; `deleteCross` removes it whole. View scores groups by cross. |
| Q19 | The operator sees **the last cross they entered**, not the day's latest cross by time. | Cross ids grow in the order of entry; the score entry page lists the three highest. A corrected cross keeps its id, so correcting an old cross does not move it to the top. |
| Q20 | **Special awards** (Best Mouth, Classiest Hound) are entered for specific dogs and printed. | `Award` (title, dog number, notes), free-text title. The same title can go to several dogs but not twice to one. Printed on the Special awards sheet and the hunt summary. |

The notes left several points open. They were built on an assumption first and then put to the author,
who answered all of them on 2026-11-24:

| # | Decision | Implemented as |
| - | -------- | -------------- |
| Q21 | The pack **minimum is a hunt setting**, 15 unless the hunt changes it. | `HuntEntity.packMinimumPoints`, shown on the hunt form when pack scoring is chosen. As built. |
| Q22 | In a **dual** hunt with pack scoring, all age and derby each count down to the minimum on their **own ladder**. | `DogService.getCrossInfo`: one place counter per stake. As built. |
| Q23 | Pack scoring changes **only the points of a cross**. The scoring interval, the highest cross per interval and endurance are the same as under standard scoring. | Nothing but `ladderPoints` reads the setting. As built. |
| Q24 | Without pack scoring, the **eighth dog** of a cross and every dog after it gets **0** and is still recorded. | `ladderPoints` with a lowest of 0. As built. |
| Q25 | When a dog is **taken out of a saved cross**, the dogs behind it **move up a place**; points a judge typed in by hand stay as typed. | Score entry in edit mode: proposed points follow the dogs as they stand, typed-in points are kept (`autoPoints`, `customPoints`). As built. |
| Q26 | **Enter skips the points boxes**: time, judge, then down the dog numbers. Tab and the arrow keys reach the points. | `ScoreEntry.enterTarget`. As built. |
| Q27 | A cross is corrected or deleted **as a whole**; there is no delete button per dog. | View scores has Edit and Delete on the cross only. As built. |
| Q28 | "The last cross entered" is the **last three crosses typed in, on any day**, newest first. | Score entry, `lastEntered`. As built. |
| Q29 | Special awards print in **four places**: their own sheet, the hunt summary, next to the dog on the final standings, and as a column the report builder can place on any dog sheet. | All four are built. The `dogs` dataset has an `awards` column (a dog's award titles on one line); Overall speed and drive and Top dogs overall carry it after the name with `whenFilled`, which leaves the column out while no dog on the sheet has an award. |
| Q30 | President and Master of Hounds print on the **hunt summary only**; the location prints on every sheet. | `HuntSummaryReport` facts; `ReportGenerator` header. As built. |

## 3. Questions still open

None at the moment. The six points the first-hunt notes left open were answered on 2026-11-24 and are
decisions Q21 to Q30 above. New questions go here with the code location they affect.

## 4. Fixed in iteration 6 so far

| # | Defect | Fix |
| - | ------ | --- |
| F1 | `editDog` validated the **existing** dog's name instead of the submitted one, so a dog could be renamed to an empty string. | Validates the submitted name; owner is required too, as in the UI. |
| F2 | `createDogs` accepted the same number twice in one batch; the second silently overwrote the first. | Duplicate numbers in a batch are rejected with a per-row error. |
| F3 | `createScore` silently **dropped** dogs that were not registered, so a mistyped number lost a score without anyone noticing. Duplicated numbers in one cross created two scores. | Unknown and duplicated dog numbers are rejected with per-row errors; nothing is saved. |
| F4 | Overall points summed fractional endurance and truncated once, while the daily sheets truncate per day, so the overall total could differ by one point from the sum of the daily sheets. | Endurance is `speedAndDrive * day / 10` in whole points on both server and UI; the by-day results now carry `endurance` and `dayTotal` so the UI no longer recomputes them. |
| F5 | Buckets were computed from the start time **sent with each cross**, while the day's stored start time (set by the first cross) was ignored, so changing the field later put crosses in inconsistent buckets. | The day's stored start time is authoritative; the field is read-only in the UI once the day has started. |
| F6 | Deleting a scratch left the dog flagged as scratched. | Deleting the last scratch of a dog clears the flag. |
| F7 | `Score.equals` compared boxed `Long` ids with `==` (wrong above 127); `DogEntity.hashCode` used the mutable score list and disagreed with `equals`; `JudgeEntity.equals` threw on a missing PIN and had no `hashCode`. | Identity-based `equals`/`hashCode` on the key fields only. |
| F8 | `getCrossInfo` checked `stakeRange` twice instead of `stakeTypeRange`. | Checks both arrays. |
| F9 | One number served as both the point step and the scoring interval (Q1). | Separate `pointStep` on the hunt; buckets always use the hunt's interval. |
| F10 | Scratched dogs were indistinguishable in standings and reports (Q4). | `scratched` flag in every result; badges in the UI and "(scratched)" on printed sheets. |
| F11 | The day count, first-dog points and scratch day were hard-coded or missing (Q5, Q6, Q11). | Hunt settings `huntDays` and `firstDogPoints`; `Scratch.day`; every day list follows the hunt. |
| F12 | A wrong day start time could not be corrected (Q10). | `changeStartTime` re-buckets the day and recalculates points; dialog on the score entry page. |
| F13 | Unknown dogs in a cross had no path but "fix the number" (Q9); crosses were limited to seven rows (Q7). | Register-on-the-spot dialog and Skip on the row; rows can be added. |
| F14 | `GET /dogs` and `GET /dogs/{n}` recalculated and **saved** points on every read. | Reads are pure; points are maintained when scores change (cross saved, score deleted, start time changed). |
| F15 | Daily scores were addressed by list position (`scores.get(day - 1)`), so scoring day 4 first created empty filler days 1-3. | `DogEntity.dailyScoreFor(day)`; one `DailyScore` per scored day, in any order. |
| F16 | Judge number 0 was accepted by the server. | Must be greater than 0. |
| F17 | `Score` was reachable from two join tables (`time_bucket_score`, `highest_score`) and deleting a dog only worked because SQLite has no foreign keys here. | Scores are owned by their `DailyScore`; the scoring interval and the counted flag live on the score. `getTimeBucketScores()`/`getHighestScores()` remain as read-only views. |
| F18 | Dog numbers were integers (Q15) and the schema had no migration path. | `LegacySchemaMigration` runs before Hibernate on start-up: backs the database up to `backups/`, moves the score links onto the scores, drops the join tables and rebuilds the four dog-number columns with text affinity (SQLite would coerce "00" to 0 in an integer column). Covered by `LegacySchemaMigrationTest` against a copy of the release-candidate schema. |
| F19 | A dog's number could not be corrected once it had scores; the only way was delete and re-enter everything. | `PUT /dogs/{number}/number` rewrites the key in place across `dogs`, `daily_score`, `score` and `scratch` in one transaction (score and scratch ids are kept). The Edit dog page exposes it. |
| F20 | No sheet said what each judge had recorded, and there was no front page for the hunt's paperwork. | `ReportService`: `GET /reports/judges` (crosses and dog placings per judge per day, scratches recorded) and `GET /reports/hunt-summary` (settings, entries, each day, top five placings per stake, scratches). A "cross" is one judge's entry at one time on one day. |
| F21 | On score entry the proposed points of a row were frozen by the first answer from the server: retyping a number, or in a dual hunt typing a dog of the other stake over it, kept the old points, and changing First dog points did nothing for rows already filled. | The page keeps proposed points and typed-in points apart (`autoPoints`, `customPoints`); emptying a points box goes back to the proposal. |
| F22 | `getCrossInfo` proposed negative points from the eighth dog on (35 - 5 × 8), which `createScore` then refused. | `ladderPoints` never goes below zero (or the pack minimum). |
| F23 | A cross typed and saved from the keyboard faster than the proposal came back was saved with the page's own estimate, which is wrong in a dual hunt. Server messages per dog (`dogNumbers2`) were shown on the wrong row when a row above was empty or skipped. | The save asks for a fresh proposal for exactly the dogs being saved, and row messages are mapped back to the rows they belong to. |
| F24 | A dog whose only cross of a day was deleted kept an empty daily score and was still listed as scored that day (a place and 0 points on the daily sheets). | `getDogScoresByDay` skips a day without crosses. |
| F25 | Crosses were counted as distinct (day, judge, time), so two crosses by one judge in the same minute counted once. | Counted by cross id (`ReportService.crossKey`). |

## 5. Still to do (defects and rough edges that do not need a rules decision)

- `GET /dogs/day/{day}` answers `400` when the day has no start time yet; `404` or an empty value is the
  honest answer.
- Two routes do similar things with different shapes: `/dogs/scores/{day}` (raw scores) and
  `/dogs/scores/day/{day}` (per-dog summaries). Rename for clarity when the API is next touched.
- `Days` has no link to the hunt; `Score.day` duplicates `DailyScore.day`. Fine for one hunt at a time,
  a problem for multiple hunts (iteration 7).
- There is no way to edit a scratch (delete it and record it again). A score is corrected by editing its cross (Q18).
- `DELETE /dogs/{number}/scores/{id}` (one score) is no longer used by the UI; drop it or keep it for scripts when the
  API is next tidied.
- `Score` still carries its own copy of the day, time and judge next to `crosses`. They are written together and cannot
  drift today, but one of the two should go.
- `GET /dogs/{number}` answers `400` for an unknown dog; `404` would be the honest answer.

## 6. User-flow notes (to smooth out)

- **First run**: done. The dashboard shows a "Getting this hunt ready" checklist (hunt → judges → dogs →
  first cross) with the counts and a link to the next step, until every step is done.
- **Creating a new hunt wipes everything.** Done: "New hunt" now asks for confirmation naming the current
  hunt before leaving the dashboard, and the create page repeats the warning. Keeping old hunts readable
  is iteration 7 (export / multiple hunts).
- **Score entry**: done. The judge number is kept between crosses and the cross time warns when it is earlier
  than that judge's last cross, or when that judge already has a cross at that time. Since 2026-11-24: times are
  typed with or without the colon, Enter moves forward through the cross (time, judge, dog numbers, Save), and the
  list under the form is the last three crosses **entered** (any day, newest first, uncounted scores greyed) with
  an Edit link on each.
- **Correcting a cross**: done (2026-11-24). View scores groups the scores under their cross; Edit opens the cross
  on the score entry page as it was saved, and saving replaces it. Delete removes the whole cross.
- **Special awards**: done (2026-11-24). The Awards page takes the award's name and the dog's number; printed on
  the Special awards sheet and the hunt summary.
- **Unknown dog in a cross**: now blocked (F3). If that is too strict at a real hunt (Q9), offer
  "register dog N now" inline.
- **Scratch sheet**: no day (Q5); the reason is free text while hunts probably use a fixed set of
  reasons (injured, withdrawn, not found); the dog's name is copied at scratch time and not shown as
  scratched anywhere else in the UI.
- **Reports**: done. Scratched dogs are marked on every sheet (F10) and the Scratches report lists them;
  the Judge summary shows crosses and dog placings per judge and day; the Hunt summary is the one-page
  front sheet (F20). Day columns follow the hunt's day count (Q6).
- **Stakes in a dual hunt** (2026-09-12): done. All age and derby are two competitions, so the dashboard
  offers "Both stakes / All age / Derby" views of the standings (per-stake rankings from the server) and
  tags every dog with its stake when both are listed together; the score list shows the dog's name and
  stake and can be filtered by stake; the "All dogs" rankings sheets add a Stake column. In a single-stake
  hunt the tag appears only on a dog whose stake differs from the hunt's (registered outside the ranges).
- **Judges**: the member PIN is kept as a reference only (Q13); the dialog says so.
- **Dogs**: done. Add dogs has Import CSV (`number, name, stake, sire, dam, owner`, header optional,
  unreadable rows listed and skipped, rows land in the table for checking before saving) and a per-row
  owner; Edit dog can change the number (F19).
- **Quick start**: the Docs page opens with the whole hunt in order (before, each day, end of hunt) and a
  "Fixing mistakes" list; the same guide is `docs/QUICK_START.md` with screenshots, linked from the README
  and from the Home checklist.
