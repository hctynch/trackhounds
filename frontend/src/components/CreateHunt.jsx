import { useEffect, useState } from 'react';
import { IoArrowBackCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import HuntService from '../services/HuntService.js';
import Box from './Box';
import OptionBoxWithNumber from './OptionBoxWithNumber';
import SelectableCards from './SelectableCards';

function CreateHunt() {
  const [title, setTitle] = useState('');
  const [dates, setDates] = useState('');
  const [huntInterval, setHuntInterval] = useState(0);
  const [selected, setSelected] = useState('ALL_AGE');
  const [selectedStake1, setSelectedStake1] = useState('ALL_AGE');
  const [startingNumber1, setStartingNumber1] = useState(0);
  const [selectedStake2, setSelectedStake2] = useState('ALL_AGE');
  const [startingNumber2, setStartingNumber2] = useState(0);
  const [selectedStake3, setSelectedStake3] = useState('ALL_AGE');
  const [startingNumber3, setStartingNumber3] = useState(0);
  const [selectedStake4, setSelectedStake4] = useState('ALL_AGE');
  const [startingNumber4, setStartingNumber4] = useState(0);
  const [errs, setErrs] = useState({});
  const navigate = useNavigate();

  // Update stake ranges based on the primary stake selection
  useEffect(() => {
    // If DUAL is selected, make sure stake ranges are appropriately set
    if (selected === 'DUAL') {
      // Default to setting first two ranges as ALL_AGE and DERBY
      if (selectedStake1 !== 'ALL_AGE') setSelectedStake1('ALL_AGE');
      if (selectedStake2 !== 'DERBY') setSelectedStake2('DERBY');
    }
  }, [selected]);

  const handleCreate = () => {
    const newErrs = {};
    var err = false;
    if (title.length < 1) {
      newErrs.title = 'Title cannot be empty.';
      err = true;
    }
    if (huntInterval < 0) {
      newErrs.interval = 'Interval must be 0 or greater.';
      err = true;
    }
    if (startingNumber1 < 0) {
      newErrs.startingNumber1 = 'Must be > 0.';
      err = true;
    }
    if (startingNumber2 < 0) {
      newErrs.startingNumber2 = 'Must be > 0.';
      err = true;
    }
    if (startingNumber3 < 0) {
      newErrs.startingNumber3 = 'Must be > 0.';
      err = true;
    }
    if (startingNumber4 < 0) {
      newErrs.startingNumber4 = 'Must be > 0.';
      err = true;
    }
    
    // For DUAL stake type, ensure proper configuration
    if (selected === 'DUAL') {
      // Check that at least one range is configured for each stake type
      const hasAllAge = [selectedStake1, selectedStake2, selectedStake3, selectedStake4].includes('ALL_AGE');
      const hasDerby = [selectedStake1, selectedStake2, selectedStake3, selectedStake4].includes('DERBY');
      
      if (!hasAllAge || !hasDerby) {
        newErrs.stake = 'Dual stake requires at least one range for All Age and one for Derby';
        err = true;
      }
    }
    
    setErrs(newErrs);
    if (err) {
      return;
    }
    
    async function newHunt() {
      const hunt = {
        title: title,
        dates: dates,
        stake: selected,
        huntInterval: huntInterval,
        stakeTypeRange: [
          selectedStake1,
          selectedStake2,
          selectedStake3,
          selectedStake4,
        ],
        stakeRange: [
          startingNumber1,
          startingNumber2,
          startingNumber3,
          startingNumber4,
        ],
      };
      const data = await HuntService.createHunt(hunt);
      if (data instanceof Error) {
        setErrs(data.response.data.fields);
      } else {
        navigate('/');
      }
    }
    newHunt();
  };

  return (
    <div className='text-black flex flex-col ml-[276px] items-start py-2 mr-4 h-full'>
      <Box params='h-full w-full bg-white pt-8 overflow-y-auto'>
        <div className='w-full flex border-b-2 border-gray-300 pb-4'>
          <a
            className='mr-4 cursor-pointer'
            href='/'>
            <IoArrowBackCircleOutline className='text-4xl text-gray-500' />
          </a>
          <p className='text-4xl font-bold'>New Hunt</p>
          <button
            className='ml-auto bg-blue-400 hover:bg-blue-500 rounded-2xl px-4 cursor-pointer'
            onClick={handleCreate}>
            Create
          </button>
        </div>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Title</p>
              <p className='italic opacity-60 text-sm'>Title of the Hunt</p>
            </div>
            <div className='w-full flex flex-col justify-center items-center'>
              <input
                type='text'
                className={`border w-full rounded ${
                  errs && errs.title ? 'border-red-400' : ''
                }`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errs && errs.title && (
                <p className='text-sm w-full italic opacity-60 text-red-500'>
                  {errs.title}
                </p>
              )}
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
                value={dates}
                onChange={(e) => setDates(e.target.value)}
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
            {errs && errs.stake && (
              <p className='col-span-2 text-sm italic opacity-60 text-red-500 mt-1'>
                {errs.stake}
              </p>
            )}
            {selected === 'DUAL' && (
              <p className='col-span-2 text-sm italic text-blue-600 mt-1'>
                When using Dual Stake, configure stake ranges below for All Age and Derby dogs.
              </p>
            )}
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
            <div className='w-full flex flex-col justify-center items-center'>
              <input
                type='number'
                className={`border w-full rounded ${
                  errs && errs.interval ? 'border-red-400' : ''
                }`}
                value={huntInterval}
                onChange={(e) => setHuntInterval(e.target.value)}
                min={0}
              />
              {errs && errs.interval && (
                <p className='w-full text-red-500 opacity-60 text-sm italic'>
                  {errs.interval}
                </p>
              )}
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2 h-102'>
          <div className='text-start py-2 grid grid-cols-2 grid-rows-7 w-full h-full'>
            <p className='col-span-2 row-span-1 pt-2 text-lg font-semibold flex flex-col'>
              Stake Ranges
              <span className='text-sm opacity-60 italic font-normal'>
                {selected === 'DUAL' 
                  ? 'Set up starting numbers for All Age and Derby dogs'
                  : 'If applicable'}
              </span>
            </p>
            <Box params='col-span-1 mr-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake1}
                setSelectedOption={setSelectedStake1}
                startingNumber={startingNumber1}
                setStartingNumber={setStartingNumber1}
                error={
                  errs && errs.startingNumber1 ? errs.startingNumber1 : null
                }
              />
            </Box>
            <Box params='col-span-1 ml-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake2}
                setSelectedOption={setSelectedStake2}
                startingNumber={startingNumber2}
                setStartingNumber={setStartingNumber2}
                error={
                  errs && errs.startingNumber2 ? errs.startingNumber2 : null
                }
              />
            </Box>
            <Box params='cols-span-1 mr-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake3}
                setSelectedOption={setSelectedStake3}
                startingNumber={startingNumber3}
                setStartingNumber={setStartingNumber3}
                error={
                  errs && errs.startingNumber3 ? errs.startingNumber3 : null
                }
              />
            </Box>
            <Box params='col-span-1 ml-2 my-2 row-span-3 bg-white'>
              <OptionBoxWithNumber
                selectedOption={selectedStake4}
                setSelectedOption={setSelectedStake4}
                startingNumber={startingNumber4}
                setStartingNumber={setStartingNumber4}
                error={
                  errs && errs.startingNumber4 ? errs.startingNumber4 : null
                }
              />
            </Box>
          </div>
        </Box>
      </Box>
    </div>
  );
}

export default CreateHunt;
