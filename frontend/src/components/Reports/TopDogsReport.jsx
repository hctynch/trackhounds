import DogService from '../../services/DogService';

const columns = ['Place', 'Score', 'Dog', 'Name', 'Sire', 'Dam', 'Owner'];

const TopDogsReport = {
  title: 'Top ten overall',
  description: 'The ten leading dogs across the whole hunt.',

  fetchData: async () => {
    try {
      const topDogs = await DogService.getTop10ScoringDogsOverall();
      return {
        title: 'Top ten overall',
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
      return { title: 'Top ten overall', columns, data: [] };
    }
  },
};

export default TopDogsReport;
