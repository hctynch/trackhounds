import { useState } from 'react';
import { PiDotsThreeOutlineVertical } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import Box from './Box';

function Home() {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  const navigate = useNavigate();

  return (
    <div className='text-black grid grid-cols-2 ml-[276px] items-start py-2 mr-4 h-full relative'>
      <Box params='col-span-2 pt-5 px-6 bg-white min-h-[calc(50vh-1rem)] max-h-[calc(50vh-0.5rem)] h-[calc(50vh-1rem)]'>
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
              onClick={handleOverlay}>
              <PiDotsThreeOutlineVertical className='h-7 w-7 text-black' />
            </div>
          </div>
        </div>
        <div className='flex flex-wrap h-full justify-between w-full'>
          <Box params='relative container my-auto bg-slate-50 w-[calc(50%-1rem)] h-[calc(50%-1rem)]'>
            <div className='w-full h-full flex flex-col items-center'>
              <p className='h-10 text-start text-2xl font-medium pt-2 w-full border-b-2 border-gray-300'>
                Title
              </p>
              <p className='absolute top-1/2 right-0 w-full text-2xl font-medium text-center'>
                Masters Fox Hunt Trial
              </p>
            </div>
          </Box>
          <Box params='relative container my-auto bg-slate-50 w-[calc(50%-1rem)] h-[calc(50%-1rem)]'>
            <div className='w-full h-full flex flex-col items-center'>
              <p className='h-10 text-start text-2xl font-medium pt-2 w-full border-b-2 border-gray-300'>
                Date
              </p>
              <p className='absolute top-1/2 right-0 w-full text-2xl font-medium text-center'>
                02/18/2025 to 02/20/2025
              </p>
            </div>
          </Box>
          <Box params='relative container my-auto bg-slate-50 w-[calc(50%-1rem)] h-[calc(50%-1rem)]'>
            <div className='w-full h-full flex flex-col items-center'>
              <p className='h-10 text-start text-2xl font-medium pt-2 w-full border-b-2 border-gray-300'>
                Stake
              </p>
              <p className='absolute top-1/2 right-0 w-full text-2xl font-medium text-center'>
                All Age
              </p>
            </div>
          </Box>
          <Box params='relative container my-auto bg-slate-50 w-[calc(50%-1rem)] h-[calc(50%-1rem)]'>
            <div className='w-full h-full flex flex-col items-center'>
              <p className='h-10 text-start text-2xl font-medium pt-2 w-full border-b-2 border-gray-300'>
                Interval
              </p>
              <p className='absolute top-1/2 right-0 w-full text-2xl font-medium text-center'>
                10
              </p>
            </div>
          </Box>
        </div>
      </Box>
      <Box params='col-span-1 mt-2 mr-2 pt-5 px-6 bg-white max-h-[calc(50vh-0.5rem)] min-h-[calc(50vh-0.5rem)]'>
        <div className='w-full flex border-b-2 border-gray-300 items-center pb-1'>
          <p className='text-3xl font-semibold'>Top Dogs</p>
        </div>
        <Box params='overflow-y-auto w-full p-4 my-8 bg-slate-50 h-full'>
          <table className='table-auto w-full h-full'>
            <thead>
              <tr className='border-b-2 border-gray-300'>
                <th className='text-xl font-semibold text-start'>#</th>
                <th className='text-xl font-semibold text-start'>Name</th>
                <th className='text-xl font-semibold text-end'>Points</th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
            </tbody>
          </table>
        </Box>
      </Box>
      <Box params='col-span-1 mt-2 ml-2 pt-5 px-6 bg-white max-h-[calc(50vh-0.5rem)] min-h-[calc(50vh-0.5rem)]'>
        <div className='w-full flex border-b-2 border-gray-300 items-center pb-1'>
          <p className='text-3xl font-semibold'>Daily 10</p>
        </div>
        <Box params='overflow-y-auto w-full p-4 my-8 bg-slate-50 h-full'>
          <table className='table-auto w-full h-full'>
            <thead>
              <tr className='border-b-2 border-gray-300'>
                <th className='text-xl font-semibold text-start'>#</th>
                <th className='text-xl font-semibold text-start'>Name</th>
                <th className='text-xl font-semibold text-end'>Points</th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-xl text-start'>1</td>
                <td className='text-xl text-start'>Rex</td>
                <td className='text-xl text-end'>100</td>
              </tr>
            </tbody>
          </table>
        </Box>
      </Box>

      {showOverlay && (
        <div className='absolute top-2 w-full h-[calc(100vh-1rem)] bg-black/30 rounded-lg flex justify-center items-center'>
          <div className='bg-white rounded-lg shadow-lg p-6'>
            <p className='text-2xl font-bold mb-4'>Options</p>
            <button
              className='bg-gray-50 hover:bg-gray-200 border border-black/30 font-bold py-2 px-4 rounded mb-2 w-full cursor-pointer'
              onClick={() => navigate('/hunt/create')}>
              Create a New Hunt
            </button>
            <button
              className='bg-gray-50 hover:bg-gray-200 border border-black/30 font-bold py-2 px-4 rounded w-full cursor-pointer'
              onClick={() => navigate('/hunt/edit')}>
              Edit Current Hunt
            </button>
            <button
              className='mt-4 bg-red-50 rounded text-red-500 hover:text-red-400 hover:bg-red-100 font-bold w-full cursor-pointer'
              onClick={handleOverlay}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
