import DogService from '../../services/DogService';

const TopDogsReport = {
  title: 'Top 10 Dogs Overall',
  description: 'Shows the highest scoring dogs across all days',
  
  fetchData: async () => {
    try {
      const topDogs = await DogService.getTop10ScoringDogsOverall();
      
      return {
        title: 'Top 10 Dogs Overall',
        columns: ['Place', 'Score', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
        data: topDogs.map((dog, index) => [
          (index + 1).toString(),
          dog.totalPoints.toString(),
          dog.dogNumber.toString(),
          dog.dogName || '',
          dog.sire || '',
          dog.dam || '',
          dog.owner || ''
        ])
      };
    } catch (error) {
      console.error("Error fetching top dogs report data:", error);
      return {
        columns: ['Place', 'Score', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
        data: []
      };
    }
  }
};

export default TopDogsReport;