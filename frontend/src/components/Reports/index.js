import CustomTopDogsReport from './CustomTopDogsReport';
import DailyCustomTopDogsReport from './DailyCustomTopDogsReport';
import DogScoresByDayReport from './DogScoresByDayReport';
import ScratchReport from './ScratchReport';
import TopDogsByDayAndStakeTypeReport from './TopDogsByDayAndStakeTypeReport';
import TopDogsByStakeTypeReport from './TopDogsByStakeTypeReport';
import TopDogsReport from './TopDogsReport';

// Group reports by category
const reportGroups = [
  {
    type: 'Daily Reports',
    items: [DogScoresByDayReport, TopDogsByDayAndStakeTypeReport, DailyCustomTopDogsReport]
  },
  {
    type: 'Total Reports',
    items: [TopDogsReport, ScratchReport, TopDogsByStakeTypeReport, CustomTopDogsReport]
  }
];

export default reportGroups;