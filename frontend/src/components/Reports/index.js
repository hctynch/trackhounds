import DogScoresByDayReport from './DogScoresByDayReport';
import ScratchReport from './ScratchReport';
import TopDogsReport from './TopDogsReport';

// Group reports by category
const reportGroups = [
  {
    type: 'Daily Reports',
    items: [ScratchReport, DogScoresByDayReport]
  },
  {
    type: 'Total Reports',
    items: [TopDogsReport]
  }
];

export default reportGroups;