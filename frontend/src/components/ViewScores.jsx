import { useEffect, useState } from "react";
import { IoMdAlert } from "react-icons/io";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { PiX } from "react-icons/pi";
import DogService from "../services/DogService";
import Box from "./Box";
import StyledTable from "./StyledTable";

function ViewScores() {
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
    score.day,
    score.time,
    score.judgeNumber,
    score.dogNumber,
    score.points,
    <button
      className="text-sm ml-1 bg-red-300 hover:bg-red-400 rounded-full cursor-pointer px-2 py-2"
      onClick={() => handleDelete(score.dogNumber, score.id)}
    >
      <PiX className="text-center" />
    </button>,
  ]);

  // Helper function to get error message for a field
  const getErrorForField = (fieldName) => {
    return error && error.fields && error.fields[fieldName];
  };

  return (
    <div className="grid text-black ml-[276px] mr-4 min-h-[calc(100vh-1rem)] my-2 relative">
      <Box params="h-full bg-white pt-5 overflow-y-auto">
        <div className="w-full flex items-center border-b-2 border-gray-300 pb-1">
          <a className="mr-4 cursor-pointer" href="/score-entry/enter">
            <IoArrowBackCircleOutline className="text-4xl text-gray-500" />
          </a>
          <p className="text-4xl font-bold">Scores</p>
          <div className="flex ml-auto items-center h-16">
            <input
              type="text"
              placeholder="Search by Dog Number"
              className="border border-black/30 rounded-lg px-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Error display */}
        {error && error.message && (
          <div className="w-full bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 flex items-center">
            <IoMdAlert className="text-2xl mr-2" />
            <div>
              <p className="font-semibold">{error.message}</p>
              {error.fields && Object.keys(error.fields).length > 0 && (
                <ul className="list-disc list-inside mt-2">
                  {Object.entries(error.fields).map(([field, message]) => (
                    <li key={field}>{field}: {message}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        {/* Filter Controls */}
        <div className="w-full flex flex-wrap items-center gap-4 pt-4 pb-2">
          <div className="flex items-center">
            <label className="mr-2">Filter by:</label>
            <select
              className="border border-black/30 rounded-lg px-3 py-1.5"
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
                <label className="mr-2">
                  {filterType === "dog" ? "Dog #:" : "Judge #:"}
                </label>
                <input
                  type="number"
                  placeholder={filterType === "dog" ? "Enter dog number" : "Enter judge number"}
                  className={`border ${getErrorForField(filterType === "dog" ? "dogNumber" : "judgeNumber") ? 'border-red-500' : 'border-black/30'} rounded-lg px-3 py-1.5`}
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
              <label className="mr-2">Day:</label>
              <select
                className={`border ${getErrorForField("day") ? 'border-red-500' : 'border-black/30'} rounded-lg px-3 py-1.5`}
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
        
        <Box params="overflow-y-auto w-full mt-4 mb-4 bg-slate-50 h-full">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p className="text-lg text-gray-600">Loading scores...</p>
            </div>
          ) : data.length > 0 ? (
            <StyledTable columns={columns} data={data} />
          ) : (
            <div className="flex justify-center items-center p-8">
              <p className="text-lg text-gray-600">
                {error ? "No scores found due to an error" : "No scores found matching your criteria"}
              </p>
            </div>
          )}
        </Box>
      </Box>
    </div>
  );
}

export default ViewScores;