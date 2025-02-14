import React from 'react';
import Box from './Box';

function Dogs() {
  const areas = []
  return (
    <div className='w-full flex justify-evenly flex-col items-center h-screen pt-15'>
      <Box params='w-11/12 h-2/5'>
        <div className='flex flex-col text-black w-full h-full'>
          <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>
            Add Dogs
          </p>
          <div className='w-full h-3/4 overflow-y-scroll'>
          <table className="text-start table-auto w-full border-separate border-2">
              <thead>
                <tr className='text-xl sticky top-0 border-2'>
                  <th className='border-2'>Number</th>
                  <th className='border-2'>Name</th>
                  <th className='border-2'>Stake</th>
                  <th className='border-2'>Owner</th>
                  <th className='border-2'>Sire</th>
                  <th className='border-2'>Dam</th>
                </tr>
              </thead>
              <tbody className=''>
                <tr className='text-md font-medium'>
                  <td className='border-2 px-2'>
                    <input type='number' placeholder='Number' className='w-full px-2'/>
                  </td>
                  <td className='border-2 px-2'>
                    <input type='text' placeholder='Name' className='w-full px-2'/>
                  </td>
                  <td className='border-2 px-2'>
                    <input type='text' placeholder='Stake' className='w-full px-2'/>
                  </td>
                  <td className='border-2 px-2'>
                    <input type='text' placeholder='Owner' className='w-full px-2'/>
                  </td>
                  <td className='border-2 px-2'>
                    <input type='text' placeholder='Sire' className='w-full px-2'/>
                  </td>
                  <td className='border-2 px-2'>
                    <input type='text' placeholder='Dam' className='w-full px-2'/>
                  </td>
                </tr>
              </tbody>
          </table>
          </div>
        </div>
      </Box>
      <Box params='w-11/12 h-2/5'>
        <div className='text-black'>
          <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>
            All Dogs
          </p>
        </div>
      </Box>
    </div>
  );
}

export default Dogs;