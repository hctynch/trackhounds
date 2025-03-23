import React from 'react';
import DogService from '../../services/DogService';

export const OverallTopDogsLimitSelector = ({ onChange }) => {
  const [limit, setLimit] = React.useState(10);
  const [stakeType, setStakeType] = React.useState('ALL');
  
  // Initialize with default values
  React.useEffect(() => {
    onChange({ limit, stakeType });
  }, []);
  
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    onChange({ limit: newLimit, stakeType });
  };
  
  const handleStakeTypeChange = (e) => {
    const newStakeType = e.target.value;
    setStakeType(newStakeType);
    onChange({ limit, stakeType: newStakeType });
  };
  
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4">
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

const SpeedAndDriveO = {
  title: 'Overall Speed & Drive Report',
  description: 'View top dogs ranked by total Speed & Drive points across all days',
  
  // Change configSelector to configComponent to match the pattern in Reports.jsx
  configComponent: 'OverallTopDogsLimitSelector',
  
  // Default configuration
  defaultConfig: { limit: 10, stakeType: 'ALL' },
  
  fetchData: async (config = { limit: 10, stakeType: 'ALL' }) => {
    const { limit, stakeType } = config;
    
    try {
      // Get all dogs from the system - we'll calculate totals manually
      const allDogs = await DogService.getDogs();
      
      // Create a map to organize scores by dog
      const dogScoresMap = {};
      
      // Initialize dogs in the map
      allDogs.forEach(dog => {
        if (stakeType === 'ALL' || dog.stake === stakeType) {
          dogScoresMap[dog.number] = {
            dogNumber: dog.number,
            dogName: dog.name,
            sire: dog.sire || '',
            dam: dog.dam || '',
            owner: dog.owner || '',
            stake: dog.stake,
            dailyScores: {
              day1: 0,
              day2: 0,
              day3: 0,
              day4: 0
            },
            totalPoints: 0
          };
        }
      });
      
      // Get scores for each day and populate the map
      for (let day = 1; day <= 4; day++) {
        // Get scores for this day
        const dailyScores = await DogService.getDogScoresByDay(day);
        
        // Add scores to the dog map
        dailyScores.forEach(score => {
          const dogNumber = score.dogNumber;
          
          // Only process if this dog is in our filtered map
          if (dogScoresMap[dogNumber]) {
            // Get just the raw S&D points without endurance
            const sdPoints = score.totalPoints || 0;
            
            // Add to daily scores
            dogScoresMap[dogNumber].dailyScores[`day${day}`] = sdPoints;
            
            // Update total
            dogScoresMap[dogNumber].totalPoints += sdPoints;
          }
        });
      }
      
      // Convert to array and sort by total points
      const sortedDogs = Object.values(dogScoresMap)
        .filter(dog => dog.totalPoints > 0) // Only include dogs with scores
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit); // Limit to requested number
      
      const stakeLabel = stakeType === 'ALL' ? 'All Dogs' : 
                         stakeType === 'ALL_AGE' ? 'All Age' : 'Derby';
      
      return {
        title: `Overall Speed & Drive Rankings - ${stakeLabel}`,
        columns: [
          'Place', 
          'Total S&D', 
          'Dog #', 
          'Name', 
          'Sire', 
          'Dam', 
          'Owner'
        ],
        data: sortedDogs.map((dog, index) => [
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
        title: `Overall Speed & Drive Rankings${stakeType !== 'ALL' ? ` - ${stakeType === 'ALL_AGE' ? 'All Age' : 'Derby'}` : ''}`,
        columns: [
          'Place', 
          'Total S&D', 
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

export default SpeedAndDriveO;