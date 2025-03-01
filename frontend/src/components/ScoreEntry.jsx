import { useState } from "react"; // Add this import
import Box from "./Box";

function ScoreEntry() {
  const [selectedDay, setSelectedDay] = useState(1); // Add state for selected day
  
  // Add state for dogs, starting points, and interval
  const [dogs, setDogs] = useState(Array(7).fill(''));
  const [startingPoints, setStartingPoints] = useState(35);
  const [interval, setInterval] = useState(5);

  // Handler for dog number changes
  const handleDogChange = (index, value) => {
    const newDogs = [...dogs];
    newDogs[index] = value;
    setDogs(newDogs);
  };

  // Calculate points for a specific dog based on its index
  const calculatePoints = (index) => {
    return Math.max(0, startingPoints - (index * interval));
  };

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
                        onChange={() => setSelectedDay(day)}
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
                    className='border border-black/30 rounded-lg px-1 mb-2'
                  />
              </div>
            </Box>
          </div>
          <div className='w-full flex gap-x-10 mt-4'>
            <Box params='flex items-start text-md bg-slate-50 mt-4 w-full'>
              <div className='flex flex-col h-full w-full'>
                <p className='text-start text-md my-2 border-b-1 border-gray-300'>Judge #</p>
                <input
                  type='text'
                  className='border border-black/30 rounded-lg px-1 mb-2'
                />
              </div>
            </Box>
            <Box params='flex items-start text-md bg-slate-50 mt-4 w-full'>
              <div className='flex flex-col h-full w-full'>
                <p className='text-start text-md my-2 border-b-1 border-gray-300'>Cross Time</p>
                <input
                  type='time'
                  className='border border-black/30 rounded-lg px-1 mb-2'
                />
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
                        className="border border-black/30 rounded-lg px-1 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Points</label>
                      <div className="border border-black/30 rounded-lg px-1 w-16 bg-gray-50">
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
          <button className='bg-blue-500 hover:bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-lg'>Submit</button>
        </div>
      </Box>
    </div>
  )
}

export default ScoreEntry