import { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { IoArrowBackCircleOutline, IoTimeOutline } from 'react-icons/io5';
import { MdOutlineDoNotDisturb, MdOutlinePerson } from 'react-icons/md';
import { RiNumbersFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService';
import Button from './Button';
import StyledTable from './StyledTable';

function ScratchSheet() {
  const [search, setSearch] = useState('');
  const [scratches, setScratches] = useState([]);
  const [newScratch, setNewScratch] = useState({
    dogNumber: '',
    time: '',
    judgeNumber: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScratches();
  }, []);

  const fetchScratches = async () => {
    setIsLoading(true);
    try {
      const data = await DogService.getScratches();
      setScratches(data || []);
    } catch (error) {
      console.error("Error fetching scratches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewScratch({ ...newScratch, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddScratch = async () => {
    try {
      const response = await DogService.postScratch(newScratch);
      if (response && response.fields) {
        setErrors(response.fields);
      } else {
        setNewScratch({ dogNumber: '', time: '', judgeNumber: '', reason: '' });
        setErrors({});
        fetchScratches();
      }
    } catch (error) {
      console.error("Error adding scratch:", error);
      setErrors({ general: "Failed to add scratch. Please try again." });
    }
  };

  const columns = ["Dog Number", "Time", "Judge Number", "Reason"];

  const filteredData = scratches
    .filter(scratch => scratch.dogNumber.toString().includes(search))
    .map(scratch => [
      scratch.dogNumber,
      scratch.time,
      scratch.judgeNumber,
      scratch.reason,
    ]);

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            type="secondary"
            onClick={() => navigate('/')}
            className="mr-4 p-1 rounded-full"
          >
            <IoArrowBackCircleOutline className="text-3xl text-gray-500" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scratch Sheet</h1>
            <p className="text-gray-500 mt-1">
              Manage dog scratches from the competition
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {/* Left side - Scratch List */}
        <div className="md:col-span-2 flex flex-col">
          {/* Scratches Table */}
          <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scratch Registry</h2>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by dog number"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading scratches...</div>
                </div>
              ) : filteredData.length > 0 ? (
                <StyledTable 
                  columns={columns} 
                  data={filteredData} 
                  className="w-full"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-center px-6 py-10">
                    {search 
                      ? `No scratches found with dog number containing "${search}"`
                      : 'No scratches have been recorded yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Add Scratch Form */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-l-4 border-amber-500">
            <h2 className="text-lg font-semibold text-gray-800">Add New Scratch</h2>
            <p className="text-sm text-gray-500">Record a dog scratch from the competition</p>
          </div>
          
          <div className="p-6 space-y-4">
            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <RiNumbersFill className="mr-1.5 text-gray-500" />
                Dog Number
              </label>
              <input
                type="number"
                name="dogNumber"
                value={newScratch.dogNumber}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${errors.dogNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm`}
                placeholder="Enter dog number"
              />
              {errors.dogNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.dogNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <IoTimeOutline className="mr-1.5 text-gray-500" />
                Time
              </label>
              <input
                type="time"
                name="time"
                value={newScratch.time}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${errors.time ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm`}
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MdOutlinePerson className="mr-1.5 text-gray-500" />
                Judge Number
              </label>
              <input
                type="number"
                name="judgeNumber"
                value={newScratch.judgeNumber}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${errors.judgeNumber ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm`}
                placeholder="Enter judge number"
              />
              {errors.judgeNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.judgeNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MdOutlineDoNotDisturb className="mr-1.5 text-gray-500" />
                Reason
              </label>
              <input
                type="text"
                name="reason"
                value={newScratch.reason}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${errors.reason ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg shadow-sm`}
                placeholder="Enter reason for scratch"
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            <Button
              type="primary"
              onClick={handleAddScratch}
              className="w-full mt-4 py-2.5 rounded-xl font-medium"
            >
              Add Scratch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScratchSheet;