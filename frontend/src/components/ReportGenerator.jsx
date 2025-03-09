import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Box from './Box';
import StyledTable from './StyledTable';

const ReportGenerator = ({ title, columns, data }) => {
  const contentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: title,
    onAfterPrint: () => console.log('Print success!'),
    onBeforeGetContent: () => console.log('Preparing content for print...'),
  });

  return (
    <div className="report-generator">
      <Box params="h-full bg-white my-2 max-h-200">
        <div ref={contentRef} className="report-content w-full flex flex-col items-start justify-start overflow-auto max-h-[calc(100%-4rem)] p-4">
            <div className='w-full flex mb-2'>
                <p className='text-2xl font-bold text-start'>{title}</p>
            </div>
            <StyledTable columns={columns} data={data} />
        </div>
        <button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full mt-4">
          Print Report
        </button>
      </Box>
    </div>
  );
};

export default ReportGenerator;