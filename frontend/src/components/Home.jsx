import { useState } from "react";
import { PiDotsThreeOutlineVertical } from "react-icons/pi";
import Box from './Box';

function Home() {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  return (
    <div className='grid grid-cols-2 text-black ml-[276px] mr-4 h-[calc(100vh-1rem)] my-2 relative'>
      <Box params='col-span-2 mb-2 pt-5 px-6'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <p className='text-4xl font-bold'>Hunt Overview</p>
          <div className='flex ml-auto items-center'>
            <div className='flex flex-col items-center'>
              <p className='font-semibold text-4xl'>100</p>
              <p>Total Dogs</p>
            </div>
            <div className='bg-gray-300 h-12 w-0.5 mx-5' />
            <div 
              className='rounded-full bg-gray-200 hover:bg-gray-300 h-9 w-7 flex items-center border border-black/10 cursor-pointer'
              onClick={handleOverlay}
            >
              <PiDotsThreeOutlineVertical className='h-7 w-7 text-black' />
            </div>
          </div>
        </div>
        <div>
        </div>
      </Box>
      <Box params='col-span-1 mt-2 mr-2 pt-5 px-6'>
        <div className='w-full flex border-b-2 border-gray-300 items-center pb-1'>
          <p className='text-3xl font-bold'>Top Dogs</p>
        </div>
      </Box>
      <Box params='col-span-1 mt-2 ml-2 pt-5 px-6'>
        <div className='w-full flex border-b-2 border-gray-300 items-center pb-1'>
          <p className='text-3xl font-bold'>Today&apos;s Frontrunners</p>
        </div>
      </Box>

      {showOverlay && (
        <div className='absolute top-0 left-0 w-full h-full bg-black/30 rounded-lg flex justify-center items-center'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <p className='text-2xl font-bold mb-4'>Options</p>
            <button className='bg-gray-50 hover:bg-gray-200 border border-black/30 font-bold py-2 px-4 rounded mb-2 w-full cursor-pointer'>
              Create a New Hunt
            </button>
            <button className='bg-gray-50 hover:bg-gray-200 border border-black/30 font-bold py-2 px-4 rounded w-full cursor-pointer'>
              Edit Current Hunt
            </button>
            <button 
              className='mt-4 text-red-500 hover:text-red-400 font-bold w-full cursor-pointer'
              onClick={handleOverlay}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;