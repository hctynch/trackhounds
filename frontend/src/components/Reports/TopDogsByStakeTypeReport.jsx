import React from 'react';
import DogService from '../../services/DogService';

export const StakeTypeSelector = ({ onChange }) => {
  const [selectedStakeType, setSelectedStakeType] = React.useState('ALL_AGE');
    
  // Trigger onChange with initial value when component mounts
  React.useEffect(() => {
    onChange({ stakeType: selectedStakeType });
  }, []);
    
  const handleStakeTypeChange = (e) => {
    const stakeType = e.target.value;
    setSelectedStakeType(stakeType);
    onChange({ stakeType });
  };
    
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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
  );
};

const TopDogsByStakeTypeReport = {
  title: 'Top Dogs By Stake Type',
  description: 'Shows the 10 highest scoring dogs for a specific stake type',
  
  // Reference component by name
  configComponent: 'StakeTypeSelector',
  
  // Default configuration
  defaultConfig: { stakeType: 'ALL_AGE' },
  
  // Update the fetchData method
  fetchData: async (config = { stakeType: 'ALL_AGE' }) => {
    const { stakeType } = config;
    const topDogs = await DogService.getTop10ScoringDogsByStakeType(stakeType);
    
    return {
      title: `Top 10 Dogs - ${stakeType === 'ALL_AGE' ? 'All Age' : 'Derby'}`,
      columns: ['Place', 'Score', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
      data: topDogs.map((dog, index) => [
        (index + 1).toString(),
        dog.totalPoints.toString(),
        dog.dogNumber.toString(),
        dog.dogName || '',
        dog.sire || '',
        dog.dam || '',
        dog.owner || ''
      ])
    };
  }
};

export default TopDogsByStakeTypeReport;