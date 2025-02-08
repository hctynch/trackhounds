import { FaHome } from 'react-icons/fa'
import { GrScorecard } from 'react-icons/gr'
import { HiOutlineDocumentReport } from 'react-icons/hi'
import { ImCross } from 'react-icons/im'
import { MdOutlinePersonSearch } from 'react-icons/md'
import { TbDog } from 'react-icons/tb'

function Navbar() {
    const links = [
        { name: 'Home', path: '/', icon: <FaHome className='h-10' /> },
        { name: 'Dogs', path: '/dogs', icon: <TbDog className='h-10' /> },
        { name: 'Judges', path: '/judges', icon: <MdOutlinePersonSearch className='h-10' /> },
        { name: 'Score Entry', path: '/score-entry', icon: <GrScorecard className='h-10' /> },
        { name: 'Scratch Sheet', path: '/scratch-sheet', icon: <ImCross className='h-10' /> },
        { name: 'Reports', path: '/reports', icon: <HiOutlineDocumentReport className='h-10' /> },
    ]
  return (
      <div className='z-1 border-b-2 border-gray-300 pl-10 flex gap-x-10 justify-start items-center bg-gradient-to-b from-white to-gray-300/60 p-4 shadow-2xl absolute top-0 left-0 w-full'>
          {links.map((link, index) => 
              <a key={index} href={link.path}>
              <div className='flex'>
                      <div className='flex items-center text-black text-2xl hover:bg-gray-800/20 hover:outline-gray-100 rounded-full px-4 py-1 transition duration-275 ease-in-out'>{link.icon}<p className='ml-2'>{link.name}</p></div>
                </div>
            </a>
          )}
    </div>
  )
}

export default Navbar