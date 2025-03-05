import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DogService from "../services/DogService";
import HuntService from "../services/HuntService";
import Box from "./Box";

function ScoreEntry() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [dogs, setDogs] = useState(Array(7).fill(''));
  const [startingPoints, setStartingPoints] = useState(35);
  const [interval, setInterval] = useState(5);
  const [startTime, setStartTime] = useState('');
  const [judge, setJudge] = useState('');
  const [crossTime, setCrossTime] = useState('');
  const [error, setError] = useState({});
  const navigate = useNavigate();
  useEffect(() => {
    const fetchStartTime = async () => {
      const startTime = await DogService.getStartTime(selectedDay);
      if (startTime instanceof Error) {
        setError(startTime.response.data.fields)
        setStartTime('');
      } else {
        setStartTime(startTime);
      }
    };
    fetchStartTime();
   }, [selectedDay]);
   
  const handleDogChange = (index, value) => {
    const newDogs = [...dogs];
    newDogs[index] = value;
    setDogs(newDogs);
  };

  const calculatePoints = (index) => {
    return Math.max(0, startingPoints - (index * interval));
  };

  async function handleSubmit() {
    const hunt = await HuntService.getHunt();
    const filteredDogs = dogs.filter((dog) => Number(dog));
    const scores = filteredDogs.map((_, index) => calculatePoints(index));

    const score = {
      day: selectedDay,
      startTime: startTime,
      judge: Number(judge),
      crossTime: crossTime,
      dogNumbers: filteredDogs.map(Number),
      scores: scores,
      interval: hunt.huntInterval
    };

    // Call the API to submit the score
    const data = await DogService.postCross(score);
    if (data) {
      setError(data.fields);
    } else {
      navigate('/score-entry/view');
    }
  }

  const handleSelectDay = async (day) => {
    setSelectedDay(day);
    const startTime = await DogService.getStartTime(day);
    if (startTime instanceof Error) {
      setError(startTime.response.data.fields)
      setStartTime('');
    } else {
      setStartTime(startTime);
    }
  }

  return (
    <div className="grid text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative">
      <Box params='h-full bg-white pt-5'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1 h-17.5'>
          <p className='text-4xl font-bold'>Enter Score</p>
        </div>
        <div className='w-full h-full flex flex-col justify-start pt-2'>
          <div className='w-full flex gap-x-10'>
            <Box params='flex items-start text-md bg-slate-50 w-1/2 min-w-50'>
              <div className='flex w-full flex-col h-full'>
                <p className='text-start text-md my-2 border-b-1 w-full border-gray-300'>Day</p>
                <div className='flex w-full flex-wrap justify-start space-x-4'>
                  {[1, 2, 3, 4].map((day) => (
                    <label key={day} className="cursor-pointer items-center h-full flex">
                      <input
                        type="radio"
                        value={day}
                        checked={selectedDay === day}
                        onChange={() => handleSelectDay(day)}
                        className="mr-2 cursor-pointer"
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Box>
            <Box params='flex items-start text-md bg-slate-50 w-1/2'>
              <div className='flex flex-col h-full w-full'>
                  <p className='text-start text-md my-2 border-b-1 border-gray-300'>Start Time</p>
                  <input
                    type='time'
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className='border border-black/30 rounded-lg px-1 mb-2'
                  />
                  {error.startTime && <p className="text-red-500 text-sm">{error.startTime}</p>}
              </div>
            </Box>
          </div>
          <div className='w-full flex gap-x-10 mt-4'>
            <Box params='flex items-start text-md bg-slate-50 mt-4 w-full'>
              <div className='flex flex-col h-full w-full'>
                <p className='text-start text-md my-2 border-b-1 border-gray-300'>Judge #</p>
                <input
                  type='text'
                  value={judge}
                  onChange={(e) => setJudge(e.target.value)}
                  className='border border-black/30 rounded-lg px-1 mb-2'
                />
                {error.judge && <p className="text-red-500/70 text-sm italic">{error.judge}</p>}
              </div>
            </Box>
            <Box params='flex items-start text-md bg-slate-50 mt-4 w-full'>
              <div className='flex flex-col h-full w-full'>
                <p className='text-start text-md my-2 border-b-1 border-gray-300'>Cross Time</p>
                <input
                  type='time'
                  value={crossTime}
                  onChange={(e) => setCrossTime(e.target.value)}
                  className='border border-black/30 rounded-lg px-1 mb-2'
                />
                {error.crossTime && <p className="text-red-500/70 text-sm italic">{error.crossTime}</p>}
              </div>
            </Box>
          </div>
          <Box params='flex items-start text-md bg-slate-50 my-4 h-full'>
            <div className='flex flex-col h-full w-full'>
              <div className='flex w-full justify-start items-center border-b-1 border-gray-300'>
                <p className='text-start text-md'>Dogs</p>
                <div className="mb-4 flex ml-auto items-center gap-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Starting Points</label>
                    <input
                      type="number"
                      value={startingPoints}
                      onChange={(e) => setStartingPoints(Number(e.target.value))}
                      className="border border-black/30 rounded-lg px-1 w-16"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interval</label>
                    <input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                      className="border border-black/30 rounded-lg px-1 w-16"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap w-1/2 mx-auto h-full justify-evenly py-1">
                {Array(7).fill().map((_, index) => (
                  <div key={index} className="flex items-center gap-x-2 mx-8">
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700">Dog #{index + 1}</label>
                      <input
                        type="text"
                        value={dogs[index]}
                        onChange={(e) => handleDogChange(index, e.target.value)}
                        className={`border ${error[`dogNumbers${index}`] ? 'border-red-500':'border-black/30'} rounded-lg px-1 w-full`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Points</label>
                      <div className={`border ${error[`scores${index}`] ? 'border-red-500': 'border-black/30'} rounded-lg px-1 w-16 bg-gray-50`}>
                        {calculatePoints(index)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Box>
        </div>
        <div className='w-full mb-2'>
          <button className='bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-lg' onClick={handleSubmit}>Submit</button>
        </div>
      </Box>
    </div>
  )
}

export default ScoreEntry;