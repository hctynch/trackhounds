import DogService from '../../services/DogService';

const CustomTopDogsReport = {
  title: 'Custom Top Dogs Report',
  description: 'View top dogs with customizable limit and optional stake filtering',
  
  // Reference component by name
  configComponent: 'CustomLimitSelector',
  
  // Default configuration
  defaultConfig: { limit: 10, stakeType: 'ALL' },
  
  fetchData: async (config = { limit: 10, stakeType: 'ALL' }) => {
    const { limit, stakeType } = config;
    let topDogs;
    
    try {
      if (stakeType === 'ALL') {
        topDogs = await DogService.getTopScoringDogsOverall(limit);
      } else {
        topDogs = await DogService.getTopScoringDogsByStakeType(stakeType, limit);
      }
      
      const stakeLabel = stakeType === 'ALL' ? 'All Dogs' : 
                         stakeType === 'ALL_AGE' ? 'All Age' : 'Derby';
      
      return {
        title: `Top ${limit} Dogs - ${stakeLabel}`,
        columns: ['Place', 'Score', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
        data: topDogs.map((dog, index) => [
          (index + 1).toString(),  // Add place number
          dog.totalPoints.toString(),
          dog.dogNumber.toString(),
          dog.dogName || '',
          dog.sire || '',
          dog.dam || '',
          dog.owner || ''
        ])
      };
    } catch (error) {
      console.error("Error fetching custom top dogs report data:", error);
      return {
        title: `Top ${limit} Dogs${stakeType !== 'ALL' ? ` - ${stakeType}` : ''}`,
        columns: ['Place', 'Score', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
        data: []
      };
    }
  }
};

export default CustomTopDogsReport;