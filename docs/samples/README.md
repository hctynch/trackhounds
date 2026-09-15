# Sample data for testing

Files here are for trying TrackHounds with realistic data. Nothing in the application depends on them.

| File                    | What it is                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sample-hunt.db`        | A complete hunt file: "Piedmont Spring Trial", a dual-stake hunt with 12 dogs (8 all age, 101 to 115 derby), 3 judges, 58 placings over 4 days, and 2 scratches (115 on day 1, 23 on day 4). |
| `club-daily-sheet.json` | A saved report layout for the report builder: day placings with owner and stake, top 15, asking for the day and stake when opened.                    |

## Loading the hunt

The file is the same kind of file the Backups page writes, so it loads the same way:

1. Open TrackHounds → **Backups** → **Import a hunt file** and pick `sample-hunt.db`. It appears under **Past hunts**.
2. Press **Open** on it. The hunt you had open, if any, is saved to past hunts first.

Or restore it directly with **Choose a file to restore** on the same page (a safety copy of the current data is taken first).

## Loading the report layout

Copy `club-daily-sheet.json` into the `reports` folder inside the data folder (`%LOCALAPPDATA%\TrackHounds\reports\`, created when the first custom report is saved) and reopen Reports. It shows under **Custom reports**.

## Remaking the sample

The hunt was created through the API against an empty data folder with `scratchpad`-style curl calls (create hunt, judges, dogs, crosses, scratches) and then saved with `POST /data/hunts`, so it carries the current schema. Any backup written by the Backups page can replace it.
