import { ASK } from '../../lib/reports';

/**
 * The built-in sheets, as definitions over the report datasets. Each can be opened in the builder
 * ("Customise") as the starting point of a custom sheet. A column with `auto` is shown only when a
 * dual hunt is printed with both stakes; a key ending in "*" expands to every day of the hunt.
 */
const define = (id, group, definition) => ({ id, group, builtin: true, description: '', ...definition });

const builtinReports = [
  define('daily-speed-and-drive', 'Daily', {
    name: 'Daily speed and drive',
    description: 'Speed and drive rankings for one day, the sheet posted at the end of each day.',
    dataset: 'dogs',
    columns: [
      { key: 'place' },
      { key: 'daySpeedAndDrive', label: 'Score' },
      { key: 'number' },
      { key: 'name' },
      { key: 'stake', auto: true },
      { key: 'sire' },
      { key: 'dam' },
      { key: 'owner' },
    ],
    filters: { day: ASK, stake: ASK, limit: ASK, includeScratched: true, scoredOnly: true, splitByStake: false },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Day {dayNumber} speed and drive, {stake}',
  }),
  define('daily-top-dogs', 'Daily', {
    name: 'Daily top dogs',
    description: 'The leading dogs on one day, with endurance added, for any number of places and stake.',
    dataset: 'dogs',
    columns: [
      { key: 'place' },
      { key: 'dayTotal', label: 'Total' },
      { key: 'daySpeedAndDrive', label: 'S&D' },
      { key: 'number' },
      { key: 'name' },
      { key: 'stake', auto: true },
      { key: 'sire' },
      { key: 'dam' },
      { key: 'owner' },
    ],
    filters: { day: ASK, stake: ASK, limit: ASK, includeScratched: true, scoredOnly: true, splitByStake: false },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Day {dayNumber} top {limit}, {stake}',
  }),
  define('overall-speed-and-drive', 'Whole hunt', {
    name: 'Overall speed and drive',
    description: 'Speed and drive totals across the hunt with the daily breakdown, the final sheet.',
    dataset: 'dogs',
    columns: [
      { key: 'place' },
      { key: 'speedAndDrive', label: 'Total S&D' },
      { key: 'sdDay*' },
      { key: 'number' },
      { key: 'name' },
      { key: 'stake', auto: true },
      { key: 'owner' },
    ],
    filters: { day: null, stake: ASK, limit: ASK, includeScratched: true, scoredOnly: false, splitByStake: false },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Overall speed and drive, {stake}',
  }),
  define('top-dogs-overall', 'Whole hunt', {
    name: 'Top dogs overall',
    description: 'The leading dogs across the whole hunt, for any number of places and stake.',
    dataset: 'dogs',
    columns: [
      { key: 'place' },
      { key: 'total', label: 'Score' },
      { key: 'number' },
      { key: 'name' },
      { key: 'stake', auto: true },
      { key: 'sire' },
      { key: 'dam' },
      { key: 'owner' },
    ],
    filters: { day: null, stake: ASK, limit: ASK, includeScratched: true, scoredOnly: false, splitByStake: false },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Top {limit} overall, {stake}',
  }),
  define('all-dogs-all-days', 'Whole hunt', {
    name: 'All dogs, all days',
    description: 'Speed and drive and endurance for every dog on every day, in dog number order.',
    dataset: 'dogs',
    columns: [{ key: 'number' }, { key: 'sdDay*' }, { key: 'enduranceDay*' }, { key: 'total', bold: true }],
    filters: { day: null, stake: 'ALL', limit: null, includeScratched: true, scoredOnly: false, splitByStake: false },
    sort: { key: 'number', direction: 'asc' },
    title: 'All dogs, all days',
  }),
  define('scratches', 'Whole hunt', {
    name: 'Scratches',
    description: 'Every dog withdrawn from the hunt, with the judge and reason.',
    dataset: 'scratches',
    columns: [{ key: 'day' }, { key: 'dogNumber' }, { key: 'dogName' }, { key: 'time' }, { key: 'judgeNumber' }, { key: 'reason' }],
    filters: { day: null, stake: 'ALL', limit: null, judgeNumber: null, splitByStake: false },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Scratches',
  }),
  define('judge-summary', 'Whole hunt', {
    name: 'Judge summary',
    description: 'Crosses and dogs scored by every judge, per day, with the scratches they recorded.',
    dataset: 'judges',
    columns: [{ key: 'number' }, { key: 'name' }, { key: 'crossesDay*' }, { key: 'totalCrosses' }, { key: 'totalScores' }, { key: 'scratches' }],
    filters: { day: null, stake: 'ALL', limit: null },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Judge summary',
  }),
  define('scores-for-one-dog', 'Details', {
    name: 'Scores for one dog',
    description: 'Every cross recorded for a dog, and whether it counted, optionally for a single day.',
    dataset: 'scores',
    columns: [{ key: 'day' }, { key: 'time' }, { key: 'judgeNumber' }, { key: 'points' }, { key: 'counted' }],
    filters: { day: ASK, dayAllowAll: true, stake: 'ALL', limit: null, dogNumber: ASK, judgeNumber: null, splitByStake: false },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Dog {dogNumber}, {day}',
  }),
  define('scores-by-one-judge', 'Details', {
    name: 'Scores by one judge',
    description: 'Every cross a judge recorded, optionally for a single day.',
    dataset: 'scores',
    columns: [{ key: 'day' }, { key: 'time' }, { key: 'dogNumber' }, { key: 'dogName' }, { key: 'points' }, { key: 'counted' }],
    filters: { day: ASK, dayAllowAll: true, stake: 'ALL', limit: null, dogNumber: null, judgeNumber: ASK, splitByStake: false },
    sort: { key: 'rank', direction: 'asc' },
    title: 'Judge {judgeNumber}, {day}',
  }),
];

export default builtinReports;
