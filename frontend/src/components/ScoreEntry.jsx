import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowRight, FaCheck, FaClock, FaExclamationTriangle, FaPaw, FaRegCalendarAlt, FaUserTie } from "react-icons/fa";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import DogService from "../services/DogService";
import HuntService from "../services/HuntService";
import Button from './Button';

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
  const [dogErrors, setDogErrors] = useState(Array(7).fill(false));
  const [huntType, setHuntType] = useState('ALL_AGE');
  const [huntExists, setHuntExists] = useState(true);
  const [dogStakes, setDogStakes] = useState(Array(7).fill(null));
  const inputRefs = useRef({});
  const debounceTimerRef = useRef(null);
  const resetFlagRef = useRef(false);
  
  // Fetch hunt info on component mount
  useEffect(() => {
    const fetchHuntInfo = async () => {
      try {
        const hunt = await HuntService.getHunt();
        
        // Check if the response is an error or if it's missing required properties
        if (hunt instanceof Error) {
          setHuntExists(false);
          // Use default values
          setHuntType('ALL_AGE');
        } else {
          setHuntExists(true);
          setHuntType(hunt.stake);
        }
      } catch (err) {
        console.error("Error fetching hunt info:", err);
        setHuntExists(false);
      }
    };
    
    fetchHuntInfo();
  }, []);
  
  useEffect(() => {
    const fetchStartTime = async () => {
      // Only try to fetch start time if a hunt exists
      if (!huntExists) return;
      
      const startTime = await DogService.getStartTime(selectedDay);
      if (startTime instanceof Error) {
        setError(prev => ({...prev, startTime: startTime.response?.data?.fields?.startTime}));
        setStartTime('');
      } else {
        setStartTime(startTime);
      }
    };
    fetchStartTime();
  }, [selectedDay, huntExists]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Debounced function to get cross info
  const updateCrossInfo = useCallback(() => {
    // Skip API call if no hunt exists or if we're in a reset operation
    if (!huntExists || resetFlagRef.current) return;
    
    const validDogs = dogs.filter(dog => dog && dog.toString().trim() !== '');
    
    if (validDogs.length > 0) {
      // Clear any previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set a new debounce timer
      debounceTimerRef.current = setTimeout(async () => {
        // Check again if we're in a reset state before making the API call
        if (resetFlagRef.current) return;
        
        try {
          const crossInfo = await DogService.getCrossInfo(
            dogs, 
            startingPoints, 
            interval, 
            huntType
          );
          
          // Check one more time before processing the results
          if (resetFlagRef.current) return;
          
          // Process the results
          if (crossInfo && crossInfo.length > 0) {
            const newCustomPoints = [...customPoints];
            const newDogErrors = Array(7).fill(false);
            const newDogStakes = [...dogStakes];
            
            // Create a mapping of dog number to info
            const dogInfoMap = {};
            crossInfo.forEach(info => {
              dogInfoMap[info.dogNumber] = info;
            });
            
            // Update points and errors for each dog entry
            dogs.forEach((dog, index) => {
              if (dog && dog.toString().trim() !== '') {
                const dogNumber = Number(dog);
                const info = dogInfoMap[dogNumber];
                
                if (info) {
                  if (info.error) {
                    // Dog doesn't exist
                    newDogErrors[index] = info.error;
                    newDogStakes[index] = null;
                  } else {
                    // Store the stake type and update points
                    newDogStakes[index] = info.stake;
                    if (newCustomPoints[index] === null) {
                      // Only update if not manually set
                      newCustomPoints[index] = info.points;
                    }
                  }
                } else {
                  // Dog wasn't in the response at all
                  newDogErrors[index] = "Dog does not exist in the hunt";
                  newDogStakes[index] = null;
                }
              } else {
                // Clear stake for empty dog entries
                newDogStakes[index] = null;
              }
            });
            
            setDogErrors(newDogErrors);
            setCustomPoints(newCustomPoints);
            setDogStakes(newDogStakes);
          }
        } catch (err) {
          console.error("Error updating cross info:", err);
        }
      }, 500); // 500ms debounce
    }
  }, [dogs, startingPoints, interval, huntType, customPoints, huntExists, dogStakes]);
  
  // Call updateCrossInfo when dogs, points, or interval changes
  useEffect(() => {
    updateCrossInfo();
  }, [dogs, startingPoints, interval, updateCrossInfo]);

  const handleDogChange = (index, value) => {
    const newDogs = [...dogs];
    newDogs[index] = value;
    setDogs(newDogs);
    
    // Reset custom points and errors for this dog if being cleared
    if (!value) {
      const newCustomPoints = [...customPoints];
      newCustomPoints[index] = null;
      setCustomPoints(newCustomPoints);
      
      const newDogErrors = [...dogErrors];
      newDogErrors[index] = false;
      setDogErrors(newDogErrors);
      
      const newDogStakes = [...dogStakes];
      newDogStakes[index] = null;
      setDogStakes(newDogStakes);
    }
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
    
    const filledDogs = dogs.filter(dog => dog && dog.trim() !== '');
    const position = filledDogs.findIndex(dog => dog === dogs[index]);
    
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
      'resetButton': { ArrowUp: 'points-6', ArrowLeft: 'submitButton' },
      'submitButton': { ArrowUp: 'points-6', ArrowRight: 'resetButton' },
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
    // Set the reset flag to true
    resetFlagRef.current = true;
    
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    setStartingPoints(35);
    setCustomPoints(Array(7).fill(null));
    setCrossTime('');
    setJudge('');
    setDogs(Array(7).fill(''));
    setDogErrors(Array(7).fill(false));
    setDogStakes(Array(7).fill(null));
    setError({});
    
    // Only reset interval if no hunt exists or hunt doesn't have an interval
    if (!huntExists) {
      setInterval(5);
    }
    
    // Set a timeout to reset the flag after all state updates have been processed
    setTimeout(() => {
      resetFlagRef.current = false;
      
      if (inputRefs.current['crossTime']) {
        inputRefs.current['crossTime'].focus();
      }
    }, 50);
  };

  async function handleSubmit() {
    // Alert user if no hunt exists
    if (!huntExists) {
      alert("No hunt has been created yet. Please create a hunt before submitting scores.");
      return;
    }
    
    const filteredDogs = dogs.filter((dog) => dog && Number(dog));
    
    const scores = [];
    for (let i = 0; i < dogs.length; i++) {
      if (dogs[i] && Number(dogs[i])) {
        scores.push(calculatePoints(i));
      }
    }

    if (filteredDogs.length === 0) {
      setError(prev => ({
        ...prev,
        general: 'Please enter at least one dog number'
      }));
      return;
    }

    const score = {
      day: selectedDay,
      startTime: startTime,
      judge: Number(judge),
      crossTime: crossTime,
      dogNumbers: filteredDogs.map(Number),
      scores: scores,
      interval: interval
    };
    
    const data = await DogService.postCross(score);
    if (data) {
      setError(data.fields || {});
      setSuccessMessage(''); 
    } else {
      setSuccessMessage('Score submitted successfully!');
      resetForm();
    }
  }
  
  const handleSelectDay = (day) => {
    setSelectedDay(day);
  };

  const getStakeStyles = (stakeType) => {
    if (stakeType === 'ALL_AGE') {
      return {
        label: 'All Age',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    } else if (stakeType === 'DERBY') {
      return {
        label: 'Derby',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-800'
      };
    }
    return { label: '', bgColor: '', textColor: '' };
  };

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Fixed notifications */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-md shadow-md flex items-center gap-2">
          <FaCheck />
          {successMessage}
        </div>
      )}
      
      {!huntExists && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-white px-6 py-3 rounded-md shadow-md flex items-center gap-2">
          <FaExclamationTriangle />
          No hunt exists. Please create a hunt first.
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            type="secondary"
            onClick={() => window.location.href = "/"}
            className="mr-4 p-1 rounded-full"
          >
            <IoArrowBackCircleOutline className="text-3xl text-gray-500" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Score Entry</h1>
            <p className="text-gray-500 mt-1">
              Record dog crossing scores
            </p>
          </div>
        </div>
        
        {huntExists && huntType === 'DUAL' && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
            <FaPaw className="mr-1" />
            Dual Stake Hunt
          </span>
        )}
      </div>

      {/* Error notification */}
      {error.general && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <FaExclamationTriangle className="text-red-500 text-lg mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-red-700">{error.general}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Left column - Hunt Day */}
        <div className="flex flex-col space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-500 flex items-center">
              <FaRegCalendarAlt className="text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Hunt Day</h2>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((day) => (
                  <div key={day} className={`rounded-lg cursor-pointer transition-all duration-200 ${selectedDay === day ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
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
                      <span className="text-lg font-medium">Day {day}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Times Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-l-4 border-amber-500 flex items-center">
              <FaClock className="text-amber-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Times</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'startTime')}
                  ref={(el) => inputRefs.current['startTime'] = el}
                  className={`border ${error.startTime ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg px-3 py-2 w-full bg-white`}
                />
                {error.startTime && <p className="text-red-500 text-sm mt-1">{error.startTime}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cross Time</label>
                <input
                  type="time"
                  value={crossTime}
                  onChange={(e) => setCrossTime(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'crossTime')}
                  ref={(el) => inputRefs.current['crossTime'] = el}
                  className={`border ${error.crossTime ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg px-3 py-2 w-full bg-white`}
                />
                {error.crossTime && <p className="text-red-500 text-sm mt-1">{error.crossTime}</p>}
              </div>
            </div>
          </div>
          
          {/* Judge Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-l-4 border-green-500 flex items-center">
              <FaUserTie className="text-green-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">Judge</h2>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Judge Number</label>
              <input
                type="text"
                value={judge}
                onChange={(e) => setJudge(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'judge')}
                ref={(el) => inputRefs.current['judge'] = el}
                className={`border ${error.judge ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg px-3 py-2 w-full bg-white`}
                placeholder="Enter judge number"
              />
              {error.judge && <p className="text-red-500 text-sm mt-1">{error.judge}</p>}
            </div>
          </div>
        </div>
        
        {/* Main Dogs & Scores section (spans 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-purple-50 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaPaw className="text-purple-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Dogs & Scores</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Starting Points</label>
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <input
                      type="number"
                      value={startingPoints}
                      onChange={(e) => setStartingPoints(Number(e.target.value))}
                      onKeyDown={(e) => handleKeyDown(e, 'startingPoints')}
                      ref={(el) => inputRefs.current['startingPoints'] = el}
                      className="border-0 bg-transparent rounded-lg px-3 py-2 w-20 focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Interval</label>
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    <input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                      onKeyDown={(e) => handleKeyDown(e, 'interval')}
                      ref={(el) => inputRefs.current['interval'] = el}
                      className="border-0 bg-transparent rounded-lg px-3 py-2 w-20 focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 flex-1 overflow-auto">
            <div className="grid grid-cols-7 gap-2 font-medium text-gray-600 mb-3 pl-1 border-b pb-2">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Dog Number</div>
              <div className="col-span-3">Points</div>
            </div>
            
            <div className="space-y-3">
              {Array(7).fill().map((_, index) => (
                <div key={index} className="grid grid-cols-7 gap-2 items-center">
                  <div className="col-span-1 flex justify-center">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="col-span-3 relative">
                    <input
                      type="text"
                      value={dogs[index]}
                      onChange={(e) => handleDogChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `dog-${index}`)}
                      ref={(el) => inputRefs.current[`dog-${index}`] = el}
                      className={`border ${error[`dogNumbers${index}`] || dogErrors[index] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg px-3 py-2 w-full bg-white`}
                      placeholder="Enter dog #"
                    />
                    {dogErrors[index] && (
                      <div className="absolute inset-y-0 right-3 flex items-center text-amber-500 group">
                        <FaExclamationTriangle className="cursor-help" />
                        {/* Tooltip that only appears on hover */}
                        <div className="hidden group-hover:block absolute z-10 right-0 top-full mt-1 w-48 p-2 bg-amber-50 border border-amber-300 rounded-md text-amber-700 text-xs shadow-md">
                          {typeof dogErrors[index] === 'string' ? dogErrors[index] : 'Dog does not exist in the hunt'}
                        </div>
                      </div>
                    )}
                    {error[`dogNumbers${index}`] && <p className="text-red-500 text-xs mt-1">{error[`dogNumbers${index}`]}</p>}
                  </div>
                  <div className="col-span-3 flex items-center">
                    <input
                      type="number"
                      value={customPoints[index] !== null ? customPoints[index] : calculatePoints(index)}
                      onChange={(e) => handleCustomPointsChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, `points-${index}`)}
                      ref={(el) => inputRefs.current[`points-${index}`] = el}
                      className={`border ${error[`scores${index}`] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg px-3 py-2 w-full bg-white`}
                      min="0"
                    />
                    <div className="flex items-center ml-2 min-w-24">
                      {dogs[index] && !dogErrors[index] && dogStakes[index] && (
                        <>
                          <FaArrowRight className="text-green-500 mr-2" />
                          <span className={`text-xs px-2 py-1 rounded-full ${getStakeStyles(dogStakes[index]).bgColor} ${getStakeStyles(dogStakes[index]).textColor} font-medium shrink-0`}>
                            {getStakeStyles(dogStakes[index]).label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <Button 
              type="secondary" 
              onClick={resetForm}
              onKeyDown={(e) => handleKeyDown(e, 'resetButton')}
              ref={(el) => inputRefs.current['resetButton'] = el}
              className="rounded-xl"
            >
              Reset
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmit}
              disabled={!huntExists}
              onKeyDown={(e) => handleKeyDown(e, 'submitButton')}
              ref={(el) => inputRefs.current['submitButton'] = el}
              tabIndex="0"
              className="rounded-xl"
            >
              Submit Scores
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScoreEntry;