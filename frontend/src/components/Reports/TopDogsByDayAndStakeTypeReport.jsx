import React from 'react';
import DogService from '../../services/DogService';

// Combined day and stake type selector component
export const DayAndStakeTypeSelector = ({ onChange }) => {
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [selectedStakeType, setSelectedStakeType] = React.useState('ALL_AGE');
  
  // Trigger onChange with initial values when component mounts
  React.useEffect(() => {
    onChange({ day: selectedDay, stakeType: selectedStakeType });
  }, []);
  
  const handleDayChange = (e) => {
    const day = parseInt(e.target.value);
    setSelectedDay(day);
    onChange({ day, stakeType: selectedStakeType });
  };
  
  const handleStakeTypeChange = (e) => {
    const stakeType = e.target.value;
    setSelectedStakeType(stakeType);
    onChange({ day: selectedDay, stakeType });
  };
  
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-col md:flex-row gap-4">
      <div>
        <label htmlFor="daySelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select Day:
        </label>
        <select
          id="daySelect"
          value={selectedDay}
          onChange={handleDayChange}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>Day 1</option>
          <option value={2}>Day 2</option>
          <option value={3}>Day 3</option>
          <option value={4}>Day 4</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="stakeTypeSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select Stake Type:
        </label>
        <select
          id="stakeTypeSelect"
          value={selectedStakeType}
          onChange={handleStakeTypeChange}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL_AGE">All Age</option>
          <option value="DERBY">Derby</option>
        </select>
      </div>
    </div>
  );
};

const TopDogsByDayAndStakeTypeReport = {
  title: 'Top Dogs By Day & Stake Type',
  description: 'Shows the 10 highest scoring dogs for a specific day and stake type',
  
  // Reference component by name
  configComponent: 'DayAndStakeTypeSelector',
  
  // Default configuration
  defaultConfig: { day: 1, stakeType: 'ALL_AGE' },
  
  fetchData: async (config = { day: 1, stakeType: 'ALL_AGE' }) => {
    const { day, stakeType } = config;
    const topDogs = await DogService.getTop10ScoringDogsByDayAndStakeType(day, stakeType);
    
    return {
      title: `Top 10 ${stakeType === 'ALL_AGE' ? 'All Age' : 'Derby'} Dogs - Day ${day}`,
      columns: ['Place', 'Score', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
      data: topDogs.map((dog, index) => [
        index + 1,
        (dog.totalPoints + Number.parseInt(dog.totalPoints * day * .1)).toString(),
        dog.dogNumber.toString(),
        dog.dogName || '',
        dog.sire,
        dog.dam,
        dog.owner || '',
      ])
    };
  }
};

export default TopDogsByDayAndStakeTypeReport;