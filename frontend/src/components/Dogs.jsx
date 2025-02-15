import { useState } from 'react';
import { FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import Box from './Box';

function Dogs() {
  const [addHover, setAddHover] = useState(false);

  return (
    <div className='w-full flex justify-evenly flex-col items-center h-screen pt-15'>
      <Box params='w-11/12 h-2/5'>
        <div className='relative flex flex-col text-black w-full h-full'>
          <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>
            Add Dogs
          </p>
          <div className='w-full h-[65%] overflow-y-scroll'>
            <table className="text-start table-auto w-full border-separate">
              <thead>
                <tr className='text-xl sticky top-0 border-2'>
                  <th></th>
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
                  <td></td>
                  <td className='border-2'>
                    <input type='number' placeholder='Number' className='w-full px-2'/>
                  </td>
                  <td className='border-2'>
                    <input type='text' placeholder='Name' className='w-full px-2'/>
                  </td>
                  <td className='border-2'>
                    <input type='text' placeholder='Stake' className='w-full px-2'/>
                  </td>
                  <td className='border-2'>
                    <input type='text' placeholder='Owner' className='w-full px-2'/>
                  </td>
                  <td className='border-2'>
                    <input type='text' placeholder='Sire' className='w-full px-2'/>
                  </td>
                  <td className='border-2'>
                    <input type='text' placeholder='Dam' className='w-full px-2'/>
                  </td>
                  <td className=''>
                    <div className='flex justify-center items-center w-full'>
                      <button className='flex justify-center items-center text-red-400 hover:text-red-500 rounded-md cursor-pointer'><FaMinusCircle className='w-8 h-8'/></button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className='text-center' colSpan='1'>
                    <div className='flex'>
                      <button className='text-green-500 hover:text-green-600 rounded-m cursor-pointer' onMouseEnter={() => setAddHover(true)} onMouseLeave={() => setAddHover(false)}><FaPlusCircle className='w-8 h-8' /></button>
                    </div>
                  </td>
                  <td className='text-center' colSpan='6'>
                    <div className={`${addHover ? 'bg-green-600' : 'bg-green-500'} w-full h-2 rounded-2xl`} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='w-full justify-center items-center flex flex-row my-5'>
            <div className='w-1/3 flex justify-evenly items-center'>
              <button className='border-blue-700 border-b-4 bg-blue-500 hover:bg-blue-600 hover:border-blue-900 rounded-lg text-white text-xl font-semibold px-4 py-1 cursor-pointer'>Submit</button>
            </div>
          </div>
        </div>
      </Box>
      <Box params='w-11/12 h-2/5'>
        <div className='relative text-black h-full flex flex-col'>
          <div className='relative flex justify-center w-full'>
            <p className=' text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>
              All Dogs
            </p>
            <input type='number' className='absolute right-5 top-[37%] border-black/60 rounded border-2 w-1/5 text-end font-medium' placeholder='Search #'></input>
          </div>
          <div className='w-full h-full overflow-y-scroll'>
            <table className="text-start table-fixed w-full border-collapse">
              <thead className='w-full'>
                <tr className='text-xl sticky top-0 border-2 w-full'>
                  <th className='border-2 w-1/6'>Number</th>
                  <th className='border-2 w-1/6'>Name</th>
                  <th className='border-2 w-1/6'>Stake</th>
                  <th className='border-2 w-1/6'>Owner</th>
                  <th className='border-2 w-1/6'>Sire</th>
                  <th className='border-2 w-1/6'>Dam</th>
                </tr>
              </thead>
              <tbody className='w-full'>
                <tr className='text-md font-medium w-full'>
                  <td className='border-2'>
                    <p className='w-full px-2'>Number</p>
                  </td>
                  <td className='border-2'>
                    <p className='w-full px-2'>Name</p>
                  </td>
                  <td className='border-2'>
                    <p className='w-full px-2'>Stake</p>
                  </td>
                  <td className='border-2'>
                    <p className='w-full px-2'>Owner</p>
                  </td>
                  <td className='border-2'>
                    <p className='w-full px-2'>Sire</p>
                  </td>
                  <td className='border-2'>
                    <p className='w-full px-2'>Dam</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Box>
    </div>
  );
}

export default Dogs;