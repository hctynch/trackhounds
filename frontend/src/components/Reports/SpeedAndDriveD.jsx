import React from 'react';
import DogService from '../../services/DogService';

export const DailySpeedAndDriveLimitSelector = ({ onChange }) => {
  const [limit, setLimit] = React.useState(10);
  const [stakeType, setStakeType] = React.useState('ALL');
  const [day, setDay] = React.useState(1);
  
  // Initialize with default values
  React.useEffect(() => {
    onChange({ limit, stakeType, day });
  }, []);
  
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    onChange({ limit: newLimit, stakeType, day });
  };
  
  const handleStakeTypeChange = (e) => {
    const newStakeType = e.target.value;
    setStakeType(newStakeType);
    onChange({ limit, stakeType: newStakeType, day });
  };
  
  const handleDayChange = (e) => {
    const newDay = parseInt(e.target.value);
    setDay(newDay);
    onChange({ limit, stakeType, day: newDay });
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
          max="100"
          value={limit}
          onChange={handleLimitChange}
          className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="stakeTypeSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Stake Type:
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

const SpeedAndDriveD = {
  title: 'Daily Speed & Drive Report',
  description: 'View top dogs ranked by Speed & Drive points for a specific day',
  
  // Match the pattern in Reports.jsx
  configComponent: 'DailySpeedAndDriveLimitSelector',
  
  // Default configuration
  defaultConfig: { limit: 10, stakeType: 'ALL', day: 1 },
  
  fetchData: async (config = { limit: 10, stakeType: 'ALL', day: 1 }) => {
    const { limit, stakeType, day } = config;
    
    try {
      let dogScores;
      
      // Use the appropriate backend method based on stake type
      if (stakeType === 'ALL') {
        // For all dogs, get top scoring dogs for the day
        dogScores = await DogService.getTopScoringDogsByDay(day, limit);
      } else {
        // For specific stake type, get filtered results
        dogScores = await DogService.getTopScoringDogsByDayAndStakeType(day, stakeType, limit);
      }
      
      // The backend already sorts the dogs correctly, so we can just map the results
      const stakeLabel = stakeType === 'ALL' ? 'All Dogs' : 
                         stakeType === 'ALL_AGE' ? 'All Age' : 'Derby';
      
      return {
        title: `Day ${day} Speed & Drive Rankings - ${stakeLabel}`,
        columns: [
          'Place', 
          'Score', 
          'Dog #', 
          'Name', 
          'Sire', 
          'Dam', 
          'Owner'
        ],
        data: dogScores.map((dog, index) => [
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
      // Handle errors gracefully
      return {
        title: `Day ${day} Speed & Drive Rankings${stakeType !== 'ALL' ? ` - ${stakeType === 'ALL_AGE' ? 'All Age' : 'Derby'}` : ''}`,
        columns: [
          'Place', 
          'Score', 
          'Dog #', 
          'Name', 
          'Sire', 
          'Dam', 
          'Owner'
        ],
        data: []
      };
    }
  }
};

export default SpeedAndDriveD;