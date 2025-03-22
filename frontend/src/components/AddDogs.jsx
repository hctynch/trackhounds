import { useEffect, useState } from 'react';
import { FaCheck, FaX } from 'react-icons/fa6';
import { GoHorizontalRule } from 'react-icons/go';
import { IoAddCircleOutline, IoArrowBackCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService';
import HuntService from '../services/HuntService';
import Box from './Box';
import StyledTable from './StyledTable';

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
  const [submitErrors, setSubmitErrors] = useState(false);
  const [sireSuggestions, setSireSuggestions] = useState([]);
  const [damSuggestions, setDamSuggestions] = useState([]);
  const handleInputChange = (index, event) => {
    setSubmitErrors(false); // Reset the flag on input change
    const values = [...dogs];
    values[index][event.target.name] = event.target.value;

    if (
      event.target.name === 'number' &&
      hunt.stakeRange &&
      hunt.stakeTypeRange
    ) {
      const number = parseInt(event.target.value, 10);
      for (let i = 0; i < hunt.stakeRange.length; i++) {
        if (
          number >= hunt.stakeRange[i] &&
          (i === hunt.stakeRange.length - 1 || number < hunt.stakeRange[i + 1])
        ) {
          values[index].stake = hunt.stakeTypeRange[i];
          break;
        }
      }
    } else if (event.target.name === 'sire') {
      if (event.target.value.length > 0) {
        const filteredSuggestions = values
          .filter((suggestion) =>
            suggestion.sire
              .toLowerCase()
              .includes(event.target.value.toLowerCase())
          )
          .map((suggestion) => suggestion.sire);
        setSireSuggestions(filteredSuggestions);
      } else {
        setSireSuggestions([]);
      }
    } else if (event.target.name === 'dam') {
      if (event.target.value.length > 0) {
        const filteredSuggestions = values
          .filter((suggestion) =>
            suggestion.dam
              .toLowerCase()
              .includes(event.target.value.toLowerCase())
          )
          .map((suggestion) => suggestion.dam);
        setDamSuggestions(filteredSuggestions);
      } else {
        setDamSuggestions([]);
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
    if (submitErrors) {
      setErrors({ ...errors, ...newErrors });
    } else {
      setErrors(newErrors);
    }
    if (Object.keys(newErrors).length !== 0) {
      setStatus('error');
    } else {
      setStatus('success');
      if (submitErrors) {
        setStatus('error');
      }
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
      setSubmitErrors(true); // Set the flag to indicate errors from submit
      console.log(call);
      return;
    }
    setStatus('success');
    setSubmitErrors(false); // Reset the flag on successful submit
    navigate('/dogs/all');
  };

  const handleSelectSuggestion = (i, event) => {};

  const columns = ['#', 'Name', 'Stake', 'Sire', 'Dam'];
  const data = dogs.map((dog, index) => [
    <input
      className={`pl-1 w-full h-full bg-gray-100 ${
        errors[`row${index}`] || errors[`number${index + 1}`]
          ? 'text-red-500'
          : 'text-black'
      }`}
      name='number'
      value={dog.number}
      onChange={(event) => handleInputChange(index, event)}
    />,
    <input
      className={`pl-1 w-full h-full bg-gray-100 ${
        errors[`row${index}`] || errors[`name${index + 1}`]
          ? 'text-red-500'
          : 'text-black'
      }`}
      name='name'
      value={dog.name}
      onChange={(event) => handleInputChange(index, event)}
    />,
    <select
      className={`pr-2 h-full bg-gray-100 ${
        errors[`row${index}`] || errors[`stake${index + 1}`]
          ? 'text-red-500'
          : 'text-black'
      }`}
      name='stake'
      value={dog.stake}
      onChange={(event) => handleInputChange(index, event)}>
      {hunt.stakeTypeRange &&
        ['ALL_AGE', 'DERBY'].map((stake, i) => (
          <option
            key={i}
            value={stake}>
            {stake === 'ALL_AGE' ? 'All Age' : 'Derby'}
          </option>
        ))}
    </select>,
    <div>
      <input
        className={`pl-1 w-full h-full bg-gray-100 ${
          errors[`row${index}`] ? 'text-red-500' : 'text-black'
        }`}
        name='sire'
        value={dog.sire}
        onChange={(event) => handleInputChange(index, event)}
      />
      {sireSuggestions.length > 0 && (
        <ul>
          {sireSuggestions.map((suggestion, i) => (
            <li
              key={i}
              onClick={(event) => handleSelectSuggestion(i, event)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>,
    <input
      className={`pl-1 w-full h-full bg-gray-100 ${
        errors[`row${index}`] ? 'text-red-500' : 'text-black'
      }`}
      name='dam'
      value={dog.dam}
      onChange={(event) => handleInputChange(index, event)}
    />,
  ]);

  return (
    <div className='grid text-black ml-[276px] h-full relative'>
      <Box params='bg-white pt-5 h-full max-h-[calc(100vh-1rem)] my-2 mr-4'>
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
          <StyledTable
            columns={columns}
            data={data}
          />
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
