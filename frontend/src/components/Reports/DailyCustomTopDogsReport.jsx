import React from 'react';
import DogService from '../../services/DogService';

export const DailyCustomLimitSelector = ({ onChange }) => {
  const [day, setDay] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [stakeType, setStakeType] = React.useState('ALL');
  
  // Trigger onChange with initial values when component mounts
  React.useEffect(() => {
    onChange({ day, limit, stakeType });
  }, []);
  
  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value);
    setDay(newDay);
    onChange({ day: newDay, limit, stakeType });
  };
  
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    onChange({ day, limit: newLimit, stakeType });
  };
  
  const handleStakeTypeChange = (e) => {
    const newStakeType = e.target.value;
    setStakeType(newStakeType);
    onChange({ day, limit, stakeType: newStakeType });
  };
  
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4">
      <div>
        <label htmlFor="daySelect" className="block text-sm font-medium text-gray-700 mb-2">
          Day:
        </label>
        <select
          id="daySelect"
          value={day}
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
        <label htmlFor="limitInput" className="block text-sm font-medium text-gray-700 mb-2">
          Number of Dogs:
        </label>
        <input
          id="limitInput"
          type="number"
          min="1"
          value={limit}
          onChange={handleLimitChange}
          className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="stakeTypeSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Stake Type (Optional):
        </label>
        <select
          id="stakeTypeSelect"
          value={stakeType}
          onChange={handleStakeTypeChange}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL">All Dogs</option>
          <option value="ALL_AGE">All Age</option>
          <option value="DERBY">Derby</option>
        </select>
      </div>
    </div>
  );
};

const DailyCustomTopDogsReport = {
  title: 'Custom Daily Top Dogs Report',
  description: 'View top dogs for a specific day with customizable limit and optional stake filtering',
  
  // Reference component by name
  configComponent: 'DailyCustomLimitSelector',
  
  // Default configuration
  defaultConfig: { day: 1, limit: 10, stakeType: 'ALL' },
  
  fetchData: async (config = { day: 1, limit: 10, stakeType: 'ALL' }) => {
    const { day, limit, stakeType } = config;
    let topDogs;
    
    try {
      if (stakeType === 'ALL') {
        topDogs = await DogService.getTopScoringDogsByDay(day, limit);
      } else {
        topDogs = await DogService.getTopScoringDogsByDayAndStakeType(day, stakeType, limit);
      }
      
      const stakeLabel = stakeType === 'ALL' ? 'All Dogs' : 
                        stakeType === 'ALL_AGE' ? 'All Age' : 'Derby';
      
      return {
        title: `Day ${day}: Top ${limit} Dogs - ${stakeLabel}`,
        columns: ['Place', 'Total', 'S&D', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
        data: topDogs.map((dog, index) => [
          (index + 1).toString(),
          (dog.totalPoints + Number.parseInt(dog.totalPoints * day * .1)).toString(),
          dog.totalPoints.toString(),
          dog.dogNumber.toString(),
          dog.dogName || '',
          dog.sire || '',
          dog.dam || '',
          dog.owner || ''
        ])
      };
    } catch (error) {
      console.error("Error fetching daily custom top dogs report data:", error);
      return {
        title: `Day ${day}: Top ${limit} Dogs${stakeType !== 'ALL' ? ` - ${stakeType}` : ''}`,
        columns: ['Place', 'Total', 'S&D', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
        data: []
      };
    }
  }
};

export default DailyCustomTopDogsReport;