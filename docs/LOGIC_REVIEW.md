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
  The UI proposes points for each dog as `firstDogPoints - position * interval` (35, 30, 25, ...); the
  judge can overwrite any value. The points sent to the server are what is stored.
- Each dog has one `DailyScore` per hunt day. A day's crosses are placed in **time buckets** of
  `interval` minutes counted from the day's start time (`bucket = minutesSinceStart / interval`).
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
- A **scratch** records the dog, the time, the judge and a reason and sets `dog.scratched = true`.

## 2. Questions to confirm with the rules (need a decision, code unchanged)

| # | Question | Where it matters |
| - | -------- | ---------------- |
| Q1 | Is the scoring interval really the same number as the point step between dogs? The score entry page sends one `interval` that is used for both (points step in the UI, bucket length in minutes on the server), while ranking tie-breaks use the hunt's `huntInterval`. If the rule is, for example, 5 points between dogs but a 30-minute scoring interval, the model needs two settings. | `ScoreDto.interval`, `HuntEntity.huntInterval`, `DailyScore.addScore`, `DogService.getTopScoringDogsByDay` |
| Q2 | Is endurance 10 % **per day number** (day 3 adds 30 %), or a flat 10 % each day? The code does the former and the tests assert it. | `DogService.calculateTotalPoints`, daily reports |
| Q3 | Should the tie-break favour the **later** last cross (as coded and tested) or the earlier one? | ranking methods in `DogService` |
| Q4 | What should a **scratch** do to scoring? Today it only flags the dog: scratched dogs still take points in later crosses and still appear in standings and reports. Options: block new crosses after the scratch time, keep points earned before it, mark the dog on reports. | `DogService.createScore`, `scratchDog`, reports |
| Q5 | Does a scratch belong to a **day**? The entity has a time but no day, so "scratches on day 2" cannot be answered and a scratch at 09:10 on day 3 is indistinguishable from day 1. | `Entity/Scratch.java`, scratch sheet |
| Q6 | Are hunts always **four days**? The day count is hard-coded in the UI (day selector, endurance per day) and nothing on the hunt records it. | `HuntEntity`, score entry, reports |
| Q7 | Can a cross have more than **seven** dogs? The entry page has seven rows; the server has no limit. | `ScoreEntry.jsx` |
| Q8 | When the hunt's **number ranges** change after dogs are registered, should dog stakes be re-derived? Today they keep the stake they were registered with. | `HuntService.editHunt`, `AddDogs.jsx` |
| Q9 | Should a dog that is **not registered** ever be allowed in a cross? Until now it was silently dropped; it is now rejected (see Fixed F3). If judges legitimately record unknown numbers, the entry page needs a "register on the spot" path instead. | `DogService.createScore` |
| Q10 | How is a day's **start time corrected** after the first cross set it? There is no way today; the field is now read-only once set (Fixed F5). A "change start time" action would have to re-bucket the day's crosses. | `Days`, score entry |

## 3. Fixed in iteration 6 so far

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

## 4. Still to do (defects and rough edges that do not need a rules decision)

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

## 5. User-flow notes (to smooth out)

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
