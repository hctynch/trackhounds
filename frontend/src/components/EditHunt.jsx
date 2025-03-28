import { useEffect, useState } from 'react';
import { IoArrowBackCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import HuntService from '../services/HuntService.js';
import Box from './Box';
import Button from './Button';
import OptionBoxWithNumber from './OptionBoxWithNumber';
import SelectableCards from './SelectableCards';

function EditHunt() {
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

  useEffect(() => {
    async function getHunt() {
      const data = await HuntService.getHunt();
      if (data instanceof Error) {
        navigate('/');
      } else {
        setTitle(data.title);
        setDates(data.dates);
        setSelected(data.stake);
        setHuntInterval(data.huntInterval);
        setSelectedStake1(data.stakeTypeRange[0]);
        setSelectedStake2(data.stakeTypeRange[1]);
        setSelectedStake3(data.stakeTypeRange[2]);
        setSelectedStake4(data.stakeTypeRange[3]);
        setStartingNumber1(data.stakeRange[0]);
        setStartingNumber2(data.stakeRange[1]);
        setStartingNumber3(data.stakeRange[2]);
        setStartingNumber4(data.stakeRange[3]);
      }
    }
    getHunt();
  }, [navigate]);

  useEffect(() => {
    if (selected === 'DUAL') {
      const hasAllAge = [selectedStake1, selectedStake2, selectedStake3, selectedStake4].includes('ALL_AGE');
      const hasDerby = [selectedStake1, selectedStake2, selectedStake3, selectedStake4].includes('DERBY');

      if (!hasAllAge) {
        if (selectedStake1 !== 'ALL_AGE') setSelectedStake1('ALL_AGE');
      }

      if (!hasDerby) {
        if (selectedStake1 !== 'DERBY') setSelectedStake2('DERBY');
      }
    }
  }, [selected, selectedStake1, selectedStake2, selectedStake3, selectedStake4]);

  const handleEdit = () => {
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

    if (selected === 'DUAL') {
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

    async function editHunt() {
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
      const data = await HuntService.editHunt(hunt);
      if (data instanceof Error) {
        setErrs(data.response.data.fields);
      } else {
        navigate('/');
      }
    }
    editHunt();
  };

  return (
    <div className='text-black flex flex-col ml-[276px] items-start py-2 mr-4 h-full'>
      <Box params='h-full w-full bg-white rounded-xl shadow-sm overflow-y-auto'>
        <div className='w-full flex items-center justify-between px-6 py-4 border-b-2 border-gray-300'>
          <div className='flex items-center'>
            <button
              onClick={() => navigate('/')}
              className='mr-4 p-1 rounded-full cursor-pointer'
            >
              <IoArrowBackCircleOutline className='text-3xl text-gray-500 h-9 w-9' />
            </button>
            <h1 className='text-3xl font-bold text-gray-900'>Edit Hunt</h1>
          </div>

          <Button
            type="primary"
            onClick={handleEdit}
            className="rounded-xl px-6 py-2.5 font-medium"
          >
            Save Changes
          </Button>
        </div>

        <div className='p-6 space-y-6 flex flex-wrap w-full gap-15'>
          <div className='flex flex-col gap-15 justify-evenly w-[45%]'>
          <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
            <div className='px-6 py-4 bg-blue-50 border-l-4 border-blue-500'>
              <h2 className='text-lg font-semibold text-gray-800'>Hunt Details</h2>
              <p className='text-sm text-gray-500'>Basic information about the hunt</p>
            </div>

            <div className='p-6 space-y-4'>
              <div className='grid grid-cols-3 gap-6 items-center'>
                <div className='col-span-1'>
                  <label className='block text-sm font-medium text-gray-700'>Hunt Title</label>
                  <p className='text-xs text-gray-500 mt-1'>Title of the hunt event</p>
                </div>
                <div className='col-span-2'>
                  <input
                    type='text'
                    className={`w-full px-4 py-2 border ${errs.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter hunt title"
                  />
                  {errs.title && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errs.title}
                    </p>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-3 gap-6 items-center'>
                <div className='col-span-1'>
                  <label className='block text-sm font-medium text-gray-700'>Date Range</label>
                  <p className='text-xs text-gray-500 mt-1'>When the hunt takes place</p>
                </div>
                <div className='col-span-2'>
                  <input
                    type='text'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500'
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                    placeholder="e.g., March 15-20, 2025"
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-6 items-center'>
                <div className='col-span-1'>
                  <label className='block text-sm font-medium text-gray-700'>Point Interval</label>
                  <p className='text-xs text-gray-500 mt-1'>Scoring interval between dogs</p>
                </div>
                <div className='col-span-2'>
                  <input
                    type='number'
                    className={`w-full px-4 py-2 border ${errs.interval ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm`}
                    value={huntInterval}
                    onChange={(e) => setHuntInterval(e.target.value)}
                    min={0}
                    placeholder="Enter interval"
                  />
                  {errs.interval && (
                    <p className='mt-1 text-sm text-red-600'>
                      {errs.interval}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
            <div className='px-6 py-4 bg-amber-50 border-l-4 border-amber-500'>
              <h2 className='text-lg font-semibold text-gray-800'>Stake Type</h2>
              <p className='text-sm text-gray-500'>Select the type of stake for this hunt</p>
            </div>

            <div className='p-6'>
              <SelectableCards
                selected={selected}
                setSelected={setSelected}
              />

              {errs.stake && (
                <p className='mt-3 text-sm text-red-600 bg-red-50 p-2 rounded'>
                  {errs.stake}
                </p>
              )}

              {selected === 'DUAL' && (
                <div className='mt-3 bg-blue-50 p-3 rounded-lg flex items-start'>
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className='text-sm text-blue-700'>
                    When using Dual Stake, configure stake ranges below for All Age and Derby dogs.
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-1/2'>
            <div className='px-6 py-4 bg-green-50 border-l-4 border-green-500'>
              <h2 className='text-lg font-semibold text-gray-800'>Stake Ranges</h2>
              <p className='text-sm text-gray-500'>
                {selected === 'DUAL' 
                  ? 'Set up starting numbers for All Age and Derby dogs'
                  : 'Configure dog number ranges (if applicable)'}
              </p>
            </div>

            <div className='p-6'>
              <div className='grid grid-cols-2 gap-6'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <OptionBoxWithNumber
                    selectedOption={selectedStake1}
                    setSelectedOption={setSelectedStake1}
                    startingNumber={startingNumber1}
                    setStartingNumber={setStartingNumber1}
                    error={errs.startingNumber1}
                  />
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <OptionBoxWithNumber
                    selectedOption={selectedStake2}
                    setSelectedOption={setSelectedStake2}
                    startingNumber={startingNumber2}
                    setStartingNumber={setStartingNumber2}
                    error={errs.startingNumber2}
                  />
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <OptionBoxWithNumber
                    selectedOption={selectedStake3}
                    setSelectedOption={setSelectedStake3}
                    startingNumber={startingNumber3}
                    setStartingNumber={setStartingNumber3}
                    error={errs.startingNumber3}
                  />
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <OptionBoxWithNumber
                    selectedOption={selectedStake4}
                    setSelectedOption={setSelectedStake4}
                    startingNumber={startingNumber4}
                    setStartingNumber={setStartingNumber4}
                    error={errs.startingNumber4}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </div>
  );
}

export default EditHunt;
