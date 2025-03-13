import CustomTopDogsReport from './CustomTopDogsReport';
import DailyCustomTopDogsReport from './DailyCustomTopDogsReport';
import DogDetailScoresReport from './DogDetailScoresReport';
import DogScoresByDayReport from './DogScoresByDayReport';
import JudgeDetailScoresReport from './JudgeDetailScoresReport';
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
    items: [TopDogsReport, TopDogsByStakeTypeReport, CustomTopDogsReport, ScratchReport]
  },
  {
    type: 'Detail Reports',
    items: [DogDetailScoresReport, JudgeDetailScoresReport]
  }
];

export default reportGroups;