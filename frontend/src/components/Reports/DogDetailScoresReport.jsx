import React from 'react';
import DogService from '../../services/DogService';

export const DogNumberSelector = ({ onChange }) => {
  const [dogNumber, setDogNumber] = React.useState('');
  const [day, setDay] = React.useState('all');
    
  const handleDogNumberChange = (e) => {
    const newNumber = e.target.value;
    setDogNumber(newNumber);
    if (newNumber) {
      onChange({ dogNumber: parseInt(newNumber), day: day === 'all' ? null : parseInt(day) });
    }
  };
    
  const handleDayChange = (e) => {
    const newDay = e.target.value;
    setDay(newDay);
    if (dogNumber) {
      onChange({ dogNumber: parseInt(dogNumber), day: newDay === 'all' ? null : parseInt(newDay) });
    }
  };
    
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4">
      <div>
        <label htmlFor="dogNumberInput" className="block text-sm font-medium text-gray-700 mb-2">
          Dog Number:
        </label>
        <input
          id="dogNumberInput"
          type="number"
          min="1"
          value={dogNumber}
          onChange={handleDogNumberChange}
          className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label htmlFor="daySelect" className="block text-sm font-medium text-gray-700 mb-2">
          Day (Optional):
        </label>
        <select
          id="daySelect"
          value={day}
          onChange={handleDayChange}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Days</option>
          <option value="1">Day 1</option>
          <option value="2">Day 2</option>
          <option value="3">Day 3</option>
          <option value="4">Day 4</option>
        </select>
      </div>
    </div>
  );
};

const DogDetailScoresReport = {
  title: 'Dog Detail Scores',
  description: 'View all scores for a specific dog, optionally filtered by day',
  
  // Reference component by name
  configComponent: 'DogNumberSelector',
  
  fetchData: async (config = {}) => {
    const { dogNumber, day } = config;
    
    if (!dogNumber) {
      return {
        title: 'Dog Detail Scores',
        columns: ['Day', 'Time', 'Judge #', 'Score', 'Counted'],
        data: [] // No dog number provided yet
      };
    }
    
    try {
      // Get dog details first to include in the title
      const dogDetails = await DogService.getDogByNumber(dogNumber);
      
      let scores;
      if (day) {
        scores = await DogService.getScoresByDogNumberAndDay(dogNumber, day);
      } else {
        scores = await DogService.getScoresByDogNumber(dogNumber);
      }
      
      // Format the scores for display
      const formattedScores = scores.map(score => [
        score.day.toString(),
        score.time,
        score.judgeNumber.toString(),
        score.points.toString(),
        score.counted ? <p>&#10003;</p> : ''
      ]);
      
      const dayTitle = day ? `Day ${day}` : 'All Days';
      const title = `Scores for Dog #${dogNumber} (${dogDetails.name || 'Unknown'}) - ${dayTitle}`;
      
      return {
        title: title,
        columns: ['Day', 'Time', 'Judge #', 'Score', 'Counted'],
        data: formattedScores
      };
    } catch (error) {
      console.error("Error fetching dog scores:", error);
      return {
        title: `Scores for Dog #${dogNumber}`,
        columns: ['Day', 'Time', 'Judge #', 'Score', 'Counted'],
        data: []
      };
    }
  }
};

export default DogDetailScoresReport;