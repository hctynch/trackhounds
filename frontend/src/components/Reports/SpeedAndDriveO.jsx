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
  configComponent: 'OverallTopDogsLimitSelector',
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
      
      // Extract data for report
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
        data: dogScores.map((dog, index) => {
          // Correctly access the daily scores
          const day1Score = getScoreForDay(dog, 1);
          const day2Score = getScoreForDay(dog, 2);
          const day3Score = getScoreForDay(dog, 3);
          const day4Score = getScoreForDay(dog, 4);
          
          // Calculate total
          const totalSDScore = day1Score + day2Score + day3Score + day4Score;
          
          return [
            (index + 1).toString(),
            totalSDScore.toString(),
            day1Score.toString(),
            day2Score.toString(),
            day3Score.toString(),
            day4Score.toString(),
            dog.dogNumber.toString(),
            dog.dogName || '',
            dog.owner || ''
          ];
        })
      };
    } catch (error) {
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

// Helper function to get the correct score for a specific day
function getScoreForDay(dog, day) {
  // Try different possible property name formats
  const possibleNames = [
    `sdScore${day}`,
    `sd${day}`,
    `s&dScore${day}`,
    `sdScore_${day}`,
    `dailyScore${day}`
  ];
  
  // Find the first property that exists and has a value
  for (const propName of possibleNames) {
    if (dog[propName] !== undefined && dog[propName] !== null) {
      return parseInt(dog[propName]) || 0;
    }
  }
  
  return 0;
}

export default SpeedAndDriveO;