import { useEffect, useState } from 'react';
import { IoArrowBackCircleOutline } from 'react-icons/io5';
import { useLocation, useNavigate } from 'react-router-dom';
import DogService from '../services/DogService';
import Box from './Box';
import SelectableCards from './SelectableCards';

function EditDog() {
  const location = useLocation();
  const { dog } = location.state || {};
  const [number, setNumber] = useState(dog?.number || '');
  const [name, setName] = useState(dog?.name || '');
  const [stake, setStake] = useState(dog?.stake || 'ALL_AGE');
  const [owner, setOwner] = useState(dog?.owner || '');
  const [sire, setSire] = useState(dog?.sire || '');
  const [dam, setDam] = useState(dog?.dam || '');
  const [points, setPoints] = useState(dog?.points || 0);
  const [errs, setErrs] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!dog) {
      navigate('/dogs/all');
    }
  }, [dog, navigate]);

  const handleEdit = async () => {
    const newErrs = {};
    let err = false;
    if (name.length < 1) {
      newErrs.name = 'Name cannot be empty.';
      err = true;
    }
    if (owner.length < 1) {
      newErrs.owner = 'Owner cannot be empty.';
      err = true;
    }
    setErrs(newErrs);
    if (err) {
      return;
    }

    const editedDog = {
      number,
      name,
      stake,
      owner,
      sire,
      dam,
      points,
    };

    const data = await DogService.editDog(editedDog);
    if (data instanceof Error) {
      console.log(data.response.data);
      setErrs(data.response.data.fields);
    } else {
      navigate('/dogs/all');
    }
  };

  return (
    <div className='text-black flex flex-col ml-[276px] items-start py-2 mr-4 h-full'>
      <Box params='h-full w-full bg-white pt-8 overflow-y-auto'>
        <div className='w-full flex border-b-2 border-gray-300 pb-4'>
          <a className='mr-4 cursor-pointer' href='/dogs/all'>
            <IoArrowBackCircleOutline className='text-4xl text-gray-500' />
          </a>
          <p className='text-4xl font-bold'>Edit Dog</p>
          <button
            className='ml-auto bg-gray-400 hover:bg-gray-500 rounded-2xl px-4 cursor-pointer'
            onClick={handleEdit}
          >
            Edit
          </button>
        </div>
        <div className='flex flex-col w-full h-full gap-y-4 overflow-y-auto min-h-100'>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Number</p>
              <p className='italic opacity-60 text-sm'>Number of the Dog</p>
            </div>
            <div className='w-full flex items-center'>
              <input
                type='number'
                className='border w-full rounded'
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                disabled
              />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Name</p>
              <p className='italic opacity-60 text-sm'>Name of the Dog</p>
            </div>
            <div className='w-full flex flex-col justify-center items-center'>
              <input
                type='text'
                className={`border w-full rounded ${
                  errs && errs.name ? 'border-red-400' : ''
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errs && errs.name && (
                <p className='text-sm w-full italic opacity-60 text-red-500'>
                  {errs.name}
                </p>
              )}
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Stake</p>
              <p className='italic opacity-60 text-sm'>Stake of the Dog</p>
            </div>
            <div className='w-full flex items-center'>
                <SelectableCards
                selected={stake}
                setSelected={setStake}
                />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Owner</p>
              <p className='italic opacity-60 text-sm'>Owner of the Dog</p>
            </div>
            <div className='w-full flex flex-col justify-center items-center'>
              <input
                type='text'
                className={`border w-full rounded ${
                  errs && errs.owner ? 'border-red-400' : ''
                }`}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
              {errs && errs.owner && (
                <p className='text-sm w-full italic opacity-60 text-red-500'>
                  {errs.owner}
                </p>
              )}
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Sire</p>
              <p className='italic opacity-60 text-sm'>Sire of the Dog</p>
            </div>
            <div className='w-full flex items-center'>
              <input
                type='text'
                className='border w-full rounded'
                value={sire}
                onChange={(e) => setSire(e.target.value)}
              />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Dam</p>
              <p className='italic opacity-60 text-sm'>Dam of the Dog</p>
            </div>
            <div className='w-full flex items-center'>
              <input
                type='text'
                className='border w-full rounded'
                value={dam}
                onChange={(e) => setDam(e.target.value)}
              />
            </div>
          </div>
        </Box>
        <Box params='w-full bg-slate-50 my-2'>
          <div className='text-start py-2 grid grid-cols-2 w-full'>
            <div className='w-full'>
              <p className='text-lg font-semibold'>Points</p>
              <p className='italic opacity-60 text-sm'>Points of the Dog</p>
            </div>
            <div className='w-full flex items-center'>
              <input
                type='number'
                className='border w-full rounded'
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                disabled
              />
            </div>
          </div>
        </Box>     
        </div>
        
      </Box>
    </div>
  );
}

export default EditDog;