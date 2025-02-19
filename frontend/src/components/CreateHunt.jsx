import { useState } from 'react';
import Box from './Box';
import OptionBoxWithNumber from './OptionBoxWithNumber';
import SelectableCards from './SelectableCards';
function CreateHunt() {
  const [selected, setSelected] = useState('ALL_AGE');
  const [selectedStake1, setSelectedStake1] = useState('ALL_AGE');
  const [startingNumber1, setStartingNumber1] = useState(0);
  const [selectedStake2, setSelectedStake2] = useState('ALL_AGE');
  const [startingNumber2, setStartingNumber2] = useState(0);
  const [selectedStake3, setSelectedStake3] = useState('ALL_AGE');
  const [startingNumber3, setStartingNumber3] = useState(0);
  const [selectedStake4, setSelectedStake4] = useState('ALL_AGE');
  const [startingNumber4, setStartingNumber4] = useState(0);
  return (
    <div className='text-black flex flex-col ml-[276px] items-start py-2 mr-4 h-full'>
      <Box params='h-full w-full bg-white pt-8'>
        <div className='w-full flex border-b-2 border-gray-300 pb-4'>
          <p className='text-4xl font-bold'>New Hunt</p>
          <button className='ml-auto bg-blue-400 hover:bg-blue-500 rounded-2xl px-4 cursor-pointer'>
            Create
          </button>
        </div>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Title</p>
              <p className='italic opacity-60 text-sm'>Title of the Hunt</p>
            </div>
            <div className='w-full flex items-center'>
              <input
                type='text'
                className='border w-full rounded'
              />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Dates</p>
              <p className='italic opacity-60 text-sm'>
                Date range of the Hunt
              </p>
            </div>
            <div className='w-full flex items-center'>
              <input
                type='text'
                className='border w-full rounded'
              />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Stake</p>
              <p className='italic opacity-60 text-sm'>
                Overall Stake of the Hunt
              </p>
            </div>
            <div className='w-full flex items-center'>
              <SelectableCards
                selected={selected}
                setSelected={setSelected}
              />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Interval</p>
              <p className='italic opacity-60 text-sm'>
                Time interval of the Hunt
              </p>
            </div>
            <div className='w-full flex items-center'>
              <input
                type='number'
                className='border w-full rounded'
              />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2 h-full'>
          <div className='text-start py-2 grid grid-cols-2 grid-rows-7 w-full h-full'>
            <p className='col-span-2 row-span-1 pt-2 text-lg font-semibold flex flex-col'>
              Stake Ranges
              <span className='text-sm opacity-60 italic font-normal'>
                If applicable
              </span>
            </p>
            <Box params='col-span-1 mr-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake1}
                setSelectedOption={setSelectedStake1}
                startingNumber={startingNumber1}
                setStartingNumber={setStartingNumber1}
              />
            </Box>
            <Box params='col-span-1 ml-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake2}
                setSelectedOption={setSelectedStake2}
                startingNumber={startingNumber2}
                setStartingNumber={setStartingNumber2}
              />
            </Box>
            <Box params='cols-span-1 mr-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake3}
                setSelectedOption={setSelectedStake3}
                startingNumber={startingNumber3}
                setStartingNumber={setStartingNumber3}
              />
            </Box>
            <Box params='col-span-1 ml-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake4}
                setSelectedOption={setSelectedStake4}
                startingNumber={startingNumber4}
                setStartingNumber={setStartingNumber4}
              />
            </Box>
          </div>
        </Box>
      </Box>
    </div>
  );
}

export default CreateHunt;
