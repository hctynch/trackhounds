import { useEffect, useRef, useState } from 'react';
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
  const [activeSuggestionField, setActiveSuggestionField] = useState({ index: -1, field: '' });
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const suggestionRefs = useRef({});
  const inputRefs = useRef({});
  
  // Create a separate function to handle suggestion generation
  const generateSuggestions = (field, value) => {
    if (!value || value.length === 0) {
      if (field === 'sire') {
        setSireSuggestions([]);
      } else {
        setDamSuggestions([]);
      }
      return;
    }
    
    // Get all unique values for the field from other filled inputs
    const uniqueValues = Array.from(
      new Set(
        dogs
          .filter(dog => dog[field] && dog[field].trim() !== '')
          .map(dog => dog[field])
      )
    );
    
    // Filter for matching suggestions, excluding exact matches
    const filteredSuggestions = uniqueValues
      .filter(val => 
        val.toLowerCase().includes(value.toLowerCase()) &&
        val.toLowerCase() !== value.toLowerCase()
      );
    
    // Set appropriate suggestion state
    if (field === 'sire') {
      setSireSuggestions(filteredSuggestions);
      setDamSuggestions([]);
    } else {
      setDamSuggestions(filteredSuggestions);
      setSireSuggestions([]);
    }
    
    // Reset highlighted suggestion when suggestions list changes
    setHighlightedSuggestion(-1);
  };

  const handleInputChange = (index, event) => {
    setSubmitErrors(false); // Reset the flag on input change
    const fieldName = event.target.name;
    const value = event.target.value;
    
    // Update dogs array
    const updatedDogs = [...dogs];
    updatedDogs[index][fieldName] = value;
    setDogs(updatedDogs);

    // Handle stake type based on number range
    if (
      fieldName === 'number' &&
      hunt.stakeRange &&
      hunt.stakeTypeRange
    ) {
      const number = parseInt(value, 10);
      for (let i = 0; i < hunt.stakeRange.length; i++) {
        if (
          number >= hunt.stakeRange[i] &&
          (i === hunt.stakeRange.length - 1 || number < hunt.stakeRange[i + 1])
        ) {
          const newDogs = [...updatedDogs];
          newDogs[index].stake = hunt.stakeTypeRange[i];
          setDogs(newDogs);
          break;
        }
      }
    } 
    // Handle sire/dam field autocomplete
    else if (fieldName === 'sire' || fieldName === 'dam') {
      setActiveSuggestionField({ index, field: fieldName });
      // Use timeout to debounce and prevent rapid state updates
      setTimeout(() => {
        generateSuggestions(fieldName, value, index);
      }, 10);
    } 
    // Clear suggestions for other fields
    else {
      setSireSuggestions([]);
      setDamSuggestions([]);
      setActiveSuggestionField({ index: -1, field: '' });
      setHighlightedSuggestion(-1);
    }
  };

  const handleOwnerChange = (event) => {
    setOwner(event.target.value);
    // Clear suggestions when interacting with owner field
    setSireSuggestions([]);
    setDamSuggestions([]);
    setActiveSuggestionField({ index: -1, field: '' });
    setHighlightedSuggestion(-1);
  };

  const handleSelectSuggestion = (suggestion) => {
    const { index, field } = activeSuggestionField;
    if (index >= 0 && field) {
      const updatedDogs = [...dogs];
      updatedDogs[index][field] = suggestion;
      setDogs(updatedDogs);
      
      // Clear suggestions after selection
      if (field === 'sire') {
        setSireSuggestions([]);
      } else if (field === 'dam') {
        setDamSuggestions([]);
      }
      
      // Reset active field and highlighted suggestion
      setActiveSuggestionField({ index: -1, field: '' });
      setHighlightedSuggestion(-1);
      
      // Focus on the next input field if possible
      const nextFieldRef = inputRefs.current[`${field === 'sire' ? 'dam' : 'number'}-${field === 'dam' ? index + 1 : index}`];
      if (nextFieldRef) {
        nextFieldRef.focus();
      }
    }
  };

  const handleKeyDown = (event, index, field) => {
    const suggestions = field === 'sire' ? sireSuggestions : damSuggestions;
    
    // If no suggestions are showing, delegate to table navigation
    if (!suggestions.length) {
      handleTableKeyDown(event, index, field);
      return;
    }
    
    // Handle suggestion list navigation
    switch (event.key) {
      case 'ArrowDown':
        // If we're not in a suggestion list yet, delegate to table navigation
        if (highlightedSuggestion === -1 && suggestions.length === 0) {
          handleTableKeyDown(event, index, field);
        } else {
          event.preventDefault();
          setHighlightedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        // If we're not in a suggestion list yet, delegate to table navigation
        if (highlightedSuggestion === -1) {
          handleTableKeyDown(event, index, field);
        } else {
          event.preventDefault();
          setHighlightedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
        break;
        
      case 'ArrowRight':
      case 'ArrowLeft':
        // For left/right arrows, always use table navigation
        handleTableKeyDown(event, index, field);
        break;
        
      case 'Tab':
        // If suggestion is highlighted, select it
        if (highlightedSuggestion >= 0) {
          event.preventDefault();
          handleSelectSuggestion(suggestions[highlightedSuggestion]);
        } else {
          // Otherwise clear suggestions and move to next field normally
          setSireSuggestions([]);
          setDamSuggestions([]);
          setActiveSuggestionField({ index: -1, field: '' });
          setHighlightedSuggestion(-1);
        }
        break;
        
      case 'Enter':
        if (highlightedSuggestion >= 0) {
          event.preventDefault();
          handleSelectSuggestion(suggestions[highlightedSuggestion]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setSireSuggestions([]);
        setDamSuggestions([]);
        setActiveSuggestionField({ index: -1, field: '' });
        setHighlightedSuggestion(-1);
        break;
        
      default:
        break;
    }
  };

  const handleAddRow = () => {
    setDogs([
      ...dogs,
      { number: '', name: '', stake: 'ALL_AGE', sire: '', dam: '' },
    ]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside any suggestion container
      const isClickInside = Object.values(suggestionRefs.current).some(ref => 
        ref && ref.contains(event.target)
      );
      
      if (!isClickInside) {
        // Only clear if there are suggestions to clear
        if (sireSuggestions.length > 0 || damSuggestions.length > 0) {
          setSireSuggestions([]);
          setDamSuggestions([]);
          setHighlightedSuggestion(-1);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sireSuggestions, damSuggestions]);

  // Get hunt data once on component mount
  useEffect(() => {
    async function getHunt() {
      const data = await HuntService.getHunt();
      setHunt(data);
      if (!data) {
        navigate('/');
      }
    }
    getHunt();
  }, [navigate]);

  // Handle errors validation separately to avoid excessive re-renders
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
    
    const hasErrors = Object.keys(newErrors).length > 0;
    
    if (submitErrors) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    } else {
      setErrors(newErrors);
    }
    
    if (hasErrors || submitErrors) {
      setStatus('error');
    } else {
      setStatus('success');
    }
  }, [dogs, submitErrors]);

  const handleSubmit = async () => {
    const updatedDogs = dogs
      .filter(
        (dog) => dog.number && dog.name && dog.stake && dog.sire && dog.dam
      )
      .map((dog) => ({ ...dog, owner: owner }));
    
    if (updatedDogs.length === 0) {
      setStatus('error');
      setSubmitErrors(true);
      return;
    }
    
    const call = await DogService.createDogs(updatedDogs);
    if (call) {
      setStatus('error');
      setErrors(call.fields);
      setSubmitErrors(true);
      return;
    }
    
    setStatus('success');
    setSubmitErrors(false);
    navigate('/dogs/all');
  };

  // Add this new function for general navigation between input fields
const handleTableKeyDown = (event, index, fieldName) => {
  // Only handle navigation keys if we're not in a suggestion list or if it's a field without suggestions
  const isInSuggestionField = (fieldName === 'sire' || fieldName === 'dam') && 
    ((fieldName === 'sire' && sireSuggestions.length > 0) || 
     (fieldName === 'dam' && damSuggestions.length > 0)) &&
    highlightedSuggestion >= 0;
  
  // Don't override the suggestion navigation
  if (isInSuggestionField && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    return;
  }
  
  // Handle arrow navigation between fields
  switch (event.key) {
    case 'ArrowRight':
      // Move to the next field in the same row
      const nextFieldMap = {
        'number': 'name',
        'name': 'stake',
        'stake': 'sire',
        'sire': 'dam',
      };
      
      if (nextFieldMap[fieldName]) {
        event.preventDefault();
        const nextField = inputRefs.current[`${nextFieldMap[fieldName]}-${index}`];
        if (nextField) {
          nextField.focus();
          // Clear suggestions when moving away from a suggestion field
          if (fieldName === 'sire' || fieldName === 'dam') {
            setSireSuggestions([]);
            setDamSuggestions([]);
            setHighlightedSuggestion(-1);
          }
        }
      }
      break;
      
    case 'ArrowLeft':
      // Move to the previous field in the same row
      const prevFieldMap = {
        'name': 'number',
        'stake': 'name',
        'sire': 'stake',
        'dam': 'sire',
      };
      
      if (prevFieldMap[fieldName]) {
        event.preventDefault();
        const prevField = inputRefs.current[`${prevFieldMap[fieldName]}-${index}`];
        if (prevField) {
          prevField.focus();
          // Clear suggestions when moving away from a suggestion field
          if (fieldName === 'sire' || fieldName === 'dam') {
            setSireSuggestions([]);
            setDamSuggestions([]);
            setHighlightedSuggestion(-1);
          }
        }
      }
      break;
      
    case 'ArrowUp':
      // Move to the same field in the row above
      if (index > 0) {
        event.preventDefault();
        const upField = inputRefs.current[`${fieldName}-${index - 1}`];
        if (upField) {
          upField.focus();
          // Clear suggestions when moving away from the current field
          if (fieldName === 'sire' || fieldName === 'dam') {
            setSireSuggestions([]);
            setDamSuggestions([]);
            setHighlightedSuggestion(-1);
            // Set the active field for the new position
            setActiveSuggestionField({ index: index - 1, field: fieldName });
          }
        }
      }
      break;
      
    case 'ArrowDown':
      // Move to the same field in the row below
      if (index < dogs.length - 1) {
        event.preventDefault();
        const downField = inputRefs.current[`${fieldName}-${index + 1}`];
        if (downField) {
          downField.focus();
          // Clear suggestions when moving away from the current field
          if (fieldName === 'sire' || fieldName === 'dam') {
            setSireSuggestions([]);
            setDamSuggestions([]);
            setHighlightedSuggestion(-1);
            // Set the active field for the new position
            setActiveSuggestionField({ index: index + 1, field: fieldName });
          }
        }
      }
      break;
      
    default:
      break;
  }
};

  const columns = ['#', 'Name', 'Stake', 'Sire', 'Dam'];
  const data = dogs.map((dog, index) => [
    <input
      key={`number-${index}`}
      ref={el => inputRefs.current[`number-${index}`] = el}
      className={`pl-1 w-full h-full bg-gray-100 ${
        errors[`row${index}`] || errors[`number${index + 1}`]
          ? 'text-red-500'
          : 'text-black'
      }`}
      name='number'
      value={dog.number}
      onChange={(event) => handleInputChange(index, event)}
      onKeyDown={(event) => handleTableKeyDown(event, index, 'number')}
    />,
    <input
      key={`name-${index}`}
      ref={el => inputRefs.current[`name-${index}`] = el}
      className={`pl-1 w-full h-full bg-gray-100 ${
        errors[`row${index}`] || errors[`name${index + 1}`]
          ? 'text-red-500'
          : 'text-black'
      }`}
      name='name'
      value={dog.name}
      onChange={(event) => handleInputChange(index, event)}
      onKeyDown={(event) => handleTableKeyDown(event, index, 'name')}
    />,
    <select
      key={`stake-${index}`}
      ref={el => inputRefs.current[`stake-${index}`] = el}
      className={`pr-2 h-full bg-gray-100 ${
        errors[`row${index}`] || errors[`stake${index + 1}`]
          ? 'text-red-500'
          : 'text-black'
      }`}
      name='stake'
      value={dog.stake}
      onChange={(event) => handleInputChange(index, event)}
      onKeyDown={(event) => handleTableKeyDown(event, index, 'stake')}>
      {hunt.stakeTypeRange &&
        ['ALL_AGE', 'DERBY'].map((stake, i) => (
          <option
            key={i}
            value={stake}>
            {stake === 'ALL_AGE' ? 'All Age' : 'Derby'}
          </option>
        ))}
    </select>,
    <div key={`sire-container-${index}`} className="relative w-full">
      <input
        ref={el => inputRefs.current[`sire-${index}`] = el}
        className={`pl-1 w-full h-full bg-gray-100 ${
          errors[`row${index}`] ? 'text-red-500' : 'text-black'
        }`}
        name='sire'
        value={dog.sire}
        onClick={() => setActiveSuggestionField({ index, field: 'sire' })}
        onChange={(event) => handleInputChange(index, event)}
        onKeyDown={(event) => handleKeyDown(event, index, 'sire')}
      />
      {sireSuggestions.length > 0 && activeSuggestionField.index === index && activeSuggestionField.field === 'sire' && (
        <ul 
          ref={el => suggestionRefs.current[`sire-${index}`] = el}
          className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md w-full max-h-40 overflow-y-auto mt-1"
        >
          {sireSuggestions.map((suggestion, i) => (
            <li
              key={i}
              className={`px-3 py-1 cursor-pointer ${highlightedSuggestion === i ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => handleSelectSuggestion(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>,
    <div key={`dam-container-${index}`} className="relative w-full">
      <input
        ref={el => inputRefs.current[`dam-${index}`] = el}
        className={`pl-1 w-full h-full bg-gray-100 ${
          errors[`row${index}`] ? 'text-red-500' : 'text-black'
        }`}
        name='dam'
        value={dog.dam}
        onClick={() => setActiveSuggestionField({ index, field: 'dam' })}
        onChange={(event) => handleInputChange(index, event)}
        onKeyDown={(event) => handleKeyDown(event, index, 'dam')}
      />
      {damSuggestions.length > 0 && activeSuggestionField.index === index && activeSuggestionField.field === 'dam' && (
        <ul 
          ref={el => suggestionRefs.current[`dam-${index}`] = el}
          className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md w-full max-h-40 overflow-y-auto mt-1"
        >
          {damSuggestions.map((suggestion, i) => (
            <li
              key={i}
              className={`px-3 py-1 cursor-pointer ${highlightedSuggestion === i ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => handleSelectSuggestion(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>,
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
            className='bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full cursor-pointer'
            onClick={handleSubmit}>
            Add
          </button>
        </div>
      </Box>
    </div>
  );
}

export default AddDogs;
