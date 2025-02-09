function Home() {
  return (
    <div className='flex flex-wrap ml-65 mt-4 mr-2 text-black w-full'>
      <div className='flex flex-col items-start bg-gradient-to-br from-white to-gray-200/80 rounded-lg shadow-2xl px-4 border-black/20 border-2 w-5/12 mr-4'>
        <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>Hunt Overview</p>
        <div className='w-full flex'>
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Title: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>Masters 2025 Derby Hunt</p>
        </div>
        <div className='w-full flex'>
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Dates Held: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>2025-12-20 to 2025-12-31</p>
        </div>
        <div className="w-full flex">
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Stake: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>Open Derby</p>
        </div>
        <div className="w-full flex">
          <p className='text-xl 2xl:text-2xl font-medium my-4'>Interval: </p>
          <p className='text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end'>10</p>
        </div>
      </div>
      <div className="flex flex-col items-start bg-gradient-to-bl from-white to-gray-200/80 rounded-lg shadow-2xl px-4 border-black/20 border-2 w-[57%]">
        <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>Stakes</p>
        <div className='w-full flex flex-row font-medium text-sm 2xl:text-xl border rounded-lg p-2 items-start my-auto'>
          <div className='w-1/4 flex flex-col items-center justify-center'>
            <p>Stake 1</p>
            <select className='w-2/3 border-2 border-black/40 rounded-lg p-2'>
              <option value="ALL_AGE">All Age</option>
              <option value="DERBY">Derby</option>
            </select>
          </div>
          <div className='w-1/4 flex flex-col items-center'>
            <p>Stake 2</p>
            <select className='w-2/3 border-2 border-black/40 rounded-lg p-2'>
              <option value="ALL_AGE">All Age</option>
              <option value="DERBY">Derby</option>
            </select>
            <input type="number" className='w-2/3 border-2 border-black/40 rounded-lg p-2 mt-2' placeholder='#' />
          </div>
          <div className='w-1/4 flex flex-col items-center'>
            <p>Stake 3</p>
            <select className='w-2/3 border-2 border-black/40 rounded-lg p-2'>
              <option value="ALL_AGE">All Age</option>
              <option value="DERBY">Derby</option>
            </select>
            <input type="number" className='w-2/3 border-2 border-black/40 rounded-lg p-2 mt-2' placeholder='#' />
          </div>
          <div className='w-1/4 flex flex-col items-center'>
            <p>Stake 4</p>
            <select className='w-2/3 border-2 border-black/40 rounded-lg p-2'>
              <option value="ALL_AGE">All Age</option>
              <option value="DERBY">Derby</option>
            </select>
            <input type="number" className='w-2/3 border-2 border-black/40 rounded-lg p-2 mt-2' placeholder='#' />
          </div>
        </div>
      </div>
      <div className='w-full flex flex-row items-start bg-gradient-to-t from-white to-gray-200/80 rounded-lg shadow-2xl px-4 border-black/20 border-2 mx-auto mt-20'>
        <div className='w-2/3 text-start'>
        <p className='text-4xl font-semibold my-5 underline decoration-2 underline-offset-4'>Edit/New Form</p>
          <div className='w-full flex'>
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Title: </p>
            <input type='text' value={'Masters 2025 Derby Hunt'} className='w-5/12 text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'/>
          </div>
          <div className='w-full flex'>
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Dates Held: </p>
            <input type='text' value={'2025-12-20 to 2025-12-31'} className='w-5/12 text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'/>
          </div>
          <div className="w-full flex">
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Stake: </p>
            <input type='text' value={'Open Derby'} className='w-5/12 text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'/>
          </div>
          <div className="w-full flex">
            <p className='text-xl 2xl:text-2xl font-medium my-4'>Interval: </p>
            <input type='number' value={10} className='w-5/12 text-xl 2xl:text-2xl font-medium my-4 ml-auto text-end border-2 border-black/40 rounded-lg'/>
          </div>
        </div>
        <div className='flex justify-center flex-col items-center w-1/3 h-full'>
          <button className="my-10 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded w-40">
            Edit Hunt
          </button>
          <button className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded w-40">
            New Hunt
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home