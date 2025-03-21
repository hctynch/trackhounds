import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import DogService from '../services/DogService';
import Box from './Box';
import StyledTable from './StyledTable';

const ReportGenerator = ({ hunt, day, title, columns, columnGroups, data }) => {
  const huntTitle = hunt.title
  const dates = hunt.dates
  const contentRef = useRef();
  const tableContainerRef = useRef();
  const [startTime, setStartTime] = useState('')

  useEffect(() => {
    async function getStartTime() {
      if (day) {
        const data = await DogService.getStartTime(day)
        if (data instanceof Error) {
          setStartTime('None')
          return
        }
        setStartTime(data)
      }
    } getStartTime()
  }, [day])
  
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: title,
  });
  
  return (
    <div className="report-generator w-full h-full">
      <Box params="h-full bg-white w-full relative">
        <div ref={contentRef} className="flex h-full report-content w-full p-3 overflow-auto print:m-0 print:p-0 print:overflow-visible print:max-h-none absolute top-0 left-0">
          {/* Using Tailwind table layout for printing */}
          <div className="w-full print:table print:w-full">
            {/* Header as table header group so it repeats on each page */}
            <div className="print:table-header-group">
              <div className="report-header w-full border-b-2 border-blue-900 print:border-b-2 print:border-blue-900">
                <p className="text-3xl font-bold text-start italic text-blue-900 print:text-blue-900">{title}</p>
                <div className="text-start text-md mt-2 italic font-medium text-blue-900 flex justify-between print:text-blue-900">
                  <p>Hunt: <span className='text-black'>{huntTitle}</span></p>
                  {day && <p>Day: <span className='text-black'>{day}</span></p>}
                  <p>Dates: <span className='text-black'>{dates}</span></p>
                  {day && <p>Start Time: <span className='text-black'>{startTime}</span></p>}
                </div>
              </div>
            </div>
            
            {/* Table content as table row group */}
            <div className="print:table-row-group">
              <div className="w-full" ref={tableContainerRef}>
                {columnGroups ? (
                  <table className="min-w-full border-collapse table-auto text-sm">
                    <thead>
                      <tr>
                        <th className="border px-4 py-2 bg-gray-100">{columns[0]}</th>
                        {columnGroups.map((group, index) => (
                          <th key={index} colSpan={group.span} className="border px-4 py-2 bg-gray-100 text-center">
                            {group.title}
                          </th>
                        ))}
                        <th className="border px-4 py-2 bg-gray-100">{columns[columns.length - 1]}</th>
                      </tr>
                      <tr>
                        <th className="border px-4 py-2 bg-gray-100"></th>
                        {columns.slice(1, columns.length - 1).map((col, idx) => (
                          <th key={idx} className="border px-4 py-2 bg-gray-100">{col}</th>
                        ))}
                        <th className="border px-4 py-2 bg-gray-100"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border px-4 py-2 text-center">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <StyledTable columns={columns} data={data} />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex w-full justify-center print:hidden">
          <button 
            onClick={handlePrint} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full absolute bottom-4"
          >
            Print Report
          </button>
        </div>
      </Box>
    </div>
  );
};

// Add minimal custom CSS for print styling
const printStyle = document.createElement('style');
printStyle.textContent = `
  @media print {
    @page {
      margin: 1cm;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Force Tailwind colors to print */
    .print\\:text-blue-900 {
      color: #1e3a8a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Force table header to repeat */
    thead {
      display: table-header-group !important;
    }
    
    /* Prevent rows from breaking across pages */
    tr {
      break-inside: avoid !important;
    }
  }
`;

// Only add the style once
if (typeof document !== 'undefined' && !document.getElementById('report-print-style')) {
  printStyle.id = 'report-print-style';
  document.head.appendChild(printStyle);
}

export default ReportGenerator;