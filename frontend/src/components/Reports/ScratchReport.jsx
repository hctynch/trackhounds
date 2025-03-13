import DogService from '../../services/DogService';

const ScratchReport = {
  title: 'Dog Scratches Report',
  description: 'Shows all scratched dogs',
  
  fetchData: async () => {
    try {
      // Get all scratches
      const scratches = await DogService.getScratches();
      
      const data = scratches.map(scratch => [
        scratch.dogNumber.toString(),
        scratch.dogName || 'Unknown',
        scratch.time || '',
        scratch.judgeNumber?.toString() || '',
        scratch.reason || 'No reason provided'
      ]);
      
      return {
        title: 'Scratch Report',
        columns: ['Dog #', 'Dog Name', 'Time', 'Judge #', 'Reason'],
        data: data
      };
    } catch (error) {
      console.error("Error fetching scratch report data:", error);
      return {
        title: 'Scratch Report',
        columns: ['Dog #', 'Dog Name', 'Time', 'Judge #', 'Reason'],
        data: []
      };
    }
  }
};

export default ScratchReport;