import DogService from '../../services/DogService';

const TopDogsReport = {
  title: 'Top 10 Dogs Overall',
  description: 'Shows the highest scoring dogs across all days',
  
  fetchData: async () => {
    try {
      const topDogs = await DogService.getTop10ScoringDogsOverall();
      
      // Transform data into the expected format
      const data = topDogs.map(dog => [
        dog.dogNumber.toString(),
        dog.dogName,
        dog.owner,
        dog.stake,
        dog.totalPoints.toString()
      ]);
      
      return {
        columns: ['Dog Number', 'Dog Name', 'Owner', 'Stake', 'Total Points'],
        data: data
      };
    } catch (error) {
      console.error("Error fetching top dogs report data:", error);
      return {
        columns: ['Dog Number', 'Dog Name', 'Owner', 'Stake', 'Total Points'],
        data: []
      };
    }
  }
};

export default TopDogsReport;