import { useEffect, useState } from "react";
import { FaFilter, FaInfoCircle, FaRegCalendarAlt, FaTrash } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import DogService from "../services/DogService";
import Button from "./Button";
import StyledTable from "./StyledTable";

function ViewScores() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [day, setDay] = useState("all");
  const [scores, setScores] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScores();
  }, [day, filterType, filterValue]);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data = [];
      let responseData;
      
      // Fetch scores based on filter criteria
      if (filterType === "all") {
        if (day === "all") {
          responseData = await DogService.getScores();
        } else {
          responseData = await DogService.getScoresByDay(parseInt(day));
        }
      } else if (filterType === "dog") {
        if (!filterValue) {
          data = [];
          setScores(data);
          setLoading(false);
          return;
        } else {
          const dogNumber = parseInt(filterValue);
          if (day === "all") {
            responseData = await DogService.getScoresByDogNumber(dogNumber);
          } else {
            responseData = await DogService.getScoresByDogNumberAndDay(dogNumber, parseInt(day));
          }
        }
      } else if (filterType === "judge") {
        if (!filterValue) {
          data = [];
          setScores(data);
          setLoading(false);
          return;
        } else {
          const judgeNumber = parseInt(filterValue);
          if (day === "all") {
            responseData = await DogService.getScoresByJudgeNumber(judgeNumber);
          } else {
            responseData = await DogService.getScoresByJudgeNumberAndDay(judgeNumber, parseInt(day));
          }
        }
      }
      
      // Check if response is an error object
      if (responseData && responseData.message && responseData.fields) {
        // This is an error response from the backend
        setError({
          message: responseData.message,
          fields: responseData.fields || {}
        });
        data = [];
      } else {
        // Valid data returned
        data = responseData || [];
      }
      
      setScores(data);
    } catch (error) {
      console.error("Error fetching scores:", error);
      setError({ message: "An unexpected error occurred" });
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dogNumber, scoreId) => {
    try {
      const response = await DogService.deleteCross(dogNumber, scoreId);
      
      // Check if the response is an error
      if (response && response.status && response.error) {
        setError({
          message: response.error,
          fields: response.fields || {}
        });
        return;
      }
      
      // If successful, remove the deleted score from the current view
      setScores(prevScores => prevScores.filter(score => score.id !== scoreId));
    } catch (error) {
      console.error("Error deleting score:", error);
      setError({ message: "Failed to delete score" });
    }
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setFilterValue(""); // Reset the filter value when changing filter types
    setError(null); // Clear any previous errors
  };

  const handleFilterValueChange = (e) => {
    setFilterValue(e.target.value);
    setError(null); // Clear any previous errors
  };

  const handleDayChange = (e) => {
    setDay(e.target.value);
    setError(null); // Clear any previous errors
  };

  // Filter the scores based on search term
  const filteredScores = search 
    ? scores.filter(score => score.dogNumber?.toString().includes(search))
    : scores;

  const columns = ["Day", "Cross Time", "Judge #", "Dog #", "Points", ""];

  const data = filteredScores.map(score => [
    <div className="font-medium">{score.day}</div>,
    score.time,
    score.judgeNumber,
    <div className="font-medium">{score.dogNumber}</div>,
    <div className="font-medium text-blue-600">{score.points}</div>,
    <button
      onClick={() => handleDelete(score.dogNumber, score.id)}
      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
      title="Delete Score"
    >
      <FaTrash size={14} />
    </button>,
  ]);

  // Helper function to get error message for a field
  const getErrorForField = (fieldName) => {
    return error && error.fields && error.fields[fieldName];
  };

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            type="secondary"
            onClick={() => navigate('/score-entry/enter')}
            className="mr-4 p-1 rounded-full"
          >
            <IoArrowBackCircleOutline className="text-3xl text-gray-500" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Scores</h1>
            <p className="text-gray-500 mt-1">
              Browse, search and manage hunt scores
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by Dog Number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Error display */}
      {error && error.message && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg flex items-start">
          <FaInfoCircle className="text-red-500 text-lg mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">{error.message}</p>
            {error.fields && Object.keys(error.fields).length > 0 && (
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.entries(error.fields).map(([field, message]) => (
                  <li key={field}>{field}: {message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center mb-1">
          <FaFilter className="text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Filter Scores</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center">
            <label className="mr-2 text-sm font-medium text-gray-700">Filter by:</label>
            <select
              className="border border-gray-300 text-gray-800 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterType}
              onChange={handleFilterChange}
            >
              <option value="all">All Scores</option>
              <option value="dog">Dog Number</option>
              <option value="judge">Judge Number</option>
            </select>
          </div>
          
          {filterType !== "all" && (
            <div className="flex flex-col">
              <div className="flex items-center">
                <label className="mr-2 text-sm font-medium text-gray-700">
                  {filterType === "dog" ? "Dog #:" : "Judge #:"}
                </label>
                <input
                  type="number"
                  placeholder={filterType === "dog" ? "Enter dog number" : "Enter judge number"}
                  className={`border ${getErrorForField(filterType === "dog" ? "dogNumber" : "judgeNumber") ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg px-3 py-2`}
                  value={filterValue}
                  onChange={handleFilterValueChange}
                  min="1"
                />
              </div>
              {getErrorForField(filterType === "dog" ? "dogNumber" : "judgeNumber") && (
                <p className="text-red-500 text-sm mt-1">{getErrorForField(filterType === "dog" ? "dogNumber" : "judgeNumber")}</p>
              )}
            </div>
          )}
          
          <div className="flex flex-col">
            <div className="flex items-center">
              <label className="mr-2 text-sm font-medium text-gray-700">
                <FaRegCalendarAlt className="inline mr-1" /> Day:
              </label>
              <select
                className={`border ${getErrorForField("day") ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-lg px-3 py-2`}
                value={day}
                onChange={handleDayChange}
              >
                <option value="all">All Days</option>
                <option value="1">Day 1</option>
                <option value="2">Day 2</option>
                <option value="3">Day 3</option>
                <option value="4">Day 4</option>
              </select>
            </div>
            {getErrorForField("day") && (
              <p className="text-red-500 text-sm mt-1">{getErrorForField("day")}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Scores Table */}
      <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Score Results</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading scores...' : 
             `Showing ${filteredScores.length} score${filteredScores.length !== 1 ? 's' : ''}`}
             {filterType !== 'all' && ` • Filtered by ${filterType}`}
             {day !== 'all' && ` • Day ${day}`}
          </p>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-8 bg-blue-200 rounded-full mb-2"></div>
                <p className="text-gray-500">Loading scores...</p>
              </div>
            </div>
          ) : data.length > 0 ? (
            <div className="p-4">
              <StyledTable 
                columns={columns} 
                data={data} 
                className="w-full"
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="bg-gray-100 rounded-full p-4 mb-3">
                <FaInfoCircle className="text-gray-400 text-3xl" />
              </div>
              <p className="text-lg text-gray-600 font-medium">
                {error ? "No scores found due to an error" : "No scores matching your criteria"}
              </p>
              <p className="text-gray-500 mt-1 text-center max-w-md">
                {filterType !== 'all' || day !== 'all' ? 
                  "Try adjusting your filters to see more results" : 
                  "No scores have been recorded yet. Start by entering scores in the Score Entry page."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewScores;