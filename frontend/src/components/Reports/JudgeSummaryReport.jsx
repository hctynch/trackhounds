import HuntService from '../../services/HuntService';
import ReportService from '../../services/ReportService';
import { huntDays } from '../../lib/hunt';

/**
 * One row per judge: how many crosses they recorded each day (a cross is one entry at one time),
 * how many dog placings those crosses contained, and the scratches they recorded.
 */
const JudgeSummaryReport = {
  title: 'Judge summary',
  description: 'Crosses and dogs scored by every judge, per day, with the scratches they recorded.',

  fetchData: async () => {
    const title = 'Judge summary';
    try {
      const [hunt, rows] = await Promise.all([HuntService.getHunt(), ReportService.getJudgeSummary()]);
      const days = huntDays(hunt instanceof Error ? null : hunt);
      const columns = ['Judge', 'Name', ...days.map((day) => `Day ${day}`), 'Crosses', 'Dogs scored', 'Scratches'];
      return {
        title,
        columns,
        data: (Array.isArray(rows) ? rows : []).map((row) => [
          String(row.judgeNumber),
          row.judgeName || '',
          ...days.map((day) => String(row.crossesByDay?.[String(day)] ?? 0)),
          String(row.totalCrosses ?? 0),
          String(row.totalScores ?? 0),
          String(row.scratches ?? 0),
        ]),
      };
    } catch (error) {
      console.error('Error fetching judge summary:', error);
      return { title, columns: ['Judge', 'Name'], data: [] };
    }
  },
};

export default JudgeSummaryReport;
