import ReportService from '../../services/ReportService';
import { STAKE_LABELS } from '../ui';
import { dogLabel } from './format';

const stakeLabel = (stake) => STAKE_LABELS[stake] || String(stake || '');

/**
 * The one-page front sheet for the hunt's paperwork: settings, how many dogs and judges took part,
 * what happened each day, the top placings per stake, and the scratches.
 */
const HuntSummaryReport = {
  title: 'Hunt summary',
  description: 'One page with the hunt settings, entries, each day at a glance, the top placings and the scratches.',

  fetchData: async () => {
    const title = 'Hunt summary';
    try {
      const summary = await ReportService.getHuntSummary();
      if (!summary || !summary.hunt) return { title, data: [] };
      const { hunt, counts = {}, days = [], placings = [], scratches = [] } = summary;
      const dual = hunt.stake === 'DUAL';

      const facts = [
        { label: 'Hunt', value: hunt.title },
        { label: 'Dates', value: hunt.dates },
        { label: 'Stake', value: stakeLabel(hunt.stake) },
        { label: 'Days', value: hunt.huntDays },
        { label: 'Scoring interval', value: `${hunt.huntInterval} min` },
        { label: 'Points', value: `${hunt.firstDogPoints} for the first dog, ${hunt.pointStep} less each` },
        { label: 'Dogs entered', value: dual ? `${counts.dogs} (${counts.allAgeDogs} all age, ${counts.derbyDogs} derby)` : counts.dogs },
        { label: 'Judges', value: counts.judges },
        { label: 'Crosses recorded', value: `${counts.crosses} (${counts.scores} dog placings)` },
      ];

      const placingsFor = (stake) =>
        placings
          .filter((row) => row.stake === stake)
          .map((row) => [String(row.place), String(row.dogNumber), dogLabel(row), row.owner || '', String(row.totalPoints)]);
      const placingColumns = ['Place', 'Dog', 'Name', 'Owner', 'Total points'];
      const placingSections = dual
        ? [
            { title: 'All age placings', columns: placingColumns, data: placingsFor('ALL_AGE'), emptyText: 'No all age dog has scored yet.' },
            { title: 'Derby placings', columns: placingColumns, data: placingsFor('DERBY'), emptyText: 'No derby dog has scored yet.' },
          ]
        : [{ title: 'Placings', columns: placingColumns, data: placingsFor(hunt.stake), emptyText: 'No dog has scored yet.' }];

      return {
        title,
        facts,
        sections: [
          {
            title: 'Each day',
            columns: ['Day', 'Start time', 'Crosses', 'Dog placings', 'Dogs scored', 'Scratches'],
            data: days.map((day) => [
              String(day.day),
              day.startTime || 'not started',
              String(day.crosses),
              String(day.scores),
              String(day.dogsScored),
              String(day.scratches),
            ]),
          },
          ...placingSections,
          {
            title: `Scratches (${scratches.length})`,
            columns: ['Day', 'Dog', 'Name', 'Time', 'Judge', 'Reason'],
            data: scratches.map((row) => [String(row.day), String(row.dogNumber), row.dogName || '', row.time || '', String(row.judgeNumber ?? ''), row.reason || '']),
            emptyText: 'No dog was scratched.',
          },
        ],
        data: [],
      };
    } catch (error) {
      console.error('Error fetching hunt summary:', error);
      return { title, data: [] };
    }
  },
};

export default HuntSummaryReport;
