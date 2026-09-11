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
  The UI proposes points for each dog as `firstDogPoints - position * pointStep` (35, 30, 25, ...), both set per hunt; the
  judge can overwrite any value. The points sent to the server are what is stored.
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
| Q12 | Scores are **not edited in place**; delete and re-enter. | No change. |
| Q13 | The judge **member PIN** is a reference number only. | Kept as an optional field. |
| Q14 | Scratch reasons are a **fixed list plus "Other"** with free text. | `SCRATCH_REASONS` in `frontend/src/lib/hunt.js`: injured, withdrawn by owner, not found, disqualified, other. Adjust the list there. |

Also confirmed: **dual stake** hunts must score all-age and derby dogs separately within one cross. That is
what `getCrossInfo` does (two point ladders); it stays and is covered by `testGetCrossInfo`.

## 3. Questions still open

None at the moment. New questions go here with the code location they affect.

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

## 5. Still to do (defects and rough edges that do not need a rules decision)

- `GET /dogs` recalculates and **saves** every dog's points on each read. Points should be computed when
  scores change and read without side effects (or computed in the query).
- `calculateTotalPoints` relies on `dog.scores` index `day - 1`; `createScore` keeps that invariant but
  nothing enforces it. Store the day on `DailyScore` lookups instead of positional access.
- Deleting a dog cascades through `DailyScore` → `TimeBucketScore` → `Score` while `HighestScore` also
  points at the same `Score`; it works only because SQLite has no foreign keys here. Simplify the model
  (`Score` owned by `DailyScore`, bucket and counted flags on the score) before iteration 7 adds
  migrations.
- `GET /dogs/day/{day}` answers `400` when the day has no start time yet; `404` or an empty value is the
  honest answer.
- Two routes do similar things with different shapes: `/dogs/scores/{day}` (raw scores) and
  `/dogs/scores/day/{day}` (per-dog summaries). Rename for clarity when the API is next touched.
- `Days` has no link to the hunt; `Score.day` duplicates `DailyScore.day`. Fine for one hunt at a time,
  a problem for multiple hunts (iteration 7).
- There is no way to **edit** a score (only delete and re-enter) and no way to edit a scratch.
- `JudgeEntity.number = 0` is accepted by the server (the UI requires ≥ 1).

## 6. User-flow notes (to smooth out)

- **First run**: the empty dashboard sends the user to "Create a hunt", but after creating it nothing
  suggests adding judges before dogs, or dogs before scores. A short checklist on the dashboard
  (hunt → judges → dogs → scores) with the current counts would carry a new user through the setup.
- **Creating a new hunt wipes everything.** The warning is there; consider asking for the old hunt's
  title to be typed, or better, keep the old hunt readable (iteration 7's export / multiple hunts).
- **Score entry** is the hot path. Ideas: keep the judge number between crosses (same judge enters many
  crosses), show the last three crosses saved so the scorekeeper can check them, and warn when the cross
  time is earlier than the previous cross of that judge.
- **Unknown dog in a cross**: now blocked (F3). If that is too strict at a real hunt (Q9), offer
  "register dog N now" inline.
- **Scratch sheet**: no day (Q5); the reason is free text while hunts probably use a fixed set of
  reasons (injured, withdrawn, not found); the dog's name is copied at scratch time and not shown as
  scratched anywhere else in the UI.
- **Reports**: no report of scratched dogs' remaining scores, no per-judge summary (crosses per judge),
  no "hunt summary" front page. The overall speed and drive sheet shows zero columns for days that were
  not run (Q6).
- **Judges**: the member PIN is stored but never used; either drop it or show what it is for.
- **Dogs**: no bulk import (a CSV from the entry list would save the biggest chunk of typing at a
  hunt); editing a dog cannot change its number.
