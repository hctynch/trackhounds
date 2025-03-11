import React, { useState } from 'react';
import Box from './Box';
import ReportGenerator from './ReportGenerator';

function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = [
    {
      type: 'Daily Reports',
      items: [
        {
          title: 'Dog Scratches Report',
          columns: ['Dog Number', 'Time', 'Judge Number', 'Reason'],
          data: [
            ['123', '12:00 PM', '45', 'Injury'],
            ['124', '12:30 PM', '46', 'Sickness'],
            // Add more rows as needed
          ],
        },
        // Add more dog reports as needed
      ],
    },
    {
      type: 'Total Reports',
      items: [
        {
          title: 'Another Report',
          columns: ['Column 1', 'Column 2', 'Column 3'],
          data: [
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            // ... rest of data
          ],
        },
      ],
    },
    {
      type: 'Dog Specific Reports',
      items: [
        {
          title: 'Another Report',
          columns: ['Column 1', 'Column 2', 'Column 3'],
          data: [
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
          ],
        },
      ],
    },
  ];

  const closeReport = () => {
    setSelectedReport(null);
  };

  return (
    <div className="reports-container ml-[276px] h-full text-black grid mr-4">
      <Box params="h-full bg-white my-2 max-h-[calc(100%-1rem)] min-h-[calc(100%-1rem)] pt-5">
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1 h-17.25'>
          <p className="text-4xl font-bold mb-3">Reports</p>
        </div>
        
        {/* Conditionally show either report list or selected report */}
        {!selectedReport ? (
          <div className="w-full p-4 overflow-auto">
            {reports.map((reportGroup, groupIndex) => (
              <div key={groupIndex} className="w-full my-6">
                <p className="text-3xl font-semibold pb-1 mb-4 text-start border-b-2 border-gray-300">{reportGroup.type}</p>
                <div className="report-buttons grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {reportGroup.items.map((report, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedReport(report)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full"
                    >
                      {report.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-[calc(100%-4rem)] p-4">
            <button 
              onClick={closeReport}
              className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-full flex items-center"
            >
              <span>← Back to Reports</span>
            </button>
            <ReportGenerator
              title={selectedReport.title}
              columns={selectedReport.columns}
              data={selectedReport.data}
            />
          </div>
        )}
      </Box>
    </div>
  );
}

export default Reports;