import PropTypes from 'prop-types';

export default function SelectableCards({ selected, setSelected }) {
  // Helper function to toggle selection
  const toggleSelection = (value) => {
    if (value === 'DUAL') {
      // If trying to directly select DUAL, select both ALL_AGE and DERBY
      setSelected('DUAL');
      return;
    }
    
    if (selected === value) {
      // If clicking the only selected option, don't deselect completely
      return;
    }
    
    if (selected === 'DUAL') {
      // If DUAL is currently selected and clicking on one option,
      // only keep the other option selected
      setSelected(value === 'ALL_AGE' ? 'DERBY' : 'ALL_AGE');
      return;
    }
    
    if (value === 'ALL_AGE' && selected === 'DERBY') {
      // Selecting ALL_AGE when DERBY is selected = DUAL
      setSelected('DUAL');
      return;
    }
    
    if (value === 'DERBY' && selected === 'ALL_AGE') {
      // Selecting DERBY when ALL_AGE is selected = DUAL
      setSelected('DUAL');
      return;
    }
    
    // Otherwise just select the clicked option
    setSelected(value);
  };

  // Helper function to check if a stake type is selected
  const isSelected = (value) => {
    if (selected === value) return true;
    if (selected === 'DUAL' && (value === 'ALL_AGE' || value === 'DERBY')) return true;
    return false;
  };

  return (
    <div className='grid grid-cols-3 gap-x-3 w-full'>
      {/* Option 1: All Age */}
      <div
        onClick={() => toggleSelection('ALL_AGE')}
        className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
          isSelected('ALL_AGE')
            ? 'border-blue-500 bg-blue-100 shadow-lg'
            : 'border-gray-300 bg-white hover:border-gray-500'
        }`}>
        <h3 className='text-lg font-semibold text-center'>All Age</h3>
      </div>

      {/* Option 2: Derby */}
      <div
        onClick={() => toggleSelection('DERBY')}
        className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
          isSelected('DERBY')
            ? 'border-blue-500 bg-blue-100 shadow-lg'
            : 'border-gray-300 bg-white hover:border-gray-500'
        }`}>
        <h3 className='text-lg font-semibold text-center'>Derby</h3>
      </div>

      {/* Option 3: Dual */}
      <div
        onClick={() => toggleSelection('DUAL')}
        className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
          selected === 'DUAL'
            ? 'border-blue-500 bg-blue-100 shadow-lg'
            : 'border-gray-300 bg-white hover:border-gray-500'
        }`}>
        <h3 className='text-lg font-semibold text-center'>Dual</h3>
      </div>
    </div>
  );
}

SelectableCards.propTypes = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
};
