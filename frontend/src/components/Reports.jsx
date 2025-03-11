import React, { useEffect, useState } from 'react';
import Box from './Box';
import ReportGenerator from './ReportGenerator';
import reportGroups from './Reports/index.js';
// Import the configuration components
import { DaySelector } from './Reports/DogScoresByDayReport';

function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState({});
  
  // Map of available config components
  const configComponentMap = {
    'DaySelector': DaySelector
  };
  
  // Fetch report data when a report is selected or config changes
  useEffect(() => {
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
    <div className="reports-container ml-[276px] h-full text-black grid mr-4">
      <Box params="h-full bg-white my-2 max-h-[calc(100%-1rem)] min-h-[calc(100%-1rem)] pt-5">
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1 h-17.25'>
          <p className="text-4xl font-bold mb-3">Reports</p>
        </div>
        
        {/* Conditionally show either report list or selected report */}
        {!selectedReport ? (
          <div className="w-full overflow-auto">
            {reportGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="w-full my-6">
                <p className="text-3xl font-semibold pb-1 mb-4 text-start border-b-2 border-gray-300">
                  {group.type}
                </p>
                <div className="report-buttons grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.items.map((report, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectReport(report)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full"
                    >
                      {report.title}
                      {report.description && (
                        <p className="text-xs text-blue-100 mt-1">{report.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full p-4">
            <button 
              onClick={closeReport}
              className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-full flex items-center"
            >
              <span>← Back to Reports</span>
            </button>
            
            {/* Configuration component if available - Using the mapping approach */}
            {selectedReport.configComponent && configComponentMap[selectedReport.configComponent] && (
              React.createElement(configComponentMap[selectedReport.configComponent], { 
                onChange: handleConfigChange 
              })
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-xl">Loading report data...</p>
              </div>
            ) : reportData ? (
              <ReportGenerator
                title={reportData.title || selectedReport.title}
                columns={reportData.columns}
                data={reportData.data}
              />
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-xl">Preparing report...</p>
              </div>
            )}
          </div>
        )}
      </Box>
    </div>
  );
}

export default Reports;