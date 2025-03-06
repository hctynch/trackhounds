import { useState } from 'react';
import Box from './Box';
import StyledTable from './StyledTable';

function ScratchSheet() {
  const [search, setSearch] = useState('');

  const columns = ["Dog Number", "Time", "Judge Number", "Reason"];

  const data = [
    ["123", "12:00 PM", "45", "Injury"],
    // Add more rows as needed
  ];

  return (
    <div className='grid text-black ml-[276px] h-full relative'>
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
        <Box params='h-full bg-slate-50 my-4 w-full'>
          <StyledTable columns={columns} data={data} />
        </Box>
      </Box>
    </div>
  );
}

export default ScratchSheet;