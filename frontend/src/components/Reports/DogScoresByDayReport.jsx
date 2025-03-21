import React, { useEffect } from 'react';
import DogService from '../../services/DogService';

// Create a separate named component that we can export
export const DaySelector = ({ onChange }) => {
  const [selectedDay, setSelectedDay] = React.useState(1);
    
  // Trigger onChange with initial value when component mounts
  useEffect(() => {
    onChange({ day: selectedDay });
  }, []);
    
  const handleDayChange = (e) => {
    const day = parseInt(e.target.value);
    setSelectedDay(day);
    onChange({ day });
  };
    
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
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
  );
};

// The report definition without the component
const DogScoresByDayReport = {
  title: 'Top Dogs By Day',
  description: 'Shows the 10 highest scoring dogs for a specific day',
  
  // Just store the component name
  configComponent: 'DaySelector',
  
  // Add default config
  defaultConfig: { day: 1 },
  
  // Update the fetchData method
  fetchData: async (config = { day: 1 }) => {
    const { day } = config;
    const topDogs = await DogService.getTop10ScoringDogsByDay(day);
    
    return {
      title: `Top 10 Dogs - Day ${day}`,
      columns: ['Place', 'Score', 'Dog #', 'Name', 'Sire', 'Dam', 'Owner'],
      data: topDogs.map((dog, index) => [
        (index + 1).toString(),
        (dog.totalPoints + Number.parseInt(dog.totalPoints * day * .1)).toString(),
        dog.dogNumber.toString(),
        dog.dogName || '',
        dog.sire || '',
        dog.dam || '',
        dog.owner || ''
      ])
    };
  }
};

export default DogScoresByDayReport;