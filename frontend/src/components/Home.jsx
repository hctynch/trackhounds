import { useEffect, useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { IoAddCircleOutline, IoAnalyticsOutline, IoSettingsOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import DogService from '../services/DogService';
import HuntService from '../services/HuntService';
import Button from './Button';
import StyledTable from './StyledTable';

function Home() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [total, setTotal] = useState(0);
  const [hunt, setHunt] = useState({
    title: '',
    dates: '',
    stake: '',
    huntInterval: 0,
  });
  const [topDogsOverall, setTopDogsOverall] = useState([]);
  const [topDogsDaily, setTopDogsDaily] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [availableDays, setAvailableDays] = useState([1, 2, 3, 4]);

  const handleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  const stakeTypes = {
    ALL_AGE: 'All Age',
    DERBY: 'Derby',
    DUAL: 'Dual',
  };

  const navigate = useNavigate();

  useEffect(() => {
    async function getHunt() {
      const data = await HuntService.getHunt();
      const total = await DogService.getDogTotal();
      if (data instanceof Error) {
        //
      } else {
        setHunt(data);
        if (data.huntDays) {
          const days = Array.from({ length: data.huntDays }, (_, i) => i + 1);
          setAvailableDays(days);
        }
      }
      if (total instanceof Error) {
        setTotal(0);
      } else {
        setTotal(total);
      }
    }
    getHunt();
  }, []);

  useEffect(() => {
    async function fetchTopDogsOverall() {
      const data = await DogService.getTop10ScoringDogsOverall();
      if (!(data instanceof Error)) {
        setTopDogsOverall(data);
      }
    }
    fetchTopDogsOverall();
  }, []);

  useEffect(() => {
    async function fetchTopDogsDaily() {
      const data = await DogService.getTop10ScoringDogsByDay(selectedDay);
      if (!(data instanceof Error)) {
        setTopDogsDaily(data);
      }
    }
    fetchTopDogsDaily();
  }, [selectedDay]);

  const overallColumns = ['#', 'Name', 'Owner', 'Points'];
  const overallData = topDogsOverall.map((dog) => [
    dog.dogNumber,
    dog.dogName,
    dog.owner,
    dog.totalPoints,
  ]);

  const dailyColumns = ['#', 'Name', 'S&D', 'Endurance', 'Total'];
  const dailyData = topDogsDaily.map((dog) => [
    dog.dogNumber,
    dog.dogName,
    dog.totalPoints,
    Number.parseInt(dog.totalPoints * 0.1 * selectedDay),
    dog.totalPoints + Number.parseInt(dog.totalPoints * 0.1 * selectedDay),
  ]);

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hunt Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {hunt.title || 'No active hunt'} {hunt.dates ? `• ${hunt.dates}` : ''}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white shadow-sm rounded-xl px-5 py-3 flex items-center">
            <div className="flex flex-col items-center mr-3">
              <span className="text-3xl font-bold text-blue-600">{total}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total Dogs</span>
            </div>
            <div className="h-10 w-px bg-gray-200 mx-3"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-amber-600">
                {stakeTypes[hunt.stake] || '-'}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Stake Type</span>
            </div>
          </div>

          <Button
            type="primary"
            onClick={handleOverlay}
            className="flex items-center rounded-xl px-5 py-2.5"
          >
            <IoSettingsOutline className="mr-2" size={18} />
            Hunt Options
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Hunt Title
          </h3>
          <p className="text-2xl font-semibold truncate">{hunt.title || 'Not set'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-amber-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Date Range
          </h3>
          <p className="text-2xl font-semibold truncate">{hunt.dates || 'Not set'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Stake Type
          </h3>
          <p className="text-2xl font-semibold truncate">{stakeTypes[hunt.stake] || 'Not set'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Interval
          </h3>
          <p className="text-2xl font-semibold">{hunt.huntInterval || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <IoAnalyticsOutline size={18} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Top Dogs Overall</h2>
            </div>
            {overallData.length === 0 && (
              <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">No data</span>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {overallData.length > 0 ? (
              <StyledTable columns={overallColumns} data={overallData} className="w-full" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 text-center px-6 py-10">
                  No top dogs data available yet. Complete some scoring to see rankings here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                <IoAnalyticsOutline size={18} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold">Daily Top 10</h2>
            </div>

            <div className="flex items-center">
              <label htmlFor="daySelect" className="text-sm text-gray-500 mr-2">
                Day:
              </label>
              <select
                id="daySelect"
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableDays.map((day) => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {dailyData.length > 0 ? (
              <StyledTable columns={dailyColumns} data={dailyData} className="w-full" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-400 text-center px-6 py-10">
                  No data available for Day {selectedDay}. Complete scoring for this day to see
                  rankings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showOverlay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Hunt Options</h2>

            <div className="space-y-3">
              <Button
                type="secondary"
                onClick={() => navigate('/hunt/create')}
                className="w-full py-3 rounded-xl flex items-center justify-center"
              >
                <IoAddCircleOutline size={20} className="mr-2" />
                <span className="font-medium">Create a New Hunt</span>
              </Button>

              <Button
                type="secondary"
                onClick={() => navigate('/hunt/edit')}
                className="w-full py-3 rounded-xl flex items-center justify-center"
              >
                <FiEdit2 size={18} className="mr-2" />
                <span className="font-medium">Edit Current Hunt</span>
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <Button
                type="danger"
                onClick={handleOverlay}
                className="w-full py-2.5 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
