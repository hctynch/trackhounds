export default function OptionBoxWithNumber({
  selectedOption,
  setSelectedOption,
  startingNumber,
  setStartingNumber,
}) {
  return (
    <div className='flex flex-col text-start py-1 w-full'>
      {/* Option Selection */}
      <div className='mb-3'>
        <label className='block text-sm opacity-60 mb-1'>Choose a Stake:</label>
        <select
          className='block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500'
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}>
          <option value='ALL_AGE'>All Age</option>
          <option value='DERBY'>Derby</option>
        </select>
      </div>

      {/* Number Input */}
      <div>
        <label className='block text-sm opacity-60 mb-1'>
          Starting Number:
        </label>
        <input
          type='number'
          className='block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500'
          value={startingNumber}
          onChange={(e) => setStartingNumber(Number(e.target.value))}
          min='0'
        />
      </div>
    </div>
  );
}
