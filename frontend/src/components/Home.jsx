import React, { useEffect, useState } from 'react';
import HuntService from '../services/HuntService';

function Home() {
  const [hunt, setHunt] = useState({
    title: '',
    dates: '',
    stake: '',
    huntInterval: 0,
    stakeTypeRange: [],
    stakeRange: [],
  });

  const [editFields, setEditFields] = useState({
    title: '',
    dates: '',
    stake: '',
    interval: 0,
  });

  const [stakeFields, setStakeFields] = useState({
    stakeTypeRange: [],
    stakeRange: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchHunt() {
      const data = await HuntService.getHunt();
      if (data instanceof Error) {
        // Handle error
      } else {
        setHunt(data);
        setEditFields({
          title: data.title || '',
          dates: data.dates,
          stake: data.stake,
          interval: data.huntInterval,
        });
        setStakeFields({
          stakeTypeRange: data.stakeTypeRange || [],
          stakeRange: data.stakeRange || [],
        });
      }
    }
    fetchHunt();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFields((prevFields) => ({
      ...prevFields,
      [name]: value,
    }));
  };

  const handleStakeTypeChange = (index, value) => {
    const updatedStakeTypeRange = [...stakeFields.stakeTypeRange];
    updatedStakeTypeRange[index] = value;
    setStakeFields((prevFields) => ({
      ...prevFields,
      stakeTypeRange: updatedStakeTypeRange,
    }));
  };

  const handleStakeRangeChange = (index, value) => {
    const updatedStakeRange = [...stakeFields.stakeRange];
    updatedStakeRange[index] = value;
    setStakeFields((prevFields) => ({
      ...prevFields,
      stakeRange: updatedStakeRange,
    }));
  };

  const handleUpdateHunt = async () => {
    const updatedHunt = await HuntService.editHunt(editFields);
    if (updatedHunt instanceof Error) {
      setErrors(updatedHunt.response.data.fields);
    } else {
      setHunt(updatedHunt);
      setErrors({});
    }
  };

  const handleUpdateStakes = async () => {
    const updatedHunt = await HuntService.setStakes(stakeFields);
    if (updatedHunt instanceof Error) {
      setErrors(updatedHunt.response.data.fields);
    } else {
      setHunt(updatedHunt);
      setErrors({});
    }
  };

  const handleCreateHunt = async () => {
    const correctFields = {
      ...editFields,
      huntInterval: editFields.interval,
    }
    const newHunt = await HuntService.createHunt(correctFields);
    if (newHunt instanceof Error) {
      setErrors(newHunt.response.data.fields);
    } else {
      setHunt(newHunt);
      setErrors({});
    }
  };

  return (
    <div className='flex flex-wrap text-black w-full my-auto justify-center'>
      <div className='flex flex-col items-start bg-gradient-to-br from-white to-gray-200/80 rounded-lg shadow-2xl px-4 border-black/20 border-2 w-5/12 mr-4'>
        <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>
          Hunt Overview
        </p>
        <div className='w-full flex'>
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Title: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>
            {hunt.title}
          </p>
        </div>
        <div className='w-full flex'>
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Dates Held: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>
            {hunt.dates}
          </p>
        </div>
        <div className='w-full flex'>
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Stake: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>
            {hunt.stake}
          </p>
        </div>
        <div className='w-full flex'>
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Interval: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>
            {hunt.huntInterval}
          </p>
        </div>
      </div>
      <div className='flex flex-col items-start bg-gradient-to-bl from-white to-gray-200/80 rounded-lg shadow-2xl px-4 border-black/20 border-2 w-[56.5%]'>
        <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>
          Stakes
        </p>
        <div className='w-full flex flex-row font-medium text-sm 2xl:text-xl border rounded-lg p-2 items-start my-auto'>
          {stakeFields.stakeTypeRange.map((stakeType, index) => (
            <div key={index} className='w-1/4 flex flex-col items-center justify-center'>
              <p>Stake {index + 1}</p>
              <select
                className='w-2/3 border-2 border-black/40 rounded-lg p-2'
                value={stakeType}
                onChange={(e) => handleStakeTypeChange(index, e.target.value)}
              >
                <option value='ALL_AGE'>All Age</option>
                <option value='DERBY'>Derby</option>
              </select>
              {index > 0 && (
                <input
                  type='number'
                  className='w-2/3 border-2 border-black/40 rounded-lg p-2 mt-2'
                  value={stakeFields.stakeRange[index - 1]}
                  onChange={(e) => handleStakeRangeChange(index - 1, e.target.value)}
                  placeholder='#'
                />
              )}
            </div>
          ))}
        </div>
        <div className='w-full my-auto '>
          <button
            className='bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 border-b-4 border-gray-600 hover:border-gray-800 rounded w-40'
            onClick={handleUpdateStakes}
          >
            Update
          </button>
        </div>
      </div>
      <div className='w-[99%] flex flex-row items-start bg-gradient-to-t from-white to-gray-200/80 rounded-lg shadow-2xl px-4 border-black/20 border-2 mx-auto mt-20 pb-4'>
        <div className='w-[60%] text-start'>
          <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>
            Edit/New Hunt Form
          </p>
          <div className='w-full flex'>
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Title: </p>
            <div className='flex flex-col items-end w-5/12 ml-auto'>
            <input
              type='text'
              name='title'
              value={editFields.title}
              onChange={handleInputChange}
              className='w-full text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'
            />
            {errors.title && <div className='text-red-500 -my-3'>{errors.title}</div>}
            </div>
          </div>
          <div className='w-full flex'>
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Dates Held: </p>
            <input
              type='text'
              name='dates'
              value={editFields.dates}
              onChange={handleInputChange}
              className='w-5/12 text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'
            />
          </div>
          <div className='w-full flex'>
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Stake: </p>
            <select
              name='stake'
              value={editFields.stake}
              onChange={handleInputChange}
              className='w-5/12 text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'
            >
              <option value='ALL_AGE'>All Age</option>
              <option value='DERBY'>Derby</option>
            </select>
          </div>
          <div className='w-full flex'>
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Interval: </p>
            <div className='flex flex-col items-end w-5/12 ml-auto'>
            <input
              type='number'
              name='interval'
              value={editFields.interval}
              onChange={handleInputChange}
              className='w-full text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'
            />
            {errors.interval && <div className='text-red-500 -my-3'>{errors.interval}</div>}
            </div>
          </div>
        </div>
        <div className='flex justify-center flex-col items-center w-1/3 h-full mx-auto'>
          <button
            className='my-10 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded w-60'
            onClick={handleUpdateHunt}
          >
            Edit Hunt
          </button>
          <button
            className='bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded w-60'
            onClick={handleCreateHunt}
          >
            New Hunt
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
