import { useEffect, useState } from 'react';
import { PiDotsThreeOutlineVertical, PiX } from 'react-icons/pi';
import JudgeService from '../services/JudgeService';
import Box from './Box';
import StyledTable from './StyledTable';

function Judges() {
  const [judges, setJudges] = useState([]);
  const [filteredJudges, setFilteredJudges] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [judge, setJudge] = useState({ name: '', memberPin: '', number: '' });
  const [select, setSelect] = useState({ name: '', memberPin: '', number: '' });
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    async function getJudges() {
      const data = await JudgeService.getJudges();
      if (data instanceof Error) {
        return;
      }
      setJudges(data);
      setFilteredJudges(data);
    } getJudges();

    async function getTotalJudges() {
      const data = await JudgeService.getJudgeTotal();
      if (data instanceof Error) {
        return;
      }
      setTotal(data);
    } getTotalJudges();
  }, []);

  useEffect(() => {
    if (search === '') {
      setFilteredJudges(judges);
    } else {
      setFilteredJudges(judges.filter(judge => judge.number.toString().includes(search)));
    }
  }, [search, judges]);

  function deleteJudge(number) {
    JudgeService.deleteJudge(number);
    const updatedJudges = judges.filter(judge => judge.number !== number);
    setJudges(updatedJudges);
    setFilteredJudges(updatedJudges);
    setTotal(total - 1);
  }

  function editJudge(judge) {
    setSelect(judge);
  }

  function handleAdd() {
    const newErrors = {};
    if (!judge.name) newErrors.name = 'Name cannot be empty';
    if (!judge.number || judge.number <= 0) newErrors.number = 'Number must be greater than 0';
    if (judges.some(j => j.number === judge.number)) newErrors.number = 'Number already exists';

    if (Object.keys(newErrors).length > 0) {
      setAddErrors(newErrors);
      return;
    }
    async function createJudge() {
      const data = await JudgeService.createJudge(judge);
      if (data instanceof Error) {
        setAddErrors(data.response.data.fields);
      } else {
        async function getJudges() {
          const data = await JudgeService.getJudges();
          setJudges(data);
          setFilteredJudges(data);
        } getJudges();
        setJudge({ name: '', memberPin: '', number: '' });
        setTotal(total + 1);
        setAddErrors({});
      }
    } createJudge();
  }

  function handleEdit() {
    const newErrors = {};
    if (!select.name) newErrors.name = 'Name cannot be empty';
    if (!select.number || select.number <= 0) newErrors.number = 'Number must be greater than 0';
    if (judges.some(j => j.number === select.number && j.number !== select.number)) newErrors.number = 'Number already exists';

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    const data = JudgeService.editJudge(select);
    if (data instanceof Error) {
      console.log(data.response.data);
      setEditErrors(data.response.data.fields);
    } else {
      const updatedJudges = judges.map(j => j.number === select.number ? select : j);
      setJudges(updatedJudges);
      setFilteredJudges(updatedJudges);
      setSelect({ name: '', memberPin: '', number: '' });
      setEditErrors({});
    }
  }

  const columns = ['#', 'Member PIN', 'Name', ''];
  const data = filteredJudges.map((judge, index) => [
    judge.number,
    judge.memberPin,
    judge.name,
    <div className='flex items-center justify-evenly'>
      <button className='text-sm mr-1 px-2 py-2 bg-slate-300 hover:bg-slate-400 rounded-full cursor-pointer' onClick={() => editJudge(judge)}>
        <PiDotsThreeOutlineVertical />
      </button>
      <button className='text-sm ml-1 bg-red-300 hover:bg-red-400 rounded-full cursor-pointer px-2 py-2' onClick={() => deleteJudge(judge.number)}>
        <PiX className='text-center' />
      </button>
    </div>
  ]);

  return (
    <div className='grid grid-cols-2 items-center grid-rows-2 text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative'>
      <Box params='col-span-1 row-span-2 h-full bg-white pt-5 overflow-y-auto mr-2'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <p className='text-4xl font-bold'>Judges</p>
          <div className='flex ml-auto items-center'>
            <div className='flex flex-col items-center'>
              <p className='font-semibold text-4xl'>{total}</p>
              <p>Total Judges</p>
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
        <Box params='overflow-y-auto w-full my-8 bg-slate-50 h-full'>
          <StyledTable columns={columns} data={data} />
        </Box>
      </Box>
      <Box params='col-span-1 row-span-1 bg-white ml-2 mb-2 py-5'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <p className='text-4xl font-bold h-16 flex items-center'>Add Judge</p>
        </div>
        <div className='h-full gap-y-2 mt-4 w-full flex flex-col items-center justify-evenly'>
          <Box params='w-full bg-slate-50 my-2'>
            <div className='w-full text-start py-2 grid grid-cols-2'>
              <div className='w-full'>
                <p className='text-lg font-semibold'>Number</p>
                <p className='italic opacity-60 text-sm'>Number of the Judge</p>
              </div>
              <div className='w-full flex flex-col items-start relative'>
                <input
                  type='number'
                  className='border w-full rounded absolute top-1 pl-1'
                  value={judge.number}
                  onChange={(e) => setJudge({ ...judge, number: e.target.value })}
                />
                {addErrors.number && <p className='absolute -bottom-1 text-red-500 text-sm italic opacity-60'>{addErrors.number}</p>}
              </div>
            </div>
          </Box>
          <Box params='w-full bg-slate-50 my-2'>
            <div className='w-full text-start py-2 grid grid-cols-2'>
              <div className='w-full'>
                <p className='text-lg font-semibold'>Member PIN</p>
                <p className='italic opacity-60 text-sm'>PIN of the Judge</p>
              </div>
              <div className='w-full flex items-center relative'>
                <input
                  type='text'
                  className='border w-full rounded absolute top-1 pl-1'
                  value={judge.memberPin}
                  onChange={(e) => setJudge({ ...judge, memberPin: e.target.value })}
                />
              </div>
            </div>
          </Box>
          <Box params='w-full bg-slate-50 my-2'>
            <div className='w-full text-start py-2 grid grid-cols-2'>
              <div className='w-full'>
                <p className='text-lg font-semibold'>Name</p>
                <p className='italic opacity-60 text-sm'>Name of the Judge</p>
              </div>
              <div className='relative w-full h-full flex flex-col items-start'>
                <input
                  type='text'
                  className='absolute top-1 border w-full rounded pl-1'
                  value={judge.name}
                  onChange={(e) => setJudge({ ...judge, name: e.target.value })}
                />
                {addErrors.name && <p className='absolute -bottom-1 text-red-500 text-sm italic opacity-60'>{addErrors.name}</p>}
              </div>
            </div>
          </Box>
          <div className='h-full flex items-center justify-center'>
            <button className='text-white bg-blue-500 hover:bg-blue-600 rounded-2xl px-4 py-2 cursor-pointer font-medium' onClick={handleAdd}>
              Add Judge
            </button>
          </div>
        </div>
      </Box>
      <Box params='col-span-1 row-span-1 bg-white mt-2 ml-2 py-5'>
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1'>
          <p className='text-4xl font-bold h-16 flex flex-col items-start justify-end'>
            Edit Judge
            <span className='text-sm -mt-1 -mb-1.5 italic opacity-60 font-medium'>
              Click the three dots on a judge to select
            </span>
          </p>
        </div>
        <div className='h-full gap-y-2 mt-4 w-full flex flex-col items-center justify-evenly'>
          <Box params='w-full bg-slate-50 my-2'>
            <div className='w-full text-start py-2 grid grid-cols-2'>
              <div className='w-full'>
                <p className='text-lg font-semibold'>Number</p>
                <p className='italic opacity-60 text-sm'>Number of the Judge</p>
              </div>
              <div className='w-full flex items-center relative'>
                <input
                  type='number'
                  value={select.number}
                  className='border w-full rounded absolute top-1 bg-gray-300/90 pl-1'
                  disabled
                />
                {editErrors.number && <p className='absolute -bottom-1 text-red-500 text-sm italic opacity-60'>{editErrors.number}</p>}
              </div>
            </div>
          </Box>
          <Box params='w-full bg-slate-50 my-2'>
            <div className='w-full text-start py-2 grid grid-cols-2'>
              <div className='w-full'>
                <p className='text-lg font-semibold'>Member PIN</p>
                <p className='italic opacity-60 text-sm'>PIN of the Judge</p>
              </div>
              <div className='w-full flex items-center relative'>
                <input
                  type='text'
                  value={select.memberPin}
                  className='border w-full rounded absolute top-1 pl-1'
                  onChange={(e) => setSelect({ ...select, memberPin: e.target.value })}
                />
              </div>
            </div>
          </Box>
          <Box params='w-full bg-slate-50 my-2'>
            <div className='w-full text-start py-2 grid grid-cols-2'>
              <div className='w-full'>
                <p className='text-lg font-semibold'>Name</p>
                <p className='italic opacity-60 text-sm'>Name of the Judge</p>
              </div>
              <div className='w-full flex items-center relative'>
                <input
                  type='text'
                  value={select.name}
                  className='border w-full rounded absolute top-1 pl-1'
                  onChange={(e) => setSelect({ ...select, name: e.target.value })}
                />
                {editErrors.name && <p className='absolute -bottom-1 text-red-500 text-sm italic opacity-60'>{editErrors.name}</p>}
              </div>
            </div>
          </Box>
          <div className='h-full flex items-center justify-center'>
            <button className='text-white bg-gray-500 hover:bg-gray-600 rounded-2xl px-4 py-2 cursor-pointer font-medium' onClick={handleEdit}>
              Edit Judge
            </button>
          </div>
        </div>
      </Box>
    </div>
  );
}

export default Judges;