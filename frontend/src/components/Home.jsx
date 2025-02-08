import { useState } from "react"
function Home() {
  const [title, setTitle] = useState('Dummy Hunt')
  const [dates, setDates] = useState('2022-01-01 to 2022-01-02')
  const [stake, setStake] = useState('Open Derby')
  const handleSubmit = (e) => {
    e.target.style.outline = '2px black solid'
    console.log('Title:', title)
    console.log('Dates Held:', dates)
    console.log('Stake:', stake)
    
    setTimeout(() => {
      e.target.style.outline = ''
    }, 150) // Change outline back after 2 seconds
  }
  return (
    <div className='flex flex-wrap mt-30 text-black w-full'>
      <div className='flex flex-col mx-auto w-2xl'>
      <div className='my-auto flex flex-col items-start border-3 px-5 border-white/50 rounded-lg bg-gradient-to-b from-white to-gray-300/80 h-60 shadow-xl'>
        <p className='text-2xl font-bold text-start mt-1'>Hunt Info:</p>
        <div className='text-2xl font-bold text-start my-auto w-full'>
          <p className='flex my-3'>Title: <span className='underline-offset-2 underline decoration-2 decoration-blue-500 ml-auto'>{title}</span></p>
          <p className='flex my-3'>Dates Held: <span className='underline-offset-2 underline decoration-2 decoration-blue-500 ml-auto'>{dates}</span></p>
          <p className='flex my-3'>Stake: <span className='underline-offset-2 underline decoration-2 decoration-blue-500 ml-auto'>{stake}</span></p>
        </div>
      </div>
      <form className='mt-20'>
        <div className='flex flex-col items-start border-3 px-5 border-white/50 rounded-lg bg-gradient-to-b from-white to-gray-300/80 shadow-xl'>
          <p className='text-2xl font-bold text-start mt-1'>Edit Hunt Info:</p>
          <div className='text-2xl font-bold text-start mt-5 w-full'>
            <label className='flex my-3'>Title: <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} className='ml-auto border-2 px-3 text-end' /></label>
            <label className='flex my-3'>Dates Held: <input type='text' value={dates} onChange={(e) => setDates(e.target.value)} className='ml-auto border-2 px-3 text-end' /></label>
            <label className='flex my-3'>Stake: <input type='text' value={stake} onChange={(e) => setStake(e.target.value)} className='ml-auto border-2 px-3 text-end' /></label>
          </div>
          <div onClick={(e) => handleSubmit(e)} className='mt-5 px-4 py-2 bg-blue-700 text-white rounded-lg mx-auto mb-5 hover:bg-blue-500 cursor-pointer outline-none'>Submit</div>
        </div>
      </form>
      </div>
      <div className='mx-auto flex flex-col items-start border-3 px-5 border-white/50 rounded-lg bg-gradient-to-b from-white to-gray-300/80 w-1/2 shadow-xl'>
        <div>
          <p className='text-2xl font-bold text-start mt-1'>Scoring Info:</p>
        </div>
        <div>

        </div>
      </div>
      <div className='text-center w-1/2 mx-auto mt-15 flex justify-center items-center'>
        <div className='w-1/5 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-500 cursor-pointer outline-none flex justify-center items-center text-2xl font-bold'>
          New Hunt
        </div>
      </div>
    </div>
  )
}

export default Home