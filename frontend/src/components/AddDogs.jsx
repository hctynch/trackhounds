import { useEffect, useState } from 'react';
import { FaCheck, FaX } from 'react-icons/fa6';
import { GoHorizontalRule } from 'react-icons/go';
import { IoAddCircleOutline, IoArrowBackCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService';
import HuntService from '../services/HuntService';
import Box from './Box';

function AddDogs() {
  const [hunt, setHunt] = useState({});
  const navigate = useNavigate();
  const [dogs, setDogs] = useState([
    { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
  ]);
  const [status, setStatus] = useState('success');
  const [owner, setOwner] = useState('');
  const [errors, setErrors] = useState({});

  const handleInputChange = (index, event) => {
    const values = [...dogs];
    values[index][event.target.name] = event.target.value;

    if (event.target.name === 'number' && hunt.stakeRange && hunt.stakeTypeRange) {
      const number = parseInt(event.target.value, 10);
      for (let i = 0; i < hunt.stakeRange.length; i++) {
        if (number >= hunt.stakeRange[i] && (i === hunt.stakeRange.length - 1 || number < hunt.stakeRange[i + 1])) {
          values[index].stake = hunt.stakeTypeRange[i];
          break;
        }
      }
    }

    setDogs(values);
  };

  const handleOwnerChange = (event) => {
    setOwner(event.target.value);
  };

  const handleAddRow = () => {
    setDogs([
      ...dogs,
      { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    ]);
  };

  useEffect(() => {
    const newErrors = {};
    dogs.forEach((dog, index) => {
      if (
        (dog.number || dog.name || dog.sire || dog.dam) &&
        (!dog.number || !dog.name || !dog.stake || !dog.sire || !dog.dam)
      ) {
        newErrors[`row${index}`] = 'All fields are required';
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length !== 0) {
      setStatus('error');
    } else {
      setStatus('success');
    }
    async function getHunt() {
      const data = await HuntService.getHunt();
      setHunt(data);
      if (!hunt) {
        navigate('/');
      }
    }
    getHunt();
  }, [dogs, hunt, navigate]);

  const handleSubmit = async () => {
    const updatedDogs = dogs
      .filter(
        (dog) => dog.number && dog.name && dog.stake && dog.sire && dog.dam
      )
      .map((dog) => ({ ...dog, owner: owner }));
    const call = await DogService.createDogs(updatedDogs);
    if (call) {
      setStatus('error');
      setErrors(call.fields);
      return;
    }
    setStatus('success');
    navigate('/dogs/all');
  };

  return (
    <div className='grid text-black ml-[276px] h-full relative'>
      <Box params='bg-white pt-5 h-full max-h-[calc(100vh-1rem)] my-2'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <a
            className='mr-4 cursor-pointer'
            href='/dogs/all'>
            <IoArrowBackCircleOutline className='text-4xl text-gray-500' />
          </a>
          <p className='text-4xl font-bold'>Add Dogs</p>
          <div className='h-16 items-center flex ml-auto'>
            <p className='italic opacity-70 mr-2'>Status:</p>
            {status === 'success' && (
              <FaCheck className='h-12 w-12 text-green-400' />
            )}
            {status === 'error' && <FaX className='h-12 w-12 text-red-400' />}
          </div>
        </div>
        <div className='w-full flex items-center'>
          <Box params='mt-4 bg-slate-100 w-1/2 pb-4 pt-2'>
            <div className='w-full flex flex-col items-start'>
              <p className='text-lg font-medium'>Owner</p>
              <input
                type='text'
                className='bg-white border w-full border-black/30 rounded-lg px-2 py-1'
                value={owner}
                onChange={handleOwnerChange}
              />
            </div>
          </Box>
        </div>
        <Box params='overflow-y-auto w-full p-4 mt-8 mb-5 bg-slate-100 h-full'>
          <table
            className='table-auto w-full border-collapse border-2 border-black overflow-y-auto'
            style={{ tableLayout: 'fixed' }}>
            <thead className='sticky -top-5 bg-slate-200'>
              <tr className='border-2 border-black'>
                <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>
                  #
                </th>
                <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>
                  Name
                </th>
                <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>
                  <div className='pr-8'>Stake</div>
                </th>
                <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>
                  Sire
                </th>
                <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>
                  Dam
                </th>
              </tr>
            </thead>
            <tbody>
              {dogs.map((dog, index) => (
                <tr
                  key={index}
                  className='border-y-2 border-black w-full'>
                  <td
                    className={`z-1 text-md xl:text-lg text-start border-2 border-black ${
                      errors[`row${index}`] || errors[`number${index + 1}`]
                        ? 'text-red-500'
                        : 'text-black'
                    }`}>
                    <div className='h-8'>
                      <input
                        className='pl-1 w-full h-full bg-white'
                        name='number'
                        value={dog.number}
                        onChange={(event) => handleInputChange(index, event)}
                      />
                    </div>
                  </td>
                  <td
                    className={`z-1 text-md xl:text-lg text-start border-2 border-black ${
                      errors[`row${index}`] || errors[`name${index + 1}`]
                        ? 'text-red-500'
                        : 'text-black'
                    }`}>
                    <div className='h-8'>
                      <input
                        className='pl-1 w-full h-full bg-white'
                        name='name'
                        value={dog.name}
                        onChange={(event) => handleInputChange(index, event)}
                      />
                    </div>
                  </td>
                  <td
                    className={`z-1 text-md xl:text-lg text-start border-2 border-black ${
                      errors[`row${index}`] || errors[`stake${index + 1}`]
                        ? 'text-red-500'
                        : 'text-black'
                    }`}>
                    <div className='h-8'>
                      <select
                        className='pl-1 w-full h-full bg-white'
                        name='stake'
                        value={dog.stake}
                        onChange={(event) => handleInputChange(index, event)}>
                        {hunt.stakeTypeRange &&
                          hunt.stakeTypeRange.map((stake, i) => (
                            <option key={i} value={stake}>
                              {stake === 'ALL_AGE' ? 'All Age' : 'Derby'}
                            </option>
                          ))}
                      </select>
                    </div>
                  </td>
                  <td
                    className={`z-1 text-md xl:text-lg text-start border-2 border-black ${
                      errors[`row${index}`] ? 'text-red-500' : 'text-black'
                    }`}>
                    <div className='h-8'>
                      <input
                        className='pl-1 w-full h-full bg-white'
                        name='sire'
                        value={dog.sire}
                        onChange={(event) => handleInputChange(index, event)}
                      />
                    </div>
                  </td>
                  <td
                    className={`z-1 text-md xl:text-lg text-start border-2 border-black ${
                      errors[`row${index}`] ? 'text-red-500' : 'text-black'
                    }`}>
                    <div className='h-8'>
                      <input
                        className='pl-1 w-full h-full bg-white'
                        name='dam'
                        value={dog.dam}
                        onChange={(event) => handleInputChange(index, event)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            className='mx-auto flex items-center justify-center mt-1 hover:text-green-600 text-green-500/90 cursor-pointer'
            onClick={handleAddRow}>
            <GoHorizontalRule className='text-4xl' />
            <IoAddCircleOutline className='h-8 w-8' />
            <GoHorizontalRule className='text-4xl' />
          </div>
        </Box>
        <div className='mx-auto mb-2'>
          <button
            className={` bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full cursor-pointer`}
            onClick={handleSubmit}>
            Add
          </button>
        </div>
      </Box>
    </div>
  );
}

export default AddDogs;
