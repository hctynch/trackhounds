import DogService from '../../services/DogService';

const columns = ['Place', 'Score', 'Dog', 'Name', 'Sire', 'Dam', 'Owner'];

const CustomTopDogsReport = {
  title: 'Top dogs overall',
  description: 'The leading dogs across the whole hunt, for any number of places and stake.',
  configComponent: 'CustomLimitSelector',
  defaultConfig: { limit: 10, stakeType: 'ALL' },

  fetchData: async (config = { limit: 10, stakeType: 'ALL' }) => {
    const { limit, stakeType } = config;
    const stakeLabel = stakeType === 'ALL' ? 'all dogs' : stakeType === 'ALL_AGE' ? 'all age' : 'derby';
    const title = `Top ${limit} overall, ${stakeLabel}`;
    try {
      const topDogs = stakeType === 'ALL' ? await DogService.getTopScoringDogsOverall(limit) : await DogService.getTopScoringDogsByStakeType(stakeType, limit);
      return {
        title,
        columns,
        data: (Array.isArray(topDogs) ? topDogs : []).map((dog, index) => [
          (index + 1).toString(),
          dog.totalPoints.toString(),
          dog.dogNumber.toString(),
          dog.dogName || '',
          dog.sire || '',
          dog.dam || '',
          dog.owner || '',
        ]),
      };
    } catch (error) {
      console.error('Error fetching top dogs report data:', error);
      return { title, columns, data: [] };
    }
  },
};

export default CustomTopDogsReport;
