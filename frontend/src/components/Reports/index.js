import DogService from '../../services/DogService';
import DogScoresByDayReport from './DogScoresByDayReport';
import ScratchReport from './ScratchReport';

// Example report: Top Dogs Overall
const TopDogsOverallReport = {
  title: 'Top Dogs Overall',
  description: 'Shows the 10 highest scoring dogs across all days',
  fetchData: async () => {
    try {
      const topDogs = await DogService.getTop10ScoringDogsOverall();
      
      const data = topDogs.map(dog => [
        dog.dogNumber.toString(),
        dog.dogName || '',
        dog.owner || '',
        dog.totalPoints.toString()
      ]);
      
      return {
        columns: ['Dog #', 'Name', 'Owner', 'Points'],
        data: data
      };
    } catch (error) {
      console.error("Error fetching top dogs report data:", error);
      return {
        columns: ['Dog #', 'Name', 'Owner', 'Points'],
        data: []
      };
    }
  }
};

// Group reports by category
const reportGroups = [
  {
    type: 'Daily Reports',
    items: [ScratchReport, DogScoresByDayReport]
  },
  {
    type: 'Total Reports',
    items: [TopDogsOverallReport]
  }
];

export default reportGroups;