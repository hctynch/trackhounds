import PropTypes from 'prop-types';

export default function SelectableCards({ selected, setSelected }) {
  return (
    <div className='grid grid-cols-2 gap-x-4 w-full'>
      {/* Option 1 */}
      <div
        onClick={() => setSelected('ALL_AGE')}
        className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
          selected === 'ALL_AGE'
            ? 'border-blue-500 bg-blue-100 shadow-lg'
            : 'border-gray-300 bg-white hover:border-gray-500'
        }`}>
        <h3 className='text-lg font-semibold text-center'>All Age</h3>
      </div>

      {/* Option 2 */}
      <div
        onClick={() => setSelected('DERBY')}
        className={`cursor-pointer p-6 rounded-xl border-2 transition-all ${
          selected === 'DERBY'
            ? 'border-blue-500 bg-blue-100 shadow-lg'
            : 'border-gray-300 bg-white hover:border-gray-500'
        }`}>
        <h3 className='text-lg font-semibold text-center'>Derby</h3>
      </div>
    </div>
  );
}

SelectableCards.props = {
  selected: PropTypes.string.isRequired,
  setSelected: PropTypes.func.isRequired,
};
