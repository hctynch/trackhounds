import { useEffect, useState } from 'react';
import { PiDotsThreeOutlineVertical, PiPlusCircle, PiX } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService.js';
import Box from './Box';
import StyledTable from './StyledTable';

function Dogs() {
  const [dogs, setDogs] = useState([]);
  const [filteredDogs, setFilteredDogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const res = await DogService.getDogs();
      if (res) {
        console.log(res)
        setDogs(res);
        setFilteredDogs(res);
      } else {
        setDogs([]);
        setFilteredDogs([]);
      }
      const totalRes = await DogService.getDogTotal();
      setTotal(totalRes);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (search === '') {
      setFilteredDogs(dogs);
    } else {
      setFilteredDogs(dogs.filter(dog => dog.number.toString().includes(search)));
    }
  }, [search, dogs]);

  function deleteDog(number) {
    DogService.deleteDog(number).then(res => {
      if (res) {
        setDogs(res);
        setTotal(total - 1);
      }
    });
  }

  function editDog(dog) {
    navigate('/dogs/edit', { state: { dog } });
  }

  const columns = ['#', 'Name', 'Stake', 'Owner', 'Sire', 'Dam', 'Points', ''];
  const data = filteredDogs.map((dog, index) => [
    dog.number,
    dog.name,
    dog.stake === 'ALL_AGE' ? 'All Age' : 'Derby',
    dog.owner,
    dog.sire,
    dog.dam,
    dog.points,
    <div key={index} className='flex items-center justify-evenly'>
      <button className='text-sm mr-1 px-2 py-2 bg-slate-300 hover:bg-slate-400 rounded-full cursor-pointer' onClick={() => editDog(dog)}>
        <PiDotsThreeOutlineVertical />
      </button>
      <button className='text-sm ml-1 bg-red-300 hover:bg-red-400 rounded-full cursor-pointer px-2 py-2' onClick={() => deleteDog(dog.number)}>
        <PiX className='text-center' />
      </button>
    </div>
  ]);

  return (
    <div className='grid text-black ml-[276px] mr-4 h-[calc(100vh-1rem)] my-2 relative'>
      <Box params='bg-white pt-5 overflow-y-auto'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <p className='text-4xl font-bold'>Dogs</p>
          <div className='flex ml-auto items-center'>
            <div className='flex flex-col items-center'>
              <p className='font-semibold text-4xl'>{total}</p>
              <p>Total Dogs</p>
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
        <Box params='overflow-y-auto w-full mt-8 mb-5 bg-slate-50 h-full'>
          <StyledTable columns={columns} data={data} />
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
