import DogService from '../../services/DogService';

// Use the same DaySelector as the other reports, so we don't need to redefine it here
// We'll just import it from DogScoresByDayReport when used

const ScratchReport = {
  title: 'Dog Scratches Report',
  description: 'Shows all scratched dogs for a specific day',
  
  // Reference the day selector component
  configComponent: 'DaySelector',
  
  // Add default config
  defaultConfig: { day: 1 },
  
  fetchData: async (config = { day: 1 }) => {
    try {
      // For now, get all scratches since the backend doesn't filter by day yet
      const scratches = await DogService.getScratches();
      
      // TODO: When backend support is added, replace with:
      // const scratches = await DogService.getScratchesByDay(config.day);
      
      // For now, we'll just show all scratches but with the day-specific title
      const data = scratches.map(scratch => [
        scratch.dogNumber.toString(),
        scratch.dogName || 'Unknown',
        scratch.time || '',
        scratch.judgeNumber?.toString() || '',
        scratch.reason || 'No reason provided'
      ]);
      
      return {
        title: `Dog Scratches - Day ${config.day}`,
        columns: ['Dog #', 'Dog Name', 'Time', 'Judge #', 'Reason'],
        data: data
      };
    } catch (error) {
      console.error("Error fetching scratch report data:", error);
      return {
        title: `Dog Scratches - Day ${config.day}`,
        columns: ['Dog #', 'Dog Name', 'Time', 'Judge #', 'Reason'],
        data: []
      };
    }
  }
};

export default ScratchReport;