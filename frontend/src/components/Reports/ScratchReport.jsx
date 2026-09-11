import DogService from '../../services/DogService';

const columns = ['Day', 'Dog', 'Name', 'Time', 'Judge', 'Reason'];

const ScratchReport = {
  title: 'Scratches',
  description: 'Every dog withdrawn from the hunt, with the judge and reason.',

  fetchData: async () => {
    try {
      const scratches = await DogService.getScratches();
      return {
        title: 'Scratches',
        columns,
        data: (Array.isArray(scratches) ? scratches : []).map((scratch) => [
          String(scratch.day ?? 1),
          scratch.dogNumber.toString(),
          scratch.dogName || '',
          scratch.time || '',
          scratch.judgeNumber?.toString() || '',
          scratch.reason || '',
        ]),
      };
    } catch (error) {
      console.error('Error fetching scratch report data:', error);
      return { title: 'Scratches', columns, data: [] };
    }
  },
};

export default ScratchReport;
