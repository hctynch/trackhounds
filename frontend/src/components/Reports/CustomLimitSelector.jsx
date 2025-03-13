import React, { useEffect, useState } from 'react';

export const CustomLimitSelector = ({ onChange, initialLimit = 10 }) => {
  const [limit, setLimit] = useState(initialLimit);
  const [stakeType, setStakeType] = useState('ALL');
  
  // Trigger onChange with initial values when component mounts
  useEffect(() => {
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
    <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-col md:flex-row gap-4">
      <div>
        <label htmlFor="limitSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Number of Dogs:
        </label>
        <input
          id="limitSelect"
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

export default CustomLimitSelector;