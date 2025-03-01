import { useState } from 'react';
import { GrDocumentMissing, GrScorecard } from 'react-icons/gr';
import { HiOutlineDocumentReport, HiOutlineHome } from 'react-icons/hi';
import { MdOutlinePersonSearch } from 'react-icons/md';
import { RxCaretDown } from 'react-icons/rx';
import { TbDog } from 'react-icons/tb';

function Navbar() {
  const [dropdown, setDropdown] = useState(null);

  const links = [
    { name: 'Home', path: '/', icon: <HiOutlineHome className='h-10' /> },
    {
      name: 'Dogs',
      icon: <TbDog className='h-10' />,
      caret: <RxCaretDown className='ml-auto text-gray-500 h-7 w-7' />,
      dropdown: [
        {
          name: <p className='text-black font-medium'>All Dogs</p>,
          path: '/dogs/all',
        },
        {
          name: <p className='text-black font-medium'>Add Dogs</p>,
          path: '/dogs/add',
        },
      ],
    },
    {
      name: 'Judges',
      path: '/judges/all',
      icon: <MdOutlinePersonSearch className='h-10' />,
    },
    {
      name: 'Score Entry',
      icon: <GrScorecard className='h-10' />,
      caret: <RxCaretDown className='ml-auto text-gray-500 h-7 w-7' />,
      dropdown: [
        {
          name: <p className='text-black font-medium'>Enter Score</p>,
          path: '/score-entry/enter',
        },
        {
          name: <p className='text-black font-medium'>View Scores</p>,
          path: '/score-entry/view',
        },
      ],
    },
    {
      name: 'Scratch Sheet',
      icon: <GrDocumentMissing className='h-10' />,
      caret: <RxCaretDown className='ml-auto text-gray-500 h-7 w-7' />,
      dropdown: [
        {
          name: <p className='text-black font-medium'>Enter Scratch</p>,
          path: '/scratch-sheet/enter',
        },
        {
          name: <p className='text-black font-medium'>View Scratches</p>,
          path: '/scratch-sheet/view',
        },
      ],
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <HiOutlineDocumentReport className='h-10' />,
    },
  ];

  const handleDropdown = (index) => {
    setDropdown(dropdown === index ? null : index);
  };

  return (
    <div className='overflow-y-auto z-1 flex flex-col gap-y-2 justify-start items-start bg-white shadow shadow-gray-500 fixed top-0 left-0 h-[calc(100vh-1rem)] rounded-r-lg p-1 w-65 my-2'>
      <div className='flex w-full items-center px-3 py-3'>
        <div className='border-b-2 border-gray-300 w-full flex pb-6'>
          <p className='text-black font-semibold text-2xl pt-4'>trackhounds</p>
          <img />
        </div>
      </div>
      <div className='h-auto flex flex-col gap-y-4 justify-start items-start px-1 w-full'>
        {links.map((link, index) => (
          <div
            key={index}
            className='w-full h-auto'>
            <a
              href={link.path}
              className='w-full'
              onClick={() => link.dropdown && handleDropdown(index)}>
              <div className='flex w-full'>
                <div className='flex items-center text-black text-lg hover:bg-gray-800/20 hover:outline-gray-100 rounded-xl px-2 transition duration-275 ease-in-out w-full'>
                  {link.icon}
                  <p className='ml-2'>{link.name}</p>
                  {link.caret && link.caret}
                </div>
              </div>
            </a>
            {dropdown === index && link.dropdown && (
              <div
                className={`flex flex-col items-center ml-4 pr-5 border-l-2 border-gray-300 h-[49.25%]`}>
                {link.dropdown.map((item, subIndex) => (
                  <div
                    key={subIndex}
                    className='w-full flex items-center justify-start'>
                    <div className='bg-gray-300 w-4 h-0.5' />
                    <a
                      href={item.path}
                      className='w-full px-2 py-1 text-start text-black text-lg hover:bg-gray-800/20 hover:outline-gray-100 rounded-xl transition duration-275 ease-in-out'>
                      {item.name}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className='mt-auto flex italic opacity-50 text-md items-center justify-center w-full'>
        <p className='text-black'>Made by Hunt Tynch (2025)</p>
      </div>
    </div>
  );
}

export default Navbar;
