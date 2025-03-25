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
      let dogScores;
      
      // Get dog scores based on stake type
      if (stakeType === 'ALL') {
        dogScores = await DogService.getTopScoringDogsOverall(limit);
      } else {
        dogScores = await DogService.getTopScoringDogsByStakeType(stakeType, limit);
      }
      
      // Extract data for report - the backend now includes s&dScore1, s&dScore2, etc.
      const stakeLabel = stakeType === 'ALL' ? 'All Dogs' : 
                         stakeType === 'ALL_AGE' ? 'All Age' : 'Derby';
      
      // Create table with daily S&D breakdown
      return {
        title: `Overall Speed & Drive Rankings - ${stakeLabel}`,
        columns: [
          'Place', 
          'Total S&D',
          'S&D Day 1',
          'S&D Day 2',
          'S&D Day 3',
          'S&D Day 4', 
          'Dog #', 
          'Name', 
          'Owner'
        ],
        data: dogScores.map((dog, index) => [
          (index + 1).toString(),
          // Use the raw S&D total (sum of daily S&D scores)
          calculateTotalSD(dog).toString(),
          // Show individual day scores (or 0 if not available)
          (dog["s&dScore1"] || 0).toString(),
          (dog["s&dScore2"] || 0).toString(),
          (dog["s&dScore3"] || 0).toString(),
          (dog["s&dScore4"] || 0).toString(),
          dog.dogNumber.toString(),
          dog.dogName || '',
          dog.owner || ''
        ])
      };
    } catch (error) {
      console.error("Error fetching overall dog scores:", error);
      // Handle errors gracefully
      return {
        title: `Overall Speed & Drive Rankings${stakeType !== 'ALL' ? ` - ${stakeType === 'ALL_AGE' ? 'All Age' : 'Derby'}` : ''}`,
        columns: [
          'Place', 
          'Total S&D',
          'S&D Day 1',
          'S&D Day 2',
          'S&D Day 3',
          'S&D Day 4', 
          'Dog #', 
          'Name', 
          'Owner'
        ],
        data: []
      };
    }
  }
};

// Calculate total S&D score from the daily scores
function calculateTotalSD(dog) {
  let total = 0;
  for (let i = 1; i <= 4; i++) {
    const dayScore = dog[`s&dScore${i}`];
    if (dayScore) {
      total += dayScore;
    }
  }
  return total;
}

export default SpeedAndDriveO;