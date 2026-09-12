import ComprehensiveDogScoresReport from './ComprehensiveDogScoresReport';
import CustomTopDogsReport from './CustomTopDogsReport';
import DailyCustomTopDogsReport from './DailyCustomTopDogsReport';
import DogDetailScoresReport from './DogDetailScoresReport';
import HuntSummaryReport from './HuntSummaryReport';
import JudgeDetailScoresReport from './JudgeDetailScoresReport';
import JudgeSummaryReport from './JudgeSummaryReport';
import ScratchReport from './ScratchReport';
import SpeedAndDriveD from './SpeedAndDriveD';
import SpeedAndDriveO from './SpeedAndDriveO';

// Stable ids make every report addressable at /reports/<id>.
const withId = (report) => ({ ...report, id: report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });

// Reports grouped the way they are used: during the hunt, at the end, and for checking details.
const reportGroups = [
  {
    type: 'Daily',
    items: [SpeedAndDriveD, DailyCustomTopDogsReport].map(withId),
  },
  {
    type: 'Whole hunt',
    items: [HuntSummaryReport, SpeedAndDriveO, CustomTopDogsReport, ComprehensiveDogScoresReport, ScratchReport, JudgeSummaryReport].map(withId),
  },
  {
    type: 'Details',
    items: [DogDetailScoresReport, JudgeDetailScoresReport].map(withId),
  },
];

export const allReports = reportGroups.flatMap((group) => group.items);

export default reportGroups;
