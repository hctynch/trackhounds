import { useState } from "react"
import { PiDotsThreeOutlineVertical, PiX } from "react-icons/pi"
import Box from "./Box"
function ViewScores() {
    const [search, setSearch] = useState('')
    const [total, setTotal] = useState(0)
    const placeholder = []
    const [day, setDay] = useState(1)
    return (
        <div className="grid text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative">
            <Box params='h-full bg-white pt-5 overflow-y-auto'>
                <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
                    <p className='text-4xl font-bold'>Scores</p>
                    <div className='flex ml-auto items-center'>
                        <div className='flex flex-col items-center'>
                            <p className='font-semibold text-4xl'>{total}</p>
                            <p>Total Crosses</p>
                        </div>
                        <div className='bg-gray-300 h-12 w-0.5 mx-5' />
                        <input
                        type='text'
                        placeholder='Search by Number'
                        className='border border-black/30 rounded-lg px-1'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className='w-full flex items-center justify-between pt-2'>
                    <div className='flex items-center text-md'>
                        <p className=''>Day</p>
                        <select className='border border-black/30 rounded-lg px-1 mx-2'>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                        </select>
                    </div>
                </div>
                <Box params='overflow-y-auto w-full p-4 mt-4 mb-4 bg-slate-50 h-full'>
                  <table className='table-auto w-full border-collapse'>
                    <thead>
                      <tr className='border-b-2 border-gray-300'>
                        <th className='text-md font-semibold text-start'>Time</th>
                        <th className='text-md font-semibold text-start'>Judge #</th>
                        <th className='text-md font-semibold text-start'>Dogs</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {placeholder.map((score, index) => (
                        <tr className='border-y-2 border-gray-200' key={index}>
                          <td className='text-sm text-start'>
                            <div className='pr-3'>{score.time}</div>
                          </td>
                          <td className='text-sm text-start'>
                            <div className='pr-3'>{score.judge.number}</div>
                          </td>
                          <td className='text-sm text-start'>
                            <div className='pr-3 flex flex-col'>{score.dogs.map((dog, index) =>(
                                <p key={index}>{dog.name}</p>
                            ))}
                            </div>
                          </td>
                          <td className='pl-2 py-2'>
                            <div className='flex items-center justify-evenly'>
                              <button className='text-sm mr-1 px-2 py-2 bg-slate-300 hover:bg-slate-400 rounded-full cursor-pointer' onClick={() => editJudge(judge)}>
                                <PiDotsThreeOutlineVertical />
                              </button>
                              <button className='text-sm ml-1 bg-red-300 hover:bg-red-400 rounded-full cursor-pointer px-2 py-2' onClick={() => deleteJudge(judge.number)}>
                                <PiX className='text-center' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
            </Box>
        </div>
    )
}

export default ViewScores