import React, { useEffect, useState } from 'react';
import { FiClipboard, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import HuntService from '../services/HuntService.js';
import Button from './Button';
import ReportGenerator from './ReportGenerator';
import reportGroups from './Reports/index.js';
// Import the configuration components
import { CustomLimitSelector } from './Reports/CustomLimitSelector';
import { DailyCustomLimitSelector } from './Reports/DailyCustomTopDogsReport';
import { DogNumberSelector } from './Reports/DogDetailScoresReport';
import { DaySelector } from './Reports/DogScoresByDayReport';
import { JudgeNumberSelector } from './Reports/JudgeDetailScoresReport';
import { DailySpeedAndDriveLimitSelector } from './Reports/SpeedAndDriveD.jsx';
import { OverallTopDogsLimitSelector } from './Reports/SpeedAndDriveO.jsx';
import { DayAndStakeTypeSelector } from './Reports/TopDogsByDayAndStakeTypeReport';
import { StakeTypeSelector } from './Reports/TopDogsByStakeTypeReport';

function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState({});
  const [hunt, setHunt] = useState({
    title: '',
    dates: '',
  });
  const navigate = useNavigate();
  
  // Map of available config components
  const configComponentMap = {
    'DaySelector': DaySelector,
    'StakeTypeSelector': StakeTypeSelector,
    'DayAndStakeTypeSelector': DayAndStakeTypeSelector,
    'CustomLimitSelector': CustomLimitSelector,
    'DailyCustomLimitSelector': DailyCustomLimitSelector,
    'DogNumberSelector': DogNumberSelector,
    'JudgeNumberSelector': JudgeNumberSelector,
    'OverallTopDogsLimitSelector': OverallTopDogsLimitSelector,
    'DailySpeedAndDriveLimitSelector': DailySpeedAndDriveLimitSelector,
  };
  
  // Fetch report data when a report is selected or config changes
  useEffect(() => {
    const fetchHuntData = async () => {
      const data = await HuntService.getHunt();
      if(data)
        setHunt(data);
    }; 
    fetchHuntData();
    
    if (selectedReport && selectedReport.fetchData) {
      const fetchReportData = async () => {
        setLoading(true);
        try {
          const result = await selectedReport.fetchData(reportConfig);
          setReportData(result);
        } catch (error) {
          console.error("Error generating report:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchReportData();
    }
  }, [selectedReport, reportConfig]);
  
  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setReportData(null); // Clear previous report data
    
    // Initialize with default config if available
    if (report.defaultConfig) {
      setReportConfig(report.defaultConfig);
    } else {
      setReportConfig({});  // Reset config
    }
  };
  
  const closeReport = () => {
    setSelectedReport(null);
    setReportData(null);
  };
  
  const handleConfigChange = (newConfig) => {
    setReportConfig(newConfig);
  };

  return (
    <div className="ml-[276px] mr-4 flex flex-col h-[calc(100vh-1rem)] py-3 text-gray-800">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 mt-1">
              {selectedReport 
                ? `Viewing: ${selectedReport.title}`
                : 'Generate hunt reports and statistics'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!selectedReport ? (
        /* Report Selection View */
        <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto p-6">
            {reportGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-10">
                <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
                  <FiClipboard className="text-blue-500 mr-2" size={20} />
                  <h2 className="text-xl font-semibold text-gray-800">{group.type}</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.items.map((report, index) => (
                    <div 
                      key={index}
                      onClick={() => handleSelectReport(report)}
                      className="bg-blue-50 hover:bg-blue-100 border border-blue-200 p-4 rounded-xl cursor-pointer transition-colors flex flex-col h-full"
                    >
                      <div className="flex items-center mb-2">
                        <FiFileText className="text-blue-500 mr-2" />
                        <h3 className="font-medium text-blue-800">{report.title}</h3>
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      )}
                      <div className="mt-auto pt-3">
                        <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full inline-flex items-center">
                          {report.configComponent ? 'Configurable' : 'Standard Report'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Report View */
        <div className="flex-1 flex flex-col">
          <div className="rounded-xl bg-white shadow-sm mb-4">
            <div className="p-4 flex flex-col items-start gap-y-10">
              <Button 
                onClick={closeReport}
                type="secondary"
                className="mr-4 rounded-lg px-3 py-1.5 text-sm"
              >
                ← Back to Reports
              </Button>
              
              {/* Show configuration component if available */}
              <div className="flex items-center space-x-2">
                {selectedReport.configComponent && configComponentMap[selectedReport.configComponent] && (
                  <div className="flex items-center bg-white rounded-lg">
                    {React.createElement(configComponentMap[selectedReport.configComponent], { 
                      onChange: handleConfigChange,
                      config: reportConfig
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex h-full">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm flex-1 h-64 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading report data...</p>
                </div>
              </div>
            ) : reportData ? (
              
                <ReportGenerator
                  hunt={hunt}
                  day={reportConfig.day}
                  title={reportData.title || selectedReport.title}
                  columns={reportData.columns}
                  columnGroups={reportData.columnGroups}
                  data={reportData.data}
                />
            ) : (
              <div className="bg-white rounded-xl shadow-sm flex-1 h-64 flex items-center justify-center">
                <p className="text-gray-500">Preparing report...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;