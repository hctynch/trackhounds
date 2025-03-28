import { useEffect, useState } from 'react';
import { FiEdit2, FiSearch, FiTrash2 } from 'react-icons/fi';
import { IoAddCircleOutline } from 'react-icons/io5';
import JudgeService from '../services/JudgeService';
import Button from './Button';
import StyledTable from './StyledTable';

// Move FormInput outside the main component to prevent recreation on every render
const FormInput = ({ label, description, name, value, onChange, error, type = 'text', disabled = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <p className="text-xs text-gray-500 mb-1">{description}</p>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-2 border ${
        error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
      } rounded-lg shadow-sm ${disabled ? 'bg-gray-100' : ''}`}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
);

function Judges() {
  const [judges, setJudges] = useState([]);
  const [filteredJudges, setFilteredJudges] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [judge, setJudge] = useState({ name: '', memberPin: '', number: '' });
  const [select, setSelect] = useState({ name: '', memberPin: '', number: '' });
  const [addErrors, setAddErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'edit'

  useEffect(() => {
    async function getJudges() {
      const data = await JudgeService.getJudges();
      if (data instanceof Error) {
        return;
      }
      setJudges(data);
      setFilteredJudges(data);
    } 
    
    async function getTotalJudges() {
      const data = await JudgeService.getJudgeTotal();
      if (data instanceof Error) {
        return;
      }
      setTotal(data);
    } 
    
    getJudges();
    getTotalJudges();
  }, []);

  useEffect(() => {
    if (search === '') {
      setFilteredJudges(judges);
    } else {
      setFilteredJudges(judges.filter(judge => judge.number.toString().includes(search)));
    }
  }, [search, judges]);

  const deleteJudge = async (number) => {
    try {
      await JudgeService.deleteJudge(number);
      const updatedJudges = judges.filter(judge => judge.number !== number);
      setJudges(updatedJudges);
      setFilteredJudges(updatedJudges);
      setTotal(total - 1);
    } catch (error) {
      console.error("Failed to delete judge:", error);
    }
  };

  const editJudge = (judge) => {
    setSelect(judge);
    setActiveTab('edit');
  };

  // Updated handler functions to properly handle form input
  const handleAddChange = (field) => (e) => {
    // Use functional update to prevent race conditions
    setJudge(prevJudge => ({
      ...prevJudge,
      [field]: e.target.value
    }));
    
    // Clear errors for this field when the user makes changes
    if (addErrors[field]) {
      setAddErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEditChange = (field) => (e) => {
    // Use functional update to prevent race conditions
    setSelect(prevSelect => ({
      ...prevSelect,
      [field]: e.target.value
    }));
    
    // Clear errors for this field when the user makes changes
    if (editErrors[field]) {
      setEditErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAdd = async () => {
    const newErrors = {};
    if (!judge.name) newErrors.name = 'Name cannot be empty';
    if (!judge.number || judge.number <= 0) newErrors.number = 'Number must be greater than 0';
    if (judges.some(j => j.number === Number(judge.number))) newErrors.number = 'Number already exists';

    if (Object.keys(newErrors).length > 0) {
      setAddErrors(newErrors);
      return;
    }
    
    try {
      const data = await JudgeService.createJudge(judge);
      if (data instanceof Error) {
        setAddErrors(data.response.data.fields);
      } else {
        const updatedJudges = await JudgeService.getJudges();
        setJudges(updatedJudges);
        setFilteredJudges(updatedJudges);
        setJudge({ name: '', memberPin: '', number: '' });
        setTotal(total + 1);
        setAddErrors({});
        setActiveTab('list'); // Return to list view after successful add
      }
    } catch (error) {
      console.error("Failed to add judge:", error);
      if (error.response?.data?.fields) {
        setAddErrors(error.response.data.fields);
      }
    }
  };

  const handleEdit = async () => {
    const newErrors = {};
    if (!select.name) newErrors.name = 'Name cannot be empty';
    if (!select.number || select.number <= 0) newErrors.number = 'Number must be greater than 0';
    
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    try {
      await JudgeService.editJudge(select);
      const updatedJudges = judges.map(j => j.number === Number(select.number) ? select : j);
      setJudges(updatedJudges);
      setFilteredJudges(updatedJudges);
      setSelect({ name: '', memberPin: '', number: '' });
      setEditErrors({});
      setActiveTab('list'); // Return to list view after successful edit
    } catch (error) {
      console.error("Failed to edit judge:", error);
      if (error.response?.data?.fields) {
        setEditErrors(error.response.data.fields);
      }
    }
  };
  
  const cancelEdit = () => {
    setSelect({ name: '', memberPin: '', number: '' });
    setEditErrors({});
    setActiveTab('list');
  };
  
  const cancelAdd = () => {
    setJudge({ name: '', memberPin: '', number: '' });
    setAddErrors({});
    setActiveTab('list');
  };

  // Table configuration for the judges list
  const columns = ['#', 'Member PIN', 'Name', 'Actions'];
  const data = filteredJudges.map((judge) => [
    judge.number,
    judge.memberPin || '—', // Show dash if no member PIN
    judge.name,
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => editJudge(judge)}
        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
        title="Edit Judge"
      >
        <FiEdit2 size={16} />
      </button>
      <button 
        onClick={() => deleteJudge(judge.number)}
        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
        title="Delete Judge"
      >
        <FiTrash2 size={16} />
      </button>
    </div>
  ]);

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Judges</h1>
          <p className="text-gray-500 mt-1">
            Manage judges for hunts and trials
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white shadow-sm rounded-xl px-5 py-3 flex items-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-600">{total}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total Judges</span>
            </div>
          </div>
          
          {activeTab === 'list' && (
            <Button
              type="primary"
              onClick={() => setActiveTab('add')}
              className="flex items-center rounded-xl px-5 py-2.5"
            >
              <IoAddCircleOutline className="mr-2" size={18} />
              Add Judge
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Judge Registry</h2>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by judge number"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {filteredJudges.length > 0 ? (
              <StyledTable 
                columns={columns} 
                data={data} 
                className="w-full"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <p className="text-gray-400 text-center px-6 py-10">
                  {search 
                    ? `No judges found with number containing "${search}"`
                    : 'No judges have been registered yet'}
                </p>
                
                <Button
                  type="primary"
                  onClick={() => setActiveTab('add')}
                  className="mt-4 flex items-center"
                >
                  <IoAddCircleOutline className="mr-2" />
                  Register New Judge
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add Judge Form */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-800">Add New Judge</h2>
            <p className="text-sm text-gray-500">Create a new judge record in the system</p>
          </div>
          
          <form 
            className="p-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
          >
            <div className="max-w-2xl mx-auto">
              <FormInput
                label="Judge Number"
                description="Unique identifier for the judge"
                value={judge.number}
                onChange={handleAddChange('number')}
                error={addErrors.number}
                type="number"
              />
              
              <FormInput
                label="Member PIN"
                description="Optional PIN identifier"
                value={judge.memberPin}
                onChange={handleAddChange('memberPin')}
                error={addErrors.memberPin}
              />
              
              <FormInput
                label="Judge Name"
                description="Full name of the judge"
                value={judge.name}
                onChange={handleAddChange('name')}
                error={addErrors.name}
              />
              
              <div className="mt-8 flex justify-end space-x-4">
                <Button
                  type="secondary"
                  onClick={cancelAdd}
                  className="rounded-xl px-5 py-2"
                >
                  Cancel
                </Button>
                
                <Button
                  type="primary"
                  onClick={handleAdd}
                  className="rounded-xl px-6 py-2"
                >
                  Add Judge
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Edit Judge Form */}
      {activeTab === 'edit' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-l-4 border-amber-500">
            <h2 className="text-lg font-semibold text-gray-800">Edit Judge</h2>
            <p className="text-sm text-gray-500">Update information for judge #{select.number}</p>
          </div>
          
          <form 
            className="p-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
          >
            <div className="max-w-2xl mx-auto">
              <FormInput
                label="Judge Number"
                description="Unique identifier (cannot be changed)"
                value={select.number}
                onChange={() => {}} // No change allowed
                error={editErrors.number}
                type="number"
                disabled={true}
              />
              
              <FormInput
                label="Member PIN"
                description="Optional PIN identifier"
                value={select.memberPin}
                onChange={handleEditChange('memberPin')}
                error={editErrors.memberPin}
              />
              
              <FormInput
                label="Judge Name"
                description="Full name of the judge"
                value={select.name}
                onChange={handleEditChange('name')}
                error={editErrors.name}
              />
              
              <div className="mt-8 flex justify-end space-x-4">
                <Button
                  type="secondary"
                  onClick={cancelEdit}
                  className="rounded-xl px-5 py-2"
                >
                  Cancel
                </Button>
                
                <Button
                  type="primary"
                  onClick={handleEdit}
                  className="rounded-xl px-6 py-2"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Judges;