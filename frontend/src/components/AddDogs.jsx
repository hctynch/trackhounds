import { FaCheck } from 'react-icons/fa6';
import { GoHorizontalRule } from 'react-icons/go';
import { IoAddCircleOutline, IoArrowBackCircleOutline } from 'react-icons/io5';
import Box from './Box';

function AddDogs() {
  return (
    <div className='grid text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative'>
      <Box params='bg-white pt-5'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <a className='mr-4 cursor-pointer' href='/dogs/all'>
            <IoArrowBackCircleOutline className='text-4xl text-gray-500' />
          </a>
          <p className='text-4xl font-bold'>Add Dogs</p>
          <div className='h-16 items-center flex ml-auto'>
            <p className='italic opacity-70 mr-2'>Status:</p>
            <FaCheck className='h-12 w-12 text-green-400'></FaCheck>
            {/*<FaX className='h-10 w-10 text-red-400'></FaX>*/}
          </div>
        </div>
        <div className='w-full flex items-center'>
          <Box params='mt-4 bg-slate-100 w-1/2 pb-4 pt-2'>
            <div className='w-full flex flex-col items-start'>
              <p className='text-lg font-medium'>Owner</p>
              <input
                type='text'
                className='bg-white border w-full border-black/30 rounded-lg px-2 py-1'
              />
            </div>
          </Box>
        </div>
        <Box params='overflow-y-auto w-full p-4 mt-8 mb-5 bg-slate-100 h-full'>
            <table className='table-auto w-full border-collapse border-2 border-black' style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className='border-2 border-black'>
                  <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>#</th>
                  <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>Name</th>
                  <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>
                    <div className='pr-8'>Stake</div>
                  </th>
                  <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>Sire</th>
                  <th className='pl-1 text-xl font-semibold text-start w-1/5 border-2 border-black'>Dam</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
                <tr className='border-y-2 border-black w-full'>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                  <td className='text-md xl:text-lg text-start border-2 border-black'>
                    <div className='h-8'>
                      <input className='pl-1 w-full h-full bg-white' />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className='mx-auto flex items-center justify-center mt-1 hover:text-green-600 text-green-500/90 cursor-pointer'>
                <GoHorizontalRule className='text-4xl'/>
                <IoAddCircleOutline className='h-8 w-8'></IoAddCircleOutline>
                <GoHorizontalRule className='text-4xl'/>
            </div>
        </Box>
        <div className='mx-auto mb-2'>
            <button className='cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full'>
                Add
            </button>
        </div>
      </Box>
    </div>
  );
}

export default AddDogs;