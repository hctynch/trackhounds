import React from 'react';

const StyledTable = ({ columns, data }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200 mt-4">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((column, index) => (
            <th
              key={index}
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200 text-start">
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-gray-100">
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StyledTable;