import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Box from './Box';
import StyledTable from './StyledTable';

const ReportGenerator = ({ title, columns, data }) => {
  const contentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: title,
  });

  return (
    <div className="report-generator w-full h-[calc(100%-60px)]">
      <Box params="h-full bg-white w-full">
        <div ref={contentRef} className="report-content w-full overflow-auto max-h-[calc(100%-5rem)] print:m-0 print:p-0">
          <div className='w-full border-b border-gray-200 pb-3 mb-4 print:mt-0'>
            <p className='text-3xl font-bold text-center'>{title}</p>
          </div>
          <div className="w-full">
            <StyledTable columns={columns} data={data} />
          </div>
        </div>
        <div className="mt-4 flex w-full justify-center print:hidden">
          <button 
            onClick={handlePrint} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full"
          >
            Print Report
          </button>
        </div>
      </Box>
    </div>
  );
};

// Add global print styles to ensure reports start at the top
const printStyles = `
  @media print {
    @page {
      margin: 0.5cm;
      size: portrait;
    }
    body {
      margin: 0;
      padding: 0;
    }
    .report-content {
      position: absolute;
      top: 0;
      left: 0;
      margin: 0;
      padding: 0;
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
  }
`;

// Add the print styles to the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = printStyles;
document.head.appendChild(styleSheet);

export default ReportGenerator;