import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaCheck } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import DogService from "../services/DogService";
import HuntService from "../services/HuntService";
import Box from "./Box";

function ScoreEntry() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [dogs, setDogs] = useState(Array(7).fill(''));
  const [customPoints, setCustomPoints] = useState(Array(7).fill(null));
  const [startingPoints, setStartingPoints] = useState(35);
  const [interval, setInterval] = useState(5);
  const [startTime, setStartTime] = useState('');
  const [judge, setJudge] = useState('');
  const [crossTime, setCrossTime] = useState('');
  const [error, setError] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const inputRefs = useRef({});
  
  useEffect(() => {
    const fetchStartTime = async () => {
      const startTime = await DogService.getStartTime(selectedDay);
      if (startTime instanceof Error) {
        setError(prev => ({...prev, startTime: startTime.response?.data?.fields?.startTime}));
        setStartTime('');
      } else {
        setStartTime(startTime);
      }
    };
    fetchStartTime();
  }, [selectedDay]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDogChange = (index, value) => {
    const newDogs = [...dogs];
    newDogs[index] = value;
    setDogs(newDogs);
  };

  const handleCustomPointsChange = (index, value) => {
    const newCustomPoints = [...customPoints];
    newCustomPoints[index] = value === '' ? null : Number(value);
    setCustomPoints(newCustomPoints);
  };

  const calculatePoints = (index) => {
    if (customPoints[index] !== null) {
      return customPoints[index];
    }
    
    const position = dogs.findIndex(dog => dog === dogs[index]);
    
    if (dogs[index] && position !== -1) {
      return Math.max(0, startingPoints - (position * interval));
    }
    
    return Math.max(0, startingPoints - (index * interval));
  };

  const handleKeyDown = (event, fieldId) => {
    const navigationMaps = {
      'day-1': { ArrowRight: 'day-2', ArrowDown: 'startTime' },
      'day-2': { ArrowLeft: 'day-1', ArrowRight: 'day-3', ArrowDown: 'startTime' },
      'day-3': { ArrowLeft: 'day-2', ArrowRight: 'day-4', ArrowDown: 'startTime' },
      'day-4': { ArrowLeft: 'day-3', ArrowDown: 'startTime' },
      'startTime': { ArrowUp: 'day-1', ArrowDown: 'crossTime' },
      'judge': { ArrowUp: 'startTime', ArrowRight: 'dog-0', ArrowDown: 'startingPoints' },
      'crossTime': { ArrowUp: 'startTime', ArrowLeft: 'startTime', ArrowDown: 'judge' },
      'startingPoints': { ArrowUp: 'judge', ArrowRight: 'interval', ArrowDown: 'dog-0' },
      'interval': { ArrowUp: 'judge', ArrowLeft: 'startingPoints', ArrowDown: 'dog-0' },
    };
    
    for (let i = 0; i < 7; i++) {
      navigationMaps[`dog-${i}`] = {
        ArrowUp: i === 0 ? 'interval' : `dog-${i-1}`,
        ArrowRight: `points-${i}`,
        ArrowDown: i === 6 ? 'submitButton' : `dog-${i + 1}`,
        Enter: 'submitButton',
      };
      
      navigationMaps[`points-${i}`] = {
        ArrowUp: i === 0 ? 'interval' : `points-${i-1}`,
        ArrowLeft: `dog-${i}`,
        ArrowDown: i === 6 ? 'submitButton' : `points-${i + 1}`,
        Enter: 'submitButton',
      };
    }
    
    navigationMaps['submitButton'] = { ArrowUp: 'points-6' };
    
    const nextFieldId = navigationMaps[fieldId]?.[event.key];
    
    if (nextFieldId) {
      event.preventDefault();
      const nextField = inputRefs.current[nextFieldId];
      if (nextField) {
        nextField.focus();
        
        if (nextFieldId.startsWith('day-')) {
          const dayNumber = parseInt(nextFieldId.split('-')[1]);
          setSelectedDay(dayNumber);
        }
      }
    }
  };

  const resetForm = () => {
    setCrossTime('');
    setJudge('');
    setDogs(Array(7).fill(''));
    setCustomPoints(Array(7).fill(null));
    setError({});
    setStartingPoints(35);
    setInterval(5);
    
    setTimeout(() => {
      if (inputRefs.current['crossTime']) {
        inputRefs.current['crossTime'].focus();
      }
    }, 0);
  };

  async function handleSubmit() {
    const hunt = await HuntService.getHunt();
    const filteredDogs = dogs.filter((dog) => dog && Number(dog));
    
    const scores = [];
    for (let i = 0; i < dogs.length; i++) {
      if (dogs[i] && Number(dogs[i])) {
        scores.push(calculatePoints(i));
      }
    }

    const score = {
      day: selectedDay,
      startTime: startTime,
      judge: Number(judge),
      crossTime: crossTime,
      dogNumbers: filteredDogs.map(Number),
      scores: scores,
      interval: hunt.huntInterval
    };
    
    const data = await DogService.postCross(score);
    if (data) {
      setError(data.fields);
      setSuccessMessage(''); 
    } else {
      setSuccessMessage('Score submitted successfully!');
      resetForm();
    }
  }
  
  const handleSelectDay = (day) => {
    setSelectedDay(day);
  };

  return (
    <div className="grid text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-md shadow-md animate-fade-in-out flex items-center gap-2">
          <FaCheck className="text-white" />
          {successMessage}
        </div>
      )}
      
      <Box params='h-full bg-white pt-5 shadow-sm'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-2 mb-4'>
          <h1 className='text-3xl font-bold text-gray-800'>Score Entry</h1>
        </div>
        
        <div className='w-full flex flex-wrap gap-5'>
          {/* Left column - Day selection and Times */}
          <div className='min-w-1/3'>
            <div className='bg-slate-50 rounded-lg p-4 mb-4 shadow-sm'>
              <h2 className='text-lg font-semibold mb-3 text-gray-700 border-b pb-2'>Hunt Day</h2>
              <div className='grid grid-cols-4 gap-3 mb-1'>
                {[1, 2, 3, 4].map((day) => (
                  <div key={day} className={`rounded-lg cursor-pointer transition-all duration-200 ${selectedDay === day ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}>
                    <label className="flex items-center justify-center h-12 cursor-pointer w-full">
                      <input
                        type="radio"
                        value={day}
                        checked={selectedDay === day}
                        onChange={() => handleSelectDay(day)}
                        onKeyDown={(e) => handleKeyDown(e, `day-${day}`)}
                        ref={(el) => inputRefs.current[`day-${day}`] = el}
                        className="sr-only" // Hide the actual radio button
                      />
                      <span className="text-lg font-medium">{day}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className='bg-slate-50 rounded-lg p-4 mb-4 shadow-sm'>
              <h2 className='text-lg font-semibold mb-3 text-gray-700 border-b pb-2'>Times</h2>
              <div className='space-y-3'>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type='time'
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'startTime')}
                    ref={(el) => inputRefs.current['startTime'] = el}
                    className='border border-gray-300 rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                  />
                  {error.startTime && <p className="text-red-500 text-sm mt-1">{error.startTime}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cross Time</label>
                  <input
                    type='time'
                    value={crossTime}
                    onChange={(e) => setCrossTime(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'crossTime')}
                    ref={(el) => inputRefs.current['crossTime'] = el}
                    className='border border-gray-300 rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                  />
                  {error.crossTime && <p className="text-red-500 text-sm mt-1">{error.crossTime}</p>}
                </div>
              </div>
            </div>
            
            <div className='bg-slate-50 rounded-lg p-4 shadow-sm'>
              <h2 className='text-lg font-semibold mb-3 text-gray-700 border-b pb-2'>Judge</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judge Number</label>
                <input
                  type='text'
                  value={judge}
                  onChange={(e) => setJudge(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'judge')}
                  ref={(el) => inputRefs.current['judge'] = el}
                  className='border border-gray-300 rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
                  placeholder="Enter judge number"
                />
                {error.judge && <p className="text-red-500 text-sm mt-1">{error.judge}</p>}
              </div>
            </div>
          </div>
          
          {/* Right column - Dogs and Scores */}
          <div className='min-w-[calc(66.7%-21px)]'>
            <div className='bg-slate-50 rounded-lg p-4 shadow-sm h-full'>
              <div className='flex items-center justify-between border-b pb-3 mb-4'>
                <h2 className='text-lg font-semibold text-gray-700'>Dogs & Scores</h2>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Starting Points</label>
                    <input
                      type="number"
                      value={startingPoints}
                      onChange={(e) => setStartingPoints(Number(e.target.value))}
                      onKeyDown={(e) => handleKeyDown(e, 'startingPoints')}
                      ref={(el) => inputRefs.current['startingPoints'] = el}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-20 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                    <input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                      onKeyDown={(e) => handleKeyDown(e, 'interval')}
                      ref={(el) => inputRefs.current['interval'] = el}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-20 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-2 font-medium text-gray-600 mb-2 pl-1">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Dog Number</div>
                <div className="col-span-3">Points</div>
              </div>
              
              <div className="space-y-2 flex flex-col overflow-y-auto py-1">
                {Array(7).fill().map((_, index) => (
                  <div key={index} className="grid grid-cols-7 gap-2 items-center">
                    <div className="col-span-1 text-gray-500 font-medium text-center">{index + 1}</div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={dogs[index]}
                        onChange={(e) => handleDogChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `dog-${index}`)}
                        ref={(el) => inputRefs.current[`dog-${index}`] = el}
                        className={`border ${error[`dogNumbers${index}`] ? 'border-red-500 focus:ring-red-500':'border-gray-300 focus:ring-blue-500'} rounded-lg px-3 py-2 w-full bg-white focus:border-blue-500 focus:ring-2 transition-all`}
                        placeholder="Enter dog #"
                      />
                    </div>
                    <div className="col-span-3 flex items-center">
                      <input
                        type="number"
                        value={customPoints[index] !== null ? customPoints[index] : calculatePoints(index)}
                        onChange={(e) => handleCustomPointsChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `points-${index}`)}
                        ref={(el) => inputRefs.current[`points-${index}`] = el}
                        className={`border ${error[`scores${index}`] ? 'border-red-500 focus:ring-red-500': 'border-gray-300 focus:ring-blue-500'} rounded-lg px-3 py-2 w-full bg-white focus:border-blue-500 focus:ring-2 transition-all`}
                      />
                      {dogs[index] && (
                        <FaArrowRight className="ml-2 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className='flex justify-end mt-6 gap-3'>
                <button 
                  className='bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500' 
                  onClick={resetForm}
                  tabIndex="0"
                >
                  Reset
                </button>
                <button 
                  className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500' 
                  onClick={handleSubmit}
                  onKeyDown={(e) => handleKeyDown(e, 'submitButton')}
                  ref={(el) => inputRefs.current['submitButton'] = el}
                  tabIndex="0"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </div>
  );
}

export default ScoreEntry;