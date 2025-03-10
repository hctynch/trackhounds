import React, { useState } from 'react';
import Box from './Box';
import ReportGenerator from './ReportGenerator';

function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = [
    {
      type: 'Dog Reports',
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
      type: 'General Reports',
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
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 4', 'Data 5', 'Data 6'],
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
          ],
        },
        // Add more general reports as needed
      ],
    },
    // Add more report types as needed
  ];

  return (
    <div className="reports-container ml-[276px] h-full text-black grid mr-4">
      <Box params="h-full bg-white my-2 max-h-[calc(100%-1rem)] min-h-[calc(100%-1rem)] pt-5">
        <div className='w-full flex items-center border-b-2 border-gray-300 pb-1 h-17.25'>
          <p className="text-4xl font-bold mb-3">Reports</p>
        </div>
        {reports.map((reportGroup, groupIndex) => (
          <div key={groupIndex} className="grid grid-cols-1 w-full my-6">
            <h2 className="text-2xl font-semibold mb-2">{reportGroup.type}</h2>
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
        {selectedReport && (
          <ReportGenerator
            title={selectedReport.title}
            columns={selectedReport.columns}
            data={selectedReport.data}
          />
        )}
      </Box>
    </div>
  );
}

export default Reports;