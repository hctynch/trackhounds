import { useEffect, useState } from 'react';
import { FiEdit2, FiSearch } from 'react-icons/fi';
import { HiOutlineTrash } from 'react-icons/hi';
import { IoAddCircleOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService.js';
import Button from './Button';
import StyledTable from './StyledTable';

function Dogs() {
  const [dogs, setDogs] = useState([]);
  const [filteredDogs, setFilteredDogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const res = await DogService.getDogs();
      if (res) {
        setDogs(res);
        setFilteredDogs(res);
      } else {
        setDogs([]);
        setFilteredDogs([]);
      }
      const totalRes = await DogService.getDogTotal();
      setTotal(totalRes);
      setIsLoading(false);
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

  const columns = ['#', 'Name', 'Stake', 'Owner', 'Sire', 'Dam', 'Points', 'Actions'];
  const data = filteredDogs.map((dog, index) => [
    dog.number,
    dog.name,
    <span key={`stake-${index}`} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      dog.stake === 'ALL_AGE' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
    }`}>
      {dog.stake === 'ALL_AGE' ? 'All Age' : 'Derby'}
    </span>,
    dog.owner,
    dog.sire,
    dog.dam,
    <span key={`points-${index}`} className="font-semibold">{dog.points}</span>,
    <div key={`actions-${index}`} className="flex items-center space-x-2">
      <Button
        type="secondary"
        onClick={() => editDog(dog)}
        className="p-1.5 rounded-lg"
      >
        <FiEdit2 className="text-gray-600" />
      </Button>
      <Button
        type="danger"
        onClick={() => deleteDog(dog.number)}
        className="p-1.5 rounded-lg"
      >
        <HiOutlineTrash className="text-white" />
      </Button>
    </div>
  ]);

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Dogs</h1>
          
          <div className="flex items-center space-x-6">
            {/* Dog Count */}
            <div className="bg-blue-50 rounded-xl px-5 py-3 flex items-center">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-blue-600">{total}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Total Dogs</span>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by dog number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Add Button */}
            <Button
              type="primary"
              onClick={() => navigate('/dogs/add')}
              className="flex items-center rounded-xl px-4 py-2"
            >
              <IoAddCircleOutline className="mr-2" size={18} />
              Add New Dog
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="mt-6 bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Dog Registry</h2>
          <p className="text-sm text-gray-500">
            {filteredDogs.length} dog{filteredDogs.length !== 1 ? 's' : ''} {search ? 'found' : 'registered'}
            {search ? ` for "${search}"` : ''}
          </p>
        </div>
        
        <div className="flex-1 overflow-auto p-4 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading dogs...</div>
            </div>
          ) : filteredDogs.length > 0 ? (
            <StyledTable 
              columns={columns} 
              data={data}
              className="w-full"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <p className="text-gray-400 text-center px-6 py-10">
                {search 
                  ? `No dogs found with number containing "${search}"`
                  : 'No dogs have been registered yet'}
              </p>
              <Button
                type="primary"
                onClick={() => navigate('/dogs/add')}
                className="mt-4 flex items-center"
              >
                <IoAddCircleOutline className="mr-2" />
                Register New Dogs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dogs;
