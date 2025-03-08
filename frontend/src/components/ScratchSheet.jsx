import { useState } from 'react';
import Box from './Box';
import StyledTable from './StyledTable';

function ScratchSheet() {
  const [search, setSearch] = useState('');
  const [scratches, setScratches] = useState([
    ["123", "12:00 PM", "45", "Injury"],
    // Add more rows as needed
  ]);
  const [newScratch, setNewScratch] = useState({
    dogNumber: '',
    time: '',
    judgeNumber: '',
    reason: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewScratch({ ...newScratch, [name]: value });
  };

  const handleAddScratch = () => {
    setScratches([...scratches, [newScratch.dogNumber, newScratch.time, newScratch.judgeNumber, newScratch.reason]]);
    setNewScratch({ dogNumber: '', time: '', judgeNumber: '', reason: '' });
  };

  const columns = ["Dog Number", "Time", "Judge Number", "Reason"];

  const filteredData = scratches.filter(scratch =>
    scratch[0].includes(search)
  );

  return (
    <div className='grid text-black ml-[276px] h-full'>
      <Box params='my-2 h-[calc(100%-1rem)] bg-white mr-4'>
        <div className="w-full flex items-center border-b-2 border-gray-300 pb-1">
          <p className="text-4xl font-bold mt-4">Scratches</p>
          <div className="flex ml-auto items-center h-21">
            <input
              type="text"
              placeholder="Search by Number"
              className="border border-black/30 rounded-lg px-1 mt-5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Box params='h-[600px] bg-slate-50 my-4 w-full overflow-y-auto'>
          <StyledTable columns={columns} data={filteredData} />
        </Box>
        <Box params='h-auto bg-slate-50 my-4 w-full p-4 my-auto'>
          <div className="flex flex-col space-y-4 w-full">
            <div className='w-full border-b-2 border-gray-300 pb-4'>
              <p className='text-4xl font-bold text-start'>Add Scratch</p>
            </div>
            <input
              type="number"
              name="dogNumber"
              placeholder="Dog Number"
              className="border border-black/30 rounded-lg px-2 py-1"
              value={newScratch.dogNumber}
              onChange={handleInputChange}
            />
            <input
              type="time"
              name="time"
              placeholder="Time"
              className="border border-black/30 rounded-lg px-2 py-1"
              value={newScratch.time}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="judgeNumber"
              placeholder="Judge Number"
              className="border border-black/30 rounded-lg px-2 py-1"
              value={newScratch.judgeNumber}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="reason"
              placeholder="Reason"
              className="border border-black/30 rounded-lg px-2 py-1"
              value={newScratch.reason}
              onChange={handleInputChange}
            />
            <button
              className="mx-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full w-50 cursor-pointer"
              onClick={handleAddScratch}
            >
              Add Scratch
            </button>
          </div>
        </Box>
      </Box>
    </div>
  );
}

export default ScratchSheet;