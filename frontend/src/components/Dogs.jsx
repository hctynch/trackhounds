import { PiDotsThreeOutlineVertical, PiPlusCircle, PiX } from 'react-icons/pi';
import Box from './Box';
function Dogs() {
  return (
    <div className='grid text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative'>
      <Box params='bg-white pt-5 overflow-y-auto'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <p className='text-4xl font-bold'>All Dogs</p>
          <div className='flex ml-auto items-center'>
            <div className='flex flex-col items-center'>
              <p className='font-semibold text-4xl'>100</p>
              <p>Total Dogs</p>
            </div>
            <div className='bg-gray-300 h-12 w-0.5 mx-5' />
            <input
              type='text'
              placeholder='Search by Number'
              className='border border-black/30 rounded-lg px-1'
            />
          </div>
        </div>
        <Box params='overflow-y-auto w-full p-4 mt-8 mb-5 bg-slate-50 h-full'>
          <table className='table-auto w-full border-collapse'>
            <thead>
              <tr className='border-b-2 border-gray-300'>
                <th className='text-md font-semibold text-start'>#</th>
                <th className='text-md font-semibold text-start'>Name</th>
                <th className='text-md font-semibold text-start'>
                  <div className='pr-8'>Stake</div>
                </th>
                <th className='text-md font-semibold text-start'>Owner</th>
                <th className='text-md font-semibold text-start'>Sire</th>
                <th className='text-md font-semibold text-start'>Dam</th>
                <th className='text-md font-semibold text-end'>Points</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className='border-y-2 border-gray-200'>
                <td className='text-sm text-start'>
                  <div className='pr-3'>1</div>
                </td>
                <td className='text-sm text-start'>
                  <div className='pr-3'>Tynch&apos;s Stardust</div>
                </td>
                <td className='text-sm text-start'>
                  <div className='pr-3'>All Age</div>
                </td>
                <td className='text-sm text-start'>
                  <div className='pr-3'>Tynch Town Kennels</div>
                </td>
                <td className='text-sm text-start'>
                  <div className='pr-3'>Tynch Town Kennels Blackrock</div>
                </td>
                <td className='text-sm text-start'>
                  <div className='pr-3'>Tynch&apos;s Strawberry</div>
                </td>
                <td className='text-sm text-end'>100</td>
                <td className='pl-2 py-2'>
                  <div className='flex items-center justify-evenly'>
                    <button className='text-sm mr-1 px-2 py-2 bg-slate-300 hover:bg-slate-400 rounded-full cursor-pointer'>
                      <PiDotsThreeOutlineVertical />
                    </button>
                    <button className='text-sm ml-1 bg-red-300 hover:bg-red-400 rounded-full cursor-pointer px-2 py-2'>
                      <PiX className='text-center' />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Box>
        <div className='ml-auto mr-3 flex h-10 items-center mb-4'>
          <a href='/dogs/add'>
            <PiPlusCircle className='h-10 w-10 text-green-500'></PiPlusCircle>
          </a>
        </div>
      </Box>
    </div>
  );
}

export default Dogs;
