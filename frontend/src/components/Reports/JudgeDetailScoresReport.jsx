import React from 'react';
import DogService from '../../services/DogService';

export const JudgeNumberSelector = ({ onChange }) => {
  const [judgeNumber, setJudgeNumber] = React.useState('');
  const [day, setDay] = React.useState('all');
    
  const handleJudgeNumberChange = (e) => {
    const newNumber = e.target.value;
    setJudgeNumber(newNumber);
    if (newNumber) {
      onChange({ judgeNumber: parseInt(newNumber), day: day === 'all' ? null : parseInt(day) });
    }
  };
    
  const handleDayChange = (e) => {
    const newDay = e.target.value;
    setDay(newDay);
    if (judgeNumber) {
      onChange({ judgeNumber: parseInt(judgeNumber), day: newDay === 'all' ? null : parseInt(newDay) });
    }
  };
    
  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4">
      <div>
        <label htmlFor="judgeNumberInput" className="block text-sm font-medium text-gray-700 mb-2">
          Judge Number:
        </label>
        <input
          id="judgeNumberInput"
          type="number"
          min="1"
          value={judgeNumber}
          onChange={handleJudgeNumberChange}
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

const JudgeDetailScoresReport = {
  title: 'Judge Detail Scores',
  description: 'View all scores given by a specific judge, optionally filtered by day',
  
  // Reference component by name
  configComponent: 'JudgeNumberSelector',
  
  fetchData: async (config = {}) => {
    const { judgeNumber, day } = config;
    
    if (!judgeNumber) {
      return {
        title: 'Judge Detail Scores',
        columns: ['Dog #', 'Score', 'Time', 'Judge #', 'Day'],
        data: [] // No judge number provided yet
      };
    }
    
    try {
      let scores;
      if (day) {
        scores = await DogService.getScoresByJudgeNumberAndDay(judgeNumber, day);
      } else {
        scores = await DogService.getScoresByJudgeNumber(judgeNumber);
      }
      
      // Format the scores for display
      const formattedScores = scores.map(score => [
        score.dogNumber.toString(),
        score.points.toString(),
        score.time,
        judgeNumber.toString(),
        score.day.toString()
      ]);
      
      const dayTitle = day ? `Day ${day}` : 'All Days';
      const title = `Scores by Judge #${judgeNumber} - ${dayTitle}`;
      
      return {
        title: title,
        columns: ['Dog #', 'Score', 'Time', 'Judge #', 'Day'],
        data: formattedScores
      };
    } catch (error) {
      console.error("Error fetching judge scores:", error);
      return {
        title: `Scores by Judge #${judgeNumber}`,
        columns: ['Dog #', 'Score', 'Time', 'Judge #', 'Day'],
        data: []
      };
    }
  }
};

export default JudgeDetailScoresReport;