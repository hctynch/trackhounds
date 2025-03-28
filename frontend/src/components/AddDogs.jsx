import { useEffect, useRef, useState } from 'react';
import { FaCheck, FaX } from 'react-icons/fa6';
import { IoAddCircleOutline, IoArrowBackCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService';
import HuntService from '../services/HuntService';
import Button from './Button';
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
      type='number'
      key={`number-${index}`}
      ref={el => inputRefs.current[`number-${index}`] = el}
      className={`pl-2 w-full h-full rounded border ${
        errors[`row${index}`] || errors[`number${index + 1}`]
          ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
      } focus:ring-2 focus:outline-none transition-colors`}
      name='number'
      value={dog.number}
      onChange={(event) => handleInputChange(index, event)}
      onKeyDown={(event) => handleTableKeyDown(event, index, 'number')}
    />,
    <input
      key={`name-${index}`}
      ref={el => inputRefs.current[`name-${index}`] = el}
      className={`pl-2 w-full h-full rounded border ${
        errors[`row${index}`] || errors[`name${index + 1}`]
          ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
      } focus:ring-2 focus:outline-none transition-colors`}
      name='name'
      value={dog.name}
      onChange={(event) => handleInputChange(index, event)}
      onKeyDown={(event) => handleTableKeyDown(event, index, 'name')}
    />,
    <select
      key={`stake-${index}`}
      ref={el => inputRefs.current[`stake-${index}`] = el}
      className={`px-2 py-1 w-full h-full rounded border ${
        errors[`row${index}`] || errors[`stake${index + 1}`]
          ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
      } focus:ring-2 focus:outline-none transition-colors`}
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
        className={`pl-2 w-full h-full rounded border ${
          errors[`row${index}`] 
            ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
        } focus:ring-2 focus:outline-none transition-colors`}
        name='sire'
        value={dog.sire}
        onClick={() => setActiveSuggestionField({ index, field: 'sire' })}
        onChange={(event) => handleInputChange(index, event)}
        onKeyDown={(event) => handleKeyDown(event, index, 'sire')}
      />
      {sireSuggestions.length > 0 && activeSuggestionField.index === index && activeSuggestionField.field === 'sire' && (
        <ul 
          ref={el => suggestionRefs.current[`sire-${index}`] = el}
          className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg w-full max-h-48 overflow-y-auto mt-1"
        >
          {sireSuggestions.map((suggestion, i) => (
            <li
              key={i}
              className={`px-3 py-1.5 cursor-pointer ${highlightedSuggestion === i ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
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
        className={`pl-2 w-full h-full rounded border ${
          errors[`row${index}`] 
            ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
        } focus:ring-2 focus:outline-none transition-colors`}
        name='dam'
        value={dog.dam}
        onClick={() => setActiveSuggestionField({ index, field: 'dam' })}
        onChange={(event) => handleInputChange(index, event)}
        onKeyDown={(event) => handleKeyDown(event, index, 'dam')}
      />
      {damSuggestions.length > 0 && activeSuggestionField.index === index && activeSuggestionField.field === 'dam' && (
        <ul 
          ref={el => suggestionRefs.current[`dam-${index}`] = el}
          className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg w-full max-h-48 overflow-y-auto mt-1"
        >
          {damSuggestions.map((suggestion, i) => (
            <li
              key={i}
              className={`px-3 py-1.5 cursor-pointer ${highlightedSuggestion === i ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
              onClick={() => handleSelectSuggestion(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>,
  ]);

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dogs/all')}
              className="mr-4 p-1 rounded-full cursor-pointer"
            >
              <IoArrowBackCircleOutline className="text-3xl text-gray-500 h-9 w-9" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Register Dogs</h1>
              <p className="text-gray-500 mt-1">
                {hunt.title ? `For: ${hunt.title}` : 'No active hunt'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">Status:</span>
              {status === 'success' ? (
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center">
                  <FaCheck className="mr-1" /> Ready
                </span>
              ) : (
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center">
                  <FaX className="mr-1" /> Errors
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Owner Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-800">Owner Information</h2>
          <p className="text-sm text-gray-500">Common owner for all dogs being registered</p>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
          <input
            type="text"
            value={owner}
            onChange={handleOwnerChange}
            className="w-full lg:w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:ring-2 focus:border-blue-500 focus:outline-none"
            placeholder="Enter owner name (will apply to all dogs)"
          />
        </div>
      </div>
      
      {/* Error Messages */}
      {submitErrors && Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <FaX className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 text-start">Please correct the following errors:</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside text-start">
                {errors != null && Object.values(errors).map((error, index) => (<li key={index}>{error}</li>))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Dog Entry Table */}
      <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Dog Registry</h2>
          <p className="text-sm text-gray-500">Enter dog information. Use arrow keys to navigate between fields.</p>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded border border-gray-200">
            <StyledTable
              columns={columns}
              data={data}
              className="w-full"
            />
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button
              type="secondary"
              onClick={handleAddRow}
              className="flex items-center rounded-xl px-4 py-2"
            >
              <IoAddCircleOutline className="mr-2" size={18} />
              Add Row
            </Button>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button
            type="primary"
            onClick={handleSubmit}
            className="rounded-xl px-6 py-2.5 font-medium"
          >
            Submit Registration
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddDogs;
