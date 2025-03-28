import ComprehensiveDogScoresReport from './ComprehensiveDogScoresReport';
import CustomTopDogsReport from './CustomTopDogsReport';
import DailyCustomTopDogsReport from './DailyCustomTopDogsReport';
import DogDetailScoresReport from './DogDetailScoresReport';
import JudgeDetailScoresReport from './JudgeDetailScoresReport';
import ScratchReport from './ScratchReport';
import SpeedAndDriveD from './SpeedAndDriveD';
import SpeedAndDriveO from './SpeedAndDriveO';

// Group reports by category
const reportGroups = [
  {
    type: 'Daily Reports',
    items: [DailyCustomTopDogsReport, SpeedAndDriveD]
  },
  {
    type: 'Total Reports',
    items: [CustomTopDogsReport, ScratchReport, ComprehensiveDogScoresReport, SpeedAndDriveO]
  },
  {
    type: 'Detail Reports',
    items: [DogDetailScoresReport, JudgeDetailScoresReport]
  }
];

export default reportGroups;